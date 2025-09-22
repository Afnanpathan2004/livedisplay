const mockDb = require('../utils/mockDb');
const { requirePermission, PERMISSIONS } = require('../utils/auth');
const { format } = require('date-fns');

// Export schedule data as JSON
exports.exportSchedule = [
  requirePermission(PERMISSIONS.EXPORT_DATA),
  async (req, res) => {
    try {
      const { startDate, endDate, format: exportFormat = 'json' } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Start date and end date are required' });
      }
      
      // Get all schedule entries in date range
      const entries = [];
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = format(d, 'yyyy-MM-dd');
        const dayEntries = await mockDb.getScheduleByDate(dateStr);
        entries.push(...dayEntries);
      }
      
      if (exportFormat === 'csv') {
        // Export as CSV
        const csvHeader = 'Date,Start Time,End Time,Room,Subject,Faculty\n';
        const csvRows = entries.map(entry => 
          `${entry.date},${entry.start_time},${entry.end_time},${entry.room_number},"${entry.subject}","${entry.faculty_name}"`
        ).join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="schedule_${startDate}_to_${endDate}.csv"`);
        res.send(csvHeader + csvRows);
      } else {
        // Export as JSON
        const exportData = {
          exportDate: new Date().toISOString(),
          dateRange: { startDate, endDate },
          totalEntries: entries.length,
          entries
        };
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="schedule_${startDate}_to_${endDate}.json"`);
        res.json(exportData);
      }
    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({ error: 'Export failed' });
    }
  }
];

// Import schedule data from JSON
exports.importSchedule = [
  requirePermission(PERMISSIONS.IMPORT_DATA),
  async (req, res) => {
    try {
      const { entries, overwrite = false } = req.body;
      
      if (!Array.isArray(entries)) {
        return res.status(400).json({ error: 'Entries must be an array' });
      }
      
      const results = {
        imported: 0,
        skipped: 0,
        errors: []
      };
      
      for (const entry of entries) {
        try {
          // Validate required fields
          if (!entry.date || !entry.start_time || !entry.end_time || !entry.room_number || !entry.subject || !entry.faculty_name) {
            results.errors.push(`Missing required fields in entry: ${JSON.stringify(entry)}`);
            continue;
          }
          
          // Check if entry already exists
          const existing = await mockDb.getScheduleByDate(entry.date);
          const conflict = existing.find(e => 
            e.room_number === entry.room_number &&
            e.start_time === entry.start_time &&
            e.date === entry.date
          );
          
          if (conflict && !overwrite) {
            results.skipped++;
            continue;
          }
          
          // Create or update entry
          await mockDb.createScheduleEntry({
            ...entry,
            created_by: req.user?.id || 'import',
            created_at: new Date().toISOString()
          });
          
          results.imported++;
        } catch (entryError) {
          results.errors.push(`Error importing entry: ${entryError.message}`);
        }
      }
      
      res.json({
        message: 'Import completed',
        results
      });
    } catch (error) {
      console.error('Import error:', error);
      res.status(500).json({ error: 'Import failed' });
    }
  }
];

// Export all data (schedules, announcements, tasks)
exports.exportAll = [
  requirePermission(PERMISSIONS.EXPORT_DATA),
  async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      // Get all data
      const schedules = [];
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateStr = format(d, 'yyyy-MM-dd');
          const dayEntries = await mockDb.getScheduleByDate(dateStr);
          schedules.push(...dayEntries);
        }
      }
      
      const announcements = await mockDb.getAllAnnouncements();
      const tasks = await mockDb.getAllTasks();
      
      const exportData = {
        exportDate: new Date().toISOString(),
        dateRange: startDate && endDate ? { startDate, endDate } : null,
        data: {
          schedules,
          announcements,
          tasks
        },
        counts: {
          schedules: schedules.length,
          announcements: announcements.length,
          tasks: tasks.length
        }
      };
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="livedisplay_export_${format(new Date(), 'yyyy-MM-dd')}.json"`);
      res.json(exportData);
    } catch (error) {
      console.error('Export all error:', error);
      res.status(500).json({ error: 'Export failed' });
    }
  }
];
