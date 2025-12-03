import { supabase } from '../lib/supabase';
import { companyMultiSiteCrawler, MultiSiteData, MergedCompanyData } from './companyMultiSiteCrawler';
import { companyKnowledgeGraphBuilder, CompanyKnowledgeGraph } from './companyKnowledgeGraph';
import { companyEmbeddingEngine } from './companyEmbeddingEngine';
import { companyBrainSync } from './companyBrainSync';

export class CompanyIntelligenceEngineV4 {
  async processCompanyFull(
    userId: string,
    urls: {
      website?: string;
      facebook?: string;
      youtube?: string;
      linkedin?: string;
    },
    companyName: string
  ): Promise<{ globalCompanyId: string; knowledgeGraph: CompanyKnowledgeGraph }> {
    const multiSiteData = await companyMultiSiteCrawler.crawlMultiSite(urls);

    const globalCompanyId = await this.saveToGlobalRegistry(multiSiteData.merged, urls);

    await this.saveMultiSiteData(globalCompanyId, multiSiteData);

    const knowledgeGraph = companyKnowledgeGraphBuilder.buildKnowledgeGraph(multiSiteData.merged);
    await companyKnowledgeGraphBuilder.saveKnowledgeGraph(globalCompanyId, knowledgeGraph);

    await this.updateGlobalCompanyWithGraph(globalCompanyId, knowledgeGraph);

    await this.linkUserToGlobalCompany(userId, globalCompanyId);

    return { globalCompanyId, knowledgeGraph };
  }

  async searchGlobalCompanies(query: string, limit: number = 10): Promise<any[]> {
    const normalized = query.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();

    const { data: directMatches } = await supabase
      .from('global_companies')
      .select('*')
      .or(`normalized_name.ilike.%${normalized}%,display_name.ilike.%${query}%`)
      .limit(limit);

    const { data: aliasMatches } = await supabase
      .from('company_aliases')
      .select('company_id, global_companies(*)')
      .ilike('normalized_alias', `%${normalized}%`)
      .limit(limit);

    const companies = new Map();

    directMatches?.forEach(company => {
      companies.set(company.id, company);
    });

    aliasMatches?.forEach((alias: any) => {
      if (alias.global_companies) {
        companies.set(alias.company_id, alias.global_companies);
      }
    });

    return Array.from(companies.values());
  }

