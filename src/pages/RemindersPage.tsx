import { useState, useEffect } from 'react';
import { ArrowLeft, Bell, Phone, MessageSquare, FileText, CheckCircle2, Clock, Flame, AlertCircle, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AIReminderEngine } from '../services/productivity/aiReminderEngine';
import ProspectAvatar from '../components/ProspectAvatar';

interface RemindersPageProps {
  onBack: () => void;
  onNavigate: (page: string, options?: any) => void;
}

export default function RemindersPage({ onBack, onNavigate }: RemindersPageProps) {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'urgent' | 'today' | 'upcoming'>('all');

  useEffect(() => {
    if (user) {
      loadReminders();
    }
  }, [user, filter]);

  async function loadReminders() {
    if (!user) return;

    setLoading(true);
    try {
      const filters: any = { completed: false };

      if (filter === 'urgent') {
        filters.priority = 'urgent';
      } else if (filter === 'today') {
        filters.startDate = new Date();
        filters.endDate = new Date();
        filters.endDate.setHours(23, 59, 59);
      } else if (filter === 'upcoming') {
        filters.startDate = new Date();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        filters.endDate = futureDate;
      }

      const data = await AIReminderEngine.getUserReminders(user.id, filters);
      setReminders(data);
    } catch (error) {
      console.error('Error loading reminders:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCompleteReminder(reminderId: string) {
    if (!user) return;

    try {
      await AIReminderEngine.completeReminder(reminderId, user.id);
      setReminders(prev => prev.filter(r => r.id !== reminderId));
    } catch (error) {
      console.error('Error completing reminder:', error);
    }
  }

  function groupReminders(reminders: any[]) {
    const groups: Record<string, any[]> = {
      urgent: [],
      hot_leads: [],
      follow_ups: [],
      appointments: [],
      tasks: [],
      other: [],
    };

    for (const reminder of reminders) {
      if (reminder.priority === 'urgent') {
        groups.urgent.push(reminder);
      } else if (reminder.reminder_type === 'hot_lead_revival') {
        groups.hot_leads.push(reminder);
      } else if (reminder.reminder_type === 'follow_up') {
        groups.follow_ups.push(reminder);
      } else if (reminder.reminder_type === 'appointment' || reminder.reminder_type === 'meeting_confirmation') {
        groups.appointments.push(reminder);
      } else if (reminder.reminder_type === 'task_assigned') {
        groups.tasks.push(reminder);
      } else {
        groups.other.push(reminder);
      }
    }

    return groups;
  }

  function getTimeUntil(dueAt: string) {
    const now = new Date();
    const due = new Date(dueAt);
    const diff = due.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (diff < 0) return 'Overdue';
    if (hours < 1) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  }

  function getPriorityColor(priority: string) {
    switch (priority) {
      case 'urgent':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'high':
        return 'bg-orange-50 border-orange-200 text-orange-700';
      case 'medium':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  }

  function getQuickActions(reminder: any) {
    const actions = [];

    if (reminder.prospect_id) {
      actions.push(
        { icon: Phone, label: 'Call', action: () => onNavigate('prospect-detail', { prospectId: reminder.prospect_id }) },
        { icon: MessageSquare, label: 'Message', action: () => onNavigate('messages', { prospectId: reminder.prospect_id }) },
        { icon: FileText, label: 'Send Deck', action: () => onNavigate('pitch-decks', { prospectId: reminder.prospect_id }) }
      );
    }

    return actions;
  }

  const grouped = groupReminders(reminders);

  return (
    <div className="min-h-screen bg-[#F4F6F8] pb-24">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={onBack} className="size-10 rounded-full bg-gray-100 flex items-center justify-center">
              <ArrowLeft className="size-5 text-gray-700" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Bell className="size-6 text-blue-600" />
              Reminders
            </h1>
            <div className="size-10" />
          </div>

          <div className="flex gap-2 overflow-x-auto">
            {['all', 'urgent', 'today', 'upcoming'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="px-6 py-6 space-y-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="size-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {grouped.urgent.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="size-5 text-red-600" />
                  <h2 className="text-lg font-bold text-gray-900">🚨 Urgent Reminders</h2>
                </div>
                <div className="space-y-3">
                  {grouped.urgent.map(reminder => (
                    <ReminderCard
                      key={reminder.id}
                      reminder={reminder}
                      onComplete={handleCompleteReminder}
                      onNavigate={onNavigate}
                      getTimeUntil={getTimeUntil}
                      getPriorityColor={getPriorityColor}
                      getQuickActions={getQuickActions}
                    />
                  ))}
                </div>
              </section>
            )}

            {grouped.hot_leads.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Flame className="size-5 text-orange-600" />
                  <h2 className="text-lg font-bold text-gray-900">🔥 Hot Leads</h2>
                </div>
                <div className="space-y-3">
                  {grouped.hot_leads.map(reminder => (
                    <ReminderCard
                      key={reminder.id}
                      reminder={reminder}
                      onComplete={handleCompleteReminder}
                      onNavigate={onNavigate}
                      getTimeUntil={getTimeUntil}
                      getPriorityColor={getPriorityColor}
                      getQuickActions={getQuickActions}
                    />
                  ))}
                </div>
              </section>
            )}

            {grouped.follow_ups.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="size-5 text-blue-600" />
                  <h2 className="text-lg font-bold text-gray-900">📞 Follow-Ups Needed</h2>
                </div>
                <div className="space-y-3">
                  {grouped.follow_ups.map(reminder => (
                    <ReminderCard
                      key={reminder.id}
                      reminder={reminder}
                      onComplete={handleCompleteReminder}
                      onNavigate={onNavigate}
                      getTimeUntil={getTimeUntil}
                      getPriorityColor={getPriorityColor}
                      getQuickActions={getQuickActions}
                    />
                  ))}
                </div>
              </section>
            )}

            {grouped.appointments.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="size-5 text-green-600" />
                  <h2 className="text-lg font-bold text-gray-900">📅 Appointments</h2>
                </div>
                <div className="space-y-3">
                  {grouped.appointments.map(reminder => (
                    <ReminderCard
                      key={reminder.id}
                      reminder={reminder}
                      onComplete={handleCompleteReminder}
                      onNavigate={onNavigate}
                      getTimeUntil={getTimeUntil}
                      getPriorityColor={getPriorityColor}
                      getQuickActions={getQuickActions}
                    />
                  ))}
                </div>
              </section>
            )}

            {grouped.tasks.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="size-5 text-purple-600" />
                  <h2 className="text-lg font-bold text-gray-900">✅ Tasks</h2>
                </div>
                <div className="space-y-3">
                  {grouped.tasks.map(reminder => (
                    <ReminderCard
                      key={reminder.id}
                      reminder={reminder}
                      onComplete={handleCompleteReminder}
                      onNavigate={onNavigate}
                      getTimeUntil={getTimeUntil}
                      getPriorityColor={getPriorityColor}
                      getQuickActions={getQuickActions}
                    />
                  ))}
                </div>
              </section>
            )}

            {grouped.other.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-3">Other Reminders</h2>
                <div className="space-y-3">
                  {grouped.other.map(reminder => (
                    <ReminderCard
                      key={reminder.id}
                      reminder={reminder}
                      onComplete={handleCompleteReminder}
                      onNavigate={onNavigate}
                      getTimeUntil={getTimeUntil}
                      getPriorityColor={getPriorityColor}
                      getQuickActions={getQuickActions}
                    />
                  ))}
                </div>
              </section>
            )}

            {reminders.length === 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                <Bell className="size-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No reminders</h3>
                <p className="text-gray-600">You're all caught up!</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

interface ReminderCardProps {
  reminder: any;
  onComplete: (id: string) => void;
  onNavigate: (page: string, options?: any) => void;
  getTimeUntil: (dueAt: string) => string;
  getPriorityColor: (priority: string) => string;
  getQuickActions: (reminder: any) => any[];
}

function ReminderCard({ reminder, onComplete, onNavigate, getTimeUntil, getPriorityColor, getQuickActions }: ReminderCardProps) {
  const quickActions = getQuickActions(reminder);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3 mb-3">
        {reminder.prospects && (
          <ProspectAvatar prospect={reminder.prospects} size="md" />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-gray-900">{reminder.title}</h3>
            <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(reminder.priority)} ml-2 shrink-0`}>
              {reminder.priority}
            </span>
          </div>

          {reminder.description && (
            <p className="text-sm text-gray-600 mb-2">{reminder.description}</p>
          )}

          {reminder.auto_ai_generated && reminder.ai_reasoning && (
            <div className="bg-blue-50 rounded-lg p-2 mb-2">
              <p className="text-xs text-blue-700">{reminder.ai_reasoning}</p>
            </div>
          )}

          <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
            <div className="flex items-center gap-1">
              <Clock className="size-3" />
              Due {getTimeUntil(reminder.due_at)}
            </div>
            <div className="text-gray-400">•</div>
            <div>{new Date(reminder.due_at).toLocaleString()}</div>
          </div>

          <div className="flex items-center gap-2">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-medium text-gray-700 transition-colors"
              >
                <action.icon className="size-3" />
                {action.label}
              </button>
            ))}

            {reminder.linked_page && (
              <button
                onClick={() => onNavigate(reminder.linked_page, reminder.navigation_data)}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-medium text-white transition-colors"
              >
                View Details
              </button>
            )}

            <button
              onClick={() => onComplete(reminder.id)}
              className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-xs font-medium text-white transition-colors"
            >
              <CheckCircle2 className="size-3" />
              Complete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
