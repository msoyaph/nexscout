import { supabase } from '../../lib/supabase';

export interface RawProspectData {
  source_type: string;
  raw_data: any;
  user_id: string;
}

export interface NormalizedProspect {
  name?: string;
  email?: string;
  phone?: string;
  messenger_id?: string;
  location?: string;
  occupation?: string;
  interest_tags?: string[];
  product_interest?: string[];
  objection_type?: string[];
  budget?: number;
  buying_capacity?: 'low' | 'medium' | 'high' | 'very_high';
  buying_timeline?: 'immediate' | 'this_week' | 'this_month' | 'this_quarter' | 'long_term' | 'unknown';
  sentiment?: 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';
  personality_type?: 'amiable' | 'driver' | 'expressive' | 'analytical' | 'unknown';
  emotion_score?: number;
  relationship_strength?: number;
  past_interactions?: any[];
  channel?: string;
  source?: string;
  quality_score?: number;
  lead_stage?: string;
}

export class UniversalNormalizationEngine {

  async normalize(rawData: RawProspectData): Promise<NormalizedProspect> {
    const { source_type, raw_data } = rawData;

    switch (source_type) {
      case 'chatbot_conversation':
        return this.normalizeChatbot(raw_data);
      case 'chatbot_preform':
        return this.normalizeChatbotPreform(raw_data);
      case 'screenshot_upload':
        return this.normalizeScreenshot(raw_data);
      case 'csv_upload':
        return this.normalizeCSV(raw_data);
      case 'pdf_upload':
        return this.normalizePDF(raw_data);
      case 'browser_extension':
        return this.normalizeBrowserExtension(raw_data);
      case 'social_api':
        return this.normalizeSocialAPI(raw_data);
      case 'website_crawler':
        return this.normalizeWebsiteCrawler(raw_data);
      case 'manual_input':
        return this.normalizeManualInput(raw_data);
      case 'cross_user_consolidation':
        return this.normalizeCrossUser(raw_data);
      default:
        throw new Error(`Unknown source type: ${source_type}`);
    }
  }

  private normalizeChatbot(data: any): NormalizedProspect {
    const normalized: NormalizedProspect = {
      channel: 'chatbot',
      source: 'public_chatbot',
      past_interactions: data.messages || [],
      lead_stage: 'contacted'
    };

    if (data.visitor_name) normalized.name = this.cleanName(data.visitor_name);
    if (data.visitor_email) normalized.email = this.cleanEmail(data.visitor_email);
    if (data.visitor_phone) normalized.phone = this.cleanPhone(data.visitor_phone);

    if (data.messages && Array.isArray(data.messages)) {
      const extractedInfo = this.extractInfoFromConversation(data.messages);
      Object.assign(normalized, extractedInfo);
    }

    return normalized;
  }

  private normalizeChatbotPreform(data: any): NormalizedProspect {
    const normalized: NormalizedProspect = {
      channel: 'chatbot',
      source: 'chatbot_preform',
      lead_stage: 'new'
    };

    if (data.budget) normalized.budget = this.parseBudget(data.budget);
    if (data.challenge) {
      normalized.interest_tags = this.extractTags(data.challenge);
    }
    if (data.location) normalized.location = data.location;
    if (data.name) normalized.name = this.cleanName(data.name);
    if (data.email) normalized.email = this.cleanEmail(data.email);
    if (data.phone) normalized.phone = this.cleanPhone(data.phone);

    return normalized;
  }

  private normalizeScreenshot(data: any): NormalizedProspect {
    const normalized: NormalizedProspect = {
      channel: data.platform || 'social_media',
      source: 'screenshot_upload',
      lead_stage: 'new'
    };

    if (data.extracted_text) {
      const extracted = this.extractInfoFromText(data.extracted_text);
      Object.assign(normalized, extracted);
    }

    if (data.platform === 'facebook' && data.messenger_id) {
      normalized.messenger_id = data.messenger_id;
    }

    return normalized;
  }

  private normalizeCSV(data: any): NormalizedProspect {
    const normalized: NormalizedProspect = {
      source: 'csv_upload',
      lead_stage: 'new'
    };

    const fieldMappings: Record<string, keyof NormalizedProspect> = {
      'name': 'name',
      'full_name': 'name',
      'fullname': 'name',
      'email': 'email',
      'email_address': 'email',
      'phone': 'phone',
      'phone_number': 'phone',
      'mobile': 'phone',
      'location': 'location',
      'address': 'location',
      'city': 'location',
      'occupation': 'occupation',
      'job': 'occupation',
      'position': 'occupation'
    };

    for (const [csvField, normalizedField] of Object.entries(fieldMappings)) {
      if (data[csvField]) {
        (normalized as any)[normalizedField] = this.cleanField(data[csvField], normalizedField);
      }
    }

    return normalized;
  }

