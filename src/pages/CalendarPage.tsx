import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AICalendarEngine } from '../services/productivity/aiCalendarEngine';

interface CalendarPageProps {
  onBack: () => void;
  onNavigate: (page: string, options?: any) => void;
}

type ViewMode = 'month' | 'week' | 'day';

export default function CalendarPage({ onBack, onNavigate }: CalendarPageProps) {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadEvents();
    }
  }, [user, currentDate, viewMode]);

  async function loadEvents() {
    if (!user) return;

    setLoading(true);
    try {
      let eventData = [];

      if (viewMode === 'month') {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        eventData = await AICalendarEngine.getEventsForMonth(user.id, year, month);
      } else if (viewMode === 'week') {
        const weekStart = getWeekStart(currentDate);
        eventData = await AICalendarEngine.getEventsForWeek(user.id, weekStart);
      } else {
        eventData = await AICalendarEngine.getEventsForDay(user.id, currentDate);
      }

      setEvents(eventData);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  }

  function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }

  function navigatePrevious() {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  }

  function navigateNext() {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  }

  function goToToday() {
    setCurrentDate(new Date());
  }

  function getMonthDays() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }

  function getEventsForDate(date: Date) {
    return events.filter(event => {
      const eventDate = new Date(event.start_time);
      return eventDate.toDateString() === date.toDateString();
    });
  }

  function formatDateHeader() {
    const options: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };
    if (viewMode === 'day') {
      return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }
    return currentDate.toLocaleDateString('en-US', options);
  }

  function formatTime(dateString: string) {
    return new Date(dateString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8] pb-24">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={onBack} className="size-10 rounded-full bg-gray-100 flex items-center justify-center">
              <ArrowLeft className="size-5 text-gray-700" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <CalendarIcon className="size-6 text-blue-600" />
              Calendar
            </h1>
            <button
              onClick={() => setShowEventModal(true)}
              className="size-10 rounded-full bg-blue-600 flex items-center justify-center"
            >
              <Plus className="size-5 text-white" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={navigatePrevious} className="size-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                <ChevronLeft className="size-5 text-gray-700" />
              </button>
              <button onClick={goToToday} className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg">
                Today
              </button>
              <button onClick={navigateNext} className="size-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                <ChevronRight className="size-5 text-gray-700" />
              </button>
            </div>

            <h2 className="text-lg font-semibold text-gray-900">{formatDateHeader()}</h2>

            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('day')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'day' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'week' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                Month
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 py-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="size-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {viewMode === 'month' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="py-3 text-center text-sm font-semibold text-gray-700">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {getMonthDays().map((date, index) => {
                    const isToday = date && date.toDateString() === new Date().toDateString();
                    const dayEvents = date ? getEventsForDate(date) : [];

                    return (
                      <div
                        key={index}
                        className={`min-h-[100px] border-r border-b border-gray-200 p-2 ${
                          !date ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'
                        } ${isToday ? 'bg-blue-50' : ''}`}
                      >
                        {date && (
                          <>
                            <div
                              className={`text-sm font-medium mb-1 ${
                                isToday ? 'inline-flex items-center justify-center size-7 bg-blue-600 text-white rounded-full' : 'text-gray-700'
                              }`}
                            >
                              {date.getDate()}
                            </div>
                            <div className="space-y-1">
                              {dayEvents.slice(0, 2).map(event => (
                                <button
                                  key={event.id}
                                  onClick={() => {
                                    setSelectedEvent(event);
                                    setShowEventModal(true);
                                  }}
                                  className="w-full text-left px-2 py-1 rounded text-xs font-medium truncate"
                                  style={{ backgroundColor: event.color + '20', color: event.color }}
                                >
                                  {formatTime(event.start_time)} {event.title}
                                </button>
                              ))}
                              {dayEvents.length > 2 && (
                                <div className="text-xs text-gray-500 pl-2">+{dayEvents.length - 2} more</div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {viewMode === 'day' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
                {events.length === 0 ? (
                  <div className="text-center py-12">
                    <CalendarIcon className="size-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600">No events scheduled for this day</p>
                  </div>
                ) : (
                  events.map(event => (
                    <button
                      key={event.id}
                      onClick={() => {
                        setSelectedEvent(event);
                        setShowEventModal(true);
                      }}
                      className="w-full text-left p-4 rounded-xl border-l-4 hover:shadow-md transition-shadow"
                      style={{ borderColor: event.color, backgroundColor: event.color + '10' }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{event.title}</h3>
                        <span className="text-xs px-2 py-1 rounded-full bg-white" style={{ color: event.color }}>
                          {event.event_type}
                        </span>
                      </div>
                      {event.description && (
                        <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="size-4" />
                          {formatTime(event.start_time)} - {formatTime(event.end_time)}
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="size-4" />
                            {event.location}
                          </div>
                        )}
                        {event.prospects && (
                          <div className="flex items-center gap-1">
                            <User className="size-4" />
                            {event.prospects.full_name}
                          </div>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {viewMode === 'week' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="grid grid-cols-7 divide-x divide-gray-200">
                  {[0, 1, 2, 3, 4, 5, 6].map(dayOffset => {
                    const weekStart = getWeekStart(currentDate);
                    const date = new Date(weekStart);
                    date.setDate(date.getDate() + dayOffset);
                    const isToday = date.toDateString() === new Date().toDateString();
                    const dayEvents = getEventsForDate(date);

                    return (
                      <div key={dayOffset} className="min-h-[400px] p-3">
                        <div className={`text-center mb-3 pb-2 border-b ${isToday ? 'border-blue-600' : 'border-gray-200'}`}>
                          <div className="text-xs font-medium text-gray-500">
                            {date.toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                          <div
                            className={`text-lg font-bold ${
                              isToday ? 'text-blue-600' : 'text-gray-900'
                            }`}
                          >
                            {date.getDate()}
                          </div>
                        </div>
                        <div className="space-y-2">
                          {dayEvents.map(event => (
                            <button
                              key={event.id}
                              onClick={() => {
                                setSelectedEvent(event);
                                setShowEventModal(true);
                              }}
                              className="w-full text-left px-2 py-2 rounded-lg text-xs"
                              style={{ backgroundColor: event.color + '20', color: event.color }}
                            >
                              <div className="font-medium truncate">{event.title}</div>
                              <div className="text-xs opacity-75">{formatTime(event.start_time)}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {showEventModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedEvent ? 'Event Details' : 'New Event'}
              </h2>
              <button
                onClick={() => {
                  setShowEventModal(false);
                  setSelectedEvent(null);
                }}
                className="size-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
              >
                <span className="text-gray-600">×</span>
              </button>
            </div>

            {selectedEvent ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">{selectedEvent.title}</h3>
                  {selectedEvent.description && (
                    <p className="text-gray-600">{selectedEvent.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">Start</div>
                    <div className="text-sm text-gray-900">{formatTime(selectedEvent.start_time)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">End</div>
                    <div className="text-sm text-gray-900">{formatTime(selectedEvent.end_time)}</div>
                  </div>
                </div>

                {selectedEvent.location && (
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">Location</div>
                    <div className="text-sm text-gray-900">{selectedEvent.location}</div>
                  </div>
                )}

                {selectedEvent.prospects && (
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">Prospect</div>
                    <div className="text-sm text-gray-900">{selectedEvent.prospects.full_name}</div>
                  </div>
                )}

                {selectedEvent.auto_ai_generated && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-xs font-medium text-blue-900 mb-1">AI Generated</div>
                    <p className="text-xs text-blue-700">{selectedEvent.ai_reasoning}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  {selectedEvent.linked_page && (
                    <button
                      onClick={() => {
                        onNavigate(selectedEvent.linked_page, selectedEvent.navigation_data);
                        setShowEventModal(false);
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700"
                    >
                      View Details
                    </button>
                  )}
                  <button
                    onClick={() => setShowEventModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-600">Create event feature coming soon...</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
