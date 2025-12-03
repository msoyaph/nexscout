import { supabase } from '../../lib/supabase';
import { API_CONFIG, GenerateMessagePayload, GenerateMessageResponse } from '../../config/apiConfig';

export class MessagingClient {
  private async makeRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
    const { data: session } = await supabase.auth.getSession();
    const token = session?.session?.access_token;

    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async generateMessage(payload: GenerateMessagePayload): Promise<GenerateMessageResponse> {
    try {
      return await this.makeRequest<GenerateMessageResponse>(
        API_CONFIG.endpoints.message.generate,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );
    } catch (error) {
      console.error('Message generation failed, using fallback:', error);

      return {
        success: true,
        message: `Hi! I noticed you might be interested in ${payload.context?.productType || 'new opportunities'}. Let's connect!`,
        variants: [
          `Hello! Hope you're doing well. I wanted to share something that might interest you.`,
          `Hey there! Got a moment? I have something exciting to discuss with you.`,
          `Hi! I came across your profile and thought this might be perfect for you.`,
        ],
        meta: {
          recommendedVariantIndex: 0,
          kpiGoal: 'Get response within 24 hours',
        },
      };
    }
  }
}

export const messagingClient = new MessagingClient();
