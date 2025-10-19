import React, { useState, useEffect } from 'react';
import { apiService, handleApiError } from '../services/api';
import { 
  Clock, 
  Calendar as CalendarIcon, 
  Users, 
  MapPin, 
  Bell,
  Menu,
  X,
  RefreshCw,
  Settings,
  Home,
  Plus,
  Search,
  Filter,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { format, parseISO, isToday } from 'date-fns';

const MobileView = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [schedules, setSchedules] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('schedule');
  const [showMenu, setShowMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCard, setExpandedCard] = useState(null);

  useEffect(() => {
    loadData();
    updateClock();
  }, []);

  const updateClock = () => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Load today's schedules
      const schedulesRes = await apiService.schedule.getAll({ date: today });
      setSchedules(schedulesRes.data || []);

      // Load active announcements
      const announcementsRes = await apiService.announcements.getAll();
      const activeAnnouncements = (announcementsRes.data || []).filter(ann => ann.isActive);
      setAnnouncements(activeAnnouncements);

      // Load today's bookings
      const bookingsRes = await apiService.bookings.getByDate(today);
      setBookings(bookingsRes.data || []);

    } catch (error) {
      console.error('Error loading mobile data:', error);
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const formatScheduleTime = (schedule) => {
    const startTime = schedule.start_time || schedule.startTime;
    const endTime = schedule.end_time || schedule.endTime;
    return `${startTime} - ${endTime}`;
  };

  const getScheduleStatus = (schedule) => {
    const now = new Date();
    const today = format(now, 'yyyy-MM-dd');
    const currentTime = format(now, 'HH:mm');
    
    if (schedule.date !== today) return 'upcoming';
    
    const startTime = schedule.start_time || schedule.startTime;
    const endTime = schedule.end_time || schedule.endTime;
    
    if (currentTime < startTime) return 'upcoming';
    if (currentTime >= startTime && currentTime <= endTime) return 'active';
    return 'completed';
  };

  const filteredSchedules = schedules.filter(schedule =>
    !searchTerm || 
    schedule.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    schedule.faculty_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    schedule.room_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBookings = bookings.filter(booking =>
    !searchTerm || 
    booking.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.organizer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.room?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAnnouncements = announcements.filter(announcement =>
    !searchTerm || 
    announcement.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    announcement.content?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const MobileScheduleCard = ({ schedule }) => {
    const status = getScheduleStatus(schedule);
    const isExpanded = expandedCard === schedule.id;
    
    const statusColors = {
      active: 'bg-green-50 border-green-200 text-green-800',
      upcoming: 'bg-blue-50 border-blue-200 text-blue-800',
      completed: 'bg-gray-50 border-gray-200 text-gray-600'
    };

    return (
      <div className={`border rounded-lg p-4 mb-3 ${statusColors[status]} touch-manipulation`}>
        <div 
          className="flex justify-between items-start cursor-pointer"
          onClick={() => setExpandedCard(isExpanded ? null : schedule.id)}
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg">{schedule.subject || schedule.title}</h3>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                status === 'active' ? 'bg-green-500 text-white' :
                status === 'upcoming' ? 'bg-blue-500 text-white' :
                'bg-gray-400 text-white'
              }`}>
                {status === 'active' ? 'LIVE' : status === 'upcoming' ? 'NEXT' : 'DONE'}
              </div>
            </div>
            
            <div className="flex items-center gap-1 text-sm mb-1">
              <Clock className="h-4 w-4" />
              <span>{formatScheduleTime(schedule)}</span>
            </div>
            
            <div className="flex items-center gap-1 text-sm">
              <MapPin className="h-4 w-4" />
              <span>{schedule.room_number || schedule.room}</span>
            </div>
          </div>
          
          <div className="ml-2">
            {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </div>
        </div>
        
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-opacity-30">
            {schedule.faculty_name && (
              <div className="flex items-center gap-1 text-sm mb-2">
                <Users className="h-4 w-4" />
                <span>{schedule.faculty_name}</span>
              </div>
            )}
            {schedule.description && (
              <p className="text-sm opacity-75">{schedule.description}</p>
            )}
          </div>
        )}
      </div>
    );
  };

  const MobileBookingCard = ({ booking }) => {
    const isExpanded = expandedCard === booking.id;
    
    return (
      <div className="bg-purple-50 border border-purple-200 text-purple-800 rounded-lg p-4 mb-3 touch-manipulation">
        <div 
          className="flex justify-between items-start cursor-pointer"
          onClick={() => setExpandedCard(isExpanded ? null : booking.id)}
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg">{booking.title}</h3>
              <div className="px-2 py-1 rounded-full text-xs font-medium bg-purple-500 text-white">
                BOOKED
              </div>
            </div>
            
            <div className="flex items-center gap-1 text-sm mb-1">
              <Clock className="h-4 w-4" />
              <span>{booking.startTime} - {booking.endTime}</span>
            </div>
            
            <div className="flex items-center gap-1 text-sm">
              <MapPin className="h-4 w-4" />
              <span>{booking.room}</span>
            </div>
          </div>
          
          <div className="ml-2">
            {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </div>
        </div>
        
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-purple-200">
            {booking.organizer && (
              <div className="flex items-center gap-1 text-sm mb-2">
                <Users className="h-4 w-4" />
                <span>{booking.organizer}</span>
              </div>
            )}
            {booking.description && (
              <p className="text-sm opacity-75">{booking.description}</p>
            )}
            {booking.attendees && (
              <p className="text-sm opacity-75">Attendees: {booking.attendees}</p>
            )}
          </div>
        )}
      </div>
    );
  };

  const MobileAnnouncementCard = ({ announcement }) => {
    const isExpanded = expandedCard === announcement.id;
    
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4 mb-3 touch-manipulation">
        <div 
          className="flex justify-between items-start cursor-pointer"
          onClick={() => setExpandedCard(isExpanded ? null : announcement.id)}
        >
          <div className="flex items-start gap-3 flex-1">
            <Bell className="h-5 w-5 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg">{announcement.title}</h3>
                {announcement.priority === 'high' && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500 text-white">
                    URGENT
                  </span>
                )}
              </div>
              
              {!isExpanded && (
                <p className="text-sm line-clamp-2">{announcement.content}</p>
              )}
            </div>
          </div>
          
          <div className="ml-2">
            {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </div>
        </div>
        
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-yellow-200">
            <p className="text-sm">{announcement.content}</p>
          </div>
        )}
      </div>
    );
  };

  const MobileMenu = () => (
    <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity ${showMenu ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className={`fixed right-0 top-0 h-full w-80 bg-white transform transition-transform ${showMenu ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Menu</h2>
            <button
              onClick={() => setShowMenu(false)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
        
        <div className="p-4 space-y-4">
          <button
            onClick={() => {
              loadData();
              setShowMenu(false);
            }}
            className="w-full flex items-center gap-3 p-3 bg-blue-50 text-blue-700 rounded-lg"
          >
            <RefreshCw className="h-5 w-5" />
            <span>Refresh Data</span>
          </button>
          
          <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg">
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </button>
          
          <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg">
            <Home className="h-5 w-5" />
            <span>Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-900">LiveDisplay</h1>
              <div className="text-sm text-gray-500">
                {format(currentTime, 'HH:mm')} • {format(currentTime, 'MMM d')}
              </div>
            </div>
            
            <button
              onClick={() => setShowMenu(true)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
          
          {/* Search Bar */}
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search events, rooms, or people..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex border-t">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 ${
              activeTab === 'schedule'
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-1">
              <CalendarIcon className="h-4 w-4" />
              <span>Schedule ({filteredSchedules.length})</span>
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 ${
              activeTab === 'bookings'
                ? 'border-purple-500 text-purple-600 bg-purple-50'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>Bookings ({filteredBookings.length})</span>
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('announcements')}
            className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 ${
              activeTab === 'announcements'
                ? 'border-yellow-500 text-yellow-600 bg-yellow-50'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-1">
              <Bell className="h-4 w-4" />
              <span>News ({filteredAnnouncements.length})</span>
            </div>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-20">
        {activeTab === 'schedule' && (
          <div>
            {filteredSchedules.length === 0 ? (
              <div className="text-center py-12">
                <CalendarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-xl text-gray-500 mb-2">No scheduled events</p>
                <p className="text-gray-400">
                  {searchTerm ? 'Try adjusting your search' : 'No events found for today'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSchedules.map(schedule => (
                  <MobileScheduleCard key={schedule.id} schedule={schedule} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'bookings' && (
          <div>
            {filteredBookings.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-xl text-gray-500 mb-2">No room bookings</p>
                <p className="text-gray-400">
                  {searchTerm ? 'Try adjusting your search' : 'No bookings found for today'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBookings.map(booking => (
                  <MobileBookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'announcements' && (
          <div>
            {filteredAnnouncements.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-xl text-gray-500 mb-2">No announcements</p>
                <p className="text-gray-400">
                  {searchTerm ? 'Try adjusting your search' : 'No announcements available'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAnnouncements.map(announcement => (
                  <MobileAnnouncementCard key={announcement.id} announcement={announcement} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      <MobileMenu />
    </div>
  );
};

export default MobileView;
