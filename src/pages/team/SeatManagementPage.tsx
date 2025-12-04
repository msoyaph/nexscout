import React, { useEffect, useState } from 'react';
import { ArrowLeft, Mail, UserPlus, Trash2, Users, AlertCircle } from 'lucide-react';
import {
  getTeamMembers,
  inviteTeamMember,
  removeTeamMember,
  updateMemberRole,
  getTeamStats,
  type TeamMember,
  type TeamStats,
} from '../../services/team/teamMembersService';
import { getTeamSubscription } from '../../services/team/teamBillingService';
import { useUser } from '../../hooks/useUser';

interface SeatManagementPageProps {
  onBack?: () => void;
}

export default function SeatManagementPage({ onBack }: SeatManagementPageProps) {
  const { user } = useUser();

  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [teamId, setTeamId] = useState<string>('');

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'agent' | 'closer' | 'leader' | 'manager' | 'co-owner'>('agent');
  const [inviting, setInviting] = useState(false);

  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [user.id]);

  async function loadData() {
    if (!user.id) return;

    setLoading(true);
    setError('');

    try {
      const [membersData, statsData, teamSub] = await Promise.all([
        getTeamMembers(user.id),
        getTeamStats(user.id),
        getTeamSubscription(user.id),
      ]);

      setMembers(membersData);
      setStats(statsData);
      setTeamId(teamSub?.id || '');
    } catch (err) {
      console.error('Error loading team members:', err);
      setError('Failed to load team members');
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite() {
    if (!inviteEmail || !teamId) return;

    setInviting(true);
    setError('');
    setSuccess('');

    try {
      const result = await inviteTeamMember(teamId, inviteEmail, inviteRole);

      if (result.success) {
        setSuccess(`Invitation sent to ${inviteEmail}`);
        setInviteEmail('');
        setInviteRole('agent');
        await loadData();
      } else {
        setError(result.error || 'Failed to send invitation');
      }
    } catch (err) {
      console.error('Error inviting member:', err);
      setError('An error occurred while sending the invitation');
    } finally {
      setInviting(false);
    }
  }

  async function handleRemove(memberId: string, email: string) {
    if (!confirm(`Are you sure you want to remove ${email} from the team?`)) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      const result = await removeTeamMember(memberId);

      if (result.success) {
        setSuccess(`${email} has been removed from the team`);
        await loadData();
      } else {
        setError(result.error || 'Failed to remove member');
      }
    } catch (err) {
      console.error('Error removing member:', err);
      setError('An error occurred while removing the member');
    }
  }

  async function handleRoleChange(memberId: string, newRole: string) {
    setError('');
    setSuccess('');

    try {
      const result = await updateMemberRole(
        memberId,
        newRole as 'agent' | 'closer' | 'leader' | 'manager' | 'co-owner'
      );

      if (result.success) {
        setSuccess('Role updated successfully');
        await loadData();
      } else {
        setError(result.error || 'Failed to update role');
      }
    } catch (err) {
      console.error('Error updating role:', err);
      setError('An error occurred while updating the role');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-600">Loading team members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] pb-24">
      {/* HEADER */}
      <div className="bg-white border-b shadow-sm p-4">
        {onBack && (
          <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2">
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
        )}
        <h1 className="text-xl font-semibold">Seat Management</h1>
        <p className="text-gray-500 text-sm leading-tight">
          Manage team members, roles, and invitations.
        </p>
      </div>

      {/* STATS CARD */}
      {stats && (
        <div className="max-w-4xl mx-auto p-4">
          <div className="bg-white rounded-xl shadow-sm p-4 border">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500">Total Members</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_members}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active_members}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending_invites}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Available Seats</p>
                <p className="text-2xl font-bold text-blue-600">{stats.seats_available}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MESSAGES */}
      {error && (
        <div className="max-w-4xl mx-auto px-4 mb-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-red-800">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="max-w-4xl mx-auto px-4 mb-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800">
            {success}
          </div>
        </div>
      )}

      {/* INVITE BOX */}
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <UserPlus className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Invite New Member</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Email address"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={inviting}
              />
            </div>

            <div className="flex gap-2">
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
                className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={inviting}
              >
                <option value="agent">Agent</option>
                <option value="closer">Closer</option>
                <option value="leader">Leader</option>
                <option value="manager">Manager</option>
                <option value="co-owner">Co-owner</option>
              </select>

              <button
                disabled={!inviteEmail || inviting || (stats?.seats_available || 0) <= 0}
                onClick={handleInvite}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {inviting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Invite
                  </>
                )}
              </button>
            </div>
          </div>

          {stats && stats.seats_available <= 0 && (
            <p className="text-xs text-red-600 mt-2">
              No available seats. Please add more seats in Team Billing before inviting new members.
            </p>
          )}
        </div>
      </div>

      {/* MEMBERS LIST */}
      <div className="max-w-4xl mx-auto px-4 space-y-3">
        {members.length === 0 ? (
          <div className="bg-white border rounded-xl p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No team members yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Invite your first team member using the form above
            </p>
          </div>
        ) : (
          members.map((member) => (
            <div
              key={member.id}
              className="bg-white border rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:justify-between md:items-center gap-3"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900">
                    {member.name || member.email}
                  </p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      member.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : member.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {member.status}
                  </span>
                </div>
                <p className="text-gray-600 text-sm">{member.email}</p>
                {member.status === 'pending' && (
                  <p className="text-xs text-gray-500 mt-1">
                    Invited {new Date(member.invited_at).toLocaleDateString()}
                  </p>
                )}
                {member.status === 'active' && member.joined_at && (
                  <p className="text-xs text-gray-500 mt-1">
                    Joined {new Date(member.joined_at).toLocaleDateString()}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* ROLE SELECT */}
                <select
                  value={member.role}
                  onChange={(e) => handleRoleChange(member.id, e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="agent">Agent</option>
                  <option value="closer">Closer</option>
                  <option value="leader">Leader</option>
                  <option value="manager">Manager</option>
                  <option value="co-owner">Co-owner</option>
                </select>

                {/* REMOVE BUTTON */}
                <button
                  onClick={() => handleRemove(member.id, member.email)}
                  className="p-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                  title="Remove member"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
