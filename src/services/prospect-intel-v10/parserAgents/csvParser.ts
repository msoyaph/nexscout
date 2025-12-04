import { DraftProspect } from '../types';

export function parseCSV(csvText: string): DraftProspect[] {
  if (!csvText || !csvText.trim()) return [];

  const lines = csvText.split('\n').filter((l) => l.trim());
  if (lines.length === 0) return [];

  const header = lines[0].toLowerCase();
  const rows = lines.slice(1);

  const colIndexes = {
    name: findColumnIndex(header, ['name', 'full name', 'fullname', 'display name']),
    first: findColumnIndex(header, ['first', 'firstname', 'first name']),
    last: findColumnIndex(header, ['last', 'lastname', 'last name']),
    email: findColumnIndex(header, ['email', 'e-mail', 'emailaddress']),
    phone: findColumnIndex(header, ['phone', 'mobile', 'contact', 'cell']),
    facebook: findColumnIndex(header, ['facebook', 'fb']),
    instagram: findColumnIndex(header, ['instagram', 'ig']),
    linkedin: findColumnIndex(header, ['linkedin', 'li']),
    tiktok: findColumnIndex(header, ['tiktok', 'tt']),
  };

  const prospects: DraftProspect[] = [];

  for (const row of rows) {
    const cols = parseCSVRow(row);
    if (cols.length === 0) continue;

    const p: DraftProspect = {};

    if (colIndexes.name !== -1) {
      p.display_name = cols[colIndexes.name];
    }
    if (colIndexes.first !== -1) {
      p.first_name = cols[colIndexes.first];
    }
    if (colIndexes.last !== -1) {
      p.last_name = cols[colIndexes.last];
    }
    if (colIndexes.email !== -1) {
      const email = cols[colIndexes.email];
      if (email) p.contact_info = { emails: [email] };
    }
    if (colIndexes.phone !== -1) {
      const phone = cols[colIndexes.phone];
      if (phone) {
        p.contact_info = p.contact_info || {};
        p.contact_info.phones = [phone];
      }
    }

    if (colIndexes.facebook !== -1) {
      const fb = cols[colIndexes.facebook];
      if (fb) p.social_handles = { facebook: fb };
    }
    if (colIndexes.instagram !== -1) {
      const ig = cols[colIndexes.instagram];
      if (ig) {
        p.social_handles = p.social_handles || {};
        p.social_handles.instagram = ig;
      }
    }
    if (colIndexes.linkedin !== -1) {
      const li = cols[colIndexes.linkedin];
      if (li) {
        p.social_handles = p.social_handles || {};
        p.social_handles.linkedin = li;
      }
    }
    if (colIndexes.tiktok !== -1) {
      const tt = cols[colIndexes.tiktok];
      if (tt) {
        p.social_handles = p.social_handles || {};
        p.social_handles.tiktok = tt;
      }
    }

    if (p.display_name || p.first_name || p.contact_info || p.social_handles) {
      prospects.push(p);
    }
  }

  return prospects;
}

function findColumnIndex(header: string, candidates: string[]): number {
  const cols = parseCSVRow(header);
  for (let i = 0; i < cols.length; i++) {
    const col = cols[i].toLowerCase().trim();
    if (candidates.some((c) => col.includes(c))) {
      return i;
    }
  }
  return -1;
}

function parseCSVRow(row: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}
