const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { getIO } = require('../websocket');
const { createAuditLog } = require('../utils/audit');

// Use mock database to avoid Prisma connection issues
const prisma = require('../utils/mockDb');

const inputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Start time must be in HH:mm format'),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'End time must be in HH:mm format'),
  room_number: z.string().min(1, 'Room number is required').max(20, 'Room number too long'),
  subject: z.string().min(1, 'Subject is required').max(100, 'Subject too long'),
  faculty_name: z.string().min(1, 'Faculty name is required').max(100, 'Faculty name too long'),
  tags: z.array(z.string()).optional()
}).refine(data => {
  const [startHour, startMin] = data.start_time.split(':').map(Number)
  const [endHour, endMin] = data.end_time.split(':').map(Number)
  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin
  return startMinutes < endMinutes
}, {
  message: 'End time must be after start time',
  path: ['end_time']
}).refine(data => {
  const [startHour] = data.start_time.split(':').map(Number)
  const [endHour] = data.end_time.split(':').map(Number)
  return startHour >= 6 && endHour <= 23
}, {
  message: 'Schedule times must be between 06:00 and 23:00',
  path: ['start_time']
});

function parseDate(dateStr) {
  // Treat as UTC date (no time)
  return new Date(dateStr + 'T00:00:00.000Z');
}

function toTime(timeStr) {
  // Convert HH:mm to Date object anchored on 1970-01-01 UTC
  return new Date('1970-01-01T' + timeStr + ':00.000Z');
}

function formatTime(dateObj) {
  // dateObj is a Date; format HH:mm in UTC
  const hh = String(dateObj.getUTCHours()).padStart(2, '0');
  const mm = String(dateObj.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

exports.getScheduleByDate = async (req, res, next) => {
  try {
    const { date, room, faculty, search } = req.query;
    
    if (!date) {
      return res.status(400).json({ error: 'Missing date parameter YYYY-MM-DD' });
    }
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Date must be in YYYY-MM-DD format' });
    }

    let items = await prisma.getScheduleByDate(date);
    
    // Apply filters
    if (room) {
      items = items.filter(item => 
        item.room_number.toLowerCase().includes(room.toLowerCase())
      );
    }
    
    if (faculty) {
      items = items.filter(item => 
        item.faculty_name.toLowerCase().includes(faculty.toLowerCase())
      );
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      items = items.filter(item => 
        item.subject.toLowerCase().includes(searchLower) ||
        item.faculty_name.toLowerCase().includes(searchLower) ||
        item.room_number.toLowerCase().includes(searchLower)
      );
    }

    res.json(items);
  } catch (err) { 
    console.error('Error fetching schedule:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.createScheduleEntry = async (req, res, next) => {
  try {
    const data = inputSchema.parse(req.body);
    const userId = req.user?.id || 'system';

    // Check for schedule conflicts
    const existingEntries = await prisma.getScheduleByDate(data.date);
    const [newStartHour, newStartMin] = data.start_time.split(':').map(Number);
    const [newEndHour, newEndMin] = data.end_time.split(':').map(Number);
    const newStartMinutes = newStartHour * 60 + newStartMin;
    const newEndMinutes = newEndHour * 60 + newEndMin;
    
    for (const entry of existingEntries) {
      if (entry.room_number !== data.room_number) continue;
      
      const [existingStartHour, existingStartMin] = entry.start_time.split(':').map(Number);
      const [existingEndHour, existingEndMin] = entry.end_time.split(':').map(Number);
      const existingStartMinutes = existingStartHour * 60 + existingStartMin;
      const existingEndMinutes = existingEndHour * 60 + existingEndMin;
      
      // Check for overlap
      if (newStartMinutes < existingEndMinutes && newEndMinutes > existingStartMinutes) {
        return res.status(409).json({ 
          error: `Schedule conflict: Room ${data.room_number} is already booked from ${entry.start_time} to ${entry.end_time} for ${entry.subject}` 
        });
      }
    }

    const created = await prisma.createScheduleEntry({
      ...data,
      created_by: userId,
      created_at: new Date().toISOString()
    });

    // Emit WebSocket update
    try {
      getIO().emit('schedule:update', { date: data.date });
    } catch (wsError) {
      console.warn('WebSocket emit failed:', wsError);
    }

    res.status(201).json(created);
  } catch (err) { 
    if (err instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: err.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      });
    }
    
    console.error('Error creating schedule entry:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateScheduleEntry = async (req, res, next) => {
  try {
    const id = req.params.id;
    const data = inputSchema.partial().parse(req.body);
    const userId = req.user?.id || 'system';

    const existing = await prisma.getScheduleById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Schedule entry not found' });
    }

    // Check for conflicts if room or time is being changed
    if (data.room_number || data.start_time || data.end_time || data.date) {
      const checkDate = data.date || existing.date;
      const checkRoom = data.room_number || existing.room_number;
      const checkStartTime = data.start_time || existing.start_time;
      const checkEndTime = data.end_time || existing.end_time;
      
      const existingEntries = await prisma.getScheduleByDate(checkDate);
      const [newStartHour, newStartMin] = checkStartTime.split(':').map(Number);
      const [newEndHour, newEndMin] = checkEndTime.split(':').map(Number);
      const newStartMinutes = newStartHour * 60 + newStartMin;
      const newEndMinutes = newEndHour * 60 + newEndMin;
      
      for (const entry of existingEntries) {
        if (entry.id === id || entry.room_number !== checkRoom) continue;
        
        const [existingStartHour, existingStartMin] = entry.start_time.split(':').map(Number);
        const [existingEndHour, existingEndMin] = entry.end_time.split(':').map(Number);
        const existingStartMinutes = existingStartHour * 60 + existingStartMin;
        const existingEndMinutes = existingEndHour * 60 + existingEndMin;
        
        if (newStartMinutes < existingEndMinutes && newEndMinutes > existingStartMinutes) {
          return res.status(409).json({ 
            error: `Schedule conflict: Room ${checkRoom} is already booked from ${entry.start_time} to ${entry.end_time} for ${entry.subject}` 
          });
        }
      }
    }

    const updated = await prisma.updateScheduleEntry(id, {
      ...data,
      updated_by: userId,
      updated_at: new Date().toISOString()
    });

    // Emit WebSocket update
    try {
      const dateStr = data.date || existing.date;
      getIO().emit('schedule:update', { date: dateStr });
    } catch (wsError) {
      console.warn('WebSocket emit failed:', wsError);
    }

    res.json(updated);
  } catch (err) { 
    if (err instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: err.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      });
    }
    
    console.error('Error updating schedule entry:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.deleteScheduleEntry = async (req, res, next) => {
  try {
    const id = req.params.id;
    const userId = req.user?.id || 'system';
    
    const existing = await prisma.getScheduleById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Schedule entry not found' });
    }

    await prisma.deleteScheduleEntry(id);

    // Emit WebSocket update
    try {
      getIO().emit('schedule:update', { date: existing.date });
    } catch (wsError) {
      console.warn('WebSocket emit failed:', wsError);
    }

    res.json({ message: 'Schedule entry deleted successfully' });
  } catch (err) { 
    console.error('Error deleting schedule entry:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
