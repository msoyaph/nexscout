import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, Circle, Sparkles, ChevronDown, ChevronUp, Calendar, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AITodoEngine } from '../services/productivity/aiTodoEngine';
import ProspectAvatar from '../components/ProspectAvatar';

interface TodosPageProps {
  onBack: () => void;
  onNavigate: (page: string, options?: any) => void;
}

type TimeframeFilter = 'today' | 'upcoming' | 'past';

export default function TodosPage({ onBack, onNavigate }: TodosPageProps) {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState<TimeframeFilter>('today');
  const [todos, setTodos] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, completionRate: 0 });
  const [loading, setLoading] = useState(true);
  const [expandedAI, setExpandedAI] = useState(true);

  useEffect(() => {
    if (user) {
      loadTodos();
      loadStats();
    }
  }, [user, timeframe]);

  async function loadTodos() {
    if (!user) return;

    setLoading(true);
    try {
      const data = await AITodoEngine.getUserTodos(user.id, {
        completed: false,
        timeframe,
      });

      setTodos(data);
    } catch (error) {
      console.error('Error loading todos:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    if (!user) return;

    try {
      const statsData = await AITodoEngine.getCompletionStats(user.id, 7);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  async function handleToggleTodo(todoId: string, completed: boolean) {
    if (!user) return;

    try {
      if (completed) {
        return;
      }

      await AITodoEngine.completeTodo(todoId, user.id);

      setTodos(prev => prev.filter(t => t.id !== todoId));

      loadStats();
    } catch (error) {
      console.error('Error toggling todo:', error);
    }
  }

  function getPriorityColor(priority: string) {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  }

  function getPriorityIcon(priority: string) {
    if (priority === 'urgent' || priority === 'high') {
      return <AlertCircle className="size-4" />;
    }
    return <Circle className="size-4" />;
  }

  const aiGeneratedTodos = todos.filter(t => t.auto_ai_generated);
  const manualTodos = todos.filter(t => !t.auto_ai_generated);

  return (
    <div className="min-h-screen bg-[#F4F6F8] pb-24">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={onBack} className="size-10 rounded-full bg-gray-100 flex items-center justify-center">
              <ArrowLeft className="size-5 text-gray-700" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">To-Dos</h1>
            <div className="size-10" />
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-700">7-Day Completion Rate</div>
              <div className="text-2xl font-bold text-blue-600">{stats.completionRate}%</div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>{stats.completed} completed</span>
              <span>{stats.pending} pending</span>
            </div>
          </div>

          <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setTimeframe('today')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                timeframe === 'today' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setTimeframe('upcoming')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                timeframe === 'upcoming' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setTimeframe('past')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                timeframe === 'past' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Past
            </button>
          </div>
        </div>
      </header>

      <main className="px-6 py-6 space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="size-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {aiGeneratedTodos.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-blue-200 overflow-hidden">
                <button
                  onClick={() => setExpandedAI(!expandedAI)}
                  className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-5 text-blue-600" />
                    <h2 className="font-bold text-gray-900">AI Suggested Tasks</h2>
                    <span className="text-sm text-gray-600">({aiGeneratedTodos.length})</span>
                  </div>
                  {expandedAI ? <ChevronUp className="size-5 text-gray-600" /> : <ChevronDown className="size-5 text-gray-600" />}
                </button>

                {expandedAI && (
                  <div className="divide-y divide-gray-200">
                    {aiGeneratedTodos.map(todo => (
                      <div key={todo.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => handleToggleTodo(todo.id, todo.completed)}
                            className="mt-1 size-6 shrink-0"
                          >
                            {todo.completed ? (
                              <CheckCircle2 className="size-6 text-green-600" />
                            ) : (
                              <Circle className="size-6 text-gray-400 hover:text-blue-600" />
                            )}
                          </button>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className={`font-semibold ${todo.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                {todo.title}
                              </h3>
                              <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(todo.priority)} ml-2 shrink-0`}>
                                {todo.priority}
                              </span>
                            </div>

                            {todo.description && (
                              <p className="text-sm text-gray-600 mb-2">{todo.description}</p>
                            )}

                            {todo.ai_reasoning && (
                              <div className="bg-blue-50 rounded-lg p-2 mb-2">
                                <p className="text-xs text-blue-700">{todo.ai_reasoning}</p>
                              </div>
                            )}

                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              {todo.due_date && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="size-3" />
                                  {new Date(todo.due_date).toLocaleDateString()}
                                </div>
                              )}
                              {todo.prospects && (
                                <div className="flex items-center gap-1">
                                  <ProspectAvatar prospect={todo.prospects} size="sm" />
                                  <span>{todo.prospects.full_name}</span>
                                </div>
                              )}
                            </div>

                            {todo.progress_total > 1 && (
                              <div className="mt-2">
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div
                                    className="bg-blue-600 h-1.5 rounded-full"
                                    style={{ width: `${(todo.progress_current / todo.progress_total) * 100}%` }}
                                  />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  {todo.progress_current} / {todo.progress_total}
                                </p>
                              </div>
                            )}

                            {todo.linked_page && (
                              <button
                                onClick={() => onNavigate(todo.linked_page, todo.navigation_data)}
                                className="mt-2 text-xs text-blue-600 font-medium hover:text-blue-700"
                              >
                                View Details →
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {manualTodos.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="font-bold text-gray-900">My Tasks</h2>
                </div>

                <div className="divide-y divide-gray-200">
                  {manualTodos.map(todo => (
                    <div key={todo.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => handleToggleTodo(todo.id, todo.completed)}
                          className="mt-1 size-6 shrink-0"
                        >
                          {todo.completed ? (
                            <CheckCircle2 className="size-6 text-green-600" />
                          ) : (
                            <Circle className="size-6 text-gray-400 hover:text-blue-600" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className={`font-semibold ${todo.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                              {todo.title}
                            </h3>
                            <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(todo.priority)} ml-2 shrink-0`}>
                              {todo.priority}
                            </span>
                          </div>

                          {todo.description && (
                            <p className="text-sm text-gray-600 mb-2">{todo.description}</p>
                          )}

                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            {todo.due_date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="size-3" />
                                {new Date(todo.due_date).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {todos.length === 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                <CheckCircle2 className="size-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">All caught up!</h3>
                <p className="text-gray-600">No tasks for this timeframe</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
