// Database configuration with PostgreSQL and Prisma support
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');

// Simple logger fallback
const logger = {
  info: console.log,
  error: console.error,
  warn: console.warn,
  debug: console.log
};

// Initialize Prisma Client
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// PostgreSQL connection pool for raw queries (optional)
let pool = null;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pool.on('error', (err) => {
    logger.error('Unexpected database pool error:', err);
  });
}

// Query function for raw SQL (if needed)
const query = async (text, params = []) => {
  if (!pool) {
    throw new Error('Database pool not initialized. Check DATABASE_URL.');
  }
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (duration > 1000) {
      logger.warn(`Slow query (${duration}ms):`, text);
    }
    return res;
  } catch (error) {
    logger.error('Database query error:', error);
    throw error;
  }
};

// Health check function
const healthCheck = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'healthy',
      database: 'postgresql',
      message: 'Database connection successful'
    };
  } catch (error) {
    logger.error('Database health check failed:', error);
    return {
      status: 'unhealthy',
      database: 'postgresql',
      message: error.message
    };
  }
};

// Transaction helper using Prisma
const transaction = async (callback) => {
  return await prisma.$transaction(async (tx) => {
    return await callback(tx);
  });
};

// Graceful shutdown
const closePool = async () => {
  try {
    await prisma.$disconnect();
    if (pool) {
      await pool.end();
    }
    logger.info('Database connections closed');
  } catch (error) {
    logger.error('Error closing database connections:', error);
    throw error;
  }
};

// Graceful shutdown handlers
process.on('SIGINT', async () => {
  await closePool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closePool();
  process.exit(0);
});

module.exports = {
  prisma,
  pool,
  query,
  transaction,
  healthCheck,
  closePool,
  useMockDb: false
};
