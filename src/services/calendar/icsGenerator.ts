/**
 * ICS (iCalendar) File Generator
 * 
 * Generates .ics files for native calendar apps:
 * - Apple Calendar (iOS/macOS)
 * - Google Calendar
 * - Microsoft Outlook
 * - Any calendar app that supports iCalendar format
 */

import type { CalendarBooking, MeetingType } from './types';

export class ICSGenerator {
  /**
   * Generate ICS file content
   */
  static generateICS(
    booking: CalendarBooking,
    meetingType: MeetingType,
    organizerName: string,
    organizerEmail: string
  ): string {
    const startDate = new Date(booking.start_time);
    const endDate = new Date(booking.end_time);

    // Format dates for ICS (YYYYMMDDTHHMMSSZ)
    const formatDate = (date: Date) => {
      return date
        .toISOString()
        .replace(/[-:]/g, '')
        .replace(/\.\d{3}/, '');
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//NexScout//Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${booking.id}@nexscout.com`,
      `DTSTAMP:${formatDate(new Date())}`,
      `DTSTART:${formatDate(startDate)}`,
      `DTEND:${formatDate(endDate)}`,
      `SUMMARY:${meetingType.name} with ${organizerName}`,
      `DESCRIPTION:Meeting with ${booking.guest_name}\\n\\nNotes: ${booking.guest_notes || 'None'}`,
      `LOCATION:${meetingType.location_details || meetingType.location_type}`,
      `ORGANIZER;CN=${organizerName}:MAILTO:${organizerEmail}`,
      `ATTENDEE;CN=${booking.guest_name};RSVP=TRUE:MAILTO:${booking.guest_email}`,
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      // 24-hour reminder
      'BEGIN:VALARM',
      'TRIGGER:-PT24H',
      'DESCRIPTION:Meeting reminder - Tomorrow',
      'ACTION:DISPLAY',
      'END:VALARM',
      // 1-hour reminder
      'BEGIN:VALARM',
      'TRIGGER:-PT1H',
      'DESCRIPTION:Meeting starting soon',
      'ACTION:DISPLAY',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    return icsContent;
  }

  /**
   * Download ICS file to user's device
   */
  static downloadICS(
    icsContent: string,
    filename: string = 'meeting.ics'
  ): void {
    const blob = new Blob([icsContent], {
      type: 'text/calendar;charset=utf-8',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  /**
   * Generate Apple Calendar link (opens in iOS/macOS Calendar app)
   */
  static generateAppleCalendarLink(icsContent: string): string {
    const encodedICS = encodeURIComponent(icsContent);
    return `data:text/calendar;charset=utf8,${encodedICS}`;
  }

  /**
   * Generate Google Calendar link
   */
  static generateGoogleCalendarLink(
    booking: CalendarBooking,
    meetingType: MeetingType,
    organizerName: string
  ): string {
    const startDate = new Date(booking.start_time);
    const endDate = new Date(booking.end_time);

    const formatGoogleDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `${meetingType.name} with ${organizerName}`,
      dates: `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`,
      details: `Meeting with ${booking.guest_name}\n\nNotes: ${booking.guest_notes || 'None'}`,
      location: meetingType.location_details || meetingType.location_type,
      ctz: 'Asia/Manila',
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  /**
   * Generate Microsoft Outlook Calendar link
   */
  static generateOutlookCalendarLink(
    booking: CalendarBooking,
    meetingType: MeetingType,
    organizerName: string
  ): string {
    const startDate = new Date(booking.start_time);
    const endDate = new Date(booking.end_time);

    const params = new URLSearchParams({
      path: '/calendar/action/compose',
      rru: 'addevent',
      subject: `${meetingType.name} with ${organizerName}`,
      startdt: startDate.toISOString(),
      enddt: endDate.toISOString(),
      body: `Meeting with ${booking.guest_name}\n\nNotes: ${booking.guest_notes || 'None'}`,
      location: meetingType.location_details || meetingType.location_type,
    });

    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
  }

  /**
   * Show calendar options modal (helper for UI)
   */
  static showCalendarOptions(
    booking: CalendarBooking,
    meetingType: MeetingType,
    organizerName: string,
    organizerEmail: string
  ): void {
    const icsContent = this.generateICS(booking, meetingType, organizerName, organizerEmail);
    
    // You can implement a modal here, or just download ICS
    // For now, let's download the ICS file
    this.downloadICS(icsContent, `meeting-${booking.id}.ics`);
  }
}

export const icsGenerator = ICSGenerator;




