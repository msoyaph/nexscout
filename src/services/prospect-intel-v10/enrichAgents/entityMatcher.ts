import { supabase } from '../../../lib/supabase';
import { DraftProspect } from '../types';

export async function matchEntities(
  userId: string,
  drafts: DraftProspect[]
): Promise<DraftProspect[]> {
  if (drafts.length === 0) return drafts;

  const { data: existingEntities } = await supabase
    .from('prospect_entities')
    .select('*')
    .eq('user_id', userId);

  if (!existingEntities || existingEntities.length === 0) {
    return drafts;
  }

  const enriched = drafts.map((draft) => {
    const matches = existingEntities.filter((entity) => {
      if (draft.contact_info?.emails && entity.emails) {
        const draftEmails = draft.contact_info.emails;
        const entityEmails = entity.emails as string[];
        if (draftEmails.some((e) => entityEmails.includes(e))) {
          return true;
        }
      }

      if (draft.contact_info?.phones && entity.phones) {
        const draftPhones = draft.contact_info.phones;
        const entityPhones = entity.phones as string[];
        if (draftPhones.some((p) => entityPhones.includes(p))) {
          return true;
        }
      }

      if (draft.social_handles?.facebook && entity.facebook_handle) {
        if (draft.social_handles.facebook === entity.facebook_handle) {
          return true;
        }
      }

      if (draft.social_handles?.instagram && entity.instagram_handle) {
        if (draft.social_handles.instagram === entity.instagram_handle) {
          return true;
        }
      }

      if (draft.social_handles?.linkedin && entity.linkedin_handle) {
        if (draft.social_handles.linkedin === entity.linkedin_handle) {
          return true;
        }
      }

      if (draft.display_name && entity.display_name) {
        if (
          draft.display_name.toLowerCase() === entity.display_name.toLowerCase()
        ) {
          return true;
        }
      }

      return false;
    });

    if (matches.length > 0) {
      const match = matches[0];
      return {
        ...draft,
        source_refs: [match.id],
      };
    }

    return draft;
  });

  return enriched;
}
