import { CreditCard, TrendingUp, Users, DollarSign, ArrowUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface SubscriptionData {
  user: string;
  email: string;
  tier: string;
  status: string;
  amount: number;
  renewal: string;
}

interface SubStats {
  activeSubscriptions: number;
  mrr: number;
  churnRate: number;
  trialUsers: number;
}

export default function SubscriptionManagement() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
  const [stats, setStats] = useState<SubStats>({
    activeSubscriptions: 0,
    mrr: 0,
    churnRate: 0,
    trialUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      const { data: activeSubs } = await supabase
        .from('user_subscriptions')
        .select(`
          user_id,
          subscription_tier,
          status,
          price_php,
          current_period_end,
          user_profiles!inner(full_name, email)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(50);

      const { count: totalActive } = await supabase
        .from('user_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      const { count: trialCount } = await supabase
        .from('user_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'trial');

      const { count: cancelledCount } = await supabase
        .from('subscription_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'cancelled')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (activeSubs) {
        const mrr = activeSubs.reduce((sum, sub) => sum + (sub.price_php || 0), 0);
        const churnRate = ((cancelledCount || 0) / Math.max(totalActive || 1, 1)) * 100;

        const formattedSubs: SubscriptionData[] = activeSubs.map((sub: any) => ({
          user: sub.user_profiles?.full_name || 'Unknown User',
          email: sub.user_profiles?.email || 'N/A',
          tier: sub.subscription_tier.charAt(0).toUpperCase() + sub.subscription_tier.slice(1),
          status: 'Active',
          amount: sub.price_php || 0,
          renewal: new Date(sub.current_period_end).toLocaleDateString(),
        }));

        setSubscriptions(formattedSubs);
        setStats({
          activeSubscriptions: totalActive || 0,
          mrr,
          churnRate,
          trialUsers: trialCount || 0,
        });
      }
    } catch (error) {
      console.error('Error loading subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg font-semibold text-[#666]">Loading subscription data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Active Subscriptions" value={stats.activeSubscriptions.toString()} change="+12%" icon={CreditCard} color="blue" />
        <StatCard title="MRR" value={`₱${(stats.mrr / 1000).toFixed(0)}K`} change="+15%" icon={DollarSign} color="green" />
        <StatCard title="Churn Rate" value={`${stats.churnRate.toFixed(1)}%`} change="-0.5%" icon={TrendingUp} color="purple" />
        <StatCard title="Trial Users" value={stats.trialUsers.toString()} change="+23%" icon={Users} color="orange" />
      </div>

      <div className="bg-white rounded-[24px] p-6 border border-[#E6E8EB] shadow-sm">
        <h3 className="text-lg font-bold text-[#1A1A1A] mb-6">Active Subscriptions</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E6E8EB]">
                <th className="text-left py-3 px-4 text-xs font-semibold text-[#666] uppercase">User</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[#666] uppercase">Email</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[#666] uppercase">Tier</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[#666] uppercase">Status</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[#666] uppercase">Amount</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[#666] uppercase">Renewal</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-[#666] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.length > 0 ? subscriptions.map((sub, index) => (
                <tr key={index} className="border-b border-[#E6E8EB] hover:bg-[#F4F6F8]">
                  <td className="py-4 px-4 font-semibold text-sm">{sub.user}</td>
                  <td className="py-4 px-4 text-sm text-[#666]">{sub.email}</td>
                  <td className="py-4 px-4">
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                      {sub.tier}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                      {sub.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-semibold">₱{sub.amount}</td>
                  <td className="py-4 px-4 text-sm text-[#666]">{sub.renewal}</td>
                  <td className="py-4 px-4 text-right">
                    <button className="px-4 py-2 bg-[#1877F2] text-white rounded-lg text-xs font-semibold hover:bg-[#166FE5]">
                      Manage
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sm text-[#666]">
                    No active subscriptions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, icon: Icon, color }: any) {
  return (
    <div className="bg-white rounded-[24px] p-6 border border-[#E6E8EB] shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={`size-12 rounded-[16px] bg-${color}-100 flex items-center justify-center`}>
          <Icon className={`size-6 text-${color}-600`} />
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
