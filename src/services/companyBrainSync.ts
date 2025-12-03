import { supabase } from '../lib/supabase';
import { CompanyScrapedData } from './companyWebScraper';
import { companyEmbeddingEngine } from './companyEmbeddingEngine';

export class CompanyBrainSync {
  async syncAfterCrawl(
    userId: string,
    companyId: string | undefined,
    extractedDataId: string,
    data: CompanyScrapedData
  ): Promise<void> {
    try {
      if (companyId) {
        await this.updateCompanyProfile(companyId, data);
        await this.updateBrainState(userId, companyId, data);
      }

      await companyEmbeddingEngine.generateEmbeddings(userId, companyId, extractedDataId, data);

      if (companyId) {
        await this.generateAIStyleRules(userId, companyId, data);
      }

      console.log('Brain sync completed successfully');
    } catch (error) {
      console.error('Brain sync error:', error);
      throw error;
    }
  }

  private async updateCompanyProfile(companyId: string, data: CompanyScrapedData): Promise<void> {
    const updates: any = {};

    if (data.companyName) updates.company_name = data.companyName;
    if (data.description) updates.company_description = data.description;
    if (data.mission) updates.website_content = data.mission;
    if (data.brandColors && data.brandColors.length > 0) {
      updates.metadata = { brand_colors: data.brandColors };
    }
    if (data.socialLinks) updates.social_media = data.socialLinks;

    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date().toISOString();

      await supabase
        .from('company_profiles')
        .update(updates)
        .eq('id', companyId);
    }
  }

  private async updateBrainState(userId: string, companyId: string, data: CompanyScrapedData): Promise<void> {
    const aiReadiness = this.calculateAIReadiness(data);

    const brainState = {
      ai_readiness: aiReadiness,
      brand_tone: data.brandTone,
      keywords: data.keywords,
      last_crawl: new Date().toISOString(),
      data_sources: ['website'],
      intelligence_level: this.getIntelligenceLevel(aiReadiness),
    };

    const { data: existing } = await supabase
      .from('company_brain_state')
      .select('id, version')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('company_brain_state')
        .update({
          brain_state: brainState,
          version: (existing.version || 1) + 1,
          last_evolution: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('company_brain_state')
        .insert({
          user_id: userId,
          company_id: companyId,
          brain_state: brainState,
          version: 1,
          last_evolution: new Date().toISOString(),
        });
    }
  }

  private calculateAIReadiness(data: CompanyScrapedData): number {
    let score = 0;

    if (data.companyName) score += 15;
    if (data.description && data.description.length > 100) score += 20;
    if (data.products && data.products.length > 0) score += 15;
    if (data.mission) score += 15;
    if (data.values && data.values.length > 0) score += 10;
    if (data.brandTone) score += 10;
    if (data.brandColors && data.brandColors.length > 0) score += 5;
    if (data.keywords && data.keywords.length > 0) score += 5;
    if (Object.keys(data.socialLinks).length > 0) score += 5;

    return Math.min(100, score);
  }

  private getIntelligenceLevel(readiness: number): string {
    if (readiness >= 90) return 'expert';
    if (readiness >= 70) return 'advanced';
    if (readiness >= 50) return 'intermediate';
    if (readiness >= 30) return 'basic';
    return 'minimal';
  }

  private async generateAIStyleRules(userId: string, companyId: string, data: CompanyScrapedData): Promise<void> {
    const rules = [];

    if (data.brandTone) {
      rules.push({
        user_id: userId,
        company_id: companyId,
        rule_category: 'tone',
        rule: {
          tone: data.brandTone,
          description: `Use a ${data.brandTone} tone in all communications`,
        },
        priority: 10,
        is_active: true,
      });
    }

    if (data.keywords && data.keywords.length > 0) {
      rules.push({
        user_id: userId,
        company_id: companyId,
        rule_category: 'keywords',
        rule: {
          keywords: data.keywords,
          description: 'Key terms to emphasize in messaging',
        },
        priority: 8,
        is_active: true,
      });
    }

    if (data.values && data.values.length > 0) {
      rules.push({
        user_id: userId,
        company_id: companyId,
        rule_category: 'values',
        rule: {
          values: data.values,
          description: 'Company values to highlight',
        },
        priority: 7,
        is_active: true,
      });
    }

    if (rules.length > 0) {
      await supabase.from('company_ai_style_rules').delete().eq('company_id', companyId);

      await supabase.from('company_ai_style_rules').insert(rules);
    }
  }

  async syncUploadedFiles(userId: string, companyId?: string): Promise<void> {
    try {
      const { data: files } = await supabase
        .from('uploaded_files')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!files || files.length === 0) return;

      const extractedContent = files
        .map(f => f.metadata?.extracted_content || '')
        .filter(Boolean)
        .join('\n\n');

      if (companyId && extractedContent) {
        const { data: profile } = await supabase
          .from('company_profiles')
          .select('website_content')
          .eq('id', companyId)
          .maybeSingle();

        const currentContent = profile?.website_content || '';
        if (!currentContent.includes(extractedContent.substring(0, 100))) {
          await supabase
            .from('company_profiles')
            .update({
              website_content: currentContent + '\n\n--- Uploaded Materials ---\n' + extractedContent,
              updated_at: new Date().toISOString(),
            })
            .eq('id', companyId);
        }
      }

      console.log('Uploaded files synced to company brain');
    } catch (error) {
      console.error('Error syncing uploaded files:', error);
    }
  }

  async getBrainReadiness(userId: string, companyId: string): Promise<number> {
    const { data } = await supabase
      .from('company_brain_state')
      .select('brain_state')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .maybeSingle();

    if (!data) return 0;

    const state = data.brain_state as any;
    return state.ai_readiness || 0;
  }
}

export const companyBrainSync = new CompanyBrainSync();
