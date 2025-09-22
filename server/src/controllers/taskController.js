const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { getIO } = require('../websocket');
const { createAuditLog } = require('../utils/audit');

// Use mock database to avoid Prisma connection issues
const prisma = require('../utils/mockDb');

const taskInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  assignedTo: z.string().optional(),
  room: z.string().optional(),
  dueTime: z.string().datetime().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional()
});

exports.getTasks = async (req, res, next) => {
  try {
    const { room, status, assignedTo } = req.query;
    
    const where = {};
    if (room) where.room = room;
    if (status) where.status = status;
    if (assignedTo) where.assignedTo = assignedTo;

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [
        { status: 'asc' },
        { dueTime: 'asc' },
        { createdAt: 'desc' }
      ],
      include: {
        user: {
          select: { username: true }
        }
      }
    });

    res.json(tasks);
  } catch (err) { 
    next(err); 
  }
};

exports.getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        user: {
          select: { username: true }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (err) { 
    next(err); 
  }
};

exports.createTask = async (req, res, next) => {
  try {
    const data = taskInputSchema.parse(req.body);
    const userId = req.user?.id;

    const task = await prisma.task.create({
      data: {
        ...data,
        dueTime: data.dueTime ? new Date(data.dueTime) : null,
        createdById: userId
      },
      include: {
        user: {
          select: { username: true }
        }
      }
    });

    // Create audit log
    await createAuditLog({
      userId,
      action: 'create',
      entity: 'task',
      entityId: task.id,
      after: task,
      req
    });

    // Emit real-time update
    getIO().emit('task:update', { action: 'create', task });

    res.status(201).json(task);
  } catch (err) { 
    next(err); 
  }
};

exports.updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = taskInputSchema.partial().parse(req.body);
    const userId = req.user?.id;

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...data,
        dueTime: data.dueTime ? new Date(data.dueTime) : undefined
      },
      include: {
        user: {
          select: { username: true }
        }
      }
    });

    // Create audit log
    await createAuditLog({
      userId,
      action: 'update',
      entity: 'task',
      entityId: id,
      before: existing,
      after: updated,
      req
    });

    // Emit real-time update
    getIO().emit('task:update', { action: 'update', task: updated });

    res.json(updated);
  } catch (err) { 
    next(err); 
  }
};

exports.deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await prisma.task.delete({ where: { id } });

    // Create audit log
    await createAuditLog({
      userId,
      action: 'delete',
      entity: 'task',
      entityId: id,
      before: existing,
      req
    });

    // Emit real-time update
    getIO().emit('task:update', { action: 'delete', taskId: id });

    res.json({ ok: true });
  } catch (err) { 
    next(err); 
  }
};

exports.completeTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updated = await prisma.task.update({
      where: { id },
      data: { status: 'completed' },
      include: {
        user: {
          select: { username: true }
        }
      }
    });

    // Create audit log
    await createAuditLog({
      userId,
      action: 'update',
      entity: 'task',
      entityId: id,
      before: existing,
      after: updated,
      req
    });

    // Emit real-time update
    getIO().emit('task:update', { action: 'update', task: updated });

    res.json(updated);
  } catch (err) { 
    next(err); 
  }
};
