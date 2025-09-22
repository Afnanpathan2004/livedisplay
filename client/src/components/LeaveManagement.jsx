import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService, handleApiError } from '../services/api';
import Layout from './Layout';
import { 
  Calendar, 
  Plus, 
  Search, 
  Filter, 
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  User,
  AlertTriangle,
  FileText,
  Download
} from 'lucide-react';

const LeaveManagement = () => {
  const { token, user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  });

  useEffect(() => {
    fetchLeaves();
    fetchLeaveStats();
  }, []);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const response = await apiService.leaves.getAll({
        status: filterStatus,
        type: filterType,
        search: searchTerm
      });
      setLeaves(response.data.leaves || []);
    } catch (error) {
      console.error('Error fetching leaves:', error);
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveStats = async () => {
    try {
      const response = await apiService.leaves.getStats();
      setStats(response.data.stats || stats);
    } catch (error) {
      console.error('Error fetching leave stats:', error);
      handleApiError(error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'rejected':
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getLeaveTypeColor = (type) => {
    switch (type) {
      case 'sick':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'vacation':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'personal':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'emergency':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'maternity':
        return 'bg-pink-50 text-pink-700 border-pink-200';
      case 'paternity':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const filteredLeaves = leaves.filter(leave => {
    const matchesSearch = leave.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         leave.employee?.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         leave.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || leave.status === filterStatus;
    const matchesType = !filterType || leave.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const LeaveCard = ({ leave }) => (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-gray-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {leave.employee?.name || 'Unknown Employee'}
            </h3>
            <p className="text-sm text-gray-600">{leave.employee?.employeeId}</p>
            <p className="text-sm text-blue-600">{leave.employee?.department}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon(leave.status)}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(leave.status)}`}>
            {leave.status}
          </span>
        </div>
      </div>

      <div className="mb-4">
        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getLeaveTypeColor(leave.type)}`}>
          {leave.type} Leave
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
        <div>
          <span className="font-medium">Start Date:</span> {new Date(leave.startDate).toLocaleDateString()}
        </div>
        <div>
          <span className="font-medium">End Date:</span> {new Date(leave.endDate).toLocaleDateString()}
        </div>
        <div>
          <span className="font-medium">Duration:</span> {calculateDuration(leave.startDate, leave.endDate)} days
        </div>
        <div>
          <span className="font-medium">Applied:</span> {new Date(leave.appliedDate).toLocaleDateString()}
        </div>
      </div>

      {leave.reason && (
        <div className="mb-4">
          <span className="text-sm font-medium text-gray-700">Reason:</span>
          <p className="text-sm text-gray-600 mt-1">{leave.reason}</p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {leave.approvedBy && (
            <span>Approved by: {leave.approvedBy}</span>
          )}
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => setSelectedLeave(leave)}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
          >
            <Eye className="h-4 w-4" />
          </button>
          {(user?.role === 'admin' || user?.role === 'hr' || user?.role === 'manager') && leave.status === 'pending' && (
            <>
              <button className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                Approve
              </button>
              <button className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700">
                Reject
              </button>
            </>
          )}
          {leave.employeeId === user?.id && leave.status === 'pending' && (
            <button className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700">
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const LeaveModal = ({ leave, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Leave Application Details</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-gray-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">{leave.employee?.name}</h3>
              <p className="text-gray-600">{leave.employee?.employeeId}</p>
              <p className="text-blue-600">{leave.employee?.department}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Leave Details</h4>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Type:</span> 
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs border ${getLeaveTypeColor(leave.type)}`}>
                    {leave.type} Leave
                  </span>
                </div>
                <div><span className="font-medium">Start Date:</span> {new Date(leave.startDate).toLocaleDateString()}</div>
                <div><span className="font-medium">End Date:</span> {new Date(leave.endDate).toLocaleDateString()}</div>
                <div><span className="font-medium">Duration:</span> {calculateDuration(leave.startDate, leave.endDate)} days</div>
                <div><span className="font-medium">Applied Date:</span> {new Date(leave.appliedDate).toLocaleDateString()}</div>
                <div><span className="font-medium">Status:</span> 
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(leave.status)}`}>
                    {leave.status}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Additional Information</h4>
              <div className="space-y-2 text-sm">
                {leave.approvedBy && (
                  <div><span className="font-medium">Approved by:</span> {leave.approvedBy}</div>
                )}
                {leave.approvedDate && (
                  <div><span className="font-medium">Approved on:</span> {new Date(leave.approvedDate).toLocaleDateString()}</div>
                )}
                {leave.rejectionReason && (
                  <div><span className="font-medium">Rejection Reason:</span> {leave.rejectionReason}</div>
                )}
                {leave.emergencyContact && (
                  <div><span className="font-medium">Emergency Contact:</span> {leave.emergencyContact}</div>
                )}
              </div>
            </div>
          </div>

          {leave.reason && (
            <div className="mt-6">
              <h4 className="font-semibold text-gray-900 mb-2">Reason for Leave</h4>
              <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{leave.reason}</p>
            </div>
          )}

          {leave.documents && leave.documents.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold text-gray-900 mb-2">Supporting Documents</h4>
              <div className="space-y-2">
                {leave.documents.map((doc, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700">{doc.name}</span>
                    <button className="ml-auto text-blue-600 hover:text-blue-800">
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Close
          </button>
          {(user?.role === 'admin' || user?.role === 'hr' || user?.role === 'manager') && leave.status === 'pending' && (
            <>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                Approve Leave
              </button>
              <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                Reject Leave
              </button>
            </>
          )}
        </div>
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
            <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
            <p className="text-gray-600">Manage employee leave applications and approvals</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Apply for Leave</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search leaves..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex space-x-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="sick">Sick Leave</option>
                <option value="vacation">Vacation</option>
                <option value="personal">Personal</option>
                <option value="emergency">Emergency</option>
                <option value="maternity">Maternity</option>
                <option value="paternity">Paternity</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Applications</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Leave Applications Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLeaves.map(leave => (
            <LeaveCard key={leave.id} leave={leave} />
          ))}
        </div>

        {filteredLeaves.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No leave applications found</h3>
            <p className="text-gray-600">No leave applications match your current filters.</p>
          </div>
        )}

        {/* Leave Details Modal */}
        {selectedLeave && (
          <LeaveModal 
            leave={selectedLeave} 
            onClose={() => setSelectedLeave(null)} 
          />
        )}
      </div>
    </Layout>
  );
};

export default LeaveManagement;
