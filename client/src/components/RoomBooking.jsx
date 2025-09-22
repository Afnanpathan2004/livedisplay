import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService, handleApiError } from '../services/api';
import Layout from './Layout';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Plus, 
  Search, 
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye
} from 'lucide-react';

const RoomBooking = () => {
  const { token, user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [editingBooking, setEditingBooking] = useState(null);

  useEffect(() => {
    fetchBookings();
    fetchRooms();
  }, [selectedDate]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await apiService.bookings.getAll({ date: selectedDate });
      setBookings(response.data.bookings || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    // Mock rooms data for now
    setRooms([
      { id: 'room-001', name: 'Conference Room A', capacity: 12, type: 'conference', floor: '1st Floor' },
      { id: 'room-002', name: 'Meeting Room B', capacity: 6, type: 'meeting', floor: '2nd Floor' },
      { id: 'room-003', name: 'Board Room', capacity: 20, type: 'boardroom', floor: '3rd Floor' },
      { id: 'room-004', name: 'Training Room', capacity: 30, type: 'training', floor: '1st Floor' },
      { id: 'room-005', name: 'Huddle Space 1', capacity: 4, type: 'huddle', floor: '2nd Floor' }
    ]);
  };

  const handleApproveBooking = async (bookingId) => {
    try {
      await apiService.bookings.approve(bookingId);
      fetchBookings();
      if (window.showSuccess) {
        window.showSuccess('Booking approved successfully!');
      }
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleRejectBooking = async (bookingId) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason) {
      try {
        await apiService.bookings.reject(bookingId, reason);
        fetchBookings();
        if (window.showSuccess) {
          window.showSuccess('Booking rejected successfully!');
        }
      } catch (error) {
        handleApiError(error);
      }
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        await apiService.bookings.delete(bookingId);
        fetchBookings();
        if (window.showSuccess) {
          window.showSuccess('Booking cancelled successfully!');
        }
      } catch (error) {
        handleApiError(error);
      }
    }
  };

  const handleEditBooking = (booking) => {
    setEditingBooking(booking);
    setShowEditModal(true);
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
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'rejected':
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const BookingCard = ({ booking }) => {
    const room = rooms.find(r => r.id === booking.roomId);
    
    return (
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{booking.title}</h3>
            <p className="text-sm text-gray-600">{room?.name || 'Unknown Room'}</p>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon(booking.status)}
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
              {booking.status}
            </span>
          </div>
        </div>

        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>{new Date(booking.startTime).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>
              {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
              {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>{booking.attendeeCount} attendees</span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4" />
            <span>{room?.floor || 'Unknown Floor'}</span>
          </div>
        </div>

        {booking.description && (
          <p className="text-sm text-gray-700 mb-4">{booking.description}</p>
        )}

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Booked by: {booking.employeeName || 'Unknown'}
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={() => setSelectedBooking(booking)}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              <Eye className="h-4 w-4" />
            </button>
            {user?.role === 'admin' || user?.role === 'hr' ? (
              <>
                {booking.status === 'pending' && (
                  <>
                    <button 
                      onClick={() => handleApproveBooking(booking.id)}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => handleRejectBooking(booking.id)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </>
                )}
              </>
            ) : (
              booking.employeeId === user?.id && booking.status === 'pending' && (
                <>
                  <button 
                    onClick={() => handleEditBooking(booking)}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleCancelBooking(booking.id)}
                    className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </>
              )
            )}
          </div>
        </div>
      </div>
    );
  };

  const RoomAvailabilityGrid = () => {
    const timeSlots = [
      '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
    ];

    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Room Availability</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="text-left py-2 px-3 font-medium text-gray-700">Room</th>
                {timeSlots.map(time => (
                  <th key={time} className="text-center py-2 px-2 font-medium text-gray-700 text-sm">
                    {time}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rooms.map(room => (
                <tr key={room.id} className="border-t">
                  <td className="py-3 px-3">
                    <div>
                      <div className="font-medium text-gray-900">{room.name}</div>
                      <div className="text-sm text-gray-500">Capacity: {room.capacity}</div>
                    </div>
                  </td>
                  {timeSlots.map(time => {
                    const isBooked = bookings.some(booking => {
                      const bookingStart = new Date(booking.startTime);
                      const bookingEnd = new Date(booking.endTime);
                      const slotTime = new Date(`${selectedDate}T${time}:00`);
                      return booking.roomId === room.id && 
                             slotTime >= bookingStart && 
                             slotTime < bookingEnd &&
                             booking.status === 'approved';
                    });
                    
                    return (
                      <td key={time} className="py-3 px-2 text-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isBooked ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600 cursor-pointer hover:bg-green-200'
                        }`}>
                          {isBooked ? '×' : '✓'}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const BookingModal = ({ booking, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-lg w-full mx-4">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Booking Details</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900">{booking.title}</h3>
              <p className="text-gray-600">{booking.description}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Room:</span>
                <p>{rooms.find(r => r.id === booking.roomId)?.name || 'Unknown'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Date:</span>
                <p>{new Date(booking.startTime).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Time:</span>
                <p>
                  {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                  {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Attendees:</span>
                <p>{booking.attendeeCount} people</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Status:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(booking.status)}`}>
                  {booking.status}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Booked by:</span>
                <p>{booking.employeeName || 'Unknown'}</p>
              </div>
            </div>

            {booking.requirements && (
              <div>
                <span className="font-medium text-gray-700">Requirements:</span>
                <p className="text-gray-600">{booking.requirements}</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Close
          </button>
          {user?.role === 'admin' || user?.role === 'hr' ? (
            booking.status === 'pending' && (
              <>
                <button 
                  onClick={() => {
                    handleApproveBooking(booking.id);
                    onClose();
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Approve
                </button>
                <button 
                  onClick={() => {
                    handleRejectBooking(booking.id);
                    onClose();
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Reject
                </button>
              </>
            )
          ) : (
            booking.employeeId === user?.id && booking.status === 'pending' && (
              <>
                <button 
                  onClick={() => {
                    handleEditBooking(booking);
                    onClose();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Edit Booking
                </button>
                <button 
                  onClick={() => {
                    handleCancelBooking(booking.id);
                    onClose();
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Cancel Booking
                </button>
              </>
            )
          )}
        </div>
      </div>
    </div>
  );

  const AddBookingModal = ({ onClose, onBookingAdded, rooms, selectedDate }) => {
    const [formData, setFormData] = useState({
      title: '',
      description: '',
      roomId: '',
      startTime: '',
      endTime: '',
      attendeeCount: '',
      requirements: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        setSubmitting(true);
        const bookingData = {
          ...formData,
          startTime: `${selectedDate}T${formData.startTime}:00`,
          endTime: `${selectedDate}T${formData.endTime}:00`,
          attendeeCount: parseInt(formData.attendeeCount)
        };
        await apiService.bookings.create(bookingData);
        onBookingAdded();
        onClose();
        if (window.showSuccess) {
          window.showSuccess('Booking created successfully!');
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
              <h2 className="text-xl font-semibold">New Room Booking</h2>
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
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room *
                </label>
                <select
                  name="roomId"
                  value={formData.roomId}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Room</option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.id}>
                      {room.name} (Capacity: {room.capacity})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attendee Count *
                </label>
                <input
                  type="number"
                  name="attendeeCount"
                  value={formData.attendeeCount}
                  onChange={handleChange}
                  required
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time *
                </label>
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time *
                </label>
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Requirements
              </label>
              <textarea
                name="requirements"
                value={formData.requirements}
                onChange={handleChange}
                rows={2}
                placeholder="e.g., Projector, Whiteboard, Catering"
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
                {submitting ? 'Creating...' : 'Create Booking'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const EditBookingModal = ({ booking, onClose, onBookingUpdated, rooms }) => {
    const [formData, setFormData] = useState({
      title: booking.title || '',
      description: booking.description || '',
      roomId: booking.roomId || '',
      startTime: booking.startTime ? new Date(booking.startTime).toTimeString().slice(0, 5) : '',
      endTime: booking.endTime ? new Date(booking.endTime).toTimeString().slice(0, 5) : '',
      attendeeCount: booking.attendeeCount || '',
      requirements: booking.requirements || ''
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        setSubmitting(true);
        const bookingDate = new Date(booking.startTime).toISOString().split('T')[0];
        const bookingData = {
          ...formData,
          startTime: `${bookingDate}T${formData.startTime}:00`,
          endTime: `${bookingDate}T${formData.endTime}:00`,
          attendeeCount: parseInt(formData.attendeeCount)
        };
        await apiService.bookings.update(booking.id, bookingData);
        onBookingUpdated();
        onClose();
        if (window.showSuccess) {
          window.showSuccess('Booking updated successfully!');
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
              <h2 className="text-xl font-semibold">Edit Booking</h2>
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
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room *
                </label>
                <select
                  name="roomId"
                  value={formData.roomId}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Room</option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.id}>
                      {room.name} (Capacity: {room.capacity})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attendee Count *
                </label>
                <input
                  type="number"
                  name="attendeeCount"
                  value={formData.attendeeCount}
                  onChange={handleChange}
                  required
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time *
                </label>
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time *
                </label>
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Requirements
              </label>
              <textarea
                name="requirements"
                value={formData.requirements}
                onChange={handleChange}
                rows={2}
                placeholder="e.g., Projector, Whiteboard, Catering"
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
                {submitting ? 'Updating...' : 'Update Booking'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Room Booking</h1>
          <p className="text-gray-600">Manage conference room reservations</p>
        </div>
        <button 
          onClick={() => setShowBookingModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>New Booking</span>
        </button>
      </div>

      {/* Date Selector and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">
                {bookings.filter(b => b.status === 'approved').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {bookings.filter(b => b.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Room Availability Grid */}
      <RoomAvailabilityGrid />

      {/* Bookings List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Bookings for {new Date(selectedDate).toLocaleDateString()}
        </h3>
        
        {bookings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings.map(booking => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-600">No room bookings for the selected date.</p>
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <BookingModal 
          booking={selectedBooking} 
          onClose={() => setSelectedBooking(null)} 
        />
      )}

      {/* Add Booking Modal */}
      {showBookingModal && (
        <AddBookingModal 
          onClose={() => setShowBookingModal(false)}
          onBookingAdded={fetchBookings}
          rooms={rooms}
          selectedDate={selectedDate}
        />
      )}

      {/* Edit Booking Modal */}
      {showEditModal && editingBooking && (
        <EditBookingModal 
          booking={editingBooking}
          onClose={() => {
            setShowEditModal(false);
            setEditingBooking(null);
          }}
          onBookingUpdated={fetchBookings}
          rooms={rooms}
        />
      )}
      </div>
    </Layout>
  );
};

export default RoomBooking;
