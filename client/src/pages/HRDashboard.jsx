import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiService, handleApiError } from '../services/api';
import Layout from '../components/Layout';
import { 
  Users, 
  Calendar, 
  UserCheck, 
  Package, 
  Bell, 
  Building, 
  TrendingUp, 
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react';

const HRDashboard = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    employees: { total: 0, active: 0, onLeave: 0 },
    attendance: { present: 0, late: 0, absent: 0, rate: 0 },
    bookings: { pending: 0, approved: 0, today: 0 },
    visitors: { today: 0, pending: 0, checkedIn: 0 },
    assets: { total: 0, assigned: 0, maintenance: 0 },
    notifications: { unread: 0, total: 0 }
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all stats in parallel using apiService
      const [
        employeeData,
        attendanceData,
        bookingData,
        visitorData,
        assetData,
        notificationData
      ] = await Promise.all([
        apiService.employees.getStats().catch(err => ({ stats: {} })),
        apiService.attendance.getDepartmentStats({ 
          date: new Date().toISOString().split('T')[0] 
        }).catch(err => ({ stats: {} })),
        apiService.bookings.getStats().catch(err => ({ stats: {} })),
        apiService.visitors.getStats().catch(err => ({ stats: {} })),
        apiService.assets.getStats().catch(err => ({ stats: {} })),
        apiService.notifications.getAll({ limit: 10 }).catch(err => ({ data: [], unreadCount: 0, total: 0 }))
      ]);

      setStats({
        employees: {
          total: employeeData.data?.stats?.totalEmployees || 0,
          active: employeeData.data?.stats?.totalEmployees || 0,
          onLeave: 0
        },
        attendance: {
          present: attendanceData.data?.stats?.presentEmployees || 0,
          late: attendanceData.data?.stats?.lateEmployees || 0,
          absent: attendanceData.data?.stats?.absentEmployees || 0,
          rate: attendanceData.data?.stats?.attendanceRate || 0
        },
        bookings: {
          pending: bookingData.data?.stats?.pendingBookings || 0,
          approved: bookingData.data?.stats?.approvedBookings || 0,
          today: bookingData.data?.stats?.todayBookings || 0
        },
        visitors: {
          today: visitorData.data?.stats?.todayVisitors || 0,
          pending: visitorData.data?.stats?.pendingApprovals || 0,
          checkedIn: visitorData.data?.stats?.checkedInVisitors || 0
        },
        assets: {
          total: assetData.data?.stats?.totalAssets || 0,
          assigned: assetData.data?.stats?.assignedAssets || 0,
          maintenance: assetData.data?.stats?.maintenanceAssets || 0
        },
        notifications: {
          unread: notificationData.data?.unreadCount || 0,
          total: notificationData.data?.total || 0
        }
      });

      // Mock recent activities for now
      setRecentActivities([
        { id: 1, type: 'booking', message: 'Conference Room A booked by John Doe', time: '10 minutes ago', status: 'pending' },
        { id: 2, type: 'visitor', message: 'New visitor registration: Jane Smith', time: '25 minutes ago', status: 'approved' },
        { id: 3, type: 'leave', message: 'Leave request from Mike Johnson', time: '1 hour ago', status: 'pending' },
        { id: 4, type: 'asset', message: 'Laptop LP001 assigned to Sarah Wilson', time: '2 hours ago', status: 'completed' },
        { id: 5, type: 'attendance', message: 'Late check-in: David Brown', time: '3 hours ago', status: 'warning' }
      ]);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color, trend, gradient }) => (
    <div className={`group relative overflow-hidden bg-gradient-to-br ${gradient} rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-1`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
      <div className="relative p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl bg-white/20 backdrop-blur-sm`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          {trend && (
            <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
              <TrendingUp className="h-4 w-4 text-white mr-1" />
              <span className="text-sm text-white font-semibold">{trend}</span>
            </div>
          )}
        </div>
        <div>
          <p className="text-white/80 text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-white mb-1">{value}</p>
          {subtitle && <p className="text-white/70 text-sm">{subtitle}</p>}
        </div>
        <div className="absolute -bottom-4 -right-4 opacity-10">
          <Icon className="h-16 w-16 text-white transform rotate-12" />
        </div>
      </div>
    </div>
  );

  const ActivityItem = ({ activity }) => {
    const getStatusIcon = (status) => {
      switch (status) {
        case 'completed':
        case 'approved':
          return <CheckCircle className="h-4 w-4 text-green-500" />;
        case 'pending':
          return <Clock className="h-4 w-4 text-yellow-500" />;
        case 'warning':
          return <AlertTriangle className="h-4 w-4 text-orange-500" />;
        case 'rejected':
          return <XCircle className="h-4 w-4 text-red-500" />;
        default:
          return <Eye className="h-4 w-4 text-gray-500" />;
      }
    };

    return (
      <div className="group flex items-center space-x-4 p-4 hover:bg-slate-800/50 rounded-xl transition-all duration-300 border border-slate-700/50 hover:border-slate-600">
        <div className="flex-shrink-0">
          {getStatusIcon(activity.status)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-200 group-hover:text-white truncate">
            {activity.message}
          </p>
          <p className="text-xs text-slate-400 group-hover:text-slate-300">{activity.time}</p>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Eye className="h-4 w-4 text-slate-400 hover:text-slate-200" />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500/30 border-t-blue-500 mx-auto mb-4"></div>
            <div className="absolute inset-0 rounded-full bg-blue-500/10 animate-ping"></div>
          </div>
          <p className="text-slate-300 text-lg font-medium">Loading HR Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Enhanced Header */}
      <div className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Building className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent">
                  HR Dashboard
                </h1>
                <p className="text-slate-400 text-lg">Tata Motors Office Management System</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="relative group">
                <button className="p-3 bg-slate-800/50 hover:bg-blue-600 rounded-xl transition-all duration-300 border border-slate-700 hover:border-blue-500 shadow-lg hover:shadow-blue-500/25">
                  <Bell className="h-6 w-6 text-slate-300 group-hover:text-white" />
                  {stats.notifications.unread > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse">
                      {stats.notifications.unread}
                    </span>
                  )}
                </button>
              </div>
              <div className="text-right">
                <p className="text-slate-300 font-medium">Welcome back,</p>
                <p className="text-white font-bold">{user?.username || 'Admin'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <StatCard
            title="Total Employees"
            value={stats.employees.total}
            subtitle={`${stats.employees.active} active`}
            icon={Users}
            gradient="from-blue-600 to-blue-700"
            trend="+12%"
          />
          <StatCard
            title="Attendance Rate"
            value={`${Math.round(stats.attendance.rate)}%`}
            subtitle={`${stats.attendance.present} present today`}
            icon={UserCheck}
            gradient="from-green-600 to-green-700"
            trend="+5%"
          />
          <StatCard
            title="Room Bookings"
            value={stats.bookings.today}
            subtitle={`${stats.bookings.pending} pending`}
            icon={Calendar}
            gradient="from-purple-600 to-purple-700"
            trend="+8%"
          />
          <StatCard
            title="Visitors Today"
            value={stats.visitors.today}
            subtitle={`${stats.visitors.checkedIn} checked in`}
            icon={Building}
            gradient="from-orange-600 to-orange-700"
            trend="+15%"
          />
          <StatCard
            title="Assets"
            value={stats.assets.total}
            subtitle={`${stats.assets.assigned} assigned`}
            icon={Package}
            gradient="from-red-600 to-red-700"
            trend="+3%"
          />
          <StatCard
            title="Notifications"
            value={stats.notifications.unread}
            subtitle={`${stats.notifications.total} total`}
            icon={Bell}
            gradient="from-indigo-600 to-indigo-700"
            trend="+20%"
          />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
              <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mr-3">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              Quick Actions
            </h3>
            <div className="space-y-4">
              <button 
                onClick={() => navigate('/employees')}
                className="group w-full text-left p-4 rounded-xl bg-slate-700/50 hover:bg-blue-600 border border-slate-600 hover:border-blue-500 transition-all duration-300 flex items-center space-x-4 shadow-lg hover:shadow-blue-500/25 transform hover:scale-105"
              >
                <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-white/20">
                  <Users className="h-5 w-5 text-blue-400 group-hover:text-white" />
                </div>
                <div>
                  <span className="text-slate-200 group-hover:text-white font-medium">Manage Employees</span>
                  <p className="text-slate-400 group-hover:text-blue-100 text-sm">View and manage staff</p>
                </div>
              </button>
              <button 
                onClick={() => navigate('/bookings')}
                className="group w-full text-left p-4 rounded-xl bg-slate-700/50 hover:bg-purple-600 border border-slate-600 hover:border-purple-500 transition-all duration-300 flex items-center space-x-4 shadow-lg hover:shadow-purple-500/25 transform hover:scale-105"
              >
                <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-white/20">
                  <Calendar className="h-5 w-5 text-purple-400 group-hover:text-white" />
                </div>
                <div>
                  <span className="text-slate-200 group-hover:text-white font-medium">Room Bookings</span>
                  <p className="text-slate-400 group-hover:text-purple-100 text-sm">Manage room reservations</p>
                </div>
              </button>
              <button 
                onClick={() => navigate('/visitors')}
                className="group w-full text-left p-4 rounded-xl bg-slate-700/50 hover:bg-orange-600 border border-slate-600 hover:border-orange-500 transition-all duration-300 flex items-center space-x-4 shadow-lg hover:shadow-orange-500/25 transform hover:scale-105"
              >
                <div className="p-2 bg-orange-500/20 rounded-lg group-hover:bg-white/20">
                  <Building className="h-5 w-5 text-orange-400 group-hover:text-white" />
                </div>
                <div>
                  <span className="text-slate-200 group-hover:text-white font-medium">Visitor Management</span>
                  <p className="text-slate-400 group-hover:text-orange-100 text-sm">Track visitor access</p>
                </div>
              </button>
              <button 
                onClick={() => navigate('/assets')}
                className="group w-full text-left p-4 rounded-xl bg-slate-700/50 hover:bg-red-600 border border-slate-600 hover:border-red-500 transition-all duration-300 flex items-center space-x-4 shadow-lg hover:shadow-red-500/25 transform hover:scale-105"
              >
                <div className="p-2 bg-red-500/20 rounded-lg group-hover:bg-white/20">
                  <Package className="h-5 w-5 text-red-400 group-hover:text-white" />
                </div>
                <div>
                  <span className="text-slate-200 group-hover:text-white font-medium">Asset Tracking</span>
                  <p className="text-slate-400 group-hover:text-red-100 text-sm">Monitor company assets</p>
                </div>
              </button>
              <button 
                onClick={() => navigate('/reports')}
                className="group w-full text-left p-4 rounded-xl bg-slate-700/50 hover:bg-green-600 border border-slate-600 hover:border-green-500 transition-all duration-300 flex items-center space-x-4 shadow-lg hover:shadow-green-500/25 transform hover:scale-105"
              >
                <div className="p-2 bg-green-500/20 rounded-lg group-hover:bg-white/20">
                  <UserCheck className="h-5 w-5 text-green-400 group-hover:text-white" />
                </div>
                <div>
                  <span className="text-slate-200 group-hover:text-white font-medium">Attendance Reports</span>
                  <p className="text-slate-400 group-hover:text-green-100 text-sm">View attendance analytics</p>
                </div>
              </button>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center">
                <div className="h-8 w-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-3">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                Recent Activities
              </h3>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-300 text-sm font-medium">
                View All
              </button>
            </div>
            <div className="space-y-2">
              {recentActivities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          </div>
        </div>

        {/* Attendance Overview */}
        <div className="mt-8 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-xl">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center">
            <div className="h-8 w-8 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg flex items-center justify-center mr-3">
              <UserCheck className="h-4 w-4 text-white" />
            </div>
            Today's Attendance Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-green-600 to-green-700 rounded-xl shadow-lg hover:shadow-green-500/25 transition-all duration-300 transform hover:scale-105">
              <div className="text-3xl font-bold text-white mb-2">{stats.attendance.present}</div>
              <div className="text-green-100 font-medium">Present</div>
              <div className="mt-2 w-full bg-green-800/30 rounded-full h-2">
                <div className="bg-white h-2 rounded-full" style={{width: '85%'}}></div>
              </div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-yellow-600 to-orange-600 rounded-xl shadow-lg hover:shadow-yellow-500/25 transition-all duration-300 transform hover:scale-105">
              <div className="text-3xl font-bold text-white mb-2">{stats.attendance.late}</div>
              <div className="text-yellow-100 font-medium">Late</div>
              <div className="mt-2 w-full bg-yellow-800/30 rounded-full h-2">
                <div className="bg-white h-2 rounded-full" style={{width: '15%'}}></div>
              </div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-red-600 to-red-700 rounded-xl shadow-lg hover:shadow-red-500/25 transition-all duration-300 transform hover:scale-105">
              <div className="text-3xl font-bold text-white mb-2">{stats.attendance.absent}</div>
              <div className="text-red-100 font-medium">Absent</div>
              <div className="mt-2 w-full bg-red-800/30 rounded-full h-2">
                <div className="bg-white h-2 rounded-full" style={{width: '5%'}}></div>
              </div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105">
              <div className="text-3xl font-bold text-white mb-2">{Math.round(stats.attendance.rate)}%</div>
              <div className="text-blue-100 font-medium">Attendance Rate</div>
              <div className="mt-2 w-full bg-blue-800/30 rounded-full h-2">
                <div className="bg-white h-2 rounded-full" style={{width: `${stats.attendance.rate}%`}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;
