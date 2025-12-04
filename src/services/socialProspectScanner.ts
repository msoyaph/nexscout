import { supabase } from '../lib/supabase';
import { SocialProvider } from '../auth/socialAuth';

export interface ScanProgress {
  status: 'starting' | 'fetching' | 'processing' | 'enriching' | 'completed' | 'error';
  message: string;
  progress: number;
  itemsProcessed: number;
  prospectsFound: number;
}

export interface ScanResult {
  success: boolean;
  jobId?: string;
  prospectsFound?: number;
  error?: string;
}

interface SocialConnection {
  name: string;
  username: string;
  profileUrl: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  followersCount?: number;
  followingCount?: number;
  mutualFriends?: number;
  recentActivity?: string;
}

export class SocialProspectScanner {
  private onProgress?: (progress: ScanProgress) => void;

  constructor(progressCallback?: (progress: ScanProgress) => void) {
    this.onProgress = progressCallback;
  }

  private reportProgress(
    status: ScanProgress['status'],
    message: string,
    progress: number,
    itemsProcessed: number = 0,
    prospectsFound: number = 0
  ) {
    if (this.onProgress) {
      this.onProgress({ status, message, progress, itemsProcessed, prospectsFound });
    }
    console.log(`[Social Scanner] ${status}: ${message} (${progress}%)`);
  }

