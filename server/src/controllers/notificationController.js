const enterpriseDb = require('../utils/enterpriseDb');
const { logger } = require('../utils/logger');

// Get notifications for user
exports.getNotifications = async (req, res, next) => {
  try {
    const { status, type, priority, limit = 50 } = req.query;
    const filters = {};
    
    if (status) filters.status = status;
    if (type) filters.type = type;
    if (priority) filters.priority = priority;
    
    let notifications = await enterpriseDb.notifications.findAll(filters);
    
    // Filter notifications for current user
    notifications = notifications.filter(notification => {
      if (notification.recipientType === 'individual') {
        return notification.recipients.includes(req.user.id);
      } else if (notification.recipientType === 'department') {
        return notification.recipients.includes(req.user.department);
      } else if (notification.recipientType === 'role') {
        return notification.recipients.includes(req.user.role);
      } else if (notification.recipientType === 'all') {
        return true;
      }
      return false;
    });
    
    // Sort by creation date (newest first)
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Limit results
    if (limit) {
      notifications = notifications.slice(0, parseInt(limit));
    }
    
    // Enrich with sender details
    const enrichedNotifications = await Promise.all(notifications.map(async (notification) => {
      let sender = null;
      if (notification.senderId) {
        const senderEmployee = await enterpriseDb.employees.findById(notification.senderId);
        if (senderEmployee) {
          sender = {
            name: `${senderEmployee.firstName} ${senderEmployee.lastName}`,
            employeeId: senderEmployee.employeeId,
            department: senderEmployee.department
          };
        }
      }
      
      return {
        ...notification,
        sender
      };
    }));
    
    res.json({
      notifications: enrichedNotifications,
      total: enrichedNotifications.length,
      unreadCount: enrichedNotifications.filter(n => n.status === 'unread').length
    });
    
    logger.info('Notifications retrieved', {
      userId: req.user.id,
      count: enrichedNotifications.length,
      unreadCount: enrichedNotifications.filter(n => n.status === 'unread').length
    });
  } catch (error) {
    next(error);
  }
};

// Mark notification as read
exports.markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const notification = await enterpriseDb.notifications.findById(id);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    // Check if user has access to this notification
    let hasAccess = false;
    if (notification.recipientType === 'individual') {
      hasAccess = notification.recipients.includes(req.user.id);
    } else if (notification.recipientType === 'department') {
      hasAccess = notification.recipients.includes(req.user.department);
    } else if (notification.recipientType === 'role') {
      hasAccess = notification.recipients.includes(req.user.role);
    } else if (notification.recipientType === 'all') {
      hasAccess = true;
    }
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Update read status
    const updatedNotification = await enterpriseDb.notifications.update(id, {
      status: 'read',
      readAt: new Date(),
      readBy: req.user.id
    });
    
    res.json({
      message: 'Notification marked as read',
      notification: updatedNotification
    });
    
    logger.info('Notification marked as read', {
      userId: req.user.id,
      notificationId: id
    });
  } catch (error) {
    next(error);
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res, next) => {
  try {
    const notifications = await enterpriseDb.notifications.findAll({ status: 'unread' });
    
    // Filter notifications for current user
    const userNotifications = notifications.filter(notification => {
      if (notification.recipientType === 'individual') {
        return notification.recipients.includes(req.user.id);
      } else if (notification.recipientType === 'department') {
        return notification.recipients.includes(req.user.department);
      } else if (notification.recipientType === 'role') {
        return notification.recipients.includes(req.user.role);
      } else if (notification.recipientType === 'all') {
        return true;
      }
      return false;
    });
    
    // Update all to read
    const updatePromises = userNotifications.map(notification =>
      enterpriseDb.notifications.update(notification.id, {
        status: 'read',
        readAt: new Date(),
        readBy: req.user.id
      })
    );
    
    await Promise.all(updatePromises);
    
    res.json({
      message: 'All notifications marked as read',
      count: userNotifications.length
    });
    
    logger.info('All notifications marked as read', {
      userId: req.user.id,
      count: userNotifications.length
    });
  } catch (error) {
    next(error);
  }
};

