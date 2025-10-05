// Simple audit logging for compatibility with existing system
const auditLogs = [];

// Simple logger fallback
const logger = {
  info: console.log,
  error: console.error,
  warn: console.warn,
  debug: console.log
};

// Simple audit function
async function createAuditLog({ userId, action, entity, entityId, before, after, req }) {
  try {
    const auditEntry = {
      id: Date.now().toString(),
      userId,
      action,
      entity,
      entityId,
      before: before ? JSON.stringify(before) : null,
      after: after ? JSON.stringify(after) : null,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.get?.('User-Agent'),
      timestamp: new Date()
    };
    
    auditLogs.push(auditEntry);
    
    // Keep only last 1000 entries to prevent memory issues
    if (auditLogs.length > 1000) {
      auditLogs.shift();
    }
    
    logger.debug('Audit log created', { action, entity, userId });
    return auditEntry;
  } catch (error) {
    logger.error('Failed to create audit log:', error);
  }
}

// Get audit logs function
async function getAuditLogs({ entity, entityId, userId, limit = 100, offset = 0 }) {
  try {
    let filtered = [...auditLogs];
    
    if (entity) {
      filtered = filtered.filter(log => log.entity === entity);
    }
    if (entityId) {
      filtered = filtered.filter(log => log.entityId === entityId);
    }
    if (userId) {
      filtered = filtered.filter(log => log.userId === userId);
    }
    
    // Sort by timestamp descending
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Apply pagination
    const paginatedLogs = filtered.slice(offset, offset + limit);
    
    return paginatedLogs;
  } catch (error) {
    logger.error('Failed to get audit logs:', error);
    return [];
  }
}

module.exports = {
  createAuditLog,
  getAuditLogs
};
