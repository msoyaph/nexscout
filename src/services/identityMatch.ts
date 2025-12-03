export interface IdentityMatchResult {
  score: number;
  confidence: 'high' | 'medium' | 'low';
  method: string;
  details: string;
}

export function matchIdentity(a: any, b: any): number {
  if (!a?.name || !b?.name) return 0;

  const nameA = a.name.trim();
  const nameB = b.name.trim();

  if (nameA === nameB) return 0.99;

  const lowerA = nameA.toLowerCase();
  const lowerB = nameB.toLowerCase();

  if (lowerA === lowerB) return 0.95;

  const partsA = lowerA.split(/\s+/);
  const partsB = lowerB.split(/\s+/);

  if (partsA[0] === partsB[0] && partsA.length > 1 && partsB.length > 1) {
    const lastA = partsA[partsA.length - 1];
    const lastB = partsB[partsB.length - 1];
    if (lastA === lastB) return 0.88;
    return 0.65;
  }

  const filipinoSuffixes = ['jr', 'jr.', 'sr', 'sr.', 'ii', 'iii', 'iv'];
  const cleanA = partsA.filter(p => !filipinoSuffixes.includes(p)).join(' ');
  const cleanB = partsB.filter(p => !filipinoSuffixes.includes(p)).join(' ');

  if (cleanA === cleanB) return 0.92;

  const jaroScore = jaroWinkler(lowerA, lowerB);
  if (jaroScore >= 0.9) return jaroScore;

  const levenScore = 1 - (levenshtein(lowerA, lowerB) / Math.max(lowerA.length, lowerB.length));
  if (levenScore >= 0.85) return levenScore;

  if (a.email && b.email && a.email === b.email) return 0.99;
  if (a.phone && b.phone && normalizePhone(a.phone) === normalizePhone(b.phone)) return 0.99;

  if (partsA[0] === partsB[0]) return 0.6;

  return Math.max(jaroScore, levenScore);
}

export function matchIdentityDetailed(a: any, b: any): IdentityMatchResult {
  const score = matchIdentity(a, b);

  let method = 'fuzzy';
  let details = '';
  let confidence: 'high' | 'medium' | 'low' = 'low';

  if (score >= 0.95) {
    method = 'exact';
    details = 'Names are identical or nearly identical';
    confidence = 'high';
  } else if (score >= 0.85) {
    method = 'strong';
    details = 'High similarity with minor variations';
    confidence = 'high';
  } else if (score >= 0.75) {
    method = 'likely';
    details = 'Significant name overlap detected';
    confidence = 'medium';
  } else if (score >= 0.6) {
    method = 'possible';
    details = 'Partial name match (same first name or similar)';
    confidence = 'low';
  } else {
    method = 'weak';
    details = 'Low similarity between names';
    confidence = 'low';
  }

  return { score, confidence, method, details };
}

function jaroWinkler(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;

  if (m === 0 && n === 0) return 1;
  if (m === 0 || n === 0) return 0;

  const matchDistance = Math.floor(Math.max(m, n) / 2) - 1;
  const s1Matches = new Array(m).fill(false);
  const s2Matches = new Array(n).fill(false);

  let matches = 0;
  let transpositions = 0;

  for (let i = 0; i < m; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, n);

    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0;

  let k = 0;
  for (let i = 0; i < m; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  const jaro = (matches / m + matches / n + (matches - transpositions / 2) / matches) / 3;

  let prefixLength = 0;
  for (let i = 0; i < Math.min(m, n, 4); i++) {
    if (s1[i] === s2[i]) prefixLength++;
    else break;
  }

  return jaro + prefixLength * 0.1 * (1 - jaro);
}

function levenshtein(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;

  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + 1
        );
      }
    }
  }

  return dp[m][n];
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '').slice(-10);
}

export function findDuplicateGroups(prospects: any[]): Array<any[]> {
  const groups: Array<any[]> = [];
  const processed = new Set<number>();

  for (let i = 0; i < prospects.length; i++) {
    if (processed.has(i)) continue;

    const group = [prospects[i]];
    processed.add(i);

    for (let j = i + 1; j < prospects.length; j++) {
      if (processed.has(j)) continue;

      const score = matchIdentity(prospects[i], prospects[j]);
      if (score >= 0.75) {
        group.push(prospects[j]);
        processed.add(j);
      }
    }

    if (group.length > 1) {
      groups.push(group);
    }
  }

  return groups;
}

export function detectFilipinNamePattern(name: string): {
  hasNickname: boolean;
  hasSuffix: boolean;
  isCommonPattern: boolean;
} {
  const lower = name.toLowerCase();
  const parts = lower.split(/\s+/);

  const commonNicknames = ['mae', 'bing', 'boy', 'girl', 'jun', 'junjun', 'bebe', 'baby'];
  const hasNickname = parts.some(p => commonNicknames.includes(p));

  const suffixes = ['jr', 'jr.', 'sr', 'sr.', 'ii', 'iii', 'iv'];
  const hasSuffix = parts.some(p => suffixes.includes(p));

  const commonPatterns = ['dela cruz', 'del rosario', 'santos', 'reyes', 'garcia'];
  const isCommonPattern = commonPatterns.some(pattern => lower.includes(pattern));

  return { hasNickname, hasSuffix, isCommonPattern };
}
