import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService, handleApiError } from '../services/api';
import Layout from './Layout';
import { 
  Bell, 
  Search, 
  Filter, 
  Eye,
  EyeOff,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Info,
  Calendar,
  User,
  Building,
  Package,
  UserCheck,
  Settings
} from 'lucide-react';

const NotificationCenter = () => {
  const { token, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    important: 0,
    today: 0
  });

  useEffect(() => {
    fetchNotifications();
    fetchNotificationStats();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await apiService.notifications.getAll({
        type: filterType,
        status: filterStatus,
        search: searchTerm
      });
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      handleApiError(error);
      // Mock data for demonstration
      setNotifications(generateMockNotifications());
    } finally {
      setLoading(false);
    }
  };

  const fetchNotificationStats = async () => {
    try {
      const response = await fetch('/api/notifications/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setStats(data.stats || stats);
    } catch (error) {
      console.error('Error fetching notification stats:', error);
    }
  };

  const generateMockNotifications = () => [
    {
      id: 1,
      type: 'booking',
      title: 'Room Booking Approved',
      message: 'Your booking for Conference Room A has been approved for tomorrow 2:00 PM - 4:00 PM',
      isRead: false,
      isImportant: true,
      createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      sender: { name: 'HR Department', role: 'hr' },
      actionUrl: '/bookings'
    },
    {
      id: 2,
      type: 'leave',
      title: 'Leave Request Pending',
      message: 'John Doe has submitted a leave request for review (March 15-17, 2024)',
      isRead: false,
      isImportant: false,
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      sender: { name: 'John Doe', role: 'employee' },
      actionUrl: '/leaves'
    },
    {
      id: 3,
      type: 'visitor',
      title: 'New Visitor Registration',
      message: 'A new visitor "Jane Smith from ABC Corp" is scheduled to visit today at 3:00 PM',
      isRead: true,
      isImportant: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      sender: { name: 'Security', role: 'security' },
      actionUrl: '/visitors'
    },
    {
      id: 4,
      type: 'asset',
      title: 'Asset Maintenance Due',
      message: 'Laptop LP001 is due for maintenance. Please schedule maintenance within 7 days.',
      isRead: false,
      isImportant: true,
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      sender: { name: 'Asset Management', role: 'system' },
      actionUrl: '/assets'
    },
    {
      id: 5,
      type: 'attendance',
      title: 'Attendance Alert',
      message: 'Your attendance rate for this month is below 90%. Current rate: 87%',
      isRead: true,
      isImportant: true,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      sender: { name: 'HR System', role: 'system' },
      actionUrl: '/attendance'
    },
    {
      id: 6,
      type: 'system',
      title: 'System Maintenance',
      message: 'Scheduled system maintenance will occur tonight from 11:00 PM to 2:00 AM',
      isRead: true,
      isImportant: false,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      sender: { name: 'IT Department', role: 'admin' },
      actionUrl: null
    }
  ];

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'booking':
        return <Calendar className="h-5 w-5 text-purple-600" />;
      case 'leave':
        return <User className="h-5 w-5 text-blue-600" />;
      case 'visitor':
        return <Building className="h-5 w-5 text-orange-600" />;
      case 'asset':
        return <Package className="h-5 w-5 text-red-600" />;
      case 'attendance':
        return <UserCheck className="h-5 w-5 text-green-600" />;
      case 'system':
        return <Settings className="h-5 w-5 text-gray-600" />;
      default:
        return <Bell className="h-5 w-5 text-blue-600" />;
    }
  };

  const getNotificationColor = (type, isImportant) => {
    if (isImportant) {
      return 'border-l-red-500 bg-red-50';
    }
    
    switch (type) {
      case 'booking':
        return 'border-l-purple-500 bg-purple-50';
      case 'leave':
        return 'border-l-blue-500 bg-blue-50';
      case 'visitor':
        return 'border-l-orange-500 bg-orange-50';
      case 'asset':
        return 'border-l-red-500 bg-red-50';
      case 'attendance':
        return 'border-l-green-500 bg-green-50';
      case 'system':
        return 'border-l-gray-500 bg-gray-50';
      default:
        return 'border-l-blue-500 bg-blue-50';
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return date.toLocaleDateString();
  };

  const markAsRead = async (notificationId) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAsUnread = async (notificationId) => {
    try {
      await fetch(`/api/notifications/${notificationId}/unread`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: false }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as unread:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || notification.type === filterType;
    const matchesStatus = !filterStatus || 
                         (filterStatus === 'read' && notification.isRead) ||
                         (filterStatus === 'unread' && !notification.isRead) ||
                         (filterStatus === 'important' && notification.isImportant);
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const NotificationCard = ({ notification }) => (
    <div className={`border-l-4 ${getNotificationColor(notification.type, notification.isImportant)} ${
      !notification.isRead ? 'bg-white' : 'bg-gray-50'
    } rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="flex-shrink-0 mt-1">
            {getNotificationIcon(notification.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                {notification.title}
              </h3>
              {notification.isImportant && (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
              {!notification.isRead && (
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>From: {notification.sender.name}</span>
              <span>{formatTimeAgo(notification.createdAt)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          {!notification.isRead ? (
            <button
              onClick={() => markAsRead(notification.id)}
              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
              title="Mark as read"
            >
              <Eye className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => markAsUnread(notification.id)}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
              title="Mark as unread"
            >
              <EyeOff className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => deleteNotification(notification.id)}
            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {notification.actionUrl && (
        <div className="mt-3">
          <a
            href={notification.actionUrl}
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
            View Details →
          </a>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notification Center</h1>
            <p className="text-gray-600">Stay updated with important notifications and alerts</p>
          </div>
          <button 
            onClick={markAllAsRead}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <CheckCircle className="h-4 w-4" />
            <span>Mark All Read</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <Bell className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Notifications</p>
                <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Unread</p>
                <p className="text-2xl font-bold text-gray-900">
                  {notifications.filter(n => !n.isRead).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Important</p>
                <p className="text-2xl font-bold text-gray-900">
                  {notifications.filter(n => n.isImportant).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today</p>
                <p className="text-2xl font-bold text-gray-900">
                  {notifications.filter(n => {
                    const today = new Date().toDateString();
                    const notificationDate = new Date(n.createdAt).toDateString();
                    return today === notificationDate;
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex space-x-4">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="booking">Booking</option>
                <option value="leave">Leave</option>
                <option value="visitor">Visitor</option>
                <option value="asset">Asset</option>
                <option value="attendance">Attendance</option>
                <option value="system">System</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
                <option value="important">Important</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.map(notification => (
            <NotificationCard key={notification.id} notification={notification} />
          ))}
        </div>

        {filteredNotifications.length === 0 && (
          <div className="text-center py-12">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
            <p className="text-gray-600">No notifications match your current filters.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default NotificationCenter;