  async getGlobalCompany(companyId: string): Promise<any> {
    const { data, error } = await supabase
      .from('global_companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (error) throw error;
    return data;
  }

  async getUserCompany(userId: string): Promise<any | null> {
    const { data: link } = await supabase
      .from('user_company_links')
      .select('company_id, global_companies(*)')
      .eq('user_id', userId)
      .eq('is_primary', true)
      .maybeSingle();

    return link?.global_companies || null;
  }

  async autoPopulateUserProfile(userId: string, companyId: string): Promise<void> {
    const company = await this.getGlobalCompany(companyId);

    const { data: profile } = await supabase
      .from('company_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    const profileData = {
      user_id: userId,
      company_name: company.display_name,
      company_domain: company.website,
      company_description: company.description,
      industry: company.industry,
      website_content: company.json_data?.mission || '',
      value_propositions: company.json_data?.uniqueSellingPoints || [],
      target_audience: company.json_data?.targetAudience?.[0] || '',
      social_media: {
        website: company.website,
        facebook: company.fb_page,
        linkedin: company.linkedin_page,
        youtube: company.youtube_link,
      },
      logo_url: company.logo_url,
    };

    if (profile) {
      await supabase
        .from('company_profiles')
        .update(profileData)
        .eq('id', profile.id);
    } else {
      await supabase.from('company_profiles').insert(profileData);
    }

    await this.linkUserToGlobalCompany(userId, companyId);

    await supabase
      .from('global_companies')
      .update({ times_used: (company.times_used || 0) + 1 })
      .eq('id', companyId);
  }

  async enhanceAIContext(userId: string, companyId: string): Promise<string> {
    const company = await this.getGlobalCompany(companyId);
    const knowledgeGraph = await companyKnowledgeGraphBuilder.getKnowledgeGraph(companyId);

    let context = `Company: ${company.display_name}\n`;
    context += `Industry: ${company.industry}\n`;
    context += `Description: ${company.description}\n\n`;

    if (company.json_data?.mission) {
      context += `Mission: ${company.json_data.mission}\n`;
    }

    if (company.json_data?.uniqueSellingPoints) {
      context += `\nUnique Selling Points:\n`;
      company.json_data.uniqueSellingPoints.forEach((usp: string) => {
        context += `- ${usp}\n`;
      });
    }

    if (knowledgeGraph) {
      context += `\nPositioning: ${knowledgeGraph.insights.positioning_summary}\n`;

      if (knowledgeGraph.insights.benefit_chains.length > 0) {
        context += `\nValue Propositions:\n`;
        knowledgeGraph.insights.benefit_chains.forEach(chain => {
          context += `- Solves: ${chain.pain} → Delivers: ${chain.benefit}\n`;
        });
      }
    }

    return context;
  }

  private async saveToGlobalRegistry(data: MergedCompanyData, urls: any): Promise<string> {
    const existing = await this.searchGlobalCompanies(data.companyName, 1);

    if (existing.length > 0) {
      const companyId = existing[0].id;

      await supabase
        .from('global_companies')
        .update({
          display_name: data.displayName,
          website: urls.website || existing[0].website,
          fb_page: urls.facebook || existing[0].fb_page,
          linkedin_page: urls.linkedin || existing[0].linkedin_page,
          youtube_link: urls.youtube || existing[0].youtube_link,
          industry: data.industry || existing[0].industry,
          description: data.description || existing[0].description,
          json_data: data,
          crawl_quality: data.crawlQuality,
          data_sources: data.dataSources,
          last_crawled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', companyId);

      return companyId;
    }

    const { data: newCompany, error } = await supabase
      .from('global_companies')
      .insert({
        normalized_name: data.normalizedName,
        display_name: data.displayName,
        website: urls.website,
        fb_page: urls.facebook,
        linkedin_page: urls.linkedin,
        youtube_link: urls.youtube,
        industry: data.industry,
        description: data.description,
        json_data: data,
        crawl_quality: data.crawlQuality,
        data_sources: data.dataSources,
        last_crawled_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) throw error;

    const aliases = this.generateAliases(data.displayName);
    await this.saveAliases(newCompany.id, aliases);

    return newCompany.id;
  }

  private async saveMultiSiteData(companyId: string, multiSiteData: MultiSiteData): Promise<void> {
    const platforms = [
      { platform: 'website', data: multiSiteData.website, url: multiSiteData.merged.channels.website },
      { platform: 'facebook', data: multiSiteData.facebook, url: multiSiteData.merged.channels.facebook },
      { platform: 'youtube', data: multiSiteData.youtube, url: multiSiteData.merged.channels.youtube },
      { platform: 'linkedin', data: multiSiteData.linkedin, url: multiSiteData.merged.channels.linkedin },
    ];

    for (const { platform, data, url } of platforms) {
      if (data && url) {
        await supabase
          .from('company_multi_site_data')
          .upsert({
            company_id: companyId,
            platform,
            url,
            scraped_data: data,
            raw_content: JSON.stringify(data),
            scrape_quality: 80,
            last_scraped_at: new Date().toISOString(),
          });
      }
    }
  }

  private async updateGlobalCompanyWithGraph(companyId: string, graph: CompanyKnowledgeGraph): Promise<void> {
    await supabase
      .from('global_companies')
      .update({
        knowledge_graph: graph,
        embeddings_ready: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', companyId);
  }

  private async linkUserToGlobalCompany(userId: string, companyId: string): Promise<void> {
    await supabase
      .from('user_company_links')
      .upsert({
        user_id: userId,
        company_id: companyId,
        is_primary: true,
        linked_at: new Date().toISOString(),
      });
  }

  private generateAliases(companyName: string): string[] {
    const aliases: string[] = [];
    const name = companyName.trim();

    aliases.push(name.replace(/\s+/g, ''));
    aliases.push(name.replace(/,?\s+(Inc|LLC|Ltd|Corp|Corporation|Company|Co)\.*$/i, ''));
    aliases.push(name.split(' ')[0]);

    const words = name.split(' ');
    if (words.length > 1) {
      aliases.push(words.slice(0, 2).join(' '));
    }

    return [...new Set(aliases)].filter(a => a.length > 2);
  }

  private async saveAliases(companyId: string, aliases: string[]): Promise<void> {
    const aliasRecords = aliases.map(alias => ({
      company_id: companyId,
      alias_name: alias,
      normalized_alias: alias.toLowerCase().replace(/[^a-z0-9]/g, ''),
      alias_type: 'auto',
    }));

    if (aliasRecords.length > 0) {
      await supabase.from('company_aliases').insert(aliasRecords);
    }
  }
}

export const companyIntelligenceEngineV4 = new CompanyIntelligenceEngineV4();
