import { DraftProspect } from '../types';

export function parseText(text: string): DraftProspect[] {
  if (!text || !text.trim()) return [];

  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  const prospects: DraftProspect[] = [];

  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const phoneRegex = /(\+63|0)\d{10}|\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g;

  for (const line of lines) {
    const p: DraftProspect = {};

    const emails = line.match(emailRegex);
    if (emails && emails.length > 0) {
      p.contact_info = { emails };
    }

    const phones = line.match(phoneRegex);
    if (phones && phones.length > 0) {
      p.contact_info = p.contact_info || {};
      p.contact_info.phones = phones;
    }

    if (line.includes('facebook.com/') || line.includes('fb.me/')) {
      const fbMatch = line.match(/(?:facebook\.com\/|fb\.me\/)([A-Za-z0-9.]+)/);
      if (fbMatch) {
        p.social_handles = { facebook: fbMatch[1] };
      }
    }

    if (line.includes('instagram.com/')) {
      const igMatch = line.match(/instagram\.com\/([A-Za-z0-9._]+)/);
      if (igMatch) {
        p.social_handles = p.social_handles || {};
        p.social_handles.instagram = igMatch[1];
      }
    }

    if (line.includes('linkedin.com/in/')) {
      const liMatch = line.match(/linkedin\.com\/in\/([A-Za-z0-9-]+)/);
      if (liMatch) {
        p.social_handles = p.social_handles || {};
        p.social_handles.linkedin = liMatch[1];
      }
    }

    if (line.includes('tiktok.com/@')) {
      const ttMatch = line.match(/tiktok\.com\/@([A-Za-z0-9._]+)/);
      if (ttMatch) {
        p.social_handles = p.social_handles || {};
        p.social_handles.tiktok = ttMatch[1];
      }
    }

    const nameMatch = line.match(/^([A-Z][a-z]+(?: [A-Z][a-z]+)+)/);
    if (nameMatch) {
      p.display_name = nameMatch[1];
    }

    if (p.display_name || p.contact_info || p.social_handles) {
      prospects.push(p);
    }
  }

  return prospects;
}
