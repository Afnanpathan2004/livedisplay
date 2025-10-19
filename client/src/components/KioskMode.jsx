import React, { useState, useEffect, useRef } from 'react';
import { apiService, handleApiError } from '../services/api';
import { 
  Clock, 
  Calendar as CalendarIcon, 
  Users, 
  MapPin, 
  Bell,
  Wifi,
  Battery,
  Settings,
  Maximize,
  Minimize,
  RefreshCw,
  Power,
  Volume2,
  VolumeX
} from 'lucide-react';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';

const KioskMode = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [schedules, setSchedules] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [weather, setWeather] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isIdle, setIsIdle] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const idleTimerRef = useRef(null);
  const refreshIntervalRef = useRef(null);

  // Auto-refresh every 30 seconds
  const REFRESH_INTERVAL = 30000;
  // Idle timeout after 5 minutes
  const IDLE_TIMEOUT = 300000;

  useEffect(() => {
    loadData();
    startAutoRefresh();
    startIdleTimer();
    updateClock();

    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
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

      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error loading kiosk data:', error);
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const startAutoRefresh = () => {
    refreshIntervalRef.current = setInterval(() => {
      loadData();
    }, REFRESH_INTERVAL);
  };

  const startIdleTimer = () => {
    const resetIdleTimer = () => {
      setIsIdle(false);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        setIsIdle(true);
      }, IDLE_TIMEOUT);
    };

    // Reset idle timer on any user interaction
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
      document.addEventListener(event, resetIdleTimer, true);
    });

    resetIdleTimer();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
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

  const ScheduleCard = ({ schedule }) => {
    const status = getScheduleStatus(schedule);
    const statusColors = {
      active: 'bg-green-100 border-green-500 text-green-800',
      upcoming: 'bg-blue-100 border-blue-500 text-blue-800',
      completed: 'bg-gray-100 border-gray-400 text-gray-600'
    };

    return (
      <div className={`p-4 rounded-lg border-l-4 ${statusColors[status]} mb-3 transition-all duration-300 hover:shadow-md`}>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{schedule.subject || schedule.title}</h3>
            <div className="flex items-center gap-4 mt-2 text-sm">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{formatScheduleTime(schedule)}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{schedule.room_number || schedule.room}</span>
              </div>
              {schedule.faculty_name && (
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{schedule.faculty_name}</span>
                </div>
              )}
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            status === 'active' ? 'bg-green-500 text-white' :
            status === 'upcoming' ? 'bg-blue-500 text-white' :
            'bg-gray-400 text-white'
          }`}>
            {status === 'active' ? 'LIVE' : status === 'upcoming' ? 'NEXT' : 'DONE'}
          </div>
        </div>
      </div>
    );
  };

  const BookingCard = ({ booking }) => (
    <div className="p-4 rounded-lg bg-purple-100 border-l-4 border-purple-500 text-purple-800 mb-3 transition-all duration-300 hover:shadow-md">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{booking.title}</h3>
          <div className="flex items-center gap-4 mt-2 text-sm">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{booking.startTime} - {booking.endTime}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{booking.room}</span>
            </div>
            {booking.organizer && (
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{booking.organizer}</span>
              </div>
            )}
          </div>
        </div>
        <div className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500 text-white">
          BOOKED
        </div>
      </div>
    </div>
  );

  const AnnouncementCard = ({ announcement }) => (
    <div className="p-4 rounded-lg bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 mb-3 transition-all duration-300 hover:shadow-md">
      <div className="flex items-start gap-3">
        <Bell className="h-5 w-5 mt-1 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{announcement.title}</h3>
          <p className="mt-1 text-sm">{announcement.content}</p>
          {announcement.priority === 'high' && (
            <div className="mt-2">
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500 text-white">
                URGENT
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const SettingsPanel = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Kiosk Settings</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Sound Notifications</span>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg ${soundEnabled ? 'bg-green-500 text-white' : 'bg-gray-300'}`}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <span>Fullscreen Mode</span>
            <button
              onClick={toggleFullscreen}
              className={`p-2 rounded-lg ${isFullscreen ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <span>Manual Refresh</span>
            <button
              onClick={() => {
                loadData();
                setShowSettings(false);
              }}
              className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setShowSettings(false)}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Loading LiveDisplay...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white ${isIdle ? 'cursor-none' : ''}`}>
      {/* Header */}
      <div className="bg-black bg-opacity-30 backdrop-blur-sm border-b border-white border-opacity-20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-bold">LiveDisplay</h1>
              <div className="text-sm opacity-75">
                Last updated: {format(lastRefresh, 'HH:mm:ss')}
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              {/* Current Time */}
              <div className="text-right">
                <div className="text-4xl font-bold">
                  {format(currentTime, 'HH:mm')}
                </div>
                <div className="text-lg opacity-75">
                  {format(currentTime, 'EEEE, MMMM d, yyyy')}
                </div>
              </div>
              
              {/* Status Icons */}
              <div className="flex items-center space-x-3">
                <Wifi className="h-6 w-6 text-green-400" />
                <Battery className="h-6 w-6 text-green-400" />
                <button
                  onClick={() => setShowSettings(true)}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                >
                  <Settings className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Today's Schedule */}
          <div className="lg:col-span-2">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-20">
              <div className="flex items-center gap-3 mb-6">
                <CalendarIcon className="h-8 w-8 text-blue-300" />
                <h2 className="text-2xl font-bold">Today's Schedule</h2>
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
                  {schedules.length} events
                </span>
              </div>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {schedules.length === 0 ? (
                  <div className="text-center py-8 text-white text-opacity-75">
                    <CalendarIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-xl">No scheduled events today</p>
                  </div>
                ) : (
                  schedules.map(schedule => (
                    <ScheduleCard key={schedule.id} schedule={schedule} />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Room Bookings */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-20">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="h-6 w-6 text-purple-300" />
                <h3 className="text-xl font-bold">Room Bookings</h3>
              </div>
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {bookings.length === 0 ? (
                  <p className="text-white text-opacity-75 text-center py-4">
                    No room bookings today
                  </p>
                ) : (
                  bookings.map(booking => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))
                )}
              </div>
            </div>

            {/* Announcements */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-20">
              <div className="flex items-center gap-3 mb-4">
                <Bell className="h-6 w-6 text-yellow-300" />
                <h3 className="text-xl font-bold">Announcements</h3>
              </div>
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {announcements.length === 0 ? (
                  <p className="text-white text-opacity-75 text-center py-4">
                    No announcements
                  </p>
                ) : (
                  announcements.map(announcement => (
                    <AnnouncementCard key={announcement.id} announcement={announcement} />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Idle Screensaver */}
      {isIdle && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-40">
          <div className="text-center">
            <div className="text-8xl font-bold mb-4">
              {format(currentTime, 'HH:mm')}
            </div>
            <div className="text-2xl opacity-75">
              {format(currentTime, 'EEEE, MMMM d, yyyy')}
            </div>
            <p className="mt-8 text-lg opacity-50">
              Touch screen to continue
            </p>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && <SettingsPanel />}
    </div>
  );
};

export default KioskMode;
