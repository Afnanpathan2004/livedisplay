// Simple database configuration that works with existing setup
const mockDb = require('../utils/mockDb');

// Simple logger fallback
const logger = {
  info: console.log,
  error: console.error,
  warn: console.warn,
  debug: console.log
};

// For now, always use mock database to ensure compatibility
const useMockDb = true;

// Query function that works with mock database
const query = async (text, params = []) => {
  // For mock database, we'll just return a simple response
  // This maintains compatibility with existing code
  return {
    rows: [],
    rowCount: 0
  };
};

// Health check function
const healthCheck = async () => {
  return {
    status: 'healthy',
    database: 'mock',
    message: 'Using mock database for compatibility'
  };
};

// Transaction helper (no-op for mock)
const transaction = async (callback) => {
  return await callback({
    query: query
  });
};

// Graceful shutdown (no-op for mock)
const closePool = async () => {
  logger.info('Mock database - no pool to close');
};

module.exports = {
  pool: null,
  query,
  transaction,
  healthCheck,
  closePool,
  useMockDb: true
};
