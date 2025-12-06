/**
 * Calendar Service
 * Handles all calendar operations: settings, meeting types, bookings, availability
 */

import { supabase } from '../../lib/supabase';
import type {
  CalendarSettings,
  MeetingType,
  CalendarBooking,
  WeeklyAvailability,
  CreateBookingDTO,
  TimeSlot,
  PublicCalendarData,
} from './types';

export class CalendarService {
  /**
   * Get user's calendar settings
   */
  async getSettings(userId: string): Promise<CalendarSettings | null> {
    try {
      const { data, error } = await supabase
        .from('calendar_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting calendar settings:', error);
      return null;
    }
  }

  /**
   * Update calendar settings (UPSERT - creates if not exists)
   */
  async updateSettings(
    userId: string,
    updates: Partial<CalendarSettings>
  ): Promise<boolean> {
    try {
      console.log('[CalendarService] Updating settings for user:', userId);
      console.log('[CalendarService] Updates:', updates);
      
      // First, check if settings exist
      const { data: existingSettings, error: checkError } = await supabase
        .from('calendar_settings')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      console.log('[CalendarService] Existing settings:', existingSettings);

      if (existingSettings) {
        // UPDATE existing row
        console.log('[CalendarService] Updating existing settings...');
        const { data, error } = await supabase
          .from('calendar_settings')
          .update(updates)
          .eq('user_id', userId)
          .select();

        if (error) {
          console.error('[CalendarService] Update error:', error);
          throw error;
        }
        
        console.log('[CalendarService] Update successful. Data:', data);
      } else {
        // INSERT new row (first time setup)
        console.log('[CalendarService] No settings found. Creating new settings...');
        const { data, error } = await supabase
          .from('calendar_settings')
          .insert({
            user_id: userId,
            display_name: updates.display_name || 'User',
            booking_slug: updates.booking_slug || `user-${userId.slice(0, 8)}`,
            welcome_message: updates.welcome_message || 'Welcome! Book a time to chat with me.',
            timezone: updates.timezone || 'Asia/Manila',
            is_booking_enabled: true,
            ...updates,
          })
          .select();

        if (error) {
          console.error('[CalendarService] Insert error:', error);
          throw error;
        }
        
        console.log('[CalendarService] Insert successful. Data:', data);
      }
      
      return true;
    } catch (error) {
      console.error('[CalendarService] Error updating calendar settings:', error);
      return false;
    }
  }

  /**
   * Get user's meeting types
   */
  async getMeetingTypes(userId: string): Promise<MeetingType[]> {
    try {
      const { data, error } = await supabase
        .from('meeting_types')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting meeting types:', error);
      return [];
    }
  }

  /**
   * Create a new meeting type
   */
  async createMeetingType(
    userId: string,
    data: Partial<MeetingType>
  ): Promise<MeetingType | null> {
    try {
      const { data: meetingType, error } = await supabase
        .from('meeting_types')
        .insert({
          user_id: userId,
          ...data,
        })
        .select()
        .single();

      if (error) throw error;
      return meetingType;
    } catch (error) {
      console.error('Error creating meeting type:', error);
      return null;
    }
  }

  /**
   * Get user's bookings
   */
  async getBookings(
    userId: string,
    filters?: { status?: string; fromDate?: Date }
  ): Promise<CalendarBooking[]> {
    try {
      let query = supabase
        .from('calendar_bookings')
        .select('*')
        .eq('user_id', userId)
        .order('start_time', { ascending: true });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.fromDate) {
        query = query.gte('start_time', filters.fromDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting bookings:', error);
      return [];
    }
  }

  /**
   * Create a new booking
   */
  async createBooking(bookingData: CreateBookingDTO): Promise<CalendarBooking | null> {
    try {
      // Use the database function for creating bookings
      // This handles ScoutScore updates and engagement events
      const { data, error } = await supabase.rpc('create_calendar_booking', {
        p_user_id: bookingData.user_id,
        p_meeting_type_id: bookingData.meeting_type_id,
        p_start_time: bookingData.start_time,
        p_guest_name: bookingData.guest_name,
        p_guest_email: bookingData.guest_email,
        p_guest_phone: bookingData.guest_phone || null,
        p_guest_notes: bookingData.guest_notes || null,
        p_prospect_id: bookingData.prospect_id || null,
        p_booking_source: bookingData.booking_source || 'direct',
      });

      if (error) throw error;

      // Fetch the created booking
      if (data?.booking_id) {
        const { data: booking, error: fetchError } = await supabase
          .from('calendar_bookings')
          .select('*')
          .eq('id', data.booking_id)
          .single();

        if (fetchError) throw fetchError;
        return booking;
      }

      return null;
    } catch (error) {
      console.error('Error creating booking:', error);
      return null;
    }
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(bookingId: string, reason: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('calendar_bookings')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason,
        })
        .eq('id', bookingId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error cancelling booking:', error);
      return false;
    }
  }

  /**
   * Get available time slots for a specific date
   */
  async getAvailableSlots(
    userId: string,
    meetingTypeId: string,
    date: Date
  ): Promise<TimeSlot[]> {
    try {
      const { data, error } = await supabase.rpc('get_available_slots', {
        p_user_id: userId,
        p_meeting_type_id: meetingTypeId,
        p_date: date.toISOString().split('T')[0], // YYYY-MM-DD
        p_timezone: 'Asia/Manila',
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting available slots:', error);
      return [];
    }
  }

  /**
   * Get public calendar data by booking slug (for public booking page)
   */
  async getPublicCalendarData(slug: string): Promise<PublicCalendarData | null> {
    try {
      // Get settings by slug
      const { data: settings, error: settingsError } = await supabase
        .from('calendar_settings')
        .select('*')
        .eq('booking_slug', slug)
        .eq('is_booking_enabled', true)
        .single();

      if (settingsError) throw settingsError;
      if (!settings) return null;

      // Get meeting types
      const { data: meetingTypes, error: typesError } = await supabase
        .from('meeting_types')
        .select('*')
        .eq('user_id', settings.user_id)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (typesError) throw typesError;

      // Get availability
      const { data: availability, error: availError } = await supabase
        .from('weekly_availability')
        .select('*')
        .eq('user_id', settings.user_id)
        .eq('is_active', true)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (availError) throw availError;

      return {
        settings,
        meetingTypes: meetingTypes || [],
        availability: availability || [],
      };
    } catch (error) {
      console.error('Error getting public calendar data:', error);
      return null;
    }
  }

  /**
   * Get weekly availability
   */
  async getWeeklyAvailability(userId: string): Promise<WeeklyAvailability[]> {
    try {
      const { data, error } = await supabase
        .from('weekly_availability')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting weekly availability:', error);
      return [];
    }
  }

  /**
   * Set weekly availability
   */
  async setWeeklyAvailability(
    userId: string,
    availability: Array<{
      day_of_week: number;
      start_time: string;
      end_time: string;
      meeting_type_id?: string;
    }>
  ): Promise<boolean> {
    try {
      // Delete existing availability
      await supabase
        .from('weekly_availability')
        .delete()
        .eq('user_id', userId);

      // Insert new availability
      const { error } = await supabase
        .from('weekly_availability')
        .insert(
          availability.map((slot) => ({
            user_id: userId,
            ...slot,
          }))
        );

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error setting weekly availability:', error);
      return false;
    }
  }
}

export const calendarService = new CalendarService();

