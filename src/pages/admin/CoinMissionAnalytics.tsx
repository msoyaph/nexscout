import { Coins, Target, TrendingUp, Users, ArrowUp, Gift, Award } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface CoinStats {
  totalGenerated: number;
  totalSpent: number;
  activeMissions: number;
  participants: number;
}

interface CoinSource {
  label: string;
  coins: number;
  color: string;
}

interface MissionData {
  name: string;
  participants: number;
  completions: number;
  reward: number;
}

export default function CoinMissionAnalytics() {
  const [stats, setStats] = useState<CoinStats>({
    totalGenerated: 0,
    totalSpent: 0,
    activeMissions: 0,
    participants: 0,
  });
  const [coinSources, setCoinSources] = useState<CoinSource[]>([]);
  const [coinUsage, setCoinUsage] = useState<CoinSource[]>([]);
  const [missions, setMissions] = useState<MissionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCoinMissionData();
  }, []);

  const loadCoinMissionData = async () => {
    try {
      const { data: transactions } = await supabase
        .from('coin_transactions')
        .select('amount, transaction_type, description, created_at')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const { data: missionsData } = await supabase
        .from('missions')
        .select('title, description, coin_reward, completed_count, total_users_with_mission')
        .eq('status', 'active');

      const { data: userProfiles } = await supabase
        .from('user_profiles')
        .select('coins_balance')
        .gt('coins_balance', 0);

      if (transactions) {
        const earned = transactions
          .filter(t => t.transaction_type === 'earned' || t.transaction_type === 'reward')
          .reduce((sum, t) => sum + t.amount, 0);

        const spent = transactions
          .filter(t => t.transaction_type === 'spent')
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        const sourceMap = new Map<string, number>();
        transactions
          .filter(t => t.transaction_type === 'earned' || t.transaction_type === 'reward')
          .forEach(t => {
            const source = getSourceFromDescription(t.description);
            sourceMap.set(source, (sourceMap.get(source) || 0) + t.amount);
          });

        const sources: CoinSource[] = Array.from(sourceMap.entries()).map(([label, coins]) => ({
          label,
          coins,
          color: getSourceColor(label),
        }));

        const usageMap = new Map<string, number>();
        transactions
          .filter(t => t.transaction_type === 'spent')
          .forEach(t => {
            const usage = getUsageFromDescription(t.description);
            usageMap.set(usage, (usageMap.get(usage) || 0) + Math.abs(t.amount));
          });

        const usage: CoinSource[] = Array.from(usageMap.entries()).map(([label, coins]) => ({
          label,
          coins,
          color: getUsageColor(label),
        }));

        const missionsList: MissionData[] = missionsData?.map(m => ({
          name: m.title,
          participants: m.total_users_with_mission || 0,
          completions: m.completed_count || 0,
          reward: m.coin_reward,
        })) || [];

        setStats({
          totalGenerated: earned,
          totalSpent: spent,
          activeMissions: missionsData?.length || 0,
          participants: userProfiles?.length || 0,
        });
        setCoinSources(sources);
        setCoinUsage(usage);
        setMissions(missionsList);
      }
    } catch (error) {
      console.error('Error loading coin/mission data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSourceFromDescription = (desc: string): string => {
    if (desc.includes('login')) return 'Daily Login';
    if (desc.includes('mission') || desc.includes('task')) return 'Mission Completion';
    if (desc.includes('purchase')) return 'Purchases';
    if (desc.includes('referral')) return 'Referrals';
    return 'Other';
  };

  const getUsageFromDescription = (desc: string): string => {
    if (desc.includes('unlock') || desc.includes('prospect')) return 'Unlock Prospects';
    if (desc.includes('AI') || desc.includes('scan')) return 'AI Features';
    if (desc.includes('template')) return 'Premium Templates';
    return 'Other';
  };

  const getSourceColor = (label: string): string => {
    if (label === 'Daily Login') return 'blue';
    if (label === 'Mission Completion') return 'green';
    if (label === 'Purchases') return 'purple';
    if (label === 'Referrals') return 'orange';
    return 'gray';
  };

  const getUsageColor = (label: string): string => {
    if (label === 'Unlock Prospects') return 'blue';
    if (label === 'AI Features') return 'purple';
    if (label === 'Premium Templates') return 'green';
    return 'gray';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg font-semibold text-[#666]">Loading coin & mission analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <CoinMetricCard title="Total Coins Generated" value={stats.totalGenerated.toLocaleString()} change="+18.7%" icon={Coins} color="yellow" />
        <CoinMetricCard title="Coins Spent" value={stats.totalSpent.toLocaleString()} change="+22.3%" icon={TrendingUp} color="green" />
        <CoinMetricCard title="Active Missions" value={stats.activeMissions.toString()} change="+5" icon={Target} color="blue" />
        <CoinMetricCard title="Participants" value={stats.participants.toLocaleString()} change="+12.5%" icon={Users} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-[24px] p-6 border border-[#E6E8EB] shadow-sm">
          <h3 className="text-lg font-bold text-[#1A1A1A] mb-6">Coin Generation Sources</h3>
          <div className="space-y-4">
            {coinSources.length > 0 ? (
              coinSources.map((source, i) => (
                <SourceBar key={i} label={source.label} coins={source.coins} total={stats.totalGenerated} color={source.color} />
              ))
            ) : (
              <p className="text-sm text-[#666]">No coin generation data available</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6 border border-[#E6E8EB] shadow-sm">
          <h3 className="text-lg font-bold text-[#1A1A1A] mb-6">Coin Usage Breakdown</h3>
          <div className="space-y-4">
            {coinUsage.length > 0 ? (
              coinUsage.map((usage, i) => (
                <UsageBar key={i} label={usage.label} coins={usage.coins} total={stats.totalSpent} color={usage.color} />
              ))
            ) : (
              <p className="text-sm text-[#666]">No coin usage data available</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[24px] p-6 border border-[#E6E8EB] shadow-sm">
        <h3 className="text-lg font-bold text-[#1A1A1A] mb-6">Top Missions by Completion Rate</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {missions.length > 0 ? (
            missions.slice(0, 6).map((mission, i) => (
              <MissionCard key={i} mission={mission} />
            ))
          ) : (
            <p className="text-sm text-[#666]">No mission data available</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[24px] p-6 border border-[#E6E8EB] shadow-sm">
        <h3 className="text-lg font-bold text-[#1A1A1A] mb-6">Recent Coin Transactions</h3>
        <div className="space-y-3">
          {[
            { user: 'John Doe', type: 'Earned', amount: 50, reason: 'Daily Login', time: '2 mins ago' },
            { user: 'Sarah Chen', type: 'Spent', amount: -200, reason: 'Unlocked 2 Prospects', time: '15 mins ago' },
            { user: 'Mike Rodriguez', type: 'Earned', amount: 200, reason: 'Weekly Active Mission', time: '1 hour ago' },
            { user: 'Emily Johnson', type: 'Purchased', amount: 500, reason: 'Coin Bundle', time: '2 hours ago' },
          ].map((tx, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-[#F4F6F8] rounded-[16px]">
              <div className="flex items-center gap-3">
                <div className={`size-10 rounded-full ${
                  tx.type === 'Earned' ? 'bg-green-100' : tx.type === 'Spent' ? 'bg-red-100' : 'bg-blue-100'
                } flex items-center justify-center`}>
                  <Coins className={`size-5 ${
                    tx.type === 'Earned' ? 'text-green-600' : tx.type === 'Spent' ? 'text-red-600' : 'text-blue-600'
                  }`} />
                </div>
                <div>
                  <p className="font-semibold text-sm text-[#1A1A1A]">{tx.user}</p>
                  <p className="text-xs text-[#666]">{tx.type} • {tx.reason}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount} coins
                </p>
                <p className="text-xs text-[#666]">{tx.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CoinMetricCard({ title, value, change, icon: Icon, color }: any) {
  const colorMap = {
    yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
    green: { bg: 'bg-green-100', text: 'text-green-600' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
  };
  const colors = colorMap[color];

  return (
    <div className="bg-white rounded-[24px] p-6 border border-[#E6E8EB] shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={`size-12 rounded-[16px] ${colors.bg} flex items-center justify-center`}>
          <Icon className={`size-6 ${colors.text}`} />
        </div>
        <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-100">
          <ArrowUp className="size-3 text-green-600" />
          <span className="text-xs font-bold text-green-600">{change}</span>
        </div>
      </div>
      <h3 className="text-sm font-medium text-[#666] mb-1">{title}</h3>
      <p className="text-3xl font-bold text-[#1A1A1A]">{value}</p>
    </div>
  );
}

function SourceBar({ label, coins, total, color }: any) {
  const percentage = (coins / total) * 100;
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-[#1A1A1A]">{label}</span>
        <span className="text-sm font-bold text-[#1877F2]">{coins.toLocaleString()}</span>
      </div>
      <div className="w-full bg-[#F4F6F8] rounded-full h-2">
        <div
          className={`${colorClasses[color]} h-2 rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function UsageBar({ label, coins, total, color }: any) {
  const percentage = (coins / total) * 100;
  const colorClasses = {
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    green: 'bg-green-500',
    gray: 'bg-gray-400',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-[#1A1A1A]">{label}</span>
        <span className="text-sm font-bold text-[#666]">{coins.toLocaleString()}</span>
      </div>
      <div className="w-full bg-[#F4F6F8] rounded-full h-2">
        <div
          className={`${colorClasses[color]} h-2 rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function MissionCard({ mission }: any) {
  const completionRate = ((mission.completions / mission.participants) * 100).toFixed(1);

  return (
    <div className="bg-[#F4F6F8] rounded-[16px] p-4 border border-[#E6E8EB]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Award className="size-5 text-[#1877F2]" />
          <h4 className="font-bold text-sm text-[#1A1A1A]">{mission.name}</h4>
        </div>
        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
          {completionRate}%
        </span>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-[#666]">Participants</span>
          <span className="font-semibold text-[#1A1A1A]">{mission.participants}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-[#666]">Completed</span>
          <span className="font-semibold text-[#1A1A1A]">{mission.completions}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-[#666]">Reward</span>
          <span className="font-semibold text-yellow-600">{mission.reward} coins</span>
        </div>
      </div>
    </div>
  );
}
