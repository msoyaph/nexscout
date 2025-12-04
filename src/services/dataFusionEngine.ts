import { matchIdentity, findDuplicateGroups } from './identityMatch';
import { calculateScoutScoreV5, ProspectSignals } from './scoutScoreV5';
import { supabase } from '../lib/supabase';

export interface FusionSources {
  screenshotProspects?: any[];
  urlProspects?: any[];
  csvProspects?: any[];
  fbExportProspects?: any[];
  linkedinExportProspects?: any[];
  scrapers?: any[];
  textProspects?: any[];
  browserCaptureProspects?: any[];
}

export interface MergedProspect {
  prospect_id: string;
  name: string;
  mentions: string[];
  raw_sources: Record<string, any>;
  occupations: string[];
  interests: string[];
  signals: string[];
  contact_info: Array<{ type: string; value: string }>;
  social_links: Array<{ platform: string; url: string }>;
  sentiment_indicators: string[];
  topics: string[];
  activities: string[];
  relationship_strength: number;
  scoutScoreV5?: any;
  merged_count: number;
  confidence: number;
}

export async function fuseProspectData({
  scanId,
  sources,
}: {
  scanId: string;
  sources: FusionSources;
}): Promise<MergedProspect[]> {
  console.log('[DataFusion] Starting fusion process for scan:', scanId);

  await updateScanStatus(scanId, 'IDENTITY_MATCHING', 35, 'Matching identities across sources...');

  const allProspects = flattenSources(sources);
  console.log('[DataFusion] Total prospects before deduplication:', allProspects.length);

  const duplicateGroups = findDuplicateGroups(allProspects);
  console.log('[DataFusion] Found', duplicateGroups.length, 'duplicate groups');

  await updateScanStatus(scanId, 'DATA_FUSION', 50, 'Merging duplicate profiles...');

  const merged: MergedProspect[] = [];
  const processed = new Set<number>();

  for (let i = 0; i < allProspects.length; i++) {
    if (processed.has(i)) continue;

    const duplicatesForThis = duplicateGroups.find(group =>
      group.some(p => p === allProspects[i])
    );

    if (duplicatesForThis) {
      const mergedProspect = mergeProfiles(duplicatesForThis);
      merged.push(mergedProspect);

      duplicatesForThis.forEach(dup => {
        const idx = allProspects.indexOf(dup);
        if (idx !== -1) processed.add(idx);
      });
    } else {
      const single = convertToMergedProspect(allProspects[i]);
      merged.push(single);
      processed.add(i);
    }
  }

  console.log('[DataFusion] Merged down to', merged.length, 'unique prospects');

  await updateScanStatus(scanId, 'SCOUTSCORE_V5', 70, 'Calculating ScoutScore V5...');

  for (const prospect of merged) {
    const signals: ProspectSignals = {
      text: extractAllText(prospect),
      occupation: prospect.occupations[0],
      interests: prospect.interests,
      signals: prospect.signals,
      profile: {
        hasOccupation: prospect.occupations.length > 0,
        hasLocation: prospect.contact_info.some(c => c.type === 'location'),
        hasSocialLinks: prospect.social_links.length > 0,
        hasSkills: prospect.interests.length > 0,
      },
    };

    prospect.scoutScoreV5 = calculateScoutScoreV5(signals);
  }

  merged.sort((a, b) => (b.scoutScoreV5?.score || 0) - (a.scoutScoreV5?.score || 0));

  console.log('[DataFusion] ScoutScore V5 calculated for all prospects');

  await updateScanStatus(scanId, 'FINALIZING', 90, 'Finalizing results...');

  return merged;
}

function flattenSources(sources: FusionSources): any[] {
  const all: any[] = [];

  if (sources.screenshotProspects) {
    sources.screenshotProspects.forEach(p => {
      all.push({ ...p, _source: 'screenshot', _sourceType: 'screenshots' });
    });
  }

  if (sources.urlProspects) {
    sources.urlProspects.forEach(p => {
      all.push({ ...p, _source: 'url_scrape', _sourceType: 'social_url' });
    });
  }

  if (sources.csvProspects) {
    sources.csvProspects.forEach(p => {
      all.push({ ...p, _source: 'csv_import', _sourceType: 'files_csv' });
    });
  }

  if (sources.fbExportProspects) {
    sources.fbExportProspects.forEach(p => {
      all.push({ ...p, _source: 'fb_export', _sourceType: 'files_facebook_export' });
    });
  }

  if (sources.linkedinExportProspects) {
    sources.linkedinExportProspects.forEach(p => {
      all.push({ ...p, _source: 'linkedin_export', _sourceType: 'files_linkedin_export' });
    });
  }

  if (sources.scrapers) {
    sources.scrapers.forEach(p => {
      all.push({ ...p, _source: 'scraper_api', _sourceType: 'social_connect' });
    });
  }

  if (sources.textProspects) {
    sources.textProspects.forEach(p => {
      all.push({ ...p, _source: 'manual_text', _sourceType: 'text' });
    });
  }

  if (sources.browserCaptureProspects) {
    sources.browserCaptureProspects.forEach(p => {
      all.push({ ...p, _source: 'browser_capture', _sourceType: 'browser_extension' });
    });
  }

  return all;
}

