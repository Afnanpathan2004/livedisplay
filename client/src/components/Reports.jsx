import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService, handleApiError } from '../services/api';
import Layout from './Layout';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  Users, 
  TrendingUp,
  FileText,
  Filter,
  Eye,
  PieChart,
  Activity
} from 'lucide-react';

const Reports = () => {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState('attendance');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [reportData, setReportData] = useState(null);
  const [filters, setFilters] = useState({
    department: '',
    employee: '',
    status: ''
  });

  const reportTypes = [
    {
      id: 'attendance',
      name: 'Attendance Report',
      description: 'Employee attendance statistics and trends',
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      id: 'leave',
      name: 'Leave Report',
      description: 'Leave applications and approval statistics',
      icon: Calendar,
      color: 'bg-green-500'
    },
    {
      id: 'booking',
      name: 'Room Booking Report',
      description: 'Room utilization and booking patterns',
      icon: BarChart3,
      color: 'bg-purple-500'
    },
    {
      id: 'visitor',
      name: 'Visitor Report',
      description: 'Visitor statistics and security metrics',
      icon: Activity,
      color: 'bg-orange-500'
    },
    {
      id: 'asset',
      name: 'Asset Report',
      description: 'Asset utilization and maintenance tracking',
      icon: PieChart,
      color: 'bg-red-500'
    },
    {
      id: 'employee',
      name: 'Employee Report',
      description: 'Employee statistics and department analytics',
      icon: TrendingUp,
      color: 'bg-indigo-500'
    }
  ];

  useEffect(() => {
    fetchReportData();
  }, [selectedReport, dateRange, filters]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('startDate', dateRange.startDate);
      params.append('endDate', dateRange.endDate);
      
      if (filters.department) params.append('department', filters.department);
      if (filters.employee) params.append('employee', filters.employee);
      if (filters.status) params.append('status', filters.status);

      const response = await fetch(`/api/reports/${selectedReport}?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      setReportData(data);
    } catch (error) {
      console.error('Error fetching report data:', error);
      // Mock data for demonstration
      setReportData(generateMockData(selectedReport));
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = (reportType) => {
    switch (reportType) {
      case 'attendance':
        return {
          summary: {
            totalEmployees: 150,
            averageAttendance: 92.5,
            totalPresent: 139,
            totalAbsent: 11,
            lateArrivals: 8
          },
          trends: [
            { date: '2024-01-01', present: 145, absent: 5, late: 3 },
            { date: '2024-01-02', present: 142, absent: 8, late: 5 },
            { date: '2024-01-03', present: 148, absent: 2, late: 2 },
            { date: '2024-01-04', present: 140, absent: 10, late: 7 },
            { date: '2024-01-05', present: 146, absent: 4, late: 4 }
          ],
          departments: [
            { name: 'IT', attendance: 95.2, employees: 45 },
            { name: 'HR', attendance: 98.1, employees: 12 },
            { name: 'Finance', attendance: 89.3, employees: 25 },
            { name: 'Marketing', attendance: 91.7, employees: 18 },
            { name: 'Operations', attendance: 93.8, employees: 50 }
          ]
        };
      case 'leave':
        return {
          summary: {
            totalApplications: 45,
            approved: 38,
            pending: 5,
            rejected: 2,
            averageProcessingTime: 2.3
          },
          types: [
            { type: 'Sick Leave', count: 18, percentage: 40 },
            { type: 'Vacation', count: 15, percentage: 33.3 },
            { type: 'Personal', count: 8, percentage: 17.8 },
            { type: 'Emergency', count: 4, percentage: 8.9 }
          ],
          trends: [
            { month: 'Jan', applications: 12, approved: 10 },
            { month: 'Feb', applications: 15, approved: 13 },
            { month: 'Mar', applications: 18, approved: 15 }
          ]
        };
      default:
        return {
          summary: {
            total: 0,
            active: 0,
            inactive: 0
          },
          data: []
        };
    }
  };

  const exportReport = async (format) => {
    try {
      const params = new URLSearchParams();
      params.append('format', format);
      params.append('startDate', dateRange.startDate);
      params.append('endDate', dateRange.endDate);
      params.append('type', selectedReport);
      
      if (filters.department) params.append('department', filters.department);
      if (filters.employee) params.append('employee', filters.employee);
      if (filters.status) params.append('status', filters.status);

      const response = await fetch(`/api/reports/export?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${selectedReport}_report_${dateRange.startDate}_to_${dateRange.endDate}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  const ReportCard = ({ report, isSelected, onClick }) => {
    const Icon = report.icon;
    return (
      <div
        onClick={onClick}
        className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
          isSelected
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
        }`}
      >
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 ${report.color} rounded-lg flex items-center justify-center`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{report.name}</h3>
            <p className="text-sm text-gray-600">{report.description}</p>
          </div>
        </div>
      </div>
    );
  };

  const AttendanceReport = ({ data }) => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-gray-900">{data.summary.totalEmployees}</div>
          <div className="text-sm text-gray-600">Total Employees</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">{data.summary.totalPresent}</div>
          <div className="text-sm text-gray-600">Present Today</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-red-600">{data.summary.totalAbsent}</div>
          <div className="text-sm text-gray-600">Absent Today</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-yellow-600">{data.summary.lateArrivals}</div>
          <div className="text-sm text-gray-600">Late Arrivals</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">{data.summary.averageAttendance}%</div>
          <div className="text-sm text-gray-600">Avg Attendance</div>
        </div>
      </div>

      {/* Department Breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Department-wise Attendance</h3>
        <div className="space-y-4">
          {data.departments.map((dept, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">{dept.name}</div>
                <div className="text-sm text-gray-600">{dept.employees} employees</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-gray-900">{dept.attendance}%</div>
                <div className="text-sm text-gray-600">Attendance Rate</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const LeaveReport = ({ data }) => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-gray-900">{data.summary.totalApplications}</div>
          <div className="text-sm text-gray-600">Total Applications</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">{data.summary.approved}</div>
          <div className="text-sm text-gray-600">Approved</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-yellow-600">{data.summary.pending}</div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-red-600">{data.summary.rejected}</div>
          <div className="text-sm text-gray-600">Rejected</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">{data.summary.averageProcessingTime}</div>
          <div className="text-sm text-gray-600">Avg Processing (days)</div>
        </div>
      </div>

      {/* Leave Types */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Leave Types Breakdown</h3>
        <div className="space-y-4">
          {data.types.map((type, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="font-medium text-gray-900">{type.type}</div>
              <div className="flex items-center space-x-4">
                <div className="text-lg font-semibold text-gray-900">{type.count}</div>
                <div className="text-sm text-gray-600">{type.percentage}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderReportContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!reportData) {
      return (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No data available</h3>
          <p className="text-gray-600">Try adjusting your filters or date range.</p>
        </div>
      );
    }

    switch (selectedReport) {
      case 'attendance':
        return <AttendanceReport data={reportData} />;
      case 'leave':
        return <LeaveReport data={reportData} />;
      default:
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Data</h3>
            <pre className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg overflow-auto">
              {JSON.stringify(reportData, null, 2)}
            </pre>
          </div>
        );
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600">Generate comprehensive reports and insights</p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => exportReport('pdf')}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export PDF</span>
            </button>
            <button 
              onClick={() => exportReport('xlsx')}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        {/* Report Type Selection */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Report Type</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportTypes.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                isSelected={selectedReport === report.id}
                onClick={() => setSelectedReport(report.id)}
              />
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <select
                value={filters.department}
                onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Departments</option>
                <option value="IT">IT</option>
                <option value="HR">HR</option>
                <option value="Finance">Finance</option>
                <option value="Marketing">Marketing</option>
                <option value="Operations">Operations</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
              </select>
            </div>
          </div>
        </div>

        {/* Report Content */}
        <div>
          {renderReportContent()}
        </div>
      </div>
    </Layout>
  );
};

export default Reports;
