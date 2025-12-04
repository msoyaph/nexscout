import { DraftProspect } from '../types';

export function normalizeProspects(drafts: DraftProspect[]): DraftProspect[] {
  const normalized: DraftProspect[] = [];

  for (const draft of drafts) {
    const n: DraftProspect = {};

    if (draft.display_name) {
      n.display_name = normalizeString(draft.display_name);
    }
    if (draft.first_name) {
      n.first_name = normalizeString(draft.first_name);
    }
    if (draft.last_name) {
      n.last_name = normalizeString(draft.last_name);
    }

    if (draft.contact_info) {
      n.contact_info = {};
      if (draft.contact_info.emails) {
        n.contact_info.emails = draft.contact_info.emails
          .map((e) => e.toLowerCase().trim())
          .filter((e) => isValidEmail(e));
      }
      if (draft.contact_info.phones) {
        n.contact_info.phones = draft.contact_info.phones
          .map((p) => normalizePhone(p))
          .filter((p) => p.length > 0);
      }
    }

    if (draft.social_handles) {
      n.social_handles = {};
      if (draft.social_handles.facebook) {
        n.social_handles.facebook = normalizeSocialHandle(
          draft.social_handles.facebook
        );
      }
      if (draft.social_handles.instagram) {
        n.social_handles.instagram = normalizeSocialHandle(
          draft.social_handles.instagram
        );
      }
      if (draft.social_handles.linkedin) {
        n.social_handles.linkedin = normalizeSocialHandle(
          draft.social_handles.linkedin
        );
      }
      if (draft.social_handles.tiktok) {
        n.social_handles.tiktok = normalizeSocialHandle(
          draft.social_handles.tiktok
        );
      }
    }

    if (draft.source_refs) {
      n.source_refs = draft.source_refs;
    }

    normalized.push(n);
  }

  return normalized;
}

function normalizeString(s: string): string {
  return s
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '+63' + cleaned.slice(1);
  }
  return cleaned;
}

function normalizeSocialHandle(handle: string): string {
  return handle
    .replace(/^@/, '')
    .replace(/\/$/, '')
    .trim()
    .toLowerCase();
}
