import { useState } from 'react';
import { X, Calendar, Clock, FileText, Bell } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface SetReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  prospectId: string;
  prospectName: string;
  onSuccess?: () => void;
}

export default function SetReminderModal({
  isOpen,
  onClose,
  prospectId,
  prospectName,
  onSuccess
}: SetReminderModalProps) {
  const { user } = useAuth();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Set default date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split('T')[0];
  const defaultTime = '09:00';

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!date || !time) {
      setError('Please select both date and time');
      setLoading(false);
      return;
    }

    if (!user) {
      setError('You must be logged in to set reminders');
      setLoading(false);
      return;
    }

    try {
      // Combine date and time into a single timestamp
      const reminderDateTime = new Date(`${date}T${time}`);
      
      // Validate that the reminder is in the future
      if (reminderDateTime <= new Date()) {
        setError('Reminder time must be in the future');
        setLoading(false);
        return;
      }

      // Create reminder in database
      const { data: reminder, error: reminderError } = await supabase
        .from('prospect_reminders')
        .insert({
          user_id: user.id,
          prospect_id: prospectId,
          reminder_date: reminderDateTime.toISOString(),
          notes: notes.trim() || null,
          is_completed: false
        })
        .select()
        .single();

      if (reminderError) throw reminderError;

      // Create notification for the reminder
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: 'followup_due',
          title: `Follow-up reminder: ${prospectName}`,
          message: notes.trim() || `Follow up with ${prospectName}`,
          icon: '🔔',
          action_url: `prospect-detail-${prospectId}`,
          related_prospect_id: prospectId,
          priority: 'high',
          is_read: false,
          expires_at: reminderDateTime.toISOString(),
          metadata: {
            reminder_id: reminder.id,
            reminder_date: reminderDateTime.toISOString(),
            notes: notes.trim() || null
          }
        });

      if (notificationError) {
        console.error('Error creating notification:', notificationError);
        // Don't fail the whole operation if notification creation fails
      }

      // Request browser notification permission and schedule
      if ('Notification' in window && Notification.permission === 'granted') {
        scheduleBrowserNotification(reminderDateTime, prospectName, notes);
      } else if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            scheduleBrowserNotification(reminderDateTime, prospectName, notes);
          }
        });
      }

      // Reset form
      setDate('');
      setTime('');
      setNotes('');
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error setting reminder:', err);
      setError(err.message || 'Failed to set reminder. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const scheduleBrowserNotification = (dateTime: Date, name: string, note: string) => {
    const now = new Date();
    const delay = dateTime.getTime() - now.getTime();

    if (delay > 0) {
      setTimeout(() => {
        new Notification(`Follow-up: ${name}`, {
          body: note || `Time to follow up with ${name}`,
          icon: '/favicon.ico',
          tag: `reminder-${prospectId}`,
          requireInteraction: true
        });
      }, delay);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setDate('');
      setTime('');
      setNotes('');
      setError('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Set Reminder</h2>
                <p className="text-sm text-white/90">{prospectName}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Date Input */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Date
            </label>
            <input
              type="date"
              value={date || defaultDate}
              onChange={(e) => setDate(e.target.value)}
              min={defaultDate}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Time Input */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Clock className="w-4 h-4 text-blue-600" />
              Time
            </label>
            <input
              type="time"
              value={time || defaultTime}
              onChange={(e) => setTime(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Notes Input */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes or context for this reminder..."
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? 'Setting...' : 'Set Reminder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}




