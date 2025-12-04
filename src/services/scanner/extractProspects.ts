export interface ProspectCandidate {
  full_name: string;
  snippet: string;
  platform?: string;
  context?: string;
  lineNumber?: number;
}

export async function extractProspectsFromText(text: string, scanId: string): Promise<ProspectCandidate[]> {
  const prospects: ProspectCandidate[] = [];

  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const dashPattern = /^([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){1,4})\s*[—\-]\s*(.+)$/;
    const dashMatch = line.match(dashPattern);

    if (dashMatch) {
      const name = dashMatch[1].trim();
      const content = dashMatch[2].trim();

      prospects.push({
        full_name: name,
        snippet: content,
        context: content,
        lineNumber: i + 1,
      });
      continue;
    }

    const nameOnlyPattern = /^([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){1,3})$/;
    const nameMatch = line.match(nameOnlyPattern);

    if (nameMatch) {
      const name = nameMatch[1].trim();
      const contextStart = Math.max(0, i - 1);
      const contextEnd = Math.min(lines.length, i + 3);
      const contextLines = lines.slice(contextStart, contextEnd);

      prospects.push({
        full_name: name,
        snippet: contextLines.join(' '),
        context: contextLines.join(' '),
        lineNumber: i + 1,
      });
      continue;
    }

    const inlineNamePattern = /([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){1,3})\s*[—\-:]\s*([^—\-]{10,})/g;
    let match;

    while ((match = inlineNamePattern.exec(line)) !== null) {
      const name = match[1].trim();
      const content = match[2].trim();

      prospects.push({
        full_name: name,
        snippet: content,
        context: content,
        lineNumber: i + 1,
      });
    }
  }

  const uniqueProspects = new Map<string, ProspectCandidate>();

  for (const prospect of prospects) {
    const key = prospect.full_name.toLowerCase();
    if (!uniqueProspects.has(key)) {
      uniqueProspects.set(key, prospect);
    } else {
      const existing = uniqueProspects.get(key)!;
      if (prospect.snippet.length > existing.snippet.length) {
        uniqueProspects.set(key, prospect);
      }
    }
  }

  return Array.from(uniqueProspects.values());
}

export function detectPlatform(text: string): string | undefined {
  const lower = text.toLowerCase();

  if (lower.includes('facebook') || lower.includes('fb')) return 'facebook';
  if (lower.includes('instagram') || lower.includes('ig')) return 'instagram';
  if (lower.includes('linkedin')) return 'linkedin';
  if (lower.includes('twitter') || lower.includes('tweet')) return 'twitter';
  if (lower.includes('tiktok')) return 'tiktok';

  return undefined;
}
