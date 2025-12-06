/**
 * TypeScript types for Smart Calendar System
 */

export interface CalendarSettings {
  id: string;
  user_id: string;
  booking_slug: string;
  is_booking_enabled: boolean;
  display_name: string;
  welcome_message: string | null;
  profile_image_url: string | null;
  company_name: string | null;
  timezone: string;
  min_notice_hours: number;
  max_days_advance: number;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  confirmation_message: string | null;
  redirect_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface MeetingType {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  color: string;
  location_type: 'zoom' | 'google_meet' | 'phone' | 'in_person' | 'custom';
  location_details: string | null;
  is_paid: boolean;
  price_amount: number | null;
  price_currency: string;
  is_active: boolean;
  display_order: number;
  custom_questions: any[];
  created_at: string;
  updated_at: string;
}

export interface CalendarBooking {
  id: string;
  user_id: string;
  meeting_type_id: string;
  start_time: string;
  end_time: string;
  timezone: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  guest_notes: string | null;
  custom_responses: any;
  status: 'confirmed' | 'cancelled' | 'rescheduled' | 'completed' | 'no_show';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded' | null;
  payment_amount: number | null;
  meeting_link: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  prospect_id: string | null;
  booking_source: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimeSlot {
  time: string; // "09:00", "09:30", etc.
  available: boolean;
}

export interface WeeklyAvailability {
  id: string;
  user_id: string;
  day_of_week: number; // 0 = Sunday, 6 = Saturday
  start_time: string;
  end_time: string;
  meeting_type_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DateOverride {
  id: string;
  user_id: string;
  override_date: string;
  override_type: 'available' | 'unavailable';
  time_slots: any[];
  reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublicCalendarData {
  settings: CalendarSettings;
  meetingTypes: MeetingType[];
  availability: WeeklyAvailability[];
}

export interface CreateBookingDTO {
  user_id: string;
  meeting_type_id: string;
  start_time: string;
  guest_name: string;
  guest_email: string;
  guest_phone?: string;
  guest_notes?: string;
  prospect_id?: string;
  booking_source?: string;
}




