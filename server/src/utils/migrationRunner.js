const fs = require('fs').promises;
const path = require('path');
const { query, transaction } = require('../config/database');
const { logger } = require('./logger');

class MigrationRunner {
  constructor() {
    this.migrationsDir = path.join(__dirname, '..', 'migrations');
  }

  // Create migrations table if it doesn't exist
  async createMigrationsTable() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        version VARCHAR(255) UNIQUE NOT NULL,
        filename VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        checksum VARCHAR(64) NOT NULL
      );
    `;
    
    await query(createTableSQL);
    logger.info('Migrations table created or verified');
  }

  // Get list of migration files
  async getMigrationFiles() {
    try {
      const files = await fs.readdir(this.migrationsDir);
      return files
        .filter(file => file.endsWith('.sql'))
        .sort()
        .map(file => ({
          filename: file,
          version: file.split('_')[0],
          fullPath: path.join(this.migrationsDir, file)
        }));
    } catch (error) {
      logger.error('Error reading migrations directory', { error: error.message });
      return [];
    }
  }

  // Get executed migrations from database
  async getExecutedMigrations() {
    try {
      const result = await query('SELECT version, filename, checksum FROM schema_migrations ORDER BY version');
      return result.rows;
    } catch (error) {
      logger.error('Error fetching executed migrations', { error: error.message });
      return [];
    }
  }

  // Calculate file checksum
  async calculateChecksum(filePath) {
    const crypto = require('crypto');
    const content = await fs.readFile(filePath, 'utf8');
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  // Execute a single migration
  async executeMigration(migration) {
    const content = await fs.readFile(migration.fullPath, 'utf8');
    const checksum = await this.calculateChecksum(migration.fullPath);

    await transaction(async (client) => {
      // Execute the migration SQL
      await client.query(content);
      
      // Record the migration
      await client.query(
        'INSERT INTO schema_migrations (version, filename, checksum) VALUES ($1, $2, $3)',
        [migration.version, migration.filename, checksum]
      );
    });

    logger.info('Migration executed successfully', {
      version: migration.version,
      filename: migration.filename
    });
  }

  // Run pending migrations
  async runMigrations() {
    try {
      await this.createMigrationsTable();
      
      const migrationFiles = await this.getMigrationFiles();
      const executedMigrations = await this.getExecutedMigrations();
      
      const executedVersions = new Set(executedMigrations.map(m => m.version));
      const pendingMigrations = migrationFiles.filter(m => !executedVersions.has(m.version));

      if (pendingMigrations.length === 0) {
        logger.info('No pending migrations found');
        return { executed: 0, total: migrationFiles.length };
      }

      logger.info(`Found ${pendingMigrations.length} pending migrations`);

      for (const migration of pendingMigrations) {
        try {
          await this.executeMigration(migration);
        } catch (error) {
          logger.error('Migration failed', {
            version: migration.version,
            filename: migration.filename,
            error: error.message
          });
          throw new Error(`Migration ${migration.filename} failed: ${error.message}`);
        }
      }

      logger.info('All migrations completed successfully', {
        executed: pendingMigrations.length,
        total: migrationFiles.length
      });

      return { executed: pendingMigrations.length, total: migrationFiles.length };
    } catch (error) {
      logger.error('Migration process failed', { error: error.message });
      throw error;
    }
  }

  // Verify migration integrity
  async verifyMigrations() {
    try {
      const migrationFiles = await this.getMigrationFiles();
      const executedMigrations = await this.getExecutedMigrations();
      
      const issues = [];

      for (const executed of executedMigrations) {
        const file = migrationFiles.find(f => f.version === executed.version);
        
        if (!file) {
          issues.push({
            type: 'missing_file',
            version: executed.version,
            message: `Migration file for version ${executed.version} not found`
          });
          continue;
        }

        const currentChecksum = await this.calculateChecksum(file.fullPath);
        if (currentChecksum !== executed.checksum) {
          issues.push({
            type: 'checksum_mismatch',
            version: executed.version,
            message: `Migration file ${executed.filename} has been modified after execution`
          });
        }
      }

      if (issues.length > 0) {
        logger.warn('Migration integrity issues found', { issues });
        return { valid: false, issues };
      }

      logger.info('All migrations verified successfully');
      return { valid: true, issues: [] };
    } catch (error) {
      logger.error('Migration verification failed', { error: error.message });
      throw error;
    }
  }

  // Get migration status
  async getStatus() {
    try {
      const migrationFiles = await this.getMigrationFiles();
      const executedMigrations = await this.getExecutedMigrations();
      
      const executedVersions = new Set(executedMigrations.map(m => m.version));
      const pending = migrationFiles.filter(m => !executedVersions.has(m.version));
      
      return {
        total: migrationFiles.length,
        executed: executedMigrations.length,
        pending: pending.length,
        pendingMigrations: pending.map(m => ({
          version: m.version,
          filename: m.filename
        })),
        lastExecuted: executedMigrations.length > 0 ? 
          executedMigrations[executedMigrations.length - 1] : null
      };
    } catch (error) {
      logger.error('Error getting migration status', { error: error.message });
      throw error;
    }
  }
}

module.exports = new MigrationRunner();
