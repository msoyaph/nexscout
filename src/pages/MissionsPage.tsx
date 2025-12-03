import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Mail, TrendingUp, CheckCircle, Coins, Home, Users, PlusCircle, MoreHorizontal, Sparkles, UserPlus, GraduationCap, Scan, Compass, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Mission {
  id: string;
  title: string;
  description: string;
  mission_type: string;
  icon_name: string;
  color: string;
  reward_coins: number;
  total_required: number;
  current_progress: number;
  is_completed: boolean;
  completed_at: string | null;
  expires_at: string | null;
}

interface MissionsPageProps {
  onNavigateBack: () => void;
  onNavigate?: (page: string) => void;
  onNavigateToMore?: () => void;
}

const iconMap: Record<string, any> = {
  Search,
  Mail,
  TrendingUp,
  CheckCircle,
  Sparkles,
  UserPlus,
  GraduationCap,
  Scan,
  Compass,
};

export default function MissionsPage({ onNavigateBack, onNavigate }: MissionsPageProps) {
  const { profile } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const totalCoins = profile?.coin_balance || 0;

  useEffect(() => {
    loadMissions();
  }, []);

  const loadMissions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('missions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMissions(data || []);
    } catch (error) {
      console.error('Error loading missions:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMissions = async () => {
    try {
      setGenerating(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-missions`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ mission_type: 'onboarding' }),
        }
      );

      const result = await response.json();

      if (result.success) {
        await loadMissions();
      } else {
        throw new Error(result.error || 'Failed to generate missions');
      }
    } catch (error) {
      console.error('Error generating missions:', error);
      alert('Failed to generate missions. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="bg-white min-h-screen text-slate-900 relative overflow-hidden pb-28">
      <div className="px-6 pt-8 pb-6 flex items-center justify-between">
        <button
          onClick={onNavigateBack}
          className="size-11 flex items-center justify-center hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeft className="size-6 text-slate-900" />
        </button>
        <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-[0px_4px_16px_rgba(0,0,0,0.08)]">
          <Coins className="size-5 text-[#F59E0B]" />
          <span className="text-sm font-semibold text-slate-900">{totalCoins} Coins</span>
        </div>
      </div>

      <main className="px-6 space-y-8">
        <section className="text-center space-y-4">
          <div className="w-full h-[280px] bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-cyan-500/10 rounded-[32px] flex items-center justify-center relative overflow-hidden">
            <div className="relative grid grid-cols-2 gap-3 w-48">
              <div className="bg-white rounded-[20px] shadow-[0px_8px_24px_rgba(0,0,0,0.12)] p-4 flex flex-col items-center gap-2">
                <div className="size-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Search className="size-6 text-blue-600" />
                </div>
                <div className="size-1.5 rounded-full bg-green-500" />
              </div>

              <div className="bg-white rounded-[20px] shadow-[0px_8px_24px_rgba(0,0,0,0.12)] p-4 flex flex-col items-center gap-2">
                <div className="size-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Mail className="size-6 text-purple-600" />
                </div>
                <div className="size-1.5 rounded-full bg-green-500" />
              </div>

              <div className="bg-white rounded-[20px] shadow-[0px_8px_24px_rgba(0,0,0,0.12)] p-4 flex flex-col items-center gap-2">
                <div className="size-12 rounded-full bg-cyan-500/10 flex items-center justify-center">
                  <TrendingUp className="size-6 text-cyan-600" />
                </div>
                <div className="size-1.5 rounded-full bg-yellow-500" />
              </div>

              <div className="bg-white rounded-[20px] shadow-[0px_8px_24px_rgba(0,0,0,0.12)] p-4 flex flex-col items-center gap-2">
                <div className="size-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <CheckCircle className="size-6 text-yellow-600" />
                </div>
                <div className="size-1.5 rounded-full bg-blue-500" />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Complete Daily Missions
            </h1>
            <p className="text-base text-slate-600 leading-relaxed">
              Earn coins by completing missions and unlock exclusive rewards to boost your sales performance
            </p>
          </div>
        </section>

        <section className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : missions.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
                <Sparkles className="w-10 h-10 text-gray-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900">No Missions Yet</h3>
                <p className="text-sm text-slate-600">Generate your first set of missions to start earning coins!</p>
              </div>
              <button
                onClick={generateMissions}
                disabled={generating}
                className="w-full max-w-xs mx-auto py-3 px-6 bg-gradient-to-r from-[#1877F2] to-[#0C5FCD] text-white rounded-[20px] font-semibold text-sm shadow-[0px_8px_24px_rgba(24,119,242,0.3)] flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-[0px_12px_32px_rgba(24,119,242,0.4)] transition-all"
              >
                {generating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Generate tasks with AI</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            missions.map((mission) => {
              const Icon = iconMap[mission.icon_name] || Search;
              const progressPercent = (mission.current_progress / mission.total_required) * 100;

              return (
                <div
                  key={mission.id}
                  className="bg-white rounded-[24px] shadow-[0px_8px_24px_rgba(0,0,0,0.08)] p-5 border border-slate-100"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="size-14 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${mission.color}15` }}
                    >
                      <Icon className="size-7" style={{ color: mission.color }} />
                    </div>

                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="font-semibold text-slate-900">{mission.title}</h3>
                          <p className="text-sm text-slate-600">{mission.description}</p>
                        </div>
                        <div className="flex items-center gap-1 bg-yellow-500/10 px-3 py-1 rounded-full shrink-0">
                          <Coins className="size-4 text-[#F59E0B]" />
                          <span className="text-sm font-semibold text-yellow-600">{mission.reward_coins}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600">Progress</span>
                          <span className="font-semibold text-slate-900">
                            {mission.current_progress}/{mission.total_required}
                          </span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${progressPercent}%`,
                              backgroundColor: mission.color
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>

        {missions.length > 0 && (
          <div className="pt-4 pb-6 space-y-3">
            <button
              onClick={generateMissions}
              disabled={generating}
              className="w-full py-3 px-6 bg-gradient-to-r from-[#1877F2] to-[#0C5FCD] text-white rounded-[20px] font-semibold text-sm shadow-[0px_8px_24px_rgba(24,119,242,0.3)] flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-[0px_12px_32px_rgba(24,119,242,0.4)] transition-all"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Generate tasks with AI</span>
                </>
              )}
            </button>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 w-full bg-white/95 backdrop-blur-xl border-t border-slate-100 z-50 shadow-[0px_-8px_24px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between px-6 h-[72px]">
          <button
            onClick={() => onNavigate?.('home')}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-900 transition-colors"
          >
            <Home className="size-6" />
            <span className="text-[10px] font-medium">Home</span>
          </button>

          <button
            onClick={() => onNavigate?.('prospects')}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-900 transition-colors"
          >
            <Users className="size-6" />
            <span className="text-[10px] font-medium">Prospects</span>
          </button>

          <button
            onClick={() => onNavigate?.('chatbot-sessions')}
            className="relative -top-6 bg-[#1877F2] text-white size-14 rounded-full shadow-[0px_8px_24px_rgba(24,119,242,0.4)] flex items-center justify-center border-4 border-white transition-transform active:scale-95"
          >
            <MessageSquare className="size-7" />
          </button>

          <button
            onClick={() => onNavigate?.('pipeline')}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-900 transition-colors"
          >
            <TrendingUp className="size-6" />
            <span className="text-[10px] font-medium">Pipeline</span>
          </button>

          <button
            onClick={() => onNavigateToMore?.()}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-900 transition-colors"
          >
            <MoreHorizontal className="size-6" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