  private normalizePDF(data: any): NormalizedProspect {
    const normalized: NormalizedProspect = {
      source: 'pdf_upload',
      lead_stage: 'new'
    };

    if (data.extracted_text) {
      const extracted = this.extractInfoFromText(data.extracted_text);
      Object.assign(normalized, extracted);
    }

    return normalized;
  }

  private normalizeBrowserExtension(data: any): NormalizedProspect {
    const normalized: NormalizedProspect = {
      channel: data.platform || 'web',
      source: 'browser_extension',
      lead_stage: 'new'
    };

    if (data.name) normalized.name = this.cleanName(data.name);
    if (data.profile_url) normalized.messenger_id = data.profile_url;
    if (data.bio) {
      const extracted = this.extractInfoFromText(data.bio);
      Object.assign(normalized, extracted);
    }

    return normalized;
  }

  private normalizeSocialAPI(data: any): NormalizedProspect {
    const normalized: NormalizedProspect = {
      channel: 'social_media',
      source: 'social_api',
      lead_stage: 'new'
    };

    if (data.name) normalized.name = this.cleanName(data.name);
    if (data.bio || data.description) {
      const text = data.bio || data.description;
      const extracted = this.extractInfoFromText(text);
      Object.assign(normalized, extracted);
    }
    if (data.location) normalized.location = data.location;

    return normalized;
  }

  private normalizeWebsiteCrawler(data: any): NormalizedProspect {
    const normalized: NormalizedProspect = {
      source: 'website_crawler',
      lead_stage: 'new'
    };

    if (data.contact_name) normalized.name = this.cleanName(data.contact_name);
    if (data.contact_email) normalized.email = this.cleanEmail(data.contact_email);
    if (data.contact_phone) normalized.phone = this.cleanPhone(data.contact_phone);
    if (data.company_name) normalized.occupation = data.company_name;
    if (data.location) normalized.location = data.location;

    return normalized;
  }

