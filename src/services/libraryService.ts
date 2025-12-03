import { supabase } from '../lib/supabase';

export interface PitchDeck {
  id: string;
  user_id: string;
  title: string;
  company_name?: string;
  industry?: string;
  target_audience?: string;
  content: any;
  status: 'draft' | 'completed' | 'archived' | 'generating';
  created_at: string;
  updated_at: string;
  is_public?: boolean;
  share_token?: string;
}

export interface MessageSequence {
  id: string;
  user_id: string;
  title: string;
  prospect_name?: string;
  prospect_company?: string;
  sequence_type: string;
  messages: any[];
  tone: string;
  status: 'draft' | 'active' | 'completed' | 'archived' | 'generating';
  created_at: string;
  updated_at: string;
  is_public?: boolean;
  share_token?: string;
}

export interface LibraryGroup {
  id: string;
  user_id: string;
  name: string;
  type: 'pitch_deck' | 'message_sequence';
  color?: string;
  created_at: string;
}

export const libraryService = {
  async getAllPitchDecks(userId: string, status?: string): Promise<PitchDeck[]> {
    let query = supabase
      .from('pitch_decks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getPitchDeck(id: string): Promise<PitchDeck | null> {
    const { data, error } = await supabase
      .from('pitch_decks')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createPitchDeck(deck: Partial<PitchDeck>): Promise<PitchDeck> {
    const { data, error } = await supabase
      .from('pitch_decks')
      .insert(deck)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updatePitchDeck(id: string, updates: Partial<PitchDeck>): Promise<PitchDeck> {
    const { data, error } = await supabase
      .from('pitch_decks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deletePitchDeck(id: string): Promise<void> {
    const { error } = await supabase
      .from('pitch_decks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async archivePitchDeck(id: string): Promise<void> {
    await this.updatePitchDeck(id, { status: 'archived' });
  },

  async getAllMessageSequences(userId: string, status?: string): Promise<MessageSequence[]> {
    let query = supabase
      .from('ai_message_sequences')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getMessageSequence(id: string): Promise<MessageSequence | null> {
    const { data, error } = await supabase
      .from('ai_message_sequences')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createMessageSequence(sequence: Partial<MessageSequence>): Promise<MessageSequence> {
    const { data, error } = await supabase
      .from('ai_message_sequences')
      .insert(sequence)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateMessageSequence(id: string, updates: Partial<MessageSequence>): Promise<MessageSequence> {
    const { data, error } = await supabase
      .from('ai_message_sequences')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteMessageSequence(id: string): Promise<void> {
    const { error } = await supabase
      .from('ai_message_sequences')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async archiveMessageSequence(id: string): Promise<void> {
    await this.updateMessageSequence(id, { status: 'archived' });
  },

  async generateShareToken(type: 'pitch_deck' | 'message_sequence', id: string): Promise<string> {
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    if (type === 'pitch_deck') {
      await this.updatePitchDeck(id, { is_public: true, share_token: token });
    } else {
      await this.updateMessageSequence(id, { is_public: true, share_token: token });
    }

    return token;
  },

  async revokeShare(type: 'pitch_deck' | 'message_sequence', id: string): Promise<void> {
    if (type === 'pitch_deck') {
      await this.updatePitchDeck(id, { is_public: false, share_token: null });
    } else {
      await this.updateMessageSequence(id, { is_public: false, share_token: null });
    }
  },

  getShareUrl(type: 'pitch_deck' | 'message_sequence', token: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/share/${type}/${token}`;
  },
};
