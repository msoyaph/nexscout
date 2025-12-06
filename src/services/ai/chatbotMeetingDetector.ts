/**
 * AI Chatbot Meeting Detector
 * 
 * Detects when a prospect wants to schedule a meeting
 * and automatically sends them a booking link
 */

import { supabase } from '../../lib/supabase';

export class ChatbotMeetingDetector {
  /**
   * Detect if message is a meeting request
   */
  detectMeetingRequest(message: string): boolean {
    const lowerMessage = message.toLowerCase();

    // English keywords
    const englishKeywords = [
      'meet',
      'meeting',
      'schedule',
      'call',
      'zoom',
      'video call',
      'chat with you',
      'talk to you',
      'speak with you',
      'appointment',
      'book a time',
      'available',
      'free time',
    ];

    // Filipino/Taglish keywords
    const filipinoKeywords = [
      'mag-meet',
      'magmeet',
      'meet tayo',
      'kita tayo',
      'usap tayo',
      'tawag',
      'tumawag',
      'mag-usap',
      'pag-usapan',
      'schedule tayo',
      'kailan',
      'pwede ba',
      'available ka',
      'libre ka',
      'zoom tayo',
      'video call tayo',
    ];

    const allKeywords = [...englishKeywords, ...filipinoKeywords];

    // Check if any keyword is in the message
    return allKeywords.some((keyword) => lowerMessage.includes(keyword));
  }

  /**
   * Get user's booking link
   */
  async getBookingLink(userId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('calendar_settings')
        .select('booking_slug, is_booking_enabled')
        .eq('user_id', userId)
        .single();

      if (error || !data || !data.is_booking_enabled) {
        return null;
      }

      // Use current origin or default to nexscout.com
      const origin = typeof window !== 'undefined' 
        ? window.location.origin 
        : 'https://nexscout.com';

      return `${origin}/book/${data.booking_slug}`;
    } catch (error) {
      console.error('Error getting booking link:', error);
      return null;
    }
  }

  /**
   * Generate meeting response in English
   */
  generateEnglishResponse(bookingUrl: string, prospectName?: string): string {
    const greeting = prospectName ? `${prospectName}` : 'there';

    const responses = [
      `Sure ${greeting}! I'd love to meet with you! 😊

📅 Book a time that works for you:
${bookingUrl}

You can choose from these options:
• 30-Minute Discovery Call
• 1-Hour Consultation

Looking forward to our conversation! 🚀`,

      `Absolutely ${greeting}! Let's schedule a meeting! 

🗓️ Click here to book a time:
${bookingUrl}

Pick a time that's convenient for you, and I'll see you there! 😊`,

      `Of course ${greeting}! I'm excited to chat with you!

📆 Book your slot here:
${bookingUrl}

See you soon! 💼`,
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Generate meeting response in Taglish
   */
  generateTaglishResponse(bookingUrl: string, prospectName?: string): string {
    const greeting = prospectName ? `${prospectName}` : 'Kabayan';

    const responses = [
      `Sure ${greeting}! Gusto ko rin mag-meet with you! 😊

📅 Book a time na convenient sa'yo:
${bookingUrl}

Pwede kang pumili ng:
• 30-Minute Discovery Call
• 1-Hour Consultation

Excited na ako mag-usap tayo! 🚀`,

      `Siyempre ${greeting}! Let's schedule tayo! 

🗓️ I-book mo dito yung time mo:
${bookingUrl}

Pumili ka ng time na free ka, see you! 😊`,

      `Oo naman ${greeting}! Excited akong mag-chat with you!

📆 Book mo dito:
${bookingUrl}

See you soon! 💼`,
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Detect language of message
   */
  detectLanguage(message: string): 'english' | 'taglish' | 'tagalog' {
    const lowerMessage = message.toLowerCase();

    // Filipino words
    const filipinoWords = [
      'ako',
      'ka',
      'tayo',
      'gusto',
      'pwede',
      'kailangan',
      'mag',
      'pag',
      'kung',
      'ba',
      'po',
      'nga',
      'naman',
      'lang',
      'salamat',
    ];

    const filipinoCount = filipinoWords.filter((word) =>
      lowerMessage.includes(word)
    ).length;

    // English detection
    const englishWords = message.match(/\b[a-z]+\b/gi) || [];
    const hasEnglish = englishWords.length > 3;

    if (filipinoCount >= 2 && hasEnglish) return 'taglish';
    if (filipinoCount >= 2) return 'tagalog';
    return 'english';
  }

  /**
   * Generate smart meeting response
   * Detects language and generates appropriate response
   */
  async generateMeetingResponse(
    userId: string,
    prospectMessage: string,
    prospectName?: string
  ): Promise<string | null> {
    try {
      // Get booking link
      const bookingUrl = await this.getBookingLink(userId);

      if (!bookingUrl) {
        // Fallback if booking not enabled
        return "I'd love to meet with you! Let me send you my schedule shortly. 😊";
      }

      // Detect language
      const language = this.detectLanguage(prospectMessage);

      // Generate response based on language
      if (language === 'taglish' || language === 'tagalog') {
        return this.generateTaglishResponse(bookingUrl, prospectName);
      } else {
        return this.generateEnglishResponse(bookingUrl, prospectName);
      }
    } catch (error) {
      console.error('Error generating meeting response:', error);
      return null;
    }
  }

  /**
   * Check if user has calendar enabled
   */
  async isCalendarEnabled(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('calendar_settings')
        .select('is_booking_enabled')
        .eq('user_id', userId)
        .single();

      if (error) return false;
      return data?.is_booking_enabled === true;
    } catch (error) {
      return false;
    }
  }
}

export const chatbotMeetingDetector = new ChatbotMeetingDetector();