  private normalizeManualInput(data: any): NormalizedProspect {
    const normalized: NormalizedProspect = {
      source: 'manual_input',
      lead_stage: data.lead_stage || 'new'
    };

    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        (normalized as any)[key] = data[key];
      }
    });

    return normalized;
  }

  private normalizeCrossUser(data: any): NormalizedProspect {
    return {
      ...data,
      source: 'cross_user_consolidation'
    };
  }

  private cleanName(name: string): string {
    return name.trim().replace(/\s+/g, ' ');
  }

  private cleanEmail(email: string): string | undefined {
    const cleaned = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(cleaned) ? cleaned : undefined;
  }

  private cleanPhone(phone: string): string {
    return phone.replace(/[^\d+]/g, '');
  }

  private cleanField(value: any, field: string): any {
    if (field === 'name') return this.cleanName(String(value));
    if (field === 'email') return this.cleanEmail(String(value));
    if (field === 'phone') return this.cleanPhone(String(value));
    return value;
  }

  private parseBudget(budget: any): number | undefined {
    if (typeof budget === 'number') return budget;
    const parsed = parseFloat(String(budget).replace(/[^\d.]/g, ''));
    return isNaN(parsed) ? undefined : parsed;
  }

  private extractTags(text: string): string[] {
    const keywords = ['income', 'business', 'investment', 'health', 'insurance', 'property', 'sales'];
    const tags: string[] = [];
    const lowerText = text.toLowerCase();

    keywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        tags.push(keyword);
      }
    });

    return tags;
  }

  private extractInfoFromConversation(messages: any[]): Partial<NormalizedProspect> {
    const info: Partial<NormalizedProspect> = {
      interest_tags: [],
      objection_type: []
    };

    const allText = messages
      .map(m => m.content || m.message || '')
      .join(' ')
      .toLowerCase();

    if (allText.includes('how to join') || allText.includes('paano sumali')) {
      info.interest_tags?.push('interested');
      info.lead_stage = 'hot';
    }

    if (allText.includes('magkano') || allText.includes('how much') || allText.includes('price')) {
      info.interest_tags?.push('price_inquiry');
    }

    if (allText.includes('scam') || allText.includes('pyramid')) {
      info.objection_type?.push('trust');
    }

    if (allText.includes('no time') || allText.includes('busy')) {
      info.objection_type?.push('time');
    }

    return info;
  }

  private extractInfoFromText(text: string): Partial<NormalizedProspect> {
    const info: Partial<NormalizedProspect> = {
      interest_tags: []
    };

    const emailRegex = /[^\s@]+@[^\s@]+\.[^\s@]+/;
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;

    const emailMatch = text.match(emailRegex);
    if (emailMatch) info.email = this.cleanEmail(emailMatch[0]);

    const phoneMatch = text.match(phoneRegex);
    if (phoneMatch) info.phone = this.cleanPhone(phoneMatch[0]);

    const lowerText = text.toLowerCase();
    const interestKeywords = {
      'business': 'business_opportunity',
      'income': 'income',
      'investment': 'investment',
      'health': 'health',
      'insurance': 'insurance'
    };

    Object.entries(interestKeywords).forEach(([keyword, tag]) => {
      if (lowerText.includes(keyword)) {
        info.interest_tags?.push(tag);
      }
    });

    return info;
  }

  async saveNormalizedProspect(userId: string, normalized: NormalizedProspect, sourceId?: string): Promise<any> {
    const { data, error } = await supabase
      .from('prospects_v10')
      .insert({
        user_id: userId,
        source_id: sourceId,
        ...normalized,
        quality_score: this.calculateQualityScore(normalized),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private calculateQualityScore(prospect: NormalizedProspect): number {
    let score = 0;

    if (prospect.name) score += 15;
    if (prospect.email) score += 20;
    if (prospect.phone) score += 20;
    if (prospect.location) score += 10;
    if (prospect.occupation) score += 10;
    if (prospect.interest_tags && prospect.interest_tags.length > 0) score += 15;
    if (prospect.budget) score += 10;

    return Math.min(score, 100);
  }

  async findDuplicates(userId: string, prospect: NormalizedProspect): Promise<any[]> {
    const conditions: any[] = [];

    if (prospect.email) {
      conditions.push(supabase
        .from('prospects_v10')
        .select('*')
        .eq('user_id', userId)
        .eq('email', prospect.email)
        .maybeSingle());
    }

    if (prospect.phone) {
      conditions.push(supabase
        .from('prospects_v10')
        .select('*')
        .eq('user_id', userId)
        .eq('phone', prospect.phone)
        .maybeSingle());
    }

    if (prospect.messenger_id) {
      conditions.push(supabase
        .from('prospects_v10')
        .select('*')
        .eq('user_id', userId)
        .eq('messenger_id', prospect.messenger_id)
        .maybeSingle());
    }

    const results = await Promise.all(conditions);
    return results
      .map(r => r.data)
      .filter(d => d !== null);
  }

  async mergeProspects(userId: string, masterProspectId: string, duplicateProspectId: string): Promise<void> {
    const { data: master } = await supabase
      .from('prospects_v10')
      .select('*')
      .eq('id', masterProspectId)
      .single();

    const { data: duplicate } = await supabase
      .from('prospects_v10')
      .select('*')
      .eq('id', duplicateProspectId)
      .single();

    if (!master || !duplicate) return;

    const merged = this.mergeProspectData(master, duplicate);

    await supabase
      .from('prospects_v10')
      .update(merged)
      .eq('id', masterProspectId);

    await supabase
      .from('prospect_merge_log')
      .insert({
        user_id: userId,
        master_prospect_id: masterProspectId,
        merged_prospect_id: duplicateProspectId,
        merge_reason: 'duplicate_detected',
        merge_confidence: 95,
        merged_data: duplicate
      });

    await supabase
      .from('prospects_v10')
      .delete()
      .eq('id', duplicateProspectId);
  }

  private mergeProspectData(master: any, duplicate: any): any {
    const merged = { ...master };

    Object.keys(duplicate).forEach(key => {
      if (!merged[key] && duplicate[key]) {
        merged[key] = duplicate[key];
      }

      if (key === 'interest_tags' || key === 'product_interest' || key === 'objection_type') {
        const masterTags = master[key] || [];
        const dupTags = duplicate[key] || [];
        merged[key] = [...new Set([...masterTags, ...dupTags])];
      }

      if (key === 'past_interactions') {
        const masterInteractions = master[key] || [];
        const dupInteractions = duplicate[key] || [];
        merged[key] = [...masterInteractions, ...dupInteractions];
      }
    });

    merged.updated_at = new Date().toISOString();
    return merged;
  }
}

export const universalNormalizationEngine = new UniversalNormalizationEngine();