function mergeProfiles(group: any[]): MergedProspect {
  const mentions: string[] = [];
  const raw_sources: Record<string, any> = {};
  const occupations = new Set<string>();
  const interests = new Set<string>();
  const signals = new Set<string>();
  const contact_info: Array<{ type: string; value: string }> = [];
  const social_links: Array<{ platform: string; url: string }> = [];
  const sentiment_indicators = new Set<string>();
  const topics = new Set<string>();
  const activities = new Set<string>();

  let primaryName = group[0].name;

  for (const prospect of group) {
    if (prospect._source) mentions.push(prospect._source);

    raw_sources[prospect._source || 'unknown'] = prospect;

    if (prospect.occupation) {
      occupations.add(prospect.occupation);
    }

    if (prospect.interests) {
      prospect.interests.forEach((i: string) => interests.add(i));
    }

    if (prospect.signals) {
      prospect.signals.forEach((s: string) => signals.add(s));
    }

    if (prospect.keywords) {
      prospect.keywords.forEach((k: string) => signals.add(k));
    }

    if (prospect.email) {
      contact_info.push({ type: 'email', value: prospect.email });
    }

    if (prospect.phone) {
      contact_info.push({ type: 'phone', value: prospect.phone });
    }

    if (prospect.location) {
      contact_info.push({ type: 'location', value: prospect.location });
    }

    if (prospect.url || prospect.social_url) {
      const url = prospect.url || prospect.social_url;
      const platform = detectPlatform(url);
      social_links.push({ platform, url });
    }

    extractSignalsFromText(prospect, signals, topics, activities, sentiment_indicators);
  }

  const merged: MergedProspect = {
    prospect_id: generateProspectId(),
    name: primaryName,
    mentions: [...new Set(mentions)],
    raw_sources,
    occupations: Array.from(occupations),
    interests: Array.from(interests),
    signals: Array.from(signals),
    contact_info: deduplicateContacts(contact_info),
    social_links: deduplicateSocialLinks(social_links),
    sentiment_indicators: Array.from(sentiment_indicators),
    topics: Array.from(topics),
    activities: Array.from(activities),
    relationship_strength: 0,
    merged_count: group.length,
    confidence: group.length >= 3 ? 0.95 : group.length === 2 ? 0.85 : 0.7,
  };

  return merged;
}

function convertToMergedProspect(prospect: any): MergedProspect {
  const signals = new Set<string>();
  const topics = new Set<string>();
  const activities = new Set<string>();
  const sentiment_indicators = new Set<string>();

  extractSignalsFromText(prospect, signals, topics, activities, sentiment_indicators);

  return {
    prospect_id: generateProspectId(),
    name: prospect.name,
    mentions: [prospect._source || 'unknown'],
    raw_sources: { [prospect._source || 'unknown']: prospect },
    occupations: prospect.occupation ? [prospect.occupation] : [],
    interests: prospect.interests || prospect.keywords || [],
    signals: Array.from(signals),
    contact_info: buildContactInfo(prospect),
    social_links: buildSocialLinks(prospect),
    sentiment_indicators: Array.from(sentiment_indicators),
    topics: Array.from(topics),
    activities: Array.from(activities),
    relationship_strength: 0,
    merged_count: 1,
    confidence: 0.7,
  };
}

function extractSignalsFromText(
  prospect: any,
  signals: Set<string>,
  topics: Set<string>,
  activities: Set<string>,
  sentiment: Set<string>
) {
  const text = (prospect.text || prospect.content || prospect.bio || '').toLowerCase();

  const intentKeywords = [
    'extra income',
    'negosyo',
    'insurance',
    'side hustle',
    'passive income',
    'online selling',
    'business',
    'investment',
  ];

  intentKeywords.forEach(keyword => {
    if (text.includes(keyword)) signals.add(keyword);
  });

  const painKeywords = ['pagod', 'kulang', 'hirap', 'stress', 'burnout', 'salary'];
  painKeywords.forEach(keyword => {
    if (text.includes(keyword)) sentiment.add(keyword);
  });

  const topicKeywords = ['call center', 'ofw', 'homebased', 'freelance', 'entrepreneur'];
  topicKeywords.forEach(keyword => {
    if (text.includes(keyword)) topics.add(keyword);
  });

  const activityKeywords = ['looking for', 'interested in', 'ready to', 'want to'];
  activityKeywords.forEach(keyword => {
    if (text.includes(keyword)) activities.add(keyword);
  });
}

