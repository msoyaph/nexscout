import { supabase } from '../../lib/supabase';

export interface TeamMember {
  id: string;
  team_id: string;
  owner_user_id?: string;
  user_id?: string;
  email: string;
  name?: string;
  role: 'agent' | 'closer' | 'leader' | 'manager' | 'co-owner';
  status: 'pending' | 'active' | 'inactive' | 'removed';
  invited_at: string;
  joined_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TeamStats {
  total_members: number;
  active_members: number;
  pending_invites: number;
  seats_available: number;
}

/**
 * Get all team members for the owner
 */
export async function getTeamMembers(ownerUserId: string): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('owner_user_id', ownerUserId)
    .in('status', ['pending', 'active'])
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching team members:', error);
    throw error;
  }

  return data || [];
}

/**
 * Invite a new team member
 */
export async function inviteTeamMember(
  teamId: string,
  email: string,
  role: 'agent' | 'closer' | 'leader' | 'manager' | 'co-owner' = 'agent'
): Promise<{ success: boolean; error?: string; member_id?: string; seats_remaining?: number }> {
  const { data, error } = await supabase.rpc('invite_team_member', {
    p_team_id: teamId,
    p_email: email,
    p_role: role,
  });

  if (error) {
    console.error('Error inviting team member:', error);

    // Parse common errors
    if (error.message.includes('NO_SEATS_AVAILABLE')) {
      return {
        success: false,
        error: 'No available seats. Please add more seats to your plan first.',
      };
    }

    if (error.message.includes('MEMBER_ALREADY_EXISTS')) {
      return {
        success: false,
        error: 'This email is already invited or is an active member.',
      };
    }

    return {
      success: false,
      error: error.message,
    };
  }

  return data as { success: boolean; error?: string; member_id?: string; seats_remaining?: number };
}

/**
 * Remove a team member
 */
export async function removeTeamMember(
  memberId: string
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('remove_team_member', {
    p_team_member_id: memberId,
  });

  if (error) {
    console.error('Error removing team member:', error);
    return {
      success: false,
      error: error.message,
    };
  }

  return data as { success: boolean; error?: string };
}

/**
 * Update member role
 */
export async function updateMemberRole(
  memberId: string,
  newRole: 'agent' | 'closer' | 'leader' | 'manager' | 'co-owner'
): Promise<{ success: boolean; error?: string; new_role?: string }> {
  const { data, error } = await supabase.rpc('update_member_role', {
    p_team_member_id: memberId,
    p_new_role: newRole,
  });

  if (error) {
    console.error('Error updating member role:', error);
    return {
      success: false,
      error: error.message,
    };
  }

  return data as { success: boolean; error?: string; new_role?: string };
}

/**
 * Resend invitation email
 */
export async function resendInvite(memberId: string): Promise<boolean> {
  // TODO: Implement email invitation system
  // This would trigger the invitation email to be sent again
  console.log('Resending invite for member:', memberId);

  // For now, just update the invited_at timestamp
  const { error } = await supabase
    .from('team_members')
    .update({ invited_at: new Date().toISOString() })
    .eq('id', memberId);

  if (error) {
    console.error('Error resending invite:', error);
    return false;
  }

  return true;
}

/**
 * Get team statistics
 */
export async function getTeamStats(ownerUserId: string): Promise<TeamStats> {
  const members = await getTeamMembers(ownerUserId);

  // Get subscription info
  const { data: subscription } = await supabase
    .from('team_subscriptions')
    .select('seats_included, extra_seats, seats_used')
    .or(`owner_user_id.eq.${ownerUserId},team_leader_id.eq.${ownerUserId}`)
    .eq('status', 'active')
    .maybeSingle();

  const totalSeats = (subscription?.seats_included || 5) + (subscription?.extra_seats || 0);
  const seatsUsed = subscription?.seats_used || 0;

  return {
    total_members: members.length,
    active_members: members.filter(m => m.status === 'active').length,
    pending_invites: members.filter(m => m.status === 'pending').length,
    seats_available: totalSeats - seatsUsed,
  };
}

/**
 * Get member by email
 */
export async function getMemberByEmail(
  teamId: string,
  email: string
): Promise<TeamMember | null> {
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('team_id', teamId)
    .eq('email', email)
    .maybeSingle();

  if (error) {
    console.error('Error fetching member by email:', error);
    return null;
  }

  return data;
}

/**
 * Accept team invitation (for the invited user)
 */
export async function acceptInvitation(
  memberId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('team_members')
    .update({
      user_id: userId,
      status: 'active',
      joined_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', memberId)
    .eq('status', 'pending');

  if (error) {
    console.error('Error accepting invitation:', error);
    return {
      success: false,
      error: error.message,
    };
  }

  return { success: true };
}
