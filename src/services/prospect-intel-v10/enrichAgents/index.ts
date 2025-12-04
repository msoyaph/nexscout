import { DraftProspect } from '../types';
import { matchEntities } from './entityMatcher';
import { normalizeProspects } from './normalizer';

export async function runEnrichment(
  userId: string,
  drafts: DraftProspect[]
): Promise<DraftProspect[]> {
  let enriched = normalizeProspects(drafts);
  enriched = await matchEntities(userId, enriched);
  return enriched;
}