function buildContactInfo(prospect: any): Array<{ type: string; value: string }> {
  const contacts: Array<{ type: string; value: string }> = [];

  if (prospect.email) contacts.push({ type: 'email', value: prospect.email });
  if (prospect.phone) contacts.push({ type: 'phone', value: prospect.phone });
  if (prospect.location) contacts.push({ type: 'location', value: prospect.location });

  return contacts;
}

function buildSocialLinks(prospect: any): Array<{ platform: string; url: string }> {
  const links: Array<{ platform: string; url: string }> = [];

  if (prospect.url || prospect.social_url) {
    const url = prospect.url || prospect.social_url;
    links.push({ platform: detectPlatform(url), url });
  }

  return links;
}

function detectPlatform(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes('facebook.com') || lower.includes('fb.com')) return 'facebook';
  if (lower.includes('instagram.com')) return 'instagram';
  if (lower.includes('twitter.com') || lower.includes('x.com')) return 'twitter';
  if (lower.includes('linkedin.com')) return 'linkedin';
  if (lower.includes('tiktok.com')) return 'tiktok';
  return 'unknown';
}

function deduplicateContacts(
  contacts: Array<{ type: string; value: string }>
): Array<{ type: string; value: string }> {
  const seen = new Set<string>();
  return contacts.filter(c => {
    const key = `${c.type}:${c.value}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function deduplicateSocialLinks(
  links: Array<{ platform: string; url: string }>
): Array<{ platform: string; url: string }> {
  const seen = new Set<string>();
  return links.filter(l => {
    if (seen.has(l.url)) return false;
    seen.add(l.url);
    return true;
  });
}

function extractAllText(prospect: MergedProspect): string {
  const parts: string[] = [];

  parts.push(prospect.name);
  parts.push(...prospect.occupations);
  parts.push(...prospect.interests);
  parts.push(...prospect.signals);
  parts.push(...prospect.topics);

  Object.values(prospect.raw_sources).forEach((source: any) => {
    if (source.text) parts.push(source.text);
    if (source.content) parts.push(source.content);
    if (source.bio) parts.push(source.bio);
  });

  return parts.join(' ');
}

function generateProspectId(): string {
  return `prospect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function updateScanStatus(
  scanId: string,
  step: string,
  percent: number,
  message: string
): Promise<void> {
  await supabase.from('scan_status').upsert({
    scan_id: scanId,
    step,
    percent,
    message,
    updated_at: new Date().toISOString(),
  });
}

export async function saveFusedProspects(
  scanId: string,
  prospects: MergedProspect[]
): Promise<void> {
  console.log('[DataFusion] Saving', prospects.length, 'fused prospects to database');

  for (const prospect of prospects) {
    await supabase.from('scan_processed_items').insert({
      scan_id: scanId,
      type: 'fused_prospect',
      name: prospect.name,
      score: prospect.scoutScoreV5?.score || 50,
      content: JSON.stringify({
        mentions: prospect.mentions,
        merged_count: prospect.merged_count,
        confidence: prospect.confidence,
      }),
      metadata: {
        occupations: prospect.occupations,
        interests: prospect.interests,
        signals: prospect.signals,
        scoutScoreV5: prospect.scoutScoreV5,
        contact_info: prospect.contact_info,
        social_links: prospect.social_links,
      },
    });
  }

  const hotLeads = prospects.filter(p => (p.scoutScoreV5?.score || 0) >= 70).length;
  const warmLeads = prospects.filter(
    p => (p.scoutScoreV5?.score || 0) >= 50 && (p.scoutScoreV5?.score || 0) < 70
  ).length;
  const coldLeads = prospects.filter(p => (p.scoutScoreV5?.score || 0) < 50).length;

  await supabase
    .from('scans')
    .update({
      total_items: prospects.length,
      hot_leads: hotLeads,
      warm_leads: warmLeads,
      cold_leads: coldLeads,
    })
    .eq('id', scanId);

  console.log('[DataFusion] Saved successfully');
}
