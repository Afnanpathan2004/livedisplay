import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService, handleApiError } from '../services/api';
import Layout from './Layout';
import { 
  UserCheck, 
  Calendar, 
  Clock, 
  TrendingUp,
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Filter,
  Download,
  Eye
} from 'lucide-react';

const AttendanceManagement = () => {
  const { token, user } = useAuth();
  const [attendanceData, setAttendanceData] = useState([]);
  const [departmentStats, setDepartmentStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [viewMode, setViewMode] = useState('daily'); // daily, monthly, summary

  useEffect(() => {
    fetchAttendanceData();
    fetchDepartmentStats();
  }, [selectedDate, selectedDepartment]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const response = await apiService.attendance.getAll({
        date: selectedDate,
        department: selectedDepartment
      });
      setAttendanceData(response.data.attendance || []);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentStats = async () => {
    try {
      const response = await apiService.attendance.getDepartmentStats({
        date: selectedDate,
        department: selectedDepartment
      });
      setDepartmentStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching department stats:', error);
      handleApiError(error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'half_day':
        return 'bg-blue-100 text-blue-800';
      case 'on_leave':
        return 'bg-purple-100 text-purple-800';
      case 'early_departure':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'late':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'absent':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'half_day':
        return <AlertTriangle className="h-4 w-4 text-blue-600" />;
      case 'on_leave':
        return <Calendar className="h-4 w-4 text-purple-600" />;
      case 'early_departure':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default:
        return <UserCheck className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return new Date(timeString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const calculateWorkingHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 'N/A';
    const diff = new Date(checkOut) - new Date(checkIn);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const AttendanceCard = ({ record }) => (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
            <UserCheck className="h-6 w-6 text-gray-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {record.employee?.name || 'Unknown Employee'}
            </h3>
            <p className="text-sm text-gray-600">{record.employee?.employeeId}</p>
            <p className="text-sm text-blue-600">{record.employee?.department}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon(record.status)}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
            {record.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
        <div>
          <span className="font-medium">Check In:</span> {formatTime(record.checkIn)}
        </div>
        <div>
          <span className="font-medium">Check Out:</span> {formatTime(record.checkOut)}
        </div>
        <div>
          <span className="font-medium">Working Hours:</span> 
          {record.totalHours ? `${record.totalHours}h` : calculateWorkingHours(record.checkIn, record.checkOut)}
        </div>
        <div>
          <span className="font-medium">Location:</span> {record.location || 'Office'}
        </div>
      </div>

      {record.remarks && (
        <div className="mb-4">
          <span className="text-sm font-medium text-gray-700">Remarks:</span>
          <p className="text-sm text-gray-600 mt-1">{record.remarks}</p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Date: {new Date(record.date).toLocaleDateString()}
        </div>
        <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
          <Eye className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  const AttendanceSummaryTable = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Attendance Summary</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Employee
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Department
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Check In
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Check Out
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hours
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {departmentStats?.employeeDetails?.map((employee) => (
              <tr key={employee.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <UserCheck className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                      <div className="text-sm text-gray-500">{employee.employeeId}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {selectedDepartment || 'All'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(employee.status)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(employee.status)}`}>
                      {employee.status}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatTime(employee.checkIn)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatTime(employee.checkOut)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {employee.totalHours ? `${employee.totalHours}h` : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
            <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
            <p className="text-gray-600">Monitor and manage employee attendance</p>
          </div>
          <div className="flex space-x-3">
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
              <UserCheck className="h-4 w-4" />
              <span>Mark Attendance</span>
            </button>
          </div>
        </div>

        {/* Filters and View Toggle */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 items-center">
            <div className="flex space-x-4">
              <button
                onClick={() => setViewMode('daily')}
                className={`px-4 py-2 rounded-lg ${viewMode === 'daily' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                Daily View
              </button>
              <button
                onClick={() => setViewMode('summary')}
                className={`px-4 py-2 rounded-lg ${viewMode === 'summary' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                Summary View
              </button>
            </div>
            
            <div className="flex space-x-4 flex-1">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Departments</option>
                <option value="HR">Human Resources</option>
                <option value="IT">Information Technology</option>
                <option value="FIN">Finance</option>
                <option value="MKT">Marketing</option>
                <option value="OPS">Operations</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {departmentStats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Employees</p>
                  <p className="text-2xl font-bold text-gray-900">{departmentStats.totalEmployees}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Present</p>
                  <p className="text-2xl font-bold text-gray-900">{departmentStats.presentEmployees}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Late</p>
                  <p className="text-2xl font-bold text-gray-900">{departmentStats.lateEmployees}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Absent</p>
                  <p className="text-2xl font-bold text-gray-900">{departmentStats.absentEmployees}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{Math.round(departmentStats.attendanceRate)}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content based on view mode */}
        {viewMode === 'daily' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {attendanceData.map(record => (
              <AttendanceCard key={record.id} record={record} />
            ))}
          </div>
        ) : (
          <AttendanceSummaryTable />
        )}

        {attendanceData.length === 0 && viewMode === 'daily' && (
          <div className="text-center py-12">
            <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No attendance records found</h3>
            <p className="text-gray-600">No attendance data available for the selected date and filters.</p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
              <UserCheck className="h-6 w-6 text-blue-600 mb-2" />
              <h4 className="font-medium text-gray-900">Bulk Check-in</h4>
              <p className="text-sm text-gray-600">Mark attendance for multiple employees</p>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
              <Calendar className="h-6 w-6 text-green-600 mb-2" />
              <h4 className="font-medium text-gray-900">Generate Report</h4>
              <p className="text-sm text-gray-600">Create attendance reports for payroll</p>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
              <AlertTriangle className="h-6 w-6 text-orange-600 mb-2" />
              <h4 className="font-medium text-gray-900">Attendance Alerts</h4>
              <p className="text-sm text-gray-600">Set up automated attendance notifications</p>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AttendanceManagement;
