const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { getIO } = require('../websocket');

// Use mock database to avoid Prisma connection issues
const prisma = require('../utils/mockDb');

const inputSchema = z.object({
  message: z.string().min(1),
  active: z.boolean().optional()
});

exports.listAnnouncements = async (_req, res, next) => {
  try {
    const items = await prisma.announcement.findMany({ orderBy: { timestamp: 'desc' } });
    res.json(items);
  } catch (err) { next(err); }
};

exports.createAnnouncement = async (req, res, next) => {
  try {
    const data = inputSchema.parse(req.body);
    const created = await prisma.announcement.create({ data: { message: data.message, active: data.active ?? true } });
    getIO().emit('announcement:update', created);
    res.status(201).json(created);
  } catch (err) { next(err); }
};

exports.updateAnnouncement = async (req, res, next) => {
  try {
    const id = req.params.id;
    const data = inputSchema.partial().parse(req.body);
    const updated = await prisma.announcement.update({ where: { id }, data });
    getIO().emit('announcement:update', updated);
    res.json(updated);
  } catch (err) { next(err); }
};

exports.deleteAnnouncement = async (req, res, next) => {
  try {
    const id = req.params.id;
    await prisma.announcement.delete({ where: { id } });
    getIO().emit('announcement:update', { id, deleted: true });
    res.json({ ok: true });
  } catch (err) { next(err); }
};
