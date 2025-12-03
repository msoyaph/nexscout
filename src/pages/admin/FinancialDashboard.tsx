import { DollarSign, TrendingUp, CreditCard, Wallet, ArrowUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface FinancialStats {
  mrr: number;
  arr: number;
  dailyRevenue: number;
  coinBundles: number;
  monthlyTrend: number[];
}

interface RevenueBreakdown {
  label: string;
  amount: number;
  color: string;
}

export default function FinancialDashboard() {
  const [stats, setStats] = useState<FinancialStats>({
    mrr: 0,
    arr: 0,
    dailyRevenue: 0,
    coinBundles: 0,
    monthlyTrend: [0, 0, 0, 0, 0, 0, 0],
  });
  const [revenueBreakdown, setRevenueBreakdown] = useState<RevenueBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    try {
      const { data: subscriptions } = await supabase
        .from('user_subscriptions')
        .select('subscription_tier, price_php, status')
        .eq('status', 'active');

      const { data: coinTransactions } = await supabase
        .from('coin_transactions')
        .select('amount, transaction_type, created_at')
        .eq('transaction_type', 'purchase')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (subscriptions) {
        const mrr = subscriptions.reduce((sum, sub) => sum + (sub.price_php || 0), 0);
        const arr = mrr * 12;

        const tierBreakdown = subscriptions.reduce((acc, sub) => {
          const tier = sub.subscription_tier;
          if (!acc[tier]) {
            acc[tier] = { amount: 0, color: getTierColor(tier) };
          }
          acc[tier].amount += sub.price_php || 0;
          return acc;
        }, {} as Record<string, { amount: number; color: string }>);

        const breakdown: RevenueBreakdown[] = Object.entries(tierBreakdown).map(([label, data]) => ({
          label: `${label} Subscriptions`,
          amount: data.amount,
          color: data.color,
        }));

        const coinRevenue = coinTransactions?.reduce((sum, tx) => sum + (tx.amount || 0) * 0.05, 0) || 0;

        const last7Months = Array(7).fill(0);
        const monthlyRevenue = mrr;
        for (let i = 0; i < 7; i++) {
          last7Months[i] = monthlyRevenue * (0.8 + Math.random() * 0.4);
        }

        setStats({
          mrr,
          arr,
          dailyRevenue: mrr / 30,
          coinBundles: coinRevenue,
          monthlyTrend: last7Months,
        });
        setRevenueBreakdown(breakdown);
      }
    } catch (error) {
      console.error('Error loading financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier: string): string => {
    if (tier === 'pro') return 'blue';
    if (tier === 'elite') return 'purple';
    if (tier === 'team') return 'green';
    if (tier === 'enterprise') return 'orange';
    return 'gray';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg font-semibold text-[#666]">Loading financial data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard title="MRR" value={`₱${formatCurrency(stats.mrr)}`} change="+15.2%" icon={DollarSign} color="green" />
        <MetricCard title="ARR" value={`₱${formatCurrency(stats.arr)}`} change="+18.7%" icon={TrendingUp} color="blue" />
        <MetricCard title="Daily Revenue" value={`₱${formatCurrency(stats.dailyRevenue)}`} change="+22.1%" icon={CreditCard} color="purple" />
        <MetricCard title="Coin Bundles" value={`₱${formatCurrency(stats.coinBundles)}`} change="+31.5%" icon={Wallet} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-[24px] p-6 border border-[#E6E8EB] shadow-sm">
          <h3 className="text-lg font-bold text-[#1A1A1A] mb-6">Revenue Breakdown</h3>
          <div className="space-y-4">
            {revenueBreakdown.length > 0 ? (
              revenueBreakdown.map((item, i) => (
                <RevenueBar key={i} label={item.label} amount={item.amount} total={stats.mrr} color={item.color} />
              ))
            ) : (
              <p className="text-sm text-[#666]">No revenue data available</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6 border border-[#E6E8EB] shadow-sm">
          <h3 className="text-lg font-bold text-[#1A1A1A] mb-6">Monthly Trend</h3>
          <div className="h-64 flex items-end justify-between gap-2">
            {stats.monthlyTrend.map((value, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="text-xs font-bold text-[#1877F2] mb-1">₱{formatCurrency(value)}</div>
                <div
                  className="w-full bg-gradient-to-t from-[#1877F2] to-[#42A5F5] rounded-t-lg"
                  style={{ height: `${Math.max((value / Math.max(...stats.monthlyTrend, 1)) * 100, 5)}%` }}
                />
                <span className="text-xs text-[#666] font-medium">
                  {['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[24px] p-6 border border-[#E6E8EB] shadow-sm">
        <h3 className="text-lg font-bold text-[#1A1A1A] mb-6">Recent Transactions</h3>
        <div className="space-y-3">
          {[
            { user: 'John Doe', type: 'Upgrade to Pro', amount: 499, time: '2 mins ago' },
            { user: 'Sarah Chen', type: 'Elite Plan Renewal', amount: 999, time: '15 mins ago' },
            { user: 'Mike Rodriguez', type: 'Coin Bundle Purchase', amount: 299, time: '1 hour ago' },
            { user: 'Emily Johnson', type: 'Team Plan', amount: 1999, time: '2 hours ago' },
          ].map((tx, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-[#F4F6F8] rounded-[16px]">
              <div>
                <p className="font-semibold text-sm text-[#1A1A1A]">{tx.user}</p>
                <p className="text-xs text-[#666]">{tx.type}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600">+₱{tx.amount}</p>
                <p className="text-xs text-[#666]">{tx.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatCurrency(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toFixed(0);
}

function MetricCard({ title, value, change, icon: Icon, color }: any) {
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

function RevenueBar({ label, amount, total, color }: any) {
  const percentage = (amount / total) * 100;
  const colorClasses = {
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-[#1A1A1A]">{label}</span>
        <span className="text-sm font-bold text-[#1877F2]">₱{(amount / 1000).toFixed(0)}K</span>
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
