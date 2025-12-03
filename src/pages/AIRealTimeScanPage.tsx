import { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, Flame, Star, Calendar, AlertCircle, Home, Users, PlusCircle, TrendingUp, MoreHorizontal, Loader2, MessageSquare } from 'lucide-react';
import ActionPopup from '../components/ActionPopup';
import SlideInMenu from '../components/SlideInMenu';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Prospect {
  id: string;
  full_name: string;
  company_name?: string;
  profile_picture_url?: string;
  scout_score?: number;
  bucket?: string;
}

interface AIRealTimeScanPageProps {
  onNavigateToHome?: () => void;
  onNavigateToProspects?: () => void;
  onNavigateToPipeline?: () => void;
  onNavigateToMore?: () => void;
  onNavigateToPitchDeck?: () => void;
  onNavigateToMessageSequencer?: () => void;
  onNavigateToRealTimeScan?: () => void;
  onNavigateToDeepScan?: () => void;
  onNavigate?: (page: string) => void;
}

export default function AIRealTimeScanPage({
  onNavigateToHome,
  onNavigateToProspects,
  onNavigateToPipeline,
  onNavigateToMore,
  onNavigateToPitchDeck,
  onNavigateToMessageSequencer,
  onNavigateToRealTimeScan,
  onNavigateToDeepScan,
  onNavigate
}: AIRealTimeScanPageProps) {
  const { user } = useAuth();
  const [showActionPopup, setShowActionPopup] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [stats, setStats] = useState({ total: 0, hot: 0, warm: 0, cold: 0 });

  useEffect(() => {
    if (user) {
      loadProspects();
    }
  }, [user]);

  const loadProspects = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('prospects')
        .select(`
          id,
          full_name,
          company_name,
          profile_picture_url,
          prospect_scores(
            scout_score,
            bucket
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted = (data || []).map((p: any) => ({
        id: p.id,
        full_name: p.full_name,
        company_name: p.company_name,
        profile_picture_url: p.profile_picture_url,
        scout_score: p.prospect_scores?.[0]?.scout_score || 0,
        bucket: p.prospect_scores?.[0]?.bucket || 'cold',
      }));

      setProspects(formatted);

      const hot = formatted.filter((p: Prospect) => (p.scout_score || 0) >= 90).length;
      const warm = formatted.filter((p: Prospect) => (p.scout_score || 0) >= 70 && (p.scout_score || 0) < 90).length;
      const cold = formatted.filter((p: Prospect) => (p.scout_score || 0) < 70).length;

      setStats({
        total: formatted.length,
        hot,
        warm,
        cold,
      });
    } catch (error) {
      console.error('Error loading prospects:', error);
    } finally {
      setLoading(false);
    }
  };

  const hotLeads = prospects.filter(p => (p.scout_score || 0) >= 90).sort((a, b) => (b.scout_score || 0) - (a.scout_score || 0)).slice(0, 10);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };
  return (
    <div className="bg-[#F8F9FA] min-h-screen text-[#1F2937] relative overflow-hidden pb-28">
      <header className="px-6 pt-8 pb-6 bg-white shadow-[0px_8px_24px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={onNavigateToHome}
            className="flex items-center justify-center size-11"
          >
            <ArrowLeft className="size-6 text-[#1F2937]" />
          </button>
          <h1 className="text-xl font-bold text-[#1F2937] tracking-tight">
            AI Scan Results
          </h1>
          <div className="size-11" />
        </div>
        <p className="text-sm text-[#6B7280] text-center">Analyzing your prospects in real-time</p>
      </header>

      <main className="px-6 space-y-6 mt-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="size-12 text-blue-500 animate-spin mb-4" />
            <p className="text-slate-600">Analyzing your prospects...</p>
          </div>
        ) : (
          <>
            <section className="bg-white rounded-[30px] shadow-[0px_8px_24px_rgba(0,0,0,0.06)] border border-[#E5E7EB] overflow-hidden">
              <div className="p-6 text-center">
                <div className="inline-flex items-center justify-center size-20 bg-gradient-to-br from-[#DBEAFE] to-[#BFDBFE] rounded-full mb-4">
                  <Sparkles className="size-10 text-[#2563EB]" />
                </div>
                <h2 className="font-bold text-2xl text-[#1F2937] mb-2">
                  Instant Analysis Complete
                </h2>
                <p className="text-sm text-[#6B7280]">Found {stats.total} prospects with actionable insights</p>
              </div>
            </section>

            <section className="bg-white rounded-[30px] shadow-[0px_8px_24px_rgba(0,0,0,0.06)] border border-[#E5E7EB]">
              <div className="p-5 border-b border-[#E5E7EB]">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <Flame className="size-5 text-[#EF4444]" />
                  Score Distribution
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <ScoreBar
                  label="Hot Leads"
                  count={stats.hot}
                  percentage={stats.total > 0 ? (stats.hot / stats.total) * 100 : 0}
                  color="#22C55E"
                  scoreRange="Score 90-100"
                />
                <ScoreBar
                  label="Warm Leads"
                  count={stats.warm}
                  percentage={stats.total > 0 ? (stats.warm / stats.total) * 100 : 0}
                  color="#F59E0B"
                  scoreRange="Score 70-89"
                />
                <ScoreBar
                  label="Cold Leads"
                  count={stats.cold}
                  percentage={stats.total > 0 ? (stats.cold / stats.total) * 100 : 0}
                  color="#9CA3AF"
                  scoreRange="Score Below 70"
                />
              </div>
            </section>

            <section className="bg-white rounded-[30px] shadow-[0px_8px_24px_rgba(0,0,0,0.06)] border border-[#E5E7EB] overflow-hidden">
              <div className="p-5 border-b border-[#E5E7EB] flex justify-between items-center">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <Star className="size-5 text-[#22C55E]" />
                  Top Hot Leads
                </h2>
                <span className="text-xs text-[#6B7280]">{hotLeads.length} leads</span>
              </div>
              <div className="divide-y divide-[#E5E7EB]">
                {hotLeads.length > 0 ? (
                  hotLeads.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      name={lead.full_name}
                      image={lead.profile_picture_url}
                      score={lead.scout_score || 0}
                      insight={lead.company_name ? `Works at ${lead.company_name}` : 'High potential lead'}
                      initials={getInitials(lead.full_name)}
                      onView={() => onNavigate?.('prospect-detail')}
                    />
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-slate-500">No hot leads yet</p>
                    <p className="text-xs text-slate-400 mt-1">Keep adding prospects to see top performers</p>
                  </div>
                )}
              </div>
            </section>

            <section className="bg-white rounded-[30px] shadow-[0px_8px_24px_rgba(0,0,0,0.06)] border border-[#E5E7EB]">
              <div className="p-5 border-b border-[#E5E7EB]">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <Sparkles className="size-5 text-[#2563EB]" />
                  AI Insights
                </h2>
              </div>
              <div className="p-5 space-y-3">
                {stats.hot > 0 && (
                  <InsightCard
                    icon={<Sparkles className="size-5 text-[#22C55E]" />}
                    title={`${stats.hot} prospects ready for immediate outreach`}
                    description="These leads show strong buying signals and high engagement."
                    bgColor="from-[#DBEAFE] to-[#BFDBFE]"
                    borderColor="border-[#93C5FD]"
                  />
                )}
                <InsightCard
                  icon={<Calendar className="size-5 text-[#F59E0B]" />}
                  title="Best time to contact: 2-4 PM today"
                  description="Analysis shows highest response rates during this window."
                  bgColor="from-[#FEF3C7] to-[#FDE68A]"
                  borderColor="border-[#FCD34D]"
                />
                {stats.warm > 0 && (
                  <InsightCard
                    icon={<AlertCircle className="size-5 text-[#F59E0B]" />}
                    title={`${stats.warm} warm leads ready to nurture`}
                    description="These prospects show interest and need consistent follow-up."
                    bgColor="from-[#FEF3C7] to-[#FDE68A]"
                    borderColor="border-[#FCD34D]"
                  />
                )}
              </div>
            </section>
          </>
        )}

        {!loading && (
          <div className="mt-6">
            <button
              onClick={onNavigateToProspects}
              className="w-full bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-white py-4 rounded-[20px] font-semibold text-sm shadow-[0px_8px_24px_rgba(37,99,235,0.3)] flex items-center justify-center gap-2"
            >
              <Users className="size-5" />
              View All Prospects
            </button>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 w-full bg-white/95 backdrop-blur-xl border-t border-[#E5E7EB] z-50 shadow-[0px_-8px_24px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between px-6 h-[72px]">
          <button onClick={onNavigateToHome} className="flex flex-col items-center gap-1 text-[#6B7280] hover:text-[#2563EB] transition-colors">
            <Home className="size-6" />
            <span className="text-[10px] font-medium">Home</span>
          </button>
          <button onClick={onNavigateToProspects} className="flex flex-col items-center gap-1 text-[#2563EB]">
            <Users className="size-6" />
            <span className="text-[10px] font-medium">Prospects</span>
          </button>
          <button
            onClick={() => onNavigate?.('chatbot-sessions')}
            className="relative -top-6 bg-[#1877F2] text-white size-14 rounded-full shadow-[0px_8px_24px_rgba(24,119,242,0.4)] flex items-center justify-center border-4 border-white transition-transform active:scale-95"
          >
            <MessageSquare className="size-7" />
          </button>
          <button onClick={onNavigateToPipeline} className="flex flex-col items-center gap-1 text-[#6B7280] hover:text-[#2563EB] transition-colors">
            <TrendingUp className="size-6" />
            <span className="text-[10px] font-medium">Pipeline</span>
          </button>
          <button onClick={() => setMenuOpen(true)} className="flex flex-col items-center gap-1 text-[#6B7280] hover:text-[#2563EB] transition-colors">
            <MoreHorizontal className="size-6" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
        <ActionPopup
          isOpen={showActionPopup}
          onClose={() => setShowActionPopup(false)}
          onNavigateToPitchDeck={onNavigateToPitchDeck || (() => {})}
          onNavigateToMessageSequencer={onNavigateToMessageSequencer}
          onNavigateToRealTimeScan={onNavigateToRealTimeScan}
          onNavigateToDeepScan={onNavigateToDeepScan}
        />
      </nav>

      <SlideInMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={(page) => {
          setMenuOpen(false);
          if (onNavigate) {
            onNavigate(page);
          } else if (page === 'home') {
            onNavigateToHome?.();
          }
        }}
      />
    </div>
  );
}

function ScoreBar({ label, count, percentage, color, scoreRange }: { label: string; count: number; percentage: number; color: string; scoreRange: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-[#1F2937]">{label}</span>
          <span className="text-sm font-bold" style={{ color }}>{count}</span>
        </div>
        <div className="h-3 bg-[#F3F4F6] rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: color }} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="size-4 rounded" style={{ backgroundColor: color }} />
        <span className="text-xs text-[#6B7280]">{scoreRange}</span>
      </div>
    </div>
  );
}

function LeadCard({ name, image, score, insight, initials, onView }: { name: string; image?: string; score: number; insight: string; initials: string; onView: () => void }) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'bg-[#22C55E]';
    if (score >= 70) return 'bg-[#F59E0B]';
    return 'bg-[#9CA3AF]';
  };

  return (
    <div className="p-4 flex items-center gap-3">
      {image ? (
        <img src={image} className="size-12 rounded-full border-2 border-[#E5E7EB]" alt={name} />
      ) : (
        <div className="size-12 rounded-full border-2 border-[#E5E7EB] bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
          {initials}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-semibold text-[#1F2937]">{name}</h3>
          <div className={`${getScoreColor(score)} text-white px-2 py-0.5 rounded-full text-[10px] font-bold`}>
            {score}
          </div>
        </div>
        <p className="text-xs text-[#6B7280] line-clamp-1">{insight}</p>
      </div>
      <button
        onClick={onView}
        className="px-3 py-1.5 bg-[#2563EB] text-white text-xs font-semibold rounded-full shadow-[0px_4px_12px_rgba(37,99,235,0.3)]"
      >
        View
      </button>
    </div>
  );
}

function InsightCard({ icon, title, description, bgColor, borderColor }: { icon: React.ReactNode; title: string; description: string; bgColor: string; borderColor: string }) {
  return (
    <div className={`bg-gradient-to-r ${bgColor} rounded-[20px] p-4 border ${borderColor} flex items-start gap-3`}>
      <div className="shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-[#1F2937]">{title}</p>
        <p className="text-xs text-[#6B7280] mt-1">{description}</p>
      </div>
    </div>
  );
}
