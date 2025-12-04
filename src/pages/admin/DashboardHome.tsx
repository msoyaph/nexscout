import { useState, useEffect } from 'react';
import {
  Users, TrendingUp, DollarSign, Sparkles, UserPlus, UserMinus,
  CreditCard, Coins, Target, AlertCircle, CheckCircle, Clock,
  Activity, ArrowUp, ArrowDown
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface DashboardStats {
  totalUsers: number;
  newUsersToday: number;
  activeUsers: number;
  churnRate: number;
  paidUsers: number;
  freeUsers: number;
  mrr: number;
  arr: number;
  aiTokensToday: number;
  coinsGenerated: number;
  coinsSpent: number;
  activeMissions: number;
}

interface ActivityItem {
  type: string;
  user?: string;
  company?: string;
  plan?: string;
  feature?: string;
  mission?: string;
  action?: string;
  time: string;
  icon: any;
  color: string;
}

export default function DashboardHome() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    newUsersToday: 0,
    activeUsers: 0,
    churnRate: 0,
    paidUsers: 0,
    freeUsers: 0,
    mrr: 0,
    arr: 0,
    aiTokensToday: 0,
    coinsGenerated: 0,
    coinsSpent: 0,
    activeMissions: 0
  });

  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscriptionBreakdown, setSubscriptionBreakdown] = useState({
    free: 0,
    pro: 0,
    elite: 0,
    team: 0,
    enterprise: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadUserStats(),
        loadFinancialStats(),
        loadCoinStats(),
        loadRecentActivity(),
        loadSubscriptionBreakdown()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    // Total users
    const { count: totalCount } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });

    // New users today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: newToday } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    // Paid vs Free users
    const { count: paidCount } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .neq('subscription_tier', 'free')
      .not('subscription_tier', 'is', null);

    // Active users (logged in last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const { count: activeCount } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .gte('last_active_date', yesterday.toISOString());

    setStats(prev => ({
      ...prev,
      totalUsers: totalCount || 0,
      newUsersToday: newToday || 0,
      activeUsers: activeCount || 0,
      paidUsers: paidCount || 0,
      freeUsers: (totalCount || 0) - (paidCount || 0)
    }));
  };

  const loadFinancialStats = async () => {
    // Get daily summary for today
    const today = new Date().toISOString().split('T')[0];
    const { data: summary } = await supabase
      .from('analytics_daily_summary')
      .select('revenue_php')
      .eq('date', today)
      .single();

    // Calculate MRR from active subscriptions
    const { data: subscriptions } = await supabase
      .from('user_subscriptions')
      .select('monthly_price_php')
      .eq('status', 'active');

    const mrr = subscriptions?.reduce((sum, sub) => sum + (sub.monthly_price_php || 0), 0) || 0;
    const arr = mrr * 12;

    setStats(prev => ({
      ...prev,
      mrr,
      arr,
      aiTokensToday: summary?.revenue_php || 0
    }));
  };

  const loadCoinStats = async () => {
    // Total coins generated (sum of all user balances + spent)
    const { data: coinData } = await supabase
      .from('coin_transactions')
      .select('amount, transaction_type');

    let generated = 0;
    let spent = 0;

    coinData?.forEach(tx => {
      if (tx.transaction_type === 'earn' || tx.transaction_type === 'purchase') {
        generated += Math.abs(tx.amount);
      } else if (tx.transaction_type === 'spend') {
        spent += Math.abs(tx.amount);
      }
    });

    // Active missions
    const { count: missionsCount } = await supabase
      .from('missions')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    setStats(prev => ({
      ...prev,
      coinsGenerated: generated,
      coinsSpent: spent,
      activeMissions: missionsCount || 0
    }));
  };

  const loadRecentActivity = async () => {
    const activities: ActivityItem[] = [];

    // Recent signups
    const { data: newUsers } = await supabase
      .from('user_profiles')
      .select('full_name, created_at')
      .order('created_at', { ascending: false })
      .limit(2);

    newUsers?.forEach(user => {
      activities.push({
        type: 'signup',
        user: user.full_name || 'New User',
        time: getTimeAgo(user.created_at),
        icon: UserPlus,
        color: 'blue'
      });
    });

    // Recent subscription events
    const { data: subEvents } = await supabase
      .from('subscription_events')
      .select('event_type, to_tier, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(3);

    for (const event of subEvents || []) {
      const { data: user } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('id', event.user_id)
        .single();

      if (event.event_type === 'upgraded') {
        activities.push({
          type: 'upgrade',
          user: user?.full_name || 'User',
          plan: `${event.to_tier} Plan`,
          time: getTimeAgo(event.created_at),
          icon: TrendingUp,
          color: 'green'
        });
      }
    }

    // Sort by time and take top 5
    setRecentActivity(activities.slice(0, 5));
  };

  const loadSubscriptionBreakdown = async () => {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('subscription_tier');

    const breakdown = {
      free: 0,
      pro: 0,
      elite: 0,
      team: 0,
      enterprise: 0
    };

    profiles?.forEach(profile => {
      const tier = (profile.subscription_tier || 'free').toLowerCase();
      if (tier in breakdown) {
        breakdown[tier as keyof typeof breakdown]++;
      }
    });

    setSubscriptionBreakdown(breakdown);
  };

  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1877F2]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          change="+12.5%"
          trend="up"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Active Paid Users"
          value={stats.paidUsers.toLocaleString()}
          change="+8.3%"
          trend="up"
          icon={CreditCard}
          color="green"
        />
        <StatCard
          title="Monthly Recurring Revenue"
          value={`₱${(stats.mrr / 1000).toFixed(0)}K`}
          change="+15.2%"
          trend="up"
          icon={DollarSign}
          color="purple"
        />
        <StatCard
          title="New Users Today"
          value={stats.newUsersToday.toString()}
          change="+22.4%"
          trend="up"
          icon={Sparkles}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-[24px] p-6 border border-[#E6E8EB] shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-[#1A1A1A]">User Growth</h3>
            <select className="px-4 py-2 bg-[#F4F6F8] border border-[#E6E8EB] rounded-xl text-sm font-semibold text-gray-700">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>Last 90 Days</option>
            </select>
          </div>
          <div className="h-64 flex items-end justify-between gap-2">
            {[45, 52, 61, 58, 72, 68, 85].map((height, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-gradient-to-t from-[#1877F2] to-[#42A5F5] rounded-t-lg transition-all hover:opacity-80"
                  style={{ height: `${height}%` }}
                />
                <span className="text-xs text-[#666] font-medium">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6 border border-[#E6E8EB] shadow-sm">
          <h3 className="text-lg font-bold text-[#1A1A1A] mb-6">Subscription Distribution</h3>
          <div className="space-y-4">
            <SubscriptionBar label="Free" count={subscriptionBreakdown.free} total={stats.totalUsers} color="gray" />
            <SubscriptionBar label="Pro" count={subscriptionBreakdown.pro} total={stats.totalUsers} color="blue" />
            <SubscriptionBar label="Elite" count={subscriptionBreakdown.elite} total={stats.totalUsers} color="purple" />
            <SubscriptionBar label="Team" count={subscriptionBreakdown.team} total={stats.totalUsers} color="green" />
            <SubscriptionBar label="Enterprise" count={subscriptionBreakdown.enterprise} total={stats.totalUsers} color="orange" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-[24px] p-6 border border-[#E6E8EB] shadow-sm">
          <h3 className="text-lg font-bold text-[#1A1A1A] mb-6">Coin Economy</h3>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 rounded-[16px] p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Coins className="size-5 text-blue-600" />
                <span className="text-xs font-semibold text-blue-600">Generated</span>
              </div>
              <p className="text-2xl font-bold text-blue-700">{stats.coinsGenerated.toLocaleString()}</p>
            </div>
            <div className="bg-green-50 rounded-[16px] p-4 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Target className="size-5 text-green-600" />
                <span className="text-xs font-semibold text-green-600">Spent</span>
              </div>
              <p className="text-2xl font-bold text-green-700">{stats.coinsSpent.toLocaleString()}</p>
            </div>
          </div>
          <div className="bg-[#F4F6F8] rounded-[16px] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-[#666]">Active Balance</span>
              <span className="text-lg font-bold text-[#1A1A1A]">
                {(stats.coinsGenerated - stats.coinsSpent).toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-white rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
                style={{ width: `${stats.coinsGenerated > 0 ? (stats.coinsSpent / stats.coinsGenerated) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6 border border-[#E6E8EB] shadow-sm">
          <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">Key Metrics</h3>
          <div className="space-y-4">
            <MetricRow label="Active Users (24h)" value={stats.activeUsers} total={stats.totalUsers} color="green" />
            <MetricRow label="Active Missions" value={stats.activeMissions} total={100} color="blue" />
            <MetricRow label="Free Users" value={stats.freeUsers} total={stats.totalUsers} color="gray" />
            <MetricRow label="MRR" value={`₱${(stats.mrr / 1000).toFixed(0)}K`} total={0} color="purple" showProgress={false} />
          </div>
        </div>
      </div>

      {recentActivity.length > 0 && (
        <div className="bg-white rounded-[24px] p-6 border border-[#E6E8EB] shadow-sm">
          <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">Real-time Activity Feed</h3>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 bg-[#F4F6F8] rounded-[16px] hover:bg-[#E6E8EB] transition-colors"
              >
                <div className={`size-10 rounded-full bg-${activity.color}-100 flex items-center justify-center`}>
                  <activity.icon className={`size-5 text-${activity.color}-600`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#1A1A1A]">
                    {activity.user || activity.company}
                    {activity.plan && <span className="text-[#666]"> upgraded to {activity.plan}</span>}
                    {activity.feature && <span className="text-[#666]"> used {activity.feature}</span>}
                    {activity.mission && <span className="text-[#666]"> completed {activity.mission}</span>}
                    {activity.action && <span className="text-[#666]"> - {activity.action}</span>}
                  </p>
                  <p className="text-xs text-[#666] mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, change, trend, icon: Icon, color }: any) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
  };

  return (
    <div className="bg-white rounded-[24px] p-6 border border-[#E6E8EB] shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={`size-12 rounded-[16px] bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="size-6 text-white" />
        </div>
        <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${trend === 'up' ? 'bg-green-100' : 'bg-red-100'}`}>
          {trend === 'up' ? <ArrowUp className="size-3 text-green-600" /> : <ArrowDown className="size-3 text-red-600" />}
          <span className={`text-xs font-bold ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>{change}</span>
        </div>
      </div>
      <h3 className="text-sm font-medium text-[#666] mb-1">{title}</h3>
      <p className="text-3xl font-bold text-[#1A1A1A]">{value}</p>
    </div>
  );
}

function SubscriptionBar({ label, count, total, color }: any) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  const colorClasses = {
    gray: 'bg-gray-400',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-[#1A1A1A]">{label}</span>
        <span className="text-sm font-bold text-[#666]">{count}</span>
      </div>
      <div className="w-full bg-[#F4F6F8] rounded-full h-2">
        <div
          className={`${colorClasses[color]} h-2 rounded-full transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function MetricRow({ label, value, total, color, showProgress = true }: any) {
  const percentage = typeof value === 'number' && total > 0 ? (value / total) * 100 : 0;
  const colorClasses = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    gray: 'bg-gray-400',
    purple: 'bg-purple-500',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-[#1A1A1A]">{label}</span>
        <span className="text-sm font-bold text-[#1877F2]">{typeof value === 'number' ? value.toLocaleString() : value}</span>
      </div>
      {showProgress && (
        <div className="w-full bg-[#F4F6F8] rounded-full h-2">
          <div
            className={`${colorClasses[color]} h-2 rounded-full transition-all`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}
