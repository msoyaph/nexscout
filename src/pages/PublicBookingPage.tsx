import { useState, useEffect } from 'react';
import { Calendar, Clock, Check, ChevronLeft, ChevronRight, User, Mail, Phone, MessageSquare } from 'lucide-react';
import { calendarService } from '../services/calendar/calendarService';
import { icsGenerator } from '../services/calendar/icsGenerator';
import type { PublicCalendarData, MeetingType, TimeSlot, CalendarBooking } from '../services/calendar/types';

interface PublicBookingPageProps {
  slug: string;
}

export default function PublicBookingPage({ slug }: PublicBookingPageProps) {
  const [loading, setLoading] = useState(true);
  const [calendarData, setCalendarData] = useState<PublicCalendarData | null>(null);
  const [step, setStep] = useState<'meeting-type' | 'date-time' | 'details' | 'confirmation'>('meeting-type');
  
  // Selection state
  const [selectedMeetingType, setSelectedMeetingType] = useState<MeetingType | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  
  // Guest details
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestNotes, setGuestNotes] = useState('');
  
  // UI state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [submitting, setSubmitting] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<CalendarBooking | null>(null);

  useEffect(() => {
    loadCalendarData();
  }, [slug]);

  useEffect(() => {
    if (selectedMeetingType && selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedMeetingType, selectedDate]);

  async function loadCalendarData() {
    try {
      const data = await calendarService.getPublicCalendarData(slug);
      if (data) {
        setCalendarData(data);
        if (data.meetingTypes.length === 1) {
          setSelectedMeetingType(data.meetingTypes[0]);
          setStep('date-time');
        }
      }
    } catch (error) {
      console.error('Error loading calendar data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadAvailableSlots() {
    if (!selectedMeetingType || !selectedDate || !calendarData) return;
    
    const slots = await calendarService.getAvailableSlots(
      calendarData.settings.user_id,
      selectedMeetingType.id,
      selectedDate
    );
    setAvailableSlots(slots);
  }

  async function handleBooking() {
    if (!selectedMeetingType || !selectedDate || !selectedTime || !calendarData) return;
    
    setSubmitting(true);
    try {
      const startTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':');
      startTime.setHours(parseInt(hours), parseInt(minutes), 0);

      const booking = await calendarService.createBooking({
        user_id: calendarData.settings.user_id,
        meeting_type_id: selectedMeetingType.id,
        start_time: startTime.toISOString(),
        guest_name: guestName,
        guest_email: guestEmail,
        guest_phone: guestPhone,
        guest_notes: guestNotes,
        booking_source: 'public',
      });

      if (booking) {
        setConfirmedBooking(booking);
        setBookingConfirmed(true);
        setStep('confirmation');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to create booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function getDaysInMonth(date: Date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Actual days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  }

  function isDateAvailable(date: Date | null): boolean {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  if (!calendarData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Calendar Not Found</h2>
          <p className="text-gray-600">This booking link is not available.</p>
        </div>
      </div>
    );
  }

  const { settings, meetingTypes } = calendarData;
  const days = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - User Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-200 sticky top-6">
              {settings.profile_image_url ? (
                <img
                  src={settings.profile_image_url}
                  alt={settings.display_name}
                  className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-blue-100"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold">
                  {settings.display_name.charAt(0).toUpperCase()}
                </div>
              )}
              
              <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
                {settings.display_name}
              </h1>
              
              {settings.company_name && (
                <p className="text-gray-600 text-center mb-4">{settings.company_name}</p>
              )}
              
              {settings.welcome_message && (
                <p className="text-gray-700 text-center mb-6 p-4 bg-blue-50 rounded-xl">
                  {settings.welcome_message}
                </p>
              )}

              {selectedMeetingType && (
                <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="size-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${selectedMeetingType.color}20` }}>
                      <Clock className="w-5 h-5" style={{ color: selectedMeetingType.color }} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{selectedMeetingType.name}</h3>
                      <p className="text-sm text-gray-600">{selectedMeetingType.duration_minutes} minutes</p>
                    </div>
                  </div>
                  {selectedMeetingType.description && (
                    <p className="text-sm text-gray-600 mb-3">{selectedMeetingType.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="px-2 py-1 bg-white rounded-lg text-xs font-semibold">
                      📍 {selectedMeetingType.location_type}
                    </span>
                  </div>
                </div>
              )}

              {selectedDate && selectedTime && (
                <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200">
                  <p className="text-sm font-semibold text-green-900 mb-2">Selected Time:</p>
                  <p className="text-gray-700">
                    📅 {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                  <p className="text-gray-700">
                    ⏰ {selectedTime}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Content - Booking Steps */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-200">
              {/* Step 1: Select Meeting Type */}
              {step === 'meeting-type' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Select a Meeting Type</h2>
                  <div className="space-y-4">
                    {meetingTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => {
                          setSelectedMeetingType(type);
                          setStep('date-time');
                        }}
                        className="w-full p-6 border-2 border-gray-200 rounded-2xl hover:border-blue-500 hover:shadow-lg transition-all text-left"
                      >
                        <div className="flex items-start gap-4">
                          <div className="size-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${type.color}20` }}>
                            <Clock className="w-6 h-6" style={{ color: type.color }} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 mb-1">{type.name}</h3>
                            {type.description && (
                              <p className="text-sm text-gray-600 mb-2">{type.description}</p>
                            )}
                            <div className="flex items-center gap-3 text-sm text-gray-700">
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {type.duration_minutes} min
                              </span>
                              <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs font-semibold">
                                {type.location_type}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-6 h-6 text-gray-400" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Select Date & Time */}
              {step === 'date-time' && (
                <div>
                  <button
                    onClick={() => {
                      setStep('meeting-type');
                      setSelectedDate(null);
                      setSelectedTime(null);
                    }}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-semibold"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Change Meeting Type
                  </button>

                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Date & Time</h2>

                  {/* Calendar */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <h3 className="text-lg font-bold text-gray-900">{monthName}</h3>
                      <button
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-7 gap-2 mb-2">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                        <div key={i} className="text-center text-xs font-semibold text-gray-600 py-2">
                          {day}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                      {days.map((day, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            if (day && isDateAvailable(day)) {
                              setSelectedDate(day);
                              setSelectedTime(null);
                            }
                          }}
                          disabled={!day || !isDateAvailable(day)}
                          className={`aspect-square rounded-lg text-sm font-semibold transition-all ${
                            !day
                              ? 'invisible'
                              : !isDateAvailable(day)
                              ? 'text-gray-300 cursor-not-allowed'
                              : selectedDate?.toDateString() === day.toDateString()
                              ? 'bg-blue-600 text-white shadow-lg'
                              : 'hover:bg-blue-50 text-gray-700'
                          }`}
                        >
                          {day?.getDate()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time Slots */}
                  {selectedDate && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4">
                        Available Times - {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                      </h3>
                      {availableSlots.length === 0 ? (
                        <p className="text-gray-600 text-center py-8">No available slots for this date.</p>
                      ) : (
                        <div className="grid grid-cols-3 gap-3 mb-6">
                          {availableSlots.map((slot) => (
                            <button
                              key={slot.time}
                              onClick={() => setSelectedTime(slot.time)}
                              disabled={!slot.available}
                              className={`p-3 rounded-xl text-sm font-semibold transition-all ${
                                !slot.available
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : selectedTime === slot.time
                                  ? 'bg-blue-600 text-white shadow-lg'
                                  : 'bg-white border-2 border-gray-200 hover:border-blue-500 text-gray-700'
                              }`}
                            >
                              {slot.time}
                            </button>
                          ))}
                        </div>
                      )}

                      {selectedTime && (
                        <button
                          onClick={() => setStep('details')}
                          className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                        >
                          Continue
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Guest Details */}
              {step === 'details' && (
                <div>
                  <button
                    onClick={() => setStep('date-time')}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-semibold"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Change Date & Time
                  </button>

                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Details</h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <User className="w-4 h-4 inline mr-2" />
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Juan Dela Cruz"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <Mail className="w-4 h-4 inline mr-2" />
                        Email *
                      </label>
                      <input
                        type="email"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="juan@example.com"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <Phone className="w-4 h-4 inline mr-2" />
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="+63 912 345 6789"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <MessageSquare className="w-4 h-4 inline mr-2" />
                        Additional Notes
                      </label>
                      <textarea
                        value={guestNotes}
                        onChange={(e) => setGuestNotes(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                        placeholder="Tell me what you'd like to discuss..."
                      />
                    </div>

                    <button
                      onClick={handleBooking}
                      disabled={!guestName || !guestEmail || submitting}
                      className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Scheduling...
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5" />
                          Schedule Meeting
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Confirmation */}
              {step === 'confirmation' && bookingConfirmed && (
                <div className="text-center py-12">
                  <div className="size-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                    <Check className="w-10 h-10 text-green-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Meeting Confirmed!</h2>
                  <p className="text-lg text-gray-700 mb-6">
                    Your meeting with {settings.display_name} has been scheduled.
                  </p>
                  
                  <div className="bg-blue-50 rounded-2xl p-6 mb-6 max-w-md mx-auto">
                    <p className="text-sm font-semibold text-blue-900 mb-3">Meeting Details:</p>
                    <div className="space-y-2 text-left">
                      <p className="text-gray-700">
                        📅 {selectedDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="text-gray-700">⏰ {selectedTime}</p>
                      <p className="text-gray-700">⏱️ {selectedMeetingType?.duration_minutes} minutes</p>
                      <p className="text-gray-700">📍 {selectedMeetingType?.location_type}</p>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-6">
                    A confirmation email has been sent to <strong>{guestEmail}</strong>
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={() => {
                        if (confirmedBooking && selectedMeetingType) {
                          const icsContent = icsGenerator.generateICS(
                            confirmedBooking,
                            selectedMeetingType,
                            settings.display_name,
                            'contact@nexscout.com'
                          );
                          icsGenerator.downloadICS(icsContent, `meeting-${confirmedBooking.id}.ics`);
                        }
                      }}
                      className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      📥 Add to Calendar (ICS)
                    </button>
                    <button
                      onClick={() => {
                        if (confirmedBooking && selectedMeetingType) {
                          const link = icsGenerator.generateGoogleCalendarLink(
                            confirmedBooking,
                            selectedMeetingType,
                            settings.display_name
                          );
                          window.open(link, '_blank');
                        }
                      }}
                      className="px-6 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                    >
                      📅 Google Calendar
                    </button>
                  </div>
                  
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors w-full"
                  >
                    Book Another Meeting
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

