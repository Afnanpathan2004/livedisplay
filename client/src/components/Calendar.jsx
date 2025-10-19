import React, { useState, useEffect } from 'react';
import { apiService, handleApiError } from '../services/api';
import Layout from './Layout';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Users,
  Edit2,
  Trash2,
  X,
  Save,
  Filter,
  Search
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, parseISO } from 'date-fns';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // month, week, day
  const [bookings, setBookings] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRoom, setFilterRoom] = useState('all');
  const [rooms, setRooms] = useState([]);

  const [bookingForm, setBookingForm] = useState({
    title: '',
    room: '',
    startDate: '',
    startTime: '',
    endTime: '',
    description: '',
    attendees: '',
    organizer: ''
  });

  useEffect(() => {
    loadBookings();
    loadSchedules();
    loadRooms();
  }, []);

  useEffect(() => {
    filterBookings();
    filterSchedules();
  }, [bookings, schedules, searchTerm, filterRoom, currentDate, view]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await apiService.bookings.getAll();
      setBookings(response.data || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const loadSchedules = async () => {
    try {
      const response = await apiService.schedule.getAll();
      setSchedules(response.data || []);
    } catch (error) {
      console.error('Error loading schedules:', error);
      handleApiError(error);
    }
  };

  const loadRooms = async () => {
    try {
      const response = await apiService.settings.getCategory('rooms');
      setRooms(response.data.items || []);
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  };

  const filterBookings = () => {
    let filtered = [...bookings];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(booking => 
        booking.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.room?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.organizer?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by room
    if (filterRoom !== 'all') {
      filtered = filtered.filter(booking => booking.room === filterRoom);
    }

    // Filter by date range based on view
    const start = view === 'month' 
      ? startOfMonth(currentDate)
      : view === 'week'
      ? startOfWeek(currentDate)
      : currentDate;

    const end = view === 'month'
      ? endOfMonth(currentDate)
      : view === 'week'
      ? endOfWeek(currentDate)
      : currentDate;

    filtered = filtered.filter(booking => {
      const bookingDate = parseISO(booking.startDate);
      return bookingDate >= start && bookingDate <= end;
    });

    setFilteredBookings(filtered);
  };

  const filterSchedules = () => {
    let filtered = [...schedules];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(schedule => 
        schedule.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        schedule.room_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        schedule.faculty_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by room
    if (filterRoom !== 'all') {
      filtered = filtered.filter(schedule => schedule.room_number === filterRoom);
    }

    // Filter by date range based on view
    const start = view === 'month' 
      ? startOfMonth(currentDate)
      : view === 'week'
      ? startOfWeek(currentDate)
      : currentDate;

    const end = view === 'month'
      ? endOfMonth(currentDate)
      : view === 'week'
      ? endOfWeek(currentDate)
      : currentDate;

    filtered = filtered.filter(schedule => {
      const scheduleDate = parseISO(schedule.date);
      return scheduleDate >= start && scheduleDate <= end;
    });

    setFilteredSchedules(filtered);
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    try {
      const bookingData = {
        ...bookingForm,
        status: 'confirmed',
        createdAt: new Date().toISOString()
      };

      if (selectedBooking) {
        await apiService.bookings.update(selectedBooking.id, bookingData);
        if (window.showSuccess) window.showSuccess('Booking updated successfully!');
      } else {
        await apiService.bookings.create(bookingData);
        if (window.showSuccess) window.showSuccess('Booking created successfully!');
      }

      await loadBookings();
      closeModal();
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to delete this booking?')) return;

    try {
      await apiService.bookings.delete(bookingId);
      if (window.showSuccess) window.showSuccess('Booking deleted successfully!');
      await loadBookings();
    } catch (error) {
      handleApiError(error);
    }
  };

  const openModal = (date = null, booking = null) => {
    if (booking) {
      setSelectedBooking(booking);
      setBookingForm({
        title: booking.title || '',
        room: booking.room || '',
        startDate: booking.startDate || '',
        startTime: booking.startTime || '',
        endTime: booking.endTime || '',
        description: booking.description || '',
        attendees: booking.attendees || '',
        organizer: booking.organizer || ''
      });
    } else {
      setSelectedBooking(null);
      setBookingForm({
        title: '',
        room: '',
        startDate: date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        startTime: '09:00',
        endTime: '10:00',
        description: '',
        attendees: '',
        organizer: ''
      });
    }
    setSelectedDate(date);
    setShowBookingModal(true);
  };

  const closeModal = () => {
    setShowBookingModal(false);
    setSelectedBooking(null);
    setSelectedDate(null);
    setBookingForm({
      title: '',
      room: '',
      startDate: '',
      startTime: '',
      endTime: '',
      description: '',
      attendees: '',
      organizer: ''
    });
  };

  const getDaysInMonth = () => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    return eachDayOfInterval({ start, end });
  };

  const getBookingsForDay = (day) => {
    const dayBookings = filteredBookings.filter(booking => 
      isSameDay(parseISO(booking.startDate), day)
    );
    
    const daySchedules = filteredSchedules.filter(schedule => 
      isSameDay(parseISO(schedule.date), day)
    ).map(schedule => ({
      ...schedule,
      id: schedule.id,
      title: schedule.subject,
      room: schedule.room_number,
      startTime: schedule.start_time,
      endTime: schedule.end_time,
      organizer: schedule.faculty_name,
      type: 'schedule'
    }));
    
    return [...dayBookings, ...daySchedules];
  };

  const navigateMonth = (direction) => {
    setCurrentDate(direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const BookingCard = ({ booking }) => {
    const isSchedule = booking.type === 'schedule';
    const cardColor = isSchedule ? 'green' : 'blue';
    
    return (
      <div className={`bg-${cardColor}-50 border-l-4 border-${cardColor}-500 p-2 mb-1 rounded text-xs hover:bg-${cardColor}-100 transition-colors cursor-pointer group`}>
        <div className="flex justify-between items-start">
          <div className="flex-1" onClick={() => !isSchedule && openModal(null, booking)}>
            <div className={`font-semibold text-${cardColor}-900 truncate`}>
              {isSchedule ? '📚 ' : '🏢 '}{booking.title}
            </div>
            <div className={`text-${cardColor}-700 flex items-center gap-1 mt-1`}>
              <Clock className="h-3 w-3" />
              <span>{booking.startTime} - {booking.endTime}</span>
            </div>
            <div className={`text-${cardColor}-600 flex items-center gap-1`}>
              <MapPin className="h-3 w-3" />
              <span className="truncate">{booking.room}</span>
            </div>
            {booking.organizer && (
              <div className={`text-${cardColor}-600 flex items-center gap-1`}>
                <Users className="h-3 w-3" />
                <span className="truncate">{booking.organizer}</span>
              </div>
            )}
          </div>
          {!isSchedule && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openModal(null, booking);
                }}
                className={`p-1 hover:bg-${cardColor}-200 rounded`}
              >
                <Edit2 className={`h-3 w-3 text-${cardColor}-700`} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteBooking(booking.id);
                }}
                className="p-1 hover:bg-red-200 rounded"
              >
                <Trash2 className="h-3 w-3 text-red-600" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const MonthView = () => {
    const days = getDaysInMonth();
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Week day headers */}
        <div className="grid grid-cols-7 bg-gray-100 border-b">
          {weekDays.map(day => (
            <div key={day} className="p-3 text-center font-semibold text-gray-700">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 auto-rows-fr">
          {days.map((day, idx) => {
            const dayBookings = getBookingsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={idx}
                className={`min-h-[120px] border-r border-b p-2 ${
                  !isCurrentMonth ? 'bg-gray-50' : 'bg-white'
                } hover:bg-gray-50 transition-colors`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span
                    className={`text-sm font-semibold ${
                      isToday
                        ? 'bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center'
                        : isCurrentMonth
                        ? 'text-gray-900'
                        : 'text-gray-400'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                  <button
                    onClick={() => openModal(day)}
                    className="p-1 hover:bg-blue-100 rounded-full transition-colors"
                    title="Add booking"
                  >
                    <Plus className="h-4 w-4 text-blue-600" />
                  </button>
                </div>

                <div className="space-y-1 overflow-y-auto max-h-[80px]">
                  {dayBookings.map(booking => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const DayView = () => {
    const dayBookings = getBookingsForDay(currentDate);
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">
            {format(currentDate, 'EEEE, MMMM d, yyyy')}
          </h3>
        </div>

        <div className="p-4 space-y-2 max-h-[600px] overflow-y-auto">
          {hours.map(hour => {
            const hourBookings = dayBookings.filter(booking => {
              const bookingHour = parseInt(booking.startTime.split(':')[0]);
              return bookingHour === hour;
            });

            return (
              <div key={hour} className="flex gap-4 border-b pb-2">
                <div className="w-20 text-sm font-medium text-gray-600">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                <div className="flex-1">
                  {hourBookings.length > 0 ? (
                    hourBookings.map(booking => (
                      <div key={booking.id} className="mb-2">
                        <BookingCard booking={booking} />
                      </div>
                    ))
                  ) : (
                    <button
                      onClick={() => openModal(currentDate)}
                      className="text-sm text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      + Add booking
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const BookingModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">
            {selectedBooking ? 'Edit Booking' : 'New Booking'}
          </h2>
          <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleCreateBooking} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={bookingForm.title}
                onChange={(e) => setBookingForm({ ...bookingForm, title: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Meeting title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room *
              </label>
              <select
                value={bookingForm.room}
                onChange={(e) => setBookingForm({ ...bookingForm, room: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select room</option>
                {rooms.map(room => (
                  <option key={room} value={room}>{room}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                value={bookingForm.startDate}
                onChange={(e) => setBookingForm({ ...bookingForm, startDate: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time *
              </label>
              <input
                type="time"
                value={bookingForm.startTime}
                onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })}
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
                value={bookingForm.endTime}
                onChange={(e) => setBookingForm({ ...bookingForm, endTime: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organizer
              </label>
              <input
                type="text"
                value={bookingForm.organizer}
                onChange={(e) => setBookingForm({ ...bookingForm, organizer: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Organizer name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attendees
              </label>
              <input
                type="text"
                value={bookingForm.attendees}
                onChange={(e) => setBookingForm({ ...bookingForm, attendees: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Number of attendees"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={bookingForm.description}
                onChange={(e) => setBookingForm({ ...bookingForm, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Meeting description"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {selectedBooking ? 'Update' : 'Create'} Booking
            </button>
          </div>
        </form>
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
          <div className="flex items-center space-x-3">
            <CalendarIcon className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Room Booking Calendar</h1>
              <p className="text-gray-600">Manage and view all room bookings</p>
            </div>
          </div>
          <button
            onClick={() => openModal()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Booking
          </button>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={filterRoom}
              onChange={(e) => setFilterRoom(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Rooms</option>
              {rooms.map(room => (
                <option key={room} value={room}>{room}</option>
              ))}
            </select>

            <div className="flex gap-2">
              <button
                onClick={() => setView('month')}
                className={`flex-1 px-3 py-2 rounded-lg transition-colors ${
                  view === 'month'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setView('day')}
                className={`flex-1 px-3 py-2 rounded-lg transition-colors ${
                  view === 'day'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Day
              </button>
            </div>

            <button
              onClick={goToToday}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Today
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-lg shadow-md p-4 flex justify-between items-center">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-6 w-6 text-gray-700" />
          </button>

          <h2 className="text-xl font-semibold text-gray-900">
            {format(currentDate, 'MMMM yyyy')}
          </h2>

          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="h-6 w-6 text-gray-700" />
          </button>
        </div>

        {/* Calendar View */}
        {view === 'month' ? <MonthView /> : <DayView />}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <CalendarIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">🏢 Room Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">📚 Schedules</p>
                <p className="text-2xl font-bold text-gray-900">{schedules.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">{filteredBookings.length + filteredSchedules.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Rooms</p>
                <p className="text-2xl font-bold text-gray-900">{rooms.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal */}
        {showBookingModal && <BookingModal />}
      </div>
    </Layout>
  );
};

export default Calendar;
