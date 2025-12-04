import { Brain, Sparkles, Zap, AlertTriangle, TrendingUp, Activity } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface AIStats {
  totalTokens: number;
  aiRequests: number;
  successRate: number;
  errors: number;
  tokenTrend: number[];
}

interface FeatureUsage {
  feature: string;
  usage: number;
  requests: number;
  color: string;
}

export default function AIAnalytics() {
  const [stats, setStats] = useState<AIStats>({
    totalTokens: 0,
    aiRequests: 0,
    successRate: 0,
    errors: 0,
    tokenTrend: [0, 0, 0, 0, 0, 0, 0],
  });
  const [featureUsage, setFeatureUsage] = useState<FeatureUsage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAIAnalytics();
  }, []);

  const loadAIAnalytics = async () => {
    try {
      const { data: events } = await supabase
        .from('analytics_events')
        .select('event_name, event_properties, created_at')
        .or('event_name.eq.ai_scan_completed,event_name.eq.ai_message_generated,event_name.eq.ai_pitch_deck_generated,event_name.eq.ai_sequence_created')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (events) {
        const totalRequests = events.length;
        const last7Days = Array(7).fill(0);

        events.forEach((event) => {
          const dayIndex = Math.floor((Date.now() - new Date(event.created_at).getTime()) / (24 * 60 * 60 * 1000));
          if (dayIndex < 7) {
            last7Days[6 - dayIndex] += 1;
          }
        });

        const featureMap = new Map<string, { requests: number; color: string }>();
        events.forEach((event) => {
          const feature = event.event_name.replace('ai_', '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
          if (!featureMap.has(feature)) {
            featureMap.set(feature, { requests: 0, color: getFeatureColor(event.event_name) });
          }
          featureMap.get(feature)!.requests += 1;
        });

        const features: FeatureUsage[] = Array.from(featureMap.entries()).map(([feature, data]) => ({
          feature,
          usage: Math.round((data.requests / totalRequests) * 100),
          requests: data.requests,
          color: data.color,
        }));

        setStats({
          totalTokens: totalRequests * 850,
          aiRequests: totalRequests,
          successRate: 98.7,
          errors: Math.round(totalRequests * 0.013),
          tokenTrend: last7Days.map(count => count * 850),
        });
        setFeatureUsage(features);
      }
    } catch (error) {
      console.error('Error loading AI analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFeatureColor = (eventName: string): string => {
    if (eventName.includes('scan')) return 'purple';
    if (eventName.includes('message')) return 'blue';
    if (eventName.includes('pitch')) return 'green';
    return 'orange';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg font-semibold text-[#666]">Loading AI analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <AIMetricCard title="Total Tokens Used" value={formatNumber(stats.totalTokens)} change="+22.4%" icon={Brain} color="purple" />
        <AIMetricCard title="AI Requests" value={formatNumber(stats.aiRequests)} change="+18.2%" icon={Sparkles} color="blue" />
        <AIMetricCard title="Success Rate" value={`${stats.successRate}%`} change="+0.3%" icon={TrendingUp} color="green" />
        <AIMetricCard title="Errors" value={stats.errors.toString()} change="-12.5%" icon={AlertTriangle} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-[24px] p-6 border border-[#E6E8EB] shadow-sm">
          <h3 className="text-lg font-bold text-[#1A1A1A] mb-6">Feature Usage Distribution</h3>
          <div className="space-y-4">
            {featureUsage.length > 0 ? (
              featureUsage.map((feature, i) => (
                <FeatureUsageBar key={i} feature={feature.feature} usage={feature.usage} requests={feature.requests} color={feature.color} />
              ))
            ) : (
              <p className="text-sm text-[#666]">No AI feature usage data available</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6 border border-[#E6E8EB] shadow-sm">
          <h3 className="text-lg font-bold text-[#1A1A1A] mb-6">Token Usage Trend</h3>
          <div className="h-64 flex items-end justify-between gap-2">
            {stats.tokenTrend.map((value, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="text-xs font-bold text-purple-600 mb-1">{formatNumber(value)}</div>
                <div
                  className="w-full bg-gradient-to-t from-purple-500 to-purple-400 rounded-t-lg"
                  style={{ height: `${Math.max((value / Math.max(...stats.tokenTrend, 1)) * 100, 5)}%` }}
                />
                <span className="text-xs text-[#666] font-medium">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[24px] p-6 border border-[#E6E8EB] shadow-sm">
        <h3 className="text-lg font-bold text-[#1A1A1A] mb-6">Model Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ModelCard
            name="GPT-4"
            requests={5234}
            avgLatency="1.2s"
            cost="$234.50"
            status="healthy"
          />
          <ModelCard
            name="GPT-3.5 Turbo"
            requests={3308}
            avgLatency="0.8s"
            cost="$89.30"
            status="healthy"
          />
          <ModelCard
            name="Claude 3"
            requests={0}
            avgLatency="N/A"
            cost="$0.00"
            status="inactive"
          />
        </div>
      </div>

      <div className="bg-white rounded-[24px] p-6 border border-[#E6E8EB] shadow-sm">
        <h3 className="text-lg font-bold text-[#1A1A1A] mb-6">Recent AI Errors</h3>
        <div className="space-y-3">
          {[
            { feature: 'Deep Scan', error: 'Rate limit exceeded', user: 'john@example.com', time: '5 mins ago' },
            { feature: 'Message AI', error: 'Timeout after 30s', user: 'sarah@example.com', time: '12 mins ago' },
            { feature: 'Pitch Deck', error: 'Invalid template', user: 'mike@example.com', time: '23 mins ago' },
          ].map((error, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-red-50 rounded-[16px] border border-red-200">
              <div className="flex items-center gap-3">
                <AlertTriangle className="size-5 text-red-600" />
                <div>
                  <p className="font-semibold text-sm text-[#1A1A1A]">{error.feature}</p>
                  <p className="text-xs text-[#666]">{error.error} • {error.user}</p>
                </div>
              </div>
              <span className="text-xs text-[#666]">{error.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function AIMetricCard({ title, value, change, icon: Icon, color }: any) {
  const isPositive = !change.startsWith('-');
  return (
    <div className="bg-white rounded-[24px] p-6 border border-[#E6E8EB] shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={`size-12 rounded-[16px] bg-${color}-100 flex items-center justify-center`}>
          <Icon className={`size-6 text-${color}-600`} />
        </div>
        <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${isPositive ? 'bg-green-100' : 'bg-red-100'}`}>
          <span className={`text-xs font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>{change}</span>
        </div>
      </div>
      <h3 className="text-sm font-medium text-[#666] mb-1">{title}</h3>
      <p className="text-3xl font-bold text-[#1A1A1A]">{value}</p>
    </div>
  );
}

function FeatureUsageBar({ feature, usage, requests, color }: any) {
  const colorClasses = {
    purple: 'bg-purple-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-[#1A1A1A]">{feature}</span>
        <span className="text-sm font-bold text-[#1877F2]">{requests.toLocaleString()} requests</span>
      </div>
      <div className="w-full bg-[#F4F6F8] rounded-full h-2">
        <div
          className={`${colorClasses[color]} h-2 rounded-full`}
          style={{ width: `${usage}%` }}
        />
      </div>
    </div>
  );
}

function ModelCard({ name, requests, avgLatency, cost, status }: any) {
  return (
    <div className="bg-[#F4F6F8] rounded-[16px] p-4 border border-[#E6E8EB]">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-bold text-[#1A1A1A]">{name}</h4>
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
          status === 'healthy' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
        }`}>
          {status}
        </span>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-[#666]">Requests</span>
          <span className="font-semibold text-[#1A1A1A]">{requests.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#666]">Avg Latency</span>
          <span className="font-semibold text-[#1A1A1A]">{avgLatency}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#666]">Cost</span>
          <span className="font-semibold text-green-600">{cost}</span>
        </div>
      </div>
    </div>
  );
}
