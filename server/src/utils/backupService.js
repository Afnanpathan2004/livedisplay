const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const archiver = require('archiver');
const crypto = require('crypto');
const { query } = require('../config/database');
const { logger } = require('./logger');
const { auditLog } = require('./audit');

/**
 * Production-ready backup and recovery service
 * Handles database backups, file backups, and system recovery
 */
class BackupService {
  constructor() {
    this.backupDir = process.env.BACKUP_DIR || './backups';
    this.retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS) || 30;
    this.encryptionKey = process.env.BACKUP_ENCRYPTION_KEY;
    this.compressionLevel = 9;
    
    this.dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'livedisplay',
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD
    };

    this.s3Config = {
      bucket: process.env.BACKUP_S3_BUCKET,
      region: process.env.AWS_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    };

    this.initializeBackupDirectory();
  }

  /**
   * Initialize backup directory structure
   */
  async initializeBackupDirectory() {
    const directories = [
      this.backupDir,
      path.join(this.backupDir, 'database'),
      path.join(this.backupDir, 'files'),
      path.join(this.backupDir, 'system'),
      path.join(this.backupDir, 'logs'),
      path.join(this.backupDir, 'temp')
    ];

    for (const dir of directories) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        logger.error('Failed to create backup directory', {
          directory: dir,
          error: error.message
        });
      }
    }
  }

  /**
   * Create complete system backup
   */
  async createFullBackup(options = {}) {
    const {
      includeDatabase = true,
      includeFiles = true,
      includeSystem = true,
      uploadToS3 = false,
      userId = 'system'
    } = options;

    const backupId = crypto.randomUUID();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `full-backup-${timestamp}`;
    const backupPath = path.join(this.backupDir, 'temp', backupName);

    try {
      await fs.mkdir(backupPath, { recursive: true });

      const manifest = {
        id: backupId,
        name: backupName,
        type: 'full',
        created_at: new Date().toISOString(),
        created_by: userId,
        components: {},
        metadata: {
          version: process.env.APP_VERSION || '1.0.0',
          environment: process.env.NODE_ENV || 'production',
          hostname: require('os').hostname()
        }
      };

      logger.info('Starting full backup', {
        backupId,
        backupName,
        includeDatabase,
        includeFiles,
        includeSystem
      });

      // Database backup
      if (includeDatabase) {
        logger.info('Creating database backup');
        const dbBackupPath = await this.createDatabaseBackup(backupPath);
        manifest.components.database = {
          path: path.relative(backupPath, dbBackupPath),
          size: (await fs.stat(dbBackupPath)).size,
          created_at: new Date().toISOString()
        };
      }

      // Files backup
      if (includeFiles) {
        logger.info('Creating files backup');
        const filesBackupPath = await this.createFilesBackup(backupPath);
        manifest.components.files = {
          path: path.relative(backupPath, filesBackupPath),
          size: (await fs.stat(filesBackupPath)).size,
          created_at: new Date().toISOString()
        };
      }

      // System configuration backup
      if (includeSystem) {
        logger.info('Creating system backup');
        const systemBackupPath = await this.createSystemBackup(backupPath);
        manifest.components.system = {
          path: path.relative(backupPath, systemBackupPath),
          size: (await fs.stat(systemBackupPath)).size,
          created_at: new Date().toISOString()
        };
      }

      // Save manifest
      const manifestPath = path.join(backupPath, 'manifest.json');
      await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

      // Create compressed archive
      const archivePath = path.join(this.backupDir, `${backupName}.tar.gz`);
      await this.createArchive(backupPath, archivePath);

      // Encrypt if key provided
      let finalBackupPath = archivePath;
      if (this.encryptionKey) {
        finalBackupPath = await this.encryptBackup(archivePath);
        await fs.unlink(archivePath); // Remove unencrypted version
      }

      // Calculate final size and checksum
      const stats = await fs.stat(finalBackupPath);
      const checksum = await this.calculateChecksum(finalBackupPath);

      manifest.archive = {
        path: finalBackupPath,
        size: stats.size,
        checksum,
        encrypted: !!this.encryptionKey,
        created_at: new Date().toISOString()
      };

      // Upload to S3 if configured
      if (uploadToS3 && this.s3Config.bucket) {
        try {
          const s3Key = await this.uploadToS3(finalBackupPath, `backups/${backupName}`);
          manifest.s3 = {
            bucket: this.s3Config.bucket,
            key: s3Key,
            uploaded_at: new Date().toISOString()
          };
          logger.info('Backup uploaded to S3', { s3Key });
        } catch (error) {
          logger.error('Failed to upload backup to S3', {
            error: error.message,
            backupPath: finalBackupPath
          });
        }
      }

      // Clean up temporary directory
      await fs.rm(backupPath, { recursive: true, force: true });

      // Save final manifest
      const finalManifestPath = path.join(this.backupDir, `${backupName}.manifest.json`);
      await fs.writeFile(finalManifestPath, JSON.stringify(manifest, null, 2));

      // Audit log
      await auditLog(userId, 'BACKUP_CREATED', 'system', backupId, null, manifest);

      logger.info('Full backup completed successfully', {
        backupId,
        backupPath: finalBackupPath,
        size: this.formatBytes(stats.size),
        checksum
      });

      return {
        id: backupId,
        name: backupName,
        path: finalBackupPath,
        manifest: finalManifestPath,
        size: stats.size,
        checksum,
        created_at: manifest.created_at
      };

    } catch (error) {
      logger.error('Full backup failed', {
        backupId,
        error: error.message,
        stack: error.stack
      });

      // Clean up on failure
      try {
        await fs.rm(backupPath, { recursive: true, force: true });
      } catch (cleanupError) {
        logger.error('Failed to clean up backup directory', {
          path: backupPath,
          error: cleanupError.message
        });
      }

      throw error;
    }
  }

  /**
   * Create database backup using pg_dump
   */
  async createDatabaseBackup(backupDir) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `database-${timestamp}.sql`);

    return new Promise((resolve, reject) => {
      const pgDump = spawn('pg_dump', [
        '-h', this.dbConfig.host,
        '-p', this.dbConfig.port.toString(),
        '-U', this.dbConfig.username,
        '-d', this.dbConfig.database,
        '--verbose',
        '--clean',
        '--if-exists',
        '--create',
        '--format=custom',
        '--compress=9',
        '--file', backupFile
      ], {
        env: {
          ...process.env,
          PGPASSWORD: this.dbConfig.password
        }
      });

      let errorOutput = '';

      pgDump.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pgDump.on('close', (code) => {
        if (code === 0) {
          logger.info('Database backup completed', { backupFile });
          resolve(backupFile);
        } else {
          logger.error('Database backup failed', {
            code,
            error: errorOutput,
            backupFile
          });
          reject(new Error(`pg_dump failed with code ${code}: ${errorOutput}`));
        }
      });

      pgDump.on('error', (error) => {
        logger.error('Failed to start pg_dump', {
          error: error.message,
          backupFile
        });
        reject(error);
      });
    });
  }

  /**
   * Create files backup (uploads, logs, etc.)
   */
  async createFilesBackup(backupDir) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `files-${timestamp}.tar.gz`);

    const filesToBackup = [
      process.env.UPLOAD_DIR || './uploads',
      process.env.LOG_DIR || './logs'
    ];

    return this.createArchive(filesToBackup, backupFile);
  }

  /**
   * Create system configuration backup
   */
  async createSystemBackup(backupDir) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const systemDir = path.join(backupDir, 'system');
    await fs.mkdir(systemDir, { recursive: true });

    // Backup system settings from database
    const systemSettings = await this.getSystemSettings();
    await fs.writeFile(
      path.join(systemDir, 'settings.json'),
      JSON.stringify(systemSettings, null, 2)
    );

    // Backup environment template
    try {
      const envTemplate = await fs.readFile('.env.production.template', 'utf8');
      await fs.writeFile(path.join(systemDir, 'env.template'), envTemplate);
    } catch (error) {
      logger.warn('Could not backup environment template', {
        error: error.message
      });
    }

    // Backup package.json
    try {
      const packageJson = await fs.readFile('package.json', 'utf8');
      await fs.writeFile(path.join(systemDir, 'package.json'), packageJson);
    } catch (error) {
      logger.warn('Could not backup package.json', {
        error: error.message
      });
    }

    // Create system info
    const systemInfo = {
      version: process.env.APP_VERSION || '1.0.0',
      node_version: process.version,
      platform: process.platform,
      arch: process.arch,
      hostname: require('os').hostname(),
      backup_date: new Date().toISOString(),
      environment: process.env.NODE_ENV
    };

    await fs.writeFile(
      path.join(systemDir, 'system-info.json'),
      JSON.stringify(systemInfo, null, 2)
    );

    const backupFile = path.join(backupDir, `system-${timestamp}.tar.gz`);
    return this.createArchive(systemDir, backupFile);
  }

  /**
   * Get system settings from database
   */
  async getSystemSettings() {
    try {
      const result = await query('SELECT * FROM system_settings ORDER BY key');
      return result.rows.reduce((settings, row) => {
        settings[row.key] = row.value;
        return settings;
      }, {});
    } catch (error) {
      logger.error('Failed to get system settings', {
        error: error.message
      });
      return {};
    }
  }

  /**
   * Create compressed archive
   */
  async createArchive(sourcePath, outputPath) {
    return new Promise((resolve, reject) => {
      const output = require('fs').createWriteStream(outputPath);
      const archive = archiver('tar', {
        gzip: true,
        gzipOptions: {
          level: this.compressionLevel
        }
      });

      output.on('close', () => {
        logger.debug('Archive created', {
          outputPath,
          size: archive.pointer()
        });
        resolve(outputPath);
      });

      archive.on('error', (error) => {
        logger.error('Archive creation failed', {
          error: error.message,
          outputPath
        });
        reject(error);
      });

      archive.pipe(output);

      if (Array.isArray(sourcePath)) {
        // Multiple sources
        for (const source of sourcePath) {
          try {
            const stats = require('fs').statSync(source);
            if (stats.isDirectory()) {
              archive.directory(source, path.basename(source));
            } else {
              archive.file(source, { name: path.basename(source) });
            }
          } catch (error) {
            logger.warn('Could not add to archive', {
              source,
              error: error.message
            });
          }
        }
      } else {
        // Single source
        try {
          const stats = require('fs').statSync(sourcePath);
          if (stats.isDirectory()) {
            archive.directory(sourcePath, false);
          } else {
            archive.file(sourcePath, { name: path.basename(sourcePath) });
          }
        } catch (error) {
          logger.error('Source path not found', {
            sourcePath,
            error: error.message
          });
          return reject(error);
        }
      }

      archive.finalize();
    });
  }

  /**
   * Encrypt backup file
   */
  async encryptBackup(filePath) {
    const encryptedPath = `${filePath}.enc`;
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const iv = crypto.randomBytes(16);

    return new Promise((resolve, reject) => {
      const input = require('fs').createReadStream(filePath);
      const output = require('fs').createWriteStream(encryptedPath);
      const cipher = crypto.createCipher(algorithm, key);

      // Write IV to beginning of file
      output.write(iv);

      input.pipe(cipher).pipe(output);

      output.on('finish', () => {
        logger.debug('Backup encrypted', { encryptedPath });
        resolve(encryptedPath);
      });

      output.on('error', reject);
      cipher.on('error', reject);
    });
  }

  /**
   * Calculate file checksum
   */
  async calculateChecksum(filePath) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = require('fs').createReadStream(filePath);

      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  /**
   * Upload backup to S3
   */
  async uploadToS3(filePath, s3Key) {
    if (!this.s3Config.bucket) {
      throw new Error('S3 configuration not provided');
    }

    const AWS = require('aws-sdk');
    const s3 = new AWS.S3({
      accessKeyId: this.s3Config.accessKeyId,
      secretAccessKey: this.s3Config.secretAccessKey,
      region: this.s3Config.region
    });

    const fileStream = require('fs').createReadStream(filePath);
    const uploadParams = {
      Bucket: this.s3Config.bucket,
      Key: s3Key,
      Body: fileStream,
      ServerSideEncryption: 'AES256',
      StorageClass: 'STANDARD_IA'
    };

    const result = await s3.upload(uploadParams).promise();
    return result.Key;
  }

  /**
   * List available backups
   */
  async listBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backups = [];

      for (const file of files) {
        if (file.endsWith('.manifest.json')) {
          try {
            const manifestPath = path.join(this.backupDir, file);
            const manifestContent = await fs.readFile(manifestPath, 'utf8');
            const manifest = JSON.parse(manifestContent);
            
            // Check if backup file exists
            if (manifest.archive && manifest.archive.path) {
              try {
                const stats = await fs.stat(manifest.archive.path);
                backups.push({
                  ...manifest,
                  exists: true,
                  file_size: stats.size
                });
              } catch (error) {
                backups.push({
                  ...manifest,
                  exists: false,
                  error: 'Backup file not found'
                });
              }
            }
          } catch (error) {
            logger.warn('Invalid manifest file', {
              file,
              error: error.message
            });
          }
        }
      }

      return backups.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );

    } catch (error) {
      logger.error('Failed to list backups', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Clean old backups based on retention policy
   */
  async cleanOldBackups() {
    try {
      const backups = await this.listBackups();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

      let deletedCount = 0;
      let freedSpace = 0;

      for (const backup of backups) {
        const backupDate = new Date(backup.created_at);
        
        if (backupDate < cutoffDate) {
          try {
            // Delete backup file
            if (backup.archive && backup.archive.path) {
              const stats = await fs.stat(backup.archive.path);
              await fs.unlink(backup.archive.path);
              freedSpace += stats.size;
            }

            // Delete manifest file
            const manifestFile = path.join(this.backupDir, `${backup.name}.manifest.json`);
            await fs.unlink(manifestFile);

            deletedCount++;
            
            logger.info('Old backup deleted', {
              backupId: backup.id,
              backupName: backup.name,
              age: Math.floor((Date.now() - backupDate.getTime()) / (1000 * 60 * 60 * 24))
            });

          } catch (error) {
            logger.error('Failed to delete old backup', {
              backupId: backup.id,
              error: error.message
            });
          }
        }
      }

      logger.info('Backup cleanup completed', {
        deletedCount,
        freedSpace: this.formatBytes(freedSpace),
        retentionDays: this.retentionDays
      });

      return { deletedCount, freedSpace };

    } catch (error) {
      logger.error('Backup cleanup failed', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(backupId, options = {}) {
    const {
      restoreDatabase = true,
      restoreFiles = true,
      restoreSystem = false,
      userId = 'system'
    } = options;

    try {
      const backups = await this.listBackups();
      const backup = backups.find(b => b.id === backupId);

      if (!backup) {
        throw new Error(`Backup with ID ${backupId} not found`);
      }

      if (!backup.exists) {
        throw new Error(`Backup file for ${backupId} does not exist`);
      }

      logger.info('Starting backup restoration', {
        backupId,
        backupName: backup.name,
        restoreDatabase,
        restoreFiles,
        restoreSystem
      });

      // Extract backup if needed
      const extractDir = path.join(this.backupDir, 'temp', `restore-${Date.now()}`);
      await this.extractBackup(backup.archive.path, extractDir);

      const results = {
        database: null,
        files: null,
        system: null
      };

      // Restore database
      if (restoreDatabase && backup.components.database) {
        logger.info('Restoring database');
        results.database = await this.restoreDatabase(
          path.join(extractDir, backup.components.database.path)
        );
      }

      // Restore files
      if (restoreFiles && backup.components.files) {
        logger.info('Restoring files');
        results.files = await this.restoreFiles(
          path.join(extractDir, backup.components.files.path)
        );
      }

      // Restore system
      if (restoreSystem && backup.components.system) {
        logger.info('Restoring system configuration');
        results.system = await this.restoreSystem(
          path.join(extractDir, backup.components.system.path)
        );
      }

      // Clean up
      await fs.rm(extractDir, { recursive: true, force: true });

      // Audit log
      await auditLog(userId, 'BACKUP_RESTORED', 'system', backupId, null, {
        backup_name: backup.name,
        restored_components: results
      });

      logger.info('Backup restoration completed', {
        backupId,
        results
      });

      return results;

    } catch (error) {
      logger.error('Backup restoration failed', {
        backupId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Format bytes to human readable string
   */
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  /**
   * Get backup service status
   */
  getStatus() {
    return {
      backup_directory: this.backupDir,
      retention_days: this.retentionDays,
      encryption_enabled: !!this.encryptionKey,
      s3_configured: !!(this.s3Config.bucket && this.s3Config.accessKeyId),
      database_configured: !!(this.dbConfig.host && this.dbConfig.username)
    };
  }
}

// Create singleton instance
const backupService = new BackupService();

module.exports = {
  backupService,
  
  // Convenience functions
  createFullBackup: (options) => backupService.createFullBackup(options),
  listBackups: () => backupService.listBackups(),
  cleanOldBackups: () => backupService.cleanOldBackups(),
  restoreFromBackup: (backupId, options) => backupService.restoreFromBackup(backupId, options),
  getBackupStatus: () => backupService.getStatus()
};
