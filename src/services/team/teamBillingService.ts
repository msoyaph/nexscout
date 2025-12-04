import { supabase } from '../../lib/supabase';

export interface TeamSubscription {
  id: string;
  owner_user_id: string;
  team_leader_id?: string;
  team_name: string;
  seats_included: number;
  seats_used: number;
  extra_seats: number;
  base_price: number;
  extra_seat_price: number;
  billing_cycle_start: string;
  billing_cycle_end: string;
  status: 'active' | 'past_due' | 'canceled' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface BillingInvoice {
  base_price: number;
  extra_seats: number;
  extra_seat_price: number;
  extra_seats_cost: number;
  total: number;
  due_date: string;
}

/**
 * Get team subscription for the current user
 */
export async function getTeamSubscription(userId: string): Promise<TeamSubscription | null> {
  const { data, error } = await supabase
    .from('team_subscriptions')
    .select('*')
    .or(`owner_user_id.eq.${userId},team_leader_id.eq.${userId}`)
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    console.error('Error fetching team subscription:', error);
    throw error;
  }

  return data;
}

/**
 * Update team seats
 */
export async function updateTeamSeats(
  userId: string,
  teamId: string,
  seatsIncluded: number,
  extraSeats: number,
  extraSeatPrice: number
): Promise<{ success: boolean; error?: string; monthly_cost?: number }> {
  const { data, error } = await supabase.rpc('update_team_seats', {
    p_team_id: teamId,
    p_seats_included: seatsIncluded,
    p_extra_seats: extraSeats,
    p_extra_seat_price: extraSeatPrice,
  });

  if (error) {
    console.error('Error updating team seats:', error);
    return {
      success: false,
      error: error.message,
    };
  }

  return data as { success: boolean; error?: string; monthly_cost?: number };
}

/**
 * Calculate monthly billing total
 */
export function calculateMonthlyTotal(subscription: TeamSubscription): number {
  const basePrice = subscription.base_price || 4990;
  const extraCost = (subscription.extra_seats || 0) * (subscription.extra_seat_price || 899);
  return basePrice + extraCost;
}

/**
 * Get upcoming invoice details
 */
export async function getUpcomingInvoice(userId: string): Promise<BillingInvoice | null> {
  const subscription = await getTeamSubscription(userId);

  if (!subscription) return null;

  const basePrice = subscription.base_price || 4990;
  const extraSeats = subscription.extra_seats || 0;
  const extraSeatPrice = subscription.extra_seat_price || 899;
  const extraSeatsCost = extraSeats * extraSeatPrice;
  const total = basePrice + extraSeatsCost;

  return {
    base_price: basePrice,
    extra_seats: extraSeats,
    extra_seat_price: extraSeatPrice,
    extra_seats_cost: extraSeatsCost,
    total,
    due_date: subscription.billing_cycle_end,
  };
}

/**
 * Get billing history (placeholder for future implementation)
 */
export async function getBillingHistory(userId: string): Promise<any[]> {
  // TODO: Implement billing history from payment_history table
  return [];
}

/**
 * Get seat utilization stats
 */
export async function getSeatUtilization(userId: string): Promise<{
  total_seats: number;
  used_seats: number;
  available_seats: number;
  utilization_percent: number;
} | null> {
  const subscription = await getTeamSubscription(userId);

  if (!subscription) return null;

  const totalSeats = (subscription.seats_included || 5) + (subscription.extra_seats || 0);
  const usedSeats = subscription.seats_used || 0;
  const availableSeats = totalSeats - usedSeats;
  const utilizationPercent = totalSeats > 0 ? Math.round((usedSeats / totalSeats) * 100) : 0;

  return {
    total_seats: totalSeats,
    used_seats: usedSeats,
    available_seats: availableSeats,
    utilization_percent: utilizationPercent,
  };
}