  async scanProvider(
    userId: string,
    provider: SocialProvider,
    socialIdentityId: string
  ): Promise<ScanResult> {
    try {
      this.reportProgress('starting', `Initializing ${provider} scan...`, 0);

      // Create scan job
      const { data: job, error: jobError } = await supabase
        .from('social_scan_jobs')
        .insert({
          user_id: userId,
          social_identity_id: socialIdentityId,
          provider,
          scan_type: 'connections',
          status: 'running',
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (jobError || !job) {
        throw new Error('Failed to create scan job');
      }

      this.reportProgress('fetching', `Fetching connections from ${provider}...`, 10);

      // Fetch connections from platform
      const connections = await this.fetchConnections(provider, socialIdentityId);

      // Update job with total items
      await supabase
        .from('social_scan_jobs')
        .update({ total_items: connections.length })
        .eq('id', job.id);

      this.reportProgress('processing', `Processing ${connections.length} connections...`, 30);

      // Process each connection
      let prospectsCreated = 0;
      for (let i = 0; i < connections.length; i++) {
        const connection = connections[i];

        try {
          await this.processConnection(userId, job.id, provider, connection);
          prospectsCreated++;

          const progress = 30 + Math.floor((i / connections.length) * 40);
          this.reportProgress('processing', `Processing connection ${i + 1} of ${connections.length}...`, progress, i + 1, prospectsCreated);
        } catch (error) {
          console.error('Error processing connection:', error);
        }
      }

      this.reportProgress('enriching', 'Enriching prospect data with AI...', 75);

      // Enrich prospects
      await this.enrichProspects(job.id);

      this.reportProgress('enriching', 'Converting to scannable prospects...', 90);

      // Convert to prospects table
      const convertedCount = await this.convertToProspects(userId, job.id);

      // Complete job
      await supabase
        .from('social_scan_jobs')
        .update({
          status: 'completed',
          processed_items: connections.length,
          prospects_found: convertedCount,
          completed_at: new Date().toISOString(),
          results_summary: {
            total_connections: connections.length,
            prospects_created: convertedCount,
            success_rate: Math.round((convertedCount / connections.length) * 100),
          },
        })
        .eq('id', job.id);

      this.reportProgress('completed', `Successfully scanned ${convertedCount} prospects!`, 100, connections.length, convertedCount);

      return {
        success: true,
        jobId: job.id,
        prospectsFound: convertedCount,
      };

    } catch (error: any) {
      console.error('Scan error:', error);

      this.reportProgress('error', error.message || 'Scan failed', 0);

      return {
        success: false,
        error: error.message || 'Unknown error occurred',
      };
    }
  }

  private async fetchConnections(provider: SocialProvider, socialIdentityId: string): Promise<SocialConnection[]> {
    // In production, this would call the actual social media APIs
    // For now, generate realistic mock data

    const mockData = this.generateMockConnections(provider);

    return mockData;
  }

  private generateMockConnections(provider: SocialProvider): SocialConnection[] {
    const firstNames = ['Maria', 'Juan', 'Ana', 'Carlos', 'Sofia', 'Miguel', 'Isabel', 'Roberto', 'Carmen', 'Luis', 'Elena', 'Diego', 'Rosa', 'Fernando', 'Patricia'];
    const lastNames = ['Santos', 'Cruz', 'Reyes', 'Garcia', 'Martinez', 'Rodriguez', 'Lopez', 'Gonzalez', 'Hernandez', 'Perez', 'Sanchez', 'Ramirez', 'Torres', 'Flores', 'Rivera'];

    const bios = [
      'Entrepreneur | Digital Marketer | Helping people achieve financial freedom',
      'Health & Wellness Advocate | Fitness Coach | Living my best life',
      'Business Owner | Network Marketing Professional | DM me for opportunities',
      'Mom of 3 | Home-based Business | Building my empire one day at a time',
      'Financial Consultant | Helping families secure their future',
      'Lifestyle Coach | Empowering others to live their dreams',
      'Product Distributor | Join my team and change your life',
      'Work from home | Travel the world | Living the dream',
      'Building passive income | Financial freedom seeker',
      'Mentor | Leader | Building a legacy for my family',
    ];

    const locations = ['Manila', 'Quezon City', 'Cebu', 'Davao', 'Makati', 'Pasig', 'Taguig', 'Mandaluyong', 'Caloocan', 'Las Piñas'];

    const count = Math.floor(Math.random() * 30) + 20; // 20-50 connections

    return Array.from({ length: count }, (_, i) => {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const fullName = `${firstName} ${lastName}`;
      const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${Math.floor(Math.random() * 999)}`;

      return {
        name: fullName,
        username,
        profileUrl: `https://${provider}.com/${username}`,
        avatarUrl: `https://i.pravatar.cc/150?u=${username}`,
        bio: Math.random() > 0.3 ? bios[Math.floor(Math.random() * bios.length)] : undefined,
        location: Math.random() > 0.5 ? locations[Math.floor(Math.random() * locations.length)] : undefined,
        followersCount: Math.floor(Math.random() * 5000) + 100,
        followingCount: Math.floor(Math.random() * 2000) + 50,
        mutualFriends: Math.floor(Math.random() * 20) + 1,
        recentActivity: Math.random() > 0.7 ? 'Active in last 24 hours' : undefined,
      };
    });
  }

  private async processConnection(
    userId: string,
    jobId: string,
    provider: SocialProvider,
    connection: SocialConnection
  ): Promise<void> {
    await supabase.from('social_prospects_raw').insert({
      scan_job_id: jobId,
      user_id: userId,
      provider,
      platform_user_id: connection.username,
      name: connection.name,
      username: connection.username,
      profile_url: connection.profileUrl,
      avatar_url: connection.avatarUrl,
      bio: connection.bio,
      location: connection.location,
      followers_count: connection.followersCount,
      following_count: connection.followingCount,
      raw_data: {
        ...connection,
        scraped_at: new Date().toISOString(),
      },
      processed: false,
    });
  }

  private async enrichProspects(jobId: string): Promise<void> {
    const { data: rawProspects } = await supabase
      .from('social_prospects_raw')
      .select('*')
      .eq('scan_job_id', jobId);

    if (!rawProspects) return;

    for (const prospect of rawProspects) {
      const enrichment = this.generateEnrichment(prospect);

      await supabase.from('social_prospect_enrichment').insert({
        social_prospect_id: prospect.id,
        detected_interests: enrichment.interests,
        detected_pain_points: enrichment.painPoints,
        detected_lifestyle: enrichment.lifestyle,
        business_indicators: enrichment.businessIndicators,
        engagement_score: enrichment.engagementScore,
        quality_score: enrichment.qualityScore,
        mlm_affinity_score: enrichment.mlmAffinityScore,
        ai_summary: enrichment.summary,
        recommended_approach: enrichment.approach,
      });
    }
  }

  private generateEnrichment(prospect: any): any {
    const bio = prospect.bio?.toLowerCase() || '';
    const interests: string[] = [];
    const painPoints: string[] = [];
    const lifestyle: string[] = [];
    const businessIndicators: string[] = [];

    // Detect interests
    if (bio.match(/health|wellness|fitness/)) interests.push('Health & Wellness');
    if (bio.match(/business|entrepreneur/)) interests.push('Business');
    if (bio.match(/travel|adventure/)) interests.push('Travel');
    if (bio.match(/family|mom|dad/)) interests.push('Family');
    if (bio.match(/financial|money|income/)) interests.push('Finance');

    // Detect pain points
    if (bio.match(/looking for|seeking|want to/)) painPoints.push('Seeking opportunities');
    if (bio.match(/tired|frustrated|stuck/)) painPoints.push('Career dissatisfaction');
    if (bio.match(/debt|bills|expenses/)) painPoints.push('Financial pressure');
    if (bio.match(/time|freedom|flexible/)) painPoints.push('Work-life balance');

    // Detect lifestyle
    if (bio.match(/home.*based|work.*from.*home|remote/)) lifestyle.push('Work from home');
    if (bio.match(/entrepreneur|business.*owner/)) lifestyle.push('Entrepreneurial');
    if (bio.match(/mom|dad|parent/)) lifestyle.push('Parent');
    if (bio.match(/travel|nomad/)) lifestyle.push('Traveler');

    // Detect business indicators
    if (bio.match(/network marketing|mlm|direct selling/)) businessIndicators.push('MLM Experience');
    if (bio.match(/team|leader|mentor|coach/)) businessIndicators.push('Leadership');
    if (bio.match(/dm|message|contact me/)) businessIndicators.push('Open to opportunities');
    if (bio.match(/join|opportunity|business/)) businessIndicators.push('Actively recruiting');

    const engagementScore = Math.min(100, Math.round(
      (prospect.followers_count || 0) / 50 +
      (prospect.following_count || 0) / 20 +
      (prospect.bio ? 20 : 0)
    ));

    const mlmAffinityScore = Math.min(100, Math.round(
      businessIndicators.length * 25 +
      (bio.match(/network marketing|mlm/i) ? 50 : 0)
    ));

    const qualityScore = Math.round((engagementScore + mlmAffinityScore + (interests.length * 10)) / 3);

    return {
      interests,
      painPoints,
      lifestyle,
      businessIndicators,
      engagementScore,
      qualityScore,
      mlmAffinityScore,
      summary: this.generateSummary(prospect, interests, painPoints),
      approach: this.generateApproach(interests, painPoints, businessIndicators),
    };
  }

  private generateSummary(prospect: any, interests: string[], painPoints: string[]): string {
    let summary = `${prospect.name} is a `;

    if (interests.length > 0) {
      summary += `${interests.join(' & ')} enthusiast `;
    } else {
      summary += 'potential prospect ';
    }

    if (prospect.location) {
      summary += `based in ${prospect.location} `;
    }

    if (painPoints.length > 0) {
      summary += `who may be ${painPoints[0].toLowerCase()}.`;
    } else {
      summary += 'with growth potential.';
    }

    return summary;
  }

  private generateApproach(interests: string[], painPoints: string[], businessIndicators: string[]): string {
    if (businessIndicators.includes('MLM Experience')) {
      return 'Lead with business opportunity and compensation plan. They have MLM experience.';
    }

    if (interests.includes('Business')) {
      return 'Focus on entrepreneurship and financial freedom. Highlight success stories.';
    }

    if (painPoints.includes('Financial pressure')) {
      return 'Emphasize additional income streams and financial security.';
    }

    if (interests.includes('Health & Wellness')) {
      return 'Lead with product benefits and health transformation stories.';
    }

    return 'Build relationship first. Share lifestyle and community benefits.';
  }

  private async convertToProspects(userId: string, jobId: string): Promise<number> {
    const { data: rawProspects } = await supabase
      .from('social_prospects_raw')
      .select(`
        *,
        social_prospect_enrichment (*)
      `)
      .eq('scan_job_id', jobId)
      .eq('processed', false);

    if (!rawProspects || rawProspects.length === 0) return 0;

    let convertedCount = 0;

    for (const raw of rawProspects) {
      try {
        const enrichment = (raw as any).social_prospect_enrichment?.[0];

        const { data: prospect, error } = await supabase
          .from('prospects')
          .insert({
            user_id: userId,
            name: raw.name,
            email: `${raw.username}@social.placeholder`,
            phone: '',
            source: `social_${raw.provider}`,
            status: 'new',
            scout_score: enrichment?.quality_score || 50,
            tags: [
              ...(enrichment?.detected_interests || []),
              ...(enrichment?.business_indicators || []),
              raw.provider,
            ],
            metadata: {
              social_profile_url: raw.profile_url,
              social_username: raw.username,
              social_provider: raw.provider,
              followers: raw.followers_count,
              bio: raw.bio,
              location: raw.location,
              enrichment: enrichment ? {
                interests: enrichment.detected_interests,
                pain_points: enrichment.detected_pain_points,
                mlm_affinity: enrichment.mlm_affinity_score,
                recommended_approach: enrichment.recommended_approach,
              } : null,
            },
          })
          .select()
          .single();

        if (!error && prospect) {
          // Link back to social prospect
          await supabase
            .from('social_prospects_raw')
            .update({ processed: true, prospect_id: prospect.id })
            .eq('id', raw.id);

          if (enrichment) {
            await supabase
              .from('social_prospect_enrichment')
              .update({ prospect_id: prospect.id })
              .eq('id', enrichment.id);
          }

          convertedCount++;
        }
      } catch (error) {
        console.error('Error converting prospect:', error);
      }
    }

    return convertedCount;
  }
}

// Export both the class and a default instance
export const socialProspectScanner = new SocialProspectScanner();
export { SocialProspectScanner };
