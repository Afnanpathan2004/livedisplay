const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createAuditLog({ userId, action, entity, entityId, before, after, req }) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        before: before ? JSON.parse(JSON.stringify(before)) : null,
        after: after ? JSON.parse(JSON.stringify(after)) : null,
        ipAddress: req?.ip || req?.connection?.remoteAddress,
        userAgent: req?.get('User-Agent')
      }
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - audit logging should not break the main flow
  }
}

async function getAuditLogs({ entity, entityId, userId, limit = 100, offset = 0 }) {
  try {
    const where = {};
    if (entity) where.entity = entity;
    if (entityId) where.entityId = entityId;
    if (userId) where.userId = userId;

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: { username: true, email: true }
        }
      }
    });

    return logs;
  } catch (error) {
    console.error('Failed to get audit logs:', error);
    throw error;
  }
}

module.exports = {
  createAuditLog,
  getAuditLogs
};