// Create notification (admin only)
exports.createNotification = async (req, res, next) => {
  try {
    const notificationData = {
      ...req.body,
      senderId: req.user.id
    };
    
    const notification = await enterpriseDb.notifications.create(notificationData);
    
    res.status(201).json({
      message: 'Notification created successfully',
      notification
    });
    
    logger.info('Notification created', {
      userId: req.user.id,
      notificationId: notification.id,
      type: notification.type,
      recipientType: notification.recipientType
    });
  } catch (error) {
    next(error);
  }
};

// Delete notification
exports.deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const notification = await enterpriseDb.notifications.findById(id);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    // Only admin or sender can delete
    if (req.user.role !== 'admin' && req.user.id !== notification.senderId) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    await enterpriseDb.notifications.delete(id);
    
    res.json({ message: 'Notification deleted successfully' });
    
    logger.info('Notification deleted', {
      userId: req.user.id,
      notificationId: id
    });
  } catch (error) {
    next(error);
  }
};

// Get notification statistics
exports.getNotificationStats = async (req, res, next) => {
  try {
    const { department, type, days = 30 } = req.query;
    
    const notifications = await enterpriseDb.notifications.findAll();
    
    // Filter by date range
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
    
    let filteredNotifications = notifications.filter(notification => 
      new Date(notification.createdAt) >= cutoffDate
    );
    
    // Filter by department if specified
    if (department) {
      filteredNotifications = filteredNotifications.filter(notification =>
        notification.recipientType === 'department' && 
        notification.recipients.includes(department)
      );
    }
    
    // Filter by type if specified
    if (type) {
      filteredNotifications = filteredNotifications.filter(notification =>
        notification.type === type
      );
    }
    
    const stats = {
      totalNotifications: filteredNotifications.length,
      unreadNotifications: filteredNotifications.filter(n => n.status === 'unread').length,
      readNotifications: filteredNotifications.filter(n => n.status === 'read').length,
      
      typeStats: {},
      priorityStats: {
        high: filteredNotifications.filter(n => n.priority === 'high').length,
        medium: filteredNotifications.filter(n => n.priority === 'medium').length,
        low: filteredNotifications.filter(n => n.priority === 'low').length
      },
      
      channelStats: {},
      
      dailyStats: Array(parseInt(days)).fill(0)
    };
    
    // Calculate type statistics
    const types = [...new Set(filteredNotifications.map(n => n.type))];
    types.forEach(type => {
      stats.typeStats[type] = filteredNotifications.filter(n => n.type === type).length;
    });
    
    // Calculate channel statistics
    filteredNotifications.forEach(notification => {
      notification.channels.forEach(channel => {
        stats.channelStats[channel] = (stats.channelStats[channel] || 0) + 1;
      });
    });
    
    // Calculate daily statistics
    filteredNotifications.forEach(notification => {
      const notificationDate = new Date(notification.createdAt);
      const daysDiff = Math.floor((new Date() - notificationDate) / (1000 * 60 * 60 * 24));
      if (daysDiff < parseInt(days)) {
        stats.dailyStats[parseInt(days) - 1 - daysDiff]++;
      }
    });
    
    res.json({ stats });
    
    logger.info('Notification statistics retrieved', {
      userId: req.user.id,
      days: parseInt(days),
      totalNotifications: stats.totalNotifications
    });
  } catch (error) {
    next(error);
  }
};

// Send bulk notification
exports.sendBulkNotification = async (req, res, next) => {
  try {
    const { title, message, recipientType, recipients, priority = 'medium', channels = ['push'] } = req.body;
    
    if (!title || !message || !recipientType || !recipients) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const notificationData = {
      type: 'announcement',
      title,
      message,
      recipientType,
      recipients: Array.isArray(recipients) ? recipients : [recipients],
      senderId: req.user.id,
      priority,
      channels: Array.isArray(channels) ? channels : [channels]
    };
    
    const notification = await enterpriseDb.notifications.create(notificationData);
    
    res.status(201).json({
      message: 'Bulk notification sent successfully',
      notification
    });
    
    logger.info('Bulk notification sent', {
      userId: req.user.id,
      notificationId: notification.id,
      recipientType,
      recipientCount: notificationData.recipients.length
    });
  } catch (error) {
    next(error);
  }
};
