import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Link as LinkIcon,
  Copy,
  Check,
  Settings as SettingsIcon,
  Plus,
  Edit2,
  Trash2,
  Eye,
  X,
  Lock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { calendarService } from '../services/calendar/calendarService';
import type { CalendarSettings, MeetingType, CalendarBooking } from '../services/calendar/types';

interface CalendarPageProps {
  onBack: () => void;
  onNavigate: (page: string) => void;
}

export default function CalendarPage({ onBack, onNavigate }: CalendarPageProps) {
  const { user, profile } = useAuth();
  
  // Check if user has PRO subscription
  const isProUser = profile?.subscription_tier === 'pro';
  
  const [settings, setSettings] = useState<CalendarSettings | null>(null);
  const [meetingTypes, setMeetingTypes] = useState<MeetingType[]>([]);
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'bookings' | 'availability' | 'settings'>('bookings');
  const [bookingFilter, setBookingFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const [showAddMeetingType, setShowAddMeetingType] = useState(false);
  const [newMeetingType, setNewMeetingType] = useState({
    name: '',
    description: '',
    duration_minutes: 30,
    location_type: 'zoom' as const,
    color: '#3B82F6',
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [editedSettings, setEditedSettings] = useState<Partial<CalendarSettings>>({});

  useEffect(() => {
    if (user) {
      loadCalendarData();
    }
  }, [user]);

  async function loadCalendarData() {
    try {
      setLoading(true);
      console.log('[CalendarPage] Loading calendar data for user:', user?.id);
      
      // Load calendar data
      const [settingsData, typesData, bookingsData] = await Promise.all([
        calendarService.getSettings(user!.id),
        calendarService.getMeetingTypes(user!.id),
        calendarService.getBookings(user!.id),
      ]);

      console.log('[CalendarPage] Settings loaded:', settingsData);
      console.log('[CalendarPage] Meeting types loaded:', typesData?.length);
      console.log('[CalendarPage] Bookings loaded:', bookingsData?.length);

      // If no settings exist yet, initialize with universal user ID
      if (!settingsData) {
        console.log('[CalendarPage] No settings found. Initializing...');
        await initializeCalendarSettings();
        const newSettings = await calendarService.getSettings(user!.id);
        console.log('[CalendarPage] New settings created:', newSettings);
        setSettings(newSettings);
      } else {
        setSettings(settingsData);
      }
      
      setMeetingTypes(typesData || []);
      setBookings(bookingsData || []);
    } catch (error) {
      console.error('[CalendarPage] Error loading calendar data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function initializeCalendarSettings() {
    try {
      console.log('[CalendarPage] Initializing calendar settings for user:', user?.id);
      
      // Get universal user ID from chatbot_links
      const { data: chatbotLink, error: linkError } = await supabase
        .from('chatbot_links')
        .select('chatbot_id')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (linkError) {
        console.error('[CalendarPage] Error fetching chatbot link:', linkError);
      }

      const userSlug = chatbotLink?.chatbot_id || `tu${Date.now().toString().slice(-6)}`;
      console.log('[CalendarPage] Using booking slug:', userSlug);
      
      // Get user's full name from profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user!.id)
        .maybeSingle();

      if (profileError) {
        console.error('[CalendarPage] Error fetching profile:', profileError);
      }

      const displayName = profileData?.full_name || user?.email?.split('@')[0] || 'User';
      console.log('[CalendarPage] Using display name:', displayName);

      // Create calendar settings
      const { data, error } = await supabase
        .from('calendar_settings')
        .insert({
          user_id: user!.id,
          booking_slug: userSlug,
          display_name: displayName,
          welcome_message: 'Welcome! Book a time to chat with me.',
          timezone: 'Asia/Manila',
          is_booking_enabled: true,
        })
        .select();

      if (error) {
        console.error('[CalendarPage] Error creating calendar settings:', error);
        throw error;
      }

      console.log('[CalendarPage] Calendar settings initialized:', data);
    } catch (error) {
      console.error('[CalendarPage] Error initializing calendar settings:', error);
      throw error;
    }
  }

  const bookingUrl = settings?.booking_slug
    ? `${window.location.origin}/book/${settings.booking_slug}`
    : '';

  async function handleCopyLink() {
    if (bookingUrl) {
      await navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  const upcomingBookings = bookings.filter(b => 
    b.status === 'confirmed' && new Date(b.start_time) > new Date()
  );
  const pastBookings = bookings.filter(b => 
    b.status === 'completed' || new Date(b.start_time) < new Date()
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-blue-600" />
                Smart Calendar
              </h1>
              <p className="text-sm text-gray-600">Manage your bookings & availability</p>
            </div>
          </div>

        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6 max-w-screen-2xl mx-auto w-full">
        {/* Booking Link Card */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-6 mb-6 text-white shadow-xl relative">
          {!isProUser && (
            <div className="absolute top-4 right-4 px-3 py-1.5 bg-amber-500 text-white text-xs font-bold rounded-full flex items-center gap-1.5 z-10 shadow-lg">
              <Lock className="w-3.5 h-3.5" />
              Pro Only
            </div>
          )}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Your Booking Link</h2>
              <p className="text-blue-100">Share this link with prospects to book meetings</p>
            </div>
            <LinkIcon className="w-8 h-8 text-white/80" />
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
            <p className="text-sm text-blue-100 mb-2">Public booking page:</p>
            {bookingUrl ? (
              <div className={`relative ${!isProUser ? 'select-none' : ''}`}>
                <p className={`text-lg font-mono break-all ${!isProUser ? 'blur-md opacity-50' : ''}`}>
                  {bookingUrl}
                </p>
              </div>
            ) : (
              <p className="text-sm text-blue-200 italic">Setting up your calendar...</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                if (!isProUser) {
                  alert('This feature is available for PRO users only. Please upgrade to copy your booking link.');
                  return;
                }
                handleCopyLink();
              }}
              disabled={!isProUser}
              className={`flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 ${
                isProUser
                  ? 'bg-white text-blue-600 hover:bg-blue-50 transition-colors'
                  : 'bg-white/50 text-gray-400 cursor-not-allowed opacity-60'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  Copy Link
                </>
              )}
            </button>
            <button
              onClick={() => {
                if (!isProUser) {
                  alert('This feature is available for PRO users only. Please upgrade to preview your booking page.');
                  return;
                }
                if (settings?.booking_slug) {
                  onNavigate(`book-${settings.booking_slug}`);
                } else {
                  alert('Please set up your calendar settings first');
                }
              }}
              disabled={!isProUser}
              className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 ${
                isProUser
                  ? 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors'
                  : 'bg-white/10 text-white/50 cursor-not-allowed opacity-60'
              }`}
            >
              <Eye className="w-5 h-5" />
              Preview
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="size-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{upcomingBookings.length}</span>
            </div>
            <p className="text-sm font-semibold text-gray-700">Upcoming Bookings</p>
            <p className="text-xs text-gray-500">Confirmed meetings</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="size-12 rounded-xl bg-green-100 flex items-center justify-center">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{pastBookings.length}</span>
            </div>
            <p className="text-sm font-semibold text-gray-700">Completed</p>
            <p className="text-xs text-gray-500">Past meetings</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="size-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{meetingTypes.length}</span>
            </div>
            <p className="text-sm font-semibold text-gray-700">Meeting Types</p>
            <p className="text-xs text-gray-500">Active booking options</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('bookings')}
              className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
                activeTab === 'bookings'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              📅 Bookings ({bookings.length})
            </button>
            <button
              onClick={() => setActiveTab('availability')}
              className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
                activeTab === 'availability'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              ⏰ Availability
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
                activeTab === 'settings'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              ⚙️ Settings
            </button>
          </div>

          <div className="p-6">
            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
              <div className="space-y-4">
                {/* Filter Tabs */}
                <div className="flex items-center gap-2 border-b border-gray-200 pb-4">
                  <button
                    onClick={() => setBookingFilter('upcoming')}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                      bookingFilter === 'upcoming' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Upcoming ({upcomingBookings.length})
                  </button>
                  <button
                    onClick={() => setBookingFilter('past')}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                      bookingFilter === 'past' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Past ({pastBookings.length})
                  </button>
                  <button
                    onClick={() => setBookingFilter('all')}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                      bookingFilter === 'all' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    All ({bookings.length})
                  </button>
                </div>

                {/* Bookings List */}
                {(() => {
                  const filteredBookings = bookingFilter === 'upcoming' 
                    ? upcomingBookings 
                    : bookingFilter === 'past' 
                    ? pastBookings 
                    : bookings;

                  return filteredBookings.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {bookingFilter === 'upcoming' ? 'No upcoming bookings' : 
                         bookingFilter === 'past' ? 'No past bookings' : 
                         'No bookings'}
                      </h3>
                      <p className="text-gray-600 mb-4">Share your booking link to start receiving meetings!</p>
                      <button
                        onClick={handleCopyLink}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                      >
                        Copy Booking Link
                      </button>
                    </div>
                  ) : (
                    filteredBookings.map((booking) => (
                    <div key={booking.id} className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 mb-1">{booking.guest_name}</h4>
                          <p className="text-sm text-gray-600 mb-2">{booking.guest_email}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-700">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(booking.start_time).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {booking.guest_notes && (
                            <p className="text-sm text-gray-600 mt-2 italic">"{booking.guest_notes}"</p>
                          )}
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                          Confirmed
                        </span>
                      </div>
                    </div>
                  ))
                  );
                })()}
              </div>
            )}

            {/* Availability Tab */}
            {activeTab === 'availability' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">Meeting Types</h3>
                  <button
                    onClick={() => setShowAddMeetingType(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Meeting Type
                  </button>
                </div>

                {meetingTypes.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">No meeting types yet</h3>
                    <p className="text-gray-600">Create your first meeting type to start accepting bookings</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {meetingTypes.map((type) => (
                      <div key={type.id} className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="size-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${type.color}20` }}>
                              <Clock className="w-6 h-6" style={{ color: type.color }} />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-900 mb-1">{type.name}</h4>
                              <p className="text-sm text-gray-600 mb-2">{type.description}</p>
                              <div className="flex items-center gap-4 text-sm text-gray-700">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {type.duration_minutes} min
                                </span>
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                                  {type.location_type}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6 relative">
                {!isProUser && (
                  <div className="absolute top-0 right-0 px-3 py-1.5 bg-amber-500 text-white text-xs font-bold rounded-full flex items-center gap-1.5 z-10 shadow-lg">
                    <Lock className="w-3.5 h-3.5" />
                    Pro Only
                  </div>
                )}
                <div className={!isProUser ? 'blur-sm pointer-events-none select-none opacity-60' : ''}>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Calendar Settings</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={editedSettings.display_name !== undefined ? editedSettings.display_name : settings?.display_name || ''}
                        onChange={(e) => setEditedSettings({ ...editedSettings, display_name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Your name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Welcome Message
                      </label>
                      <textarea
                        value={editedSettings.welcome_message !== undefined ? editedSettings.welcome_message : settings?.welcome_message || ''}
                        onChange={(e) => setEditedSettings({ ...editedSettings, welcome_message: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                        placeholder="Welcome message for your booking page..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Booking Slug
                      </label>
                      <div className="flex gap-2">
                        <span className="px-4 py-3 bg-gray-100 text-gray-600 rounded-xl">
                          /book/
                        </span>
                        <input
                          type="text"
                          value={editedSettings.booking_slug !== undefined ? editedSettings.booking_slug : settings?.booking_slug || ''}
                          onChange={(e) => setEditedSettings({ ...editedSettings, booking_slug: e.target.value })}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="your-name"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        💡 Same as your chatbot ID (e.g., tu5828) for universal branding
                      </p>
                    </div>

                    <button
                      onClick={async () => {
                        console.log('=== SAVE BUTTON CLICKED ===');
                        console.log('User:', user);
                        console.log('Settings:', settings);
                        console.log('Edited Settings:', editedSettings);
                        
                        if (!user) {
                          alert('❌ User session not found. Please log in again.');
                          return;
                        }
                        
                        if (Object.keys(editedSettings).length === 0) {
                          alert('ℹ️ No changes to save. Make some edits first!');
                          return;
                        }
                        
                        setSavingSettings(true);
                        try {
                          console.log('Calling updateSettings with:', { userId: user.id, updates: editedSettings });
                          const success = await calendarService.updateSettings(user.id, editedSettings);
                          console.log('Update result:', success);
                          
                          if (success) {
                            console.log('Settings saved! Reloading calendar data...');
                            await loadCalendarData();
                            setEditedSettings({});
                            alert('✅ Settings saved successfully!');
                          } else {
                            console.error('updateSettings returned false');
                            alert('❌ Failed to save settings. Please check the console for errors.');
                          }
                        } catch (error) {
                          console.error('Error saving settings:', error);
                          alert('❌ Failed to save settings: ' + (error as Error).message);
                        } finally {
                          setSavingSettings(false);
                        }
                      }}
                      disabled={savingSettings}
                      className={`w-full py-3 rounded-xl font-semibold transition-colors ${
                        Object.keys(editedSettings).length === 0
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : savingSettings
                          ? 'bg-blue-400 text-white cursor-wait'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {savingSettings ? (
                        <>
                          <span className="inline-block animate-spin mr-2">⏳</span>
                          Saving...
                        </>
                      ) : Object.keys(editedSettings).length === 0 ? (
                        'No Changes to Save'
                      ) : (
                        `Save ${Object.keys(editedSettings).length} Change${Object.keys(editedSettings).length > 1 ? 's' : ''}`
                      )}
                    </button>
                    
                    {Object.keys(editedSettings).length > 0 && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                        <p className="text-xs font-semibold text-blue-800 mb-1">Unsaved Changes:</p>
                        <ul className="text-xs text-blue-700 space-y-1">
                          {editedSettings.display_name !== undefined && (
                            <li>• Display Name: {editedSettings.display_name}</li>
                          )}
                          {editedSettings.welcome_message !== undefined && (
                            <li>• Welcome Message: {editedSettings.welcome_message.substring(0, 50)}...</li>
                          )}
                          {editedSettings.booking_slug !== undefined && (
                            <li>• Booking Slug: /book/{editedSettings.booking_slug}</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                {!isProUser && (
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <div className="px-4 py-3 bg-amber-500/95 backdrop-blur-sm text-white text-sm font-bold rounded-xl flex items-center gap-2 shadow-2xl">
                      <Lock className="w-4 h-4" />
                      Pro Tier Required
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Meeting Type Modal */}
      {showAddMeetingType && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Add Meeting Type</h3>
              <button
                onClick={() => setShowAddMeetingType(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={newMeetingType.name}
                  onChange={(e) => setNewMeetingType({ ...newMeetingType, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="30-Minute Discovery Call"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  value={newMeetingType.description}
                  onChange={(e) => setNewMeetingType({ ...newMeetingType, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Let's discuss how I can help you..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Duration (minutes)</label>
                  <input
                    type="number"
                    value={newMeetingType.duration_minutes}
                    onChange={(e) => setNewMeetingType({ ...newMeetingType, duration_minutes: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Location Type</label>
                  <select
                    value={newMeetingType.location_type}
                    onChange={(e) => setNewMeetingType({ ...newMeetingType, location_type: e.target.value as any })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="zoom">Zoom</option>
                    <option value="google_meet">Google Meet</option>
                    <option value="phone">Phone</option>
                    <option value="in_person">In Person</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddMeetingType(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    // Validation
                    if (!newMeetingType.name.trim()) {
                      alert('❌ Please enter a meeting name');
                      return;
                    }
                    
                    if (!newMeetingType.description.trim()) {
                      alert('❌ Please enter a description');
                      return;
                    }
                    
                    if (newMeetingType.duration_minutes < 5 || newMeetingType.duration_minutes > 240) {
                      alert('❌ Duration must be between 5 and 240 minutes');
                      return;
                    }
                    
                    try {
                      console.log('Creating meeting type:', newMeetingType);
                      const created = await calendarService.createMeetingType(user!.id, newMeetingType);
                      
                      if (created) {
                        console.log('Meeting type created:', created);
                        setMeetingTypes([...meetingTypes, created]);
                        setShowAddMeetingType(false);
                        setNewMeetingType({
                          name: '',
                          description: '',
                          duration_minutes: 30,
                          location_type: 'zoom',
                          color: '#3B82F6',
                        });
                        alert('✅ Meeting type created successfully!');
                      } else {
                        alert('❌ Failed to create meeting type. Please try again.');
                      }
                    } catch (error) {
                      console.error('Error creating meeting type:', error);
                      alert('❌ Failed to create meeting type: ' + (error as Error).message);
                    }
                  }}
                  disabled={!newMeetingType.name.trim()}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Meeting Type
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
