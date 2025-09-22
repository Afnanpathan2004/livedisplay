import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService, handleApiError } from '../services/api';
import Layout from './Layout';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  UserCheck,
  UserX,
  Calendar,
  Phone,
  Mail,
  Building,
  MapPin
} from 'lucide-react';

const VisitorManagement = () => {
  const { token, user } = useAuth();
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchVisitors();
  }, [selectedDate]);

  const fetchVisitors = async () => {
    try {
      setLoading(true);
      const response = await apiService.visitors.getAll({ visitDate: selectedDate });
      setVisitors(response.data.visitors || []);
    } catch (error) {
      console.error('Error fetching visitors:', error);
      handleApiError(error);
    } finally {
      setLoading(false);
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
      case 'checked_in':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
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
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'checked_in':
        return <UserCheck className="h-4 w-4 text-blue-600" />;
      case 'completed':
        return <UserX className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const filteredVisitors = visitors.filter(visitor => {
    const matchesSearch = visitor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         visitor.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         visitor.phone?.includes(searchTerm) ||
                         visitor.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || visitor.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const VisitorCard = ({ visitor }) => (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{visitor.name}</h3>
            <p className="text-sm text-gray-600">{visitor.company}</p>
            <p className="text-sm text-blue-600">{visitor.purpose}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon(visitor.status)}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(visitor.status)}`}>
            {visitor.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4" />
          <span>{new Date(visitor.visitDate).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4" />
          <span>
            {visitor.expectedArrival} - {visitor.expectedDeparture}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Phone className="h-4 w-4" />
          <span>{visitor.phone}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Mail className="h-4 w-4" />
          <span>{visitor.email}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Building className="h-4 w-4" />
          <span>Host: {visitor.hostEmployeeName || 'Unknown'}</span>
        </div>
        <div className="flex items-center space-x-2">
          <MapPin className="h-4 w-4" />
          <span>{visitor.meetingLocation || 'TBD'}</span>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Badge: {visitor.badgeNumber || 'Not assigned'}
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => setSelectedVisitor(visitor)}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
          >
            <Eye className="h-4 w-4" />
          </button>
          {user?.role === 'admin' || user?.role === 'hr' || user?.role === 'security' ? (
            <>
              {visitor.status === 'pending' && (
                <>
                  <button className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                    Approve
                  </button>
                  <button className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700">
                    Reject
                  </button>
                </>
              )}
              {visitor.status === 'approved' && (
                <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                  Check In
                </button>
              )}
              {visitor.status === 'checked_in' && (
                <button className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700">
                  Check Out
                </button>
              )}
            </>
          ) : (
            visitor.hostEmployeeId === user?.id && visitor.status === 'pending' && (
              <button className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700">
                Cancel
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );

  const VisitorModal = ({ visitor, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Visitor Details</h2>
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
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">{visitor.name}</h3>
              <p className="text-gray-600">{visitor.company}</p>
              <p className="text-blue-600">{visitor.purpose}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Contact Information</h4>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Email:</span> {visitor.email}</div>
                <div><span className="font-medium">Phone:</span> {visitor.phone}</div>
                <div><span className="font-medium">Company:</span> {visitor.company}</div>
                <div><span className="font-medium">Badge Number:</span> {visitor.badgeNumber || 'Not assigned'}</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Visit Information</h4>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Visit Date:</span> {new Date(visitor.visitDate).toLocaleDateString()}</div>
                <div><span className="font-medium">Expected Arrival:</span> {visitor.expectedArrival}</div>
                <div><span className="font-medium">Expected Departure:</span> {visitor.expectedDeparture}</div>
                <div><span className="font-medium">Meeting Location:</span> {visitor.meetingLocation || 'TBD'}</div>
                <div><span className="font-medium">Host:</span> {visitor.hostEmployeeName || 'Unknown'}</div>
                <div><span className="font-medium">Status:</span> 
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(visitor.status)}`}>
                    {visitor.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {visitor.purpose && (
            <div className="mt-6">
              <h4 className="font-semibold text-gray-900 mb-2">Purpose of Visit</h4>
              <p className="text-gray-600">{visitor.purpose}</p>
            </div>
          )}

          {visitor.specialRequirements && (
            <div className="mt-4">
              <h4 className="font-semibold text-gray-900 mb-2">Special Requirements</h4>
              <p className="text-gray-600">{visitor.specialRequirements}</p>
            </div>
          )}

          {visitor.actualArrivalTime && (
            <div className="mt-4">
              <h4 className="font-semibold text-gray-900 mb-2">Check-in Details</h4>
              <div className="text-sm text-gray-600">
                <div>Actual Arrival: {new Date(visitor.actualArrivalTime).toLocaleString()}</div>
                {visitor.actualDepartureTime && (
                  <div>Actual Departure: {new Date(visitor.actualDepartureTime).toLocaleString()}</div>
                )}
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
          {user?.role === 'admin' || user?.role === 'hr' || user?.role === 'security' ? (
            <>
              {visitor.status === 'pending' && (
                <>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    Approve
                  </button>
                  <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                    Reject
                  </button>
                </>
              )}
              {visitor.status === 'approved' && (
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Check In
                </button>
              )}
              {visitor.status === 'checked_in' && (
                <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                  Check Out
                </button>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );

  const AddVisitorModal = ({ onClose, onVisitorAdded }) => {
    const [formData, setFormData] = useState({
      name: '',
      email: '',
      phone: '',
      company: '',
      purpose: '',
      hostEmployeeId: '',
      visitDate: new Date().toISOString().split('T')[0],
      expectedArrival: '',
      expectedDeparture: '',
      vehicleNumber: '',
      idProofType: 'aadhar',
      idProofNumber: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        setSubmitting(true);
        await apiService.visitors.create(formData);
        onVisitorAdded();
        onClose();
        if (window.showSuccess) {
          window.showSuccess('Visitor registered successfully!');
        }
      } catch (error) {
        handleApiError(error);
      } finally {
        setSubmitting(false);
      }
    };

    const handleChange = (e) => {
      setFormData(prev => ({
        ...prev,
        [e.target.name]: e.target.value
      }));
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Register New Visitor</h2>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visit Date *
                </label>
                <input
                  type="date"
                  name="visitDate"
                  value={formData.visitDate}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Arrival
                </label>
                <input
                  type="time"
                  name="expectedArrival"
                  value={formData.expectedArrival}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Departure
                </label>
                <input
                  type="time"
                  name="expectedDeparture"
                  value={formData.expectedDeparture}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vehicle Number
                </label>
                <input
                  type="text"
                  name="vehicleNumber"
                  value={formData.vehicleNumber}
                  onChange={handleChange}
                  placeholder="e.g., MH01AB1234"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID Proof Type *
                </label>
                <select
                  name="idProofType"
                  value={formData.idProofType}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="aadhar">Aadhar Card</option>
                  <option value="pan">PAN Card</option>
                  <option value="driving_license">Driving License</option>
                  <option value="passport">Passport</option>
                  <option value="voter_id">Voter ID</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID Proof Number *
                </label>
                <input
                  type="text"
                  name="idProofNumber"
                  value={formData.idProofNumber}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Purpose of Visit *
              </label>
              <textarea
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="mt-8 flex justify-end space-x-3">
              <button 
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Registering...' : 'Register Visitor'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

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
            <h1 className="text-2xl font-bold text-gray-900">Visitor Management</h1>
            <p className="text-gray-600">Manage visitor registrations and security</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Register Visitor</span>
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
                  placeholder="Search visitors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex space-x-4">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="checked_in">Checked In</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Visitors</p>
                <p className="text-2xl font-bold text-gray-900">{visitors.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {visitors.filter(v => v.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">
                  {visitors.filter(v => v.status === 'approved').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <UserCheck className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Checked In</p>
                <p className="text-2xl font-bold text-gray-900">
                  {visitors.filter(v => v.status === 'checked_in').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <UserX className="h-8 w-8 text-gray-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {visitors.filter(v => v.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Visitors Grid */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Visitors for {new Date(selectedDate).toLocaleDateString()}
          </h3>
          
          {filteredVisitors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVisitors.map(visitor => (
                <VisitorCard key={visitor.id} visitor={visitor} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No visitors found</h3>
              <p className="text-gray-600">No visitors registered for the selected date.</p>
            </div>
          )}
        </div>

        {/* Visitor Details Modal */}
        {selectedVisitor && (
          <VisitorModal 
            visitor={selectedVisitor} 
            onClose={() => setSelectedVisitor(null)} 
          />
        )}

        {/* Add Visitor Modal */}
        {showAddModal && (
          <AddVisitorModal 
            onClose={() => setShowAddModal(false)}
            onVisitorAdded={fetchVisitors}
          />
        )}
      </div>
    </Layout>
  );
};

export default VisitorManagement;
