import { ParsedProspect } from './fbScreenshotParser';

export class FileParser {
  async parseCSV(file: File): Promise<ParsedProspect[]> {
    console.log('[File Parser] Parsing CSV file:', file.name);
    const text = await this.readFileAsText(file);
    const prospects: ParsedProspect[] = [];

    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    if (lines.length === 0) return prospects;

    const headers = this.parseCSVLine(lines[0]);
    console.log('[File Parser] CSV headers:', headers);

    const firstNameIndex = this.findHeaderIndex(headers, ['first name', 'firstname', 'given name']);
    const lastNameIndex = this.findHeaderIndex(headers, ['last name', 'lastname', 'surname', 'family name']);
    const fullNameIndex = this.findHeaderIndex(headers, ['name', 'full name', 'fullname', 'full_name']);
    const snippetIndex = this.findHeaderIndex(headers, ['snippet', 'content', 'comment', 'text', 'message', 'post']);
    const contextIndex = this.findHeaderIndex(headers, ['context', 'tags', 'notes', 'description']);
    const platformIndex = this.findHeaderIndex(headers, ['platform', 'source', 'network']);
    const emailIndex = this.findHeaderIndex(headers, ['email', 'email address']);
    const occupationIndex = this.findHeaderIndex(headers, ['occupation', 'job', 'position', 'title', 'company']);
    const linkedinIndex = this.findHeaderIndex(headers, ['linkedin', 'url', 'profile url']);

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);

      let name = '';
      if (fullNameIndex !== -1) {
        name = values[fullNameIndex] || '';
      } else if (firstNameIndex !== -1 && lastNameIndex !== -1) {
        const firstName = values[firstNameIndex] || '';
        const lastName = values[lastNameIndex] || '';
        name = `${firstName} ${lastName}`.trim();
      } else if (firstNameIndex !== -1) {
        name = values[firstNameIndex] || '';
      }

      if (name.length > 2) {
        const snippet = snippetIndex !== -1 ? values[snippetIndex] : '';
        const context = contextIndex !== -1 ? values[contextIndex] : '';
        const platform = platformIndex !== -1 ? values[platformIndex] : 'linkedin';

        const rawText = snippet || context || lines[i];

        prospects.push({
          name,
          source: 'csv_import',
          rawText,
          platform,
          metadata: {
            snippet,
            context,
            email: emailIndex !== -1 ? values[emailIndex] : undefined,
            occupation: occupationIndex !== -1 ? values[occupationIndex] : undefined,
            linkedinUrl: linkedinIndex !== -1 ? values[linkedinIndex] : undefined,
          },
        });
      }
    }

    console.log('[File Parser] Parsed', prospects.length, 'prospects from CSV');
    return prospects;
  }

  async parseFacebookExport(file: File): Promise<ParsedProspect[]> {
    console.log('[File Parser] Parsing Facebook export:', file.name);
    const prospects: ParsedProspect[] = [];

    try {
      const text = await this.readFileAsText(file);

      if (file.name.endsWith('.json')) {
        const data = JSON.parse(text);

        if (data.friends_v2 || data.friends) {
          const friendsList = data.friends_v2 || data.friends;
          friendsList.forEach((friend: any) => {
            const name = friend.name || `${friend.first_name || ''} ${friend.last_name || ''}`.trim();
            if (name) {
              prospects.push({
                name,
                source: 'facebook_export',
                rawText: JSON.stringify(friend),
                platform: 'facebook',
                metadata: {
                  timestamp: friend.timestamp,
                },
              });
            }
          });
        }

        if (data.comments) {
          data.comments.forEach((comment: any) => {
            if (comment.author) {
              prospects.push({
                name: comment.author,
                source: 'facebook_export',
                rawText: comment.comment || '',
                platform: 'facebook',
              });
            }
          });
        }
      } else if (file.name.endsWith('.html')) {
        const nameMatches = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g);
        if (nameMatches) {
          const uniqueNames = Array.from(new Set(nameMatches));
          uniqueNames.forEach(name => {
            prospects.push({
              name,
              source: 'facebook_export',
              rawText: '',
              platform: 'facebook',
            });
          });
        }
      }

      console.log('[File Parser] Parsed', prospects.length, 'prospects from Facebook export');
      return prospects;
    } catch (error) {
      console.error('[File Parser] Error parsing Facebook export:', error);
      return prospects;
    }
  }

  async parseLinkedInExport(file: File): Promise<ParsedProspect[]> {
    console.log('[File Parser] Parsing LinkedIn export:', file.name);
    return this.parseCSV(file);
  }

  private async readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string || '');
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  private parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    values.push(current.trim());
    return values;
  }

  private findHeaderIndex(headers: string[], possibleNames: string[]): number {
    const lowerHeaders = headers.map(h => h.toLowerCase());

    for (const name of possibleNames) {
      const index = lowerHeaders.findIndex(h => h.includes(name.toLowerCase()));
      if (index !== -1) return index;
    }

    return -1;
  }
}

export const fileParser = new FileParser();
