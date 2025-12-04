import { useState, useEffect } from 'react';
import { Search, Filter, UserPlus, MoreVertical, Eye, Ban, Gift, TrendingUp, Edit, Trash2, Mail, Phone, Calendar, Coins as CoinsIcon, Crown } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface User {
  id: string;
  email: string;
  full_name: string;
  country: string;
  subscription_tier: string;
  coins_balance: number;
  status: string;
  created_at: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data: profiles, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setUsers(profiles || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = filterTier === 'all' || user.subscription_tier === filterTier;
    return matchesSearch && matchesTier;
  });

  const getTierBadge = (tier: string) => {
    const badges = {
      free: { label: 'Free', color: 'bg-gray-100 text-gray-700' },
      pro: { label: 'Pro', color: 'bg-blue-100 text-blue-700' },
      elite: { label: 'Elite', color: 'bg-purple-100 text-purple-700' },
      team: { label: 'Team', color: 'bg-green-100 text-green-700' },
      enterprise: { label: 'Enterprise', color: 'bg-orange-100 text-orange-700' },
    };
    const badge = badges[tier?.toLowerCase()] || badges.free;
    return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.color}`}>{badge.label}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-[24px] p-6 border border-[#E6E8EB] shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="size-10 rounded-[16px] bg-blue-100 flex items-center justify-center">
              <UserPlus className="size-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-[#666]">Total Users</p>
              <p className="text-2xl font-bold text-[#1A1A1A]">{users.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-[24px] p-6 border border-[#E6E8EB] shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="size-10 rounded-[16px] bg-green-100 flex items-center justify-center">
              <Crown className="size-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-[#666]">Paid Users</p>
              <p className="text-2xl font-bold text-[#1A1A1A]">
                {users.filter(u => u.subscription_tier && u.subscription_tier !== 'free').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-[24px] p-6 border border-[#E6E8EB] shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="size-10 rounded-[16px] bg-purple-100 flex items-center justify-center">
              <CoinsIcon className="size-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-[#666]">Total Coins</p>
              <p className="text-2xl font-bold text-[#1A1A1A]">
                {users.reduce((sum, u) => sum + (u.coins_balance || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-[24px] p-6 border border-[#E6E8EB] shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="size-10 rounded-[16px] bg-orange-100 flex items-center justify-center">
              <TrendingUp className="size-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-[#666]">Active Today</p>
              <p className="text-2xl font-bold text-[#1A1A1A]">892</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[24px] p-6 border border-[#E6E8EB] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-[#1A1A1A]">User Database</h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-[#F4F6F8] border border-[#E6E8EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
              />
            </div>
            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value)}
              className="px-4 py-2 bg-[#F4F6F8] border border-[#E6E8EB] rounded-xl text-sm font-semibold text-gray-700"
            >
              <option value="all">All Tiers</option>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="elite">Elite</option>
              <option value="team">Team</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1877F2]"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E6E8EB]">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-[#666] uppercase">User</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-[#666] uppercase">Email</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-[#666] uppercase">Country</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-[#666] uppercase">Tier</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-[#666] uppercase">Coins</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-[#666] uppercase">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-[#666] uppercase">Joined</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-[#666] uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-[#E6E8EB] hover:bg-[#F4F6F8] transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                          {user.full_name?.charAt(0) || 'U'}
                        </div>
                        <span className="font-semibold text-sm text-[#1A1A1A]">{user.full_name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-[#666]">{user.email}</td>
                    <td className="py-4 px-4 text-sm text-[#666]">{user.country || 'N/A'}</td>
                    <td className="py-4 px-4">{getTierBadge(user.subscription_tier)}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1">
                        <CoinsIcon className="size-4 text-yellow-500" />
                        <span className="text-sm font-semibold text-[#1A1A1A]">{user.coins_balance || 0}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {user.status || 'active'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-[#666]">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="size-4 text-blue-600" />
                        </button>
                        <button
                          className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                          title="Add Coins"
                        >
                          <Gift className="size-4 text-green-600" />
                        </button>
                        <button
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Ban User"
                        >
                          <Ban className="size-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedUser && (
        <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
    </div>
  );
}

function UserDetailModal({ user, onClose }: { user: User; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[24px] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#E6E8EB]">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-[#1A1A1A]">User Details</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <MoreVertical className="size-5" />
            </button>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="size-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-2xl">
              {user.full_name?.charAt(0) || 'U'}
            </div>
            <div>
              <h4 className="text-lg font-bold text-[#1A1A1A]">{user.full_name}</h4>
              <p className="text-sm text-[#666]">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InfoCard icon={Calendar} label="Joined" value={new Date(user.created_at).toLocaleDateString()} />
            <InfoCard icon={CoinsIcon} label="Coins Balance" value={user.coins_balance?.toString() || '0'} />
            <InfoCard icon={Crown} label="Subscription" value={user.subscription_tier || 'Free'} />
            <InfoCard icon={Mail} label="Country" value={user.country || 'N/A'} />
          </div>

          <div className="flex gap-3">
            <button className="flex-1 px-4 py-3 bg-[#1877F2] text-white rounded-xl font-semibold hover:bg-[#166FE5] transition-colors">
              Reset Account
            </button>
            <button className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors">
              Add Coins
            </button>
            <button className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors">
              Ban User
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value }: any) {
  return (
    <div className="bg-[#F4F6F8] rounded-[16px] p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="size-4 text-[#666]" />
        <span className="text-xs font-semibold text-[#666]">{label}</span>
      </div>
      <p className="text-lg font-bold text-[#1A1A1A]">{value}</p>
    </div>
  );
}
