export interface CSVRow {
  full_name: string;
  snippet: string;
  context: string;
  platform: string;
  [key: string]: string;
}

export interface Batch {
  batchId: number;
  items: CSVRow[];
}

export function parseCSV(csvContent: string): CSVRow[] {
  const lines = csvContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line === headers.join(',')) continue;

    const fields: string[] = [];
    let currentField = '';
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(currentField.trim().replace(/"/g, ''));
        currentField = '';
      } else {
        currentField += char;
      }
    }
    fields.push(currentField.trim().replace(/"/g, ''));

    const row: CSVRow = {
      full_name: '',
      snippet: '',
      context: '',
      platform: 'other',
    };

    headers.forEach((header, idx) => {
      const value = fields[idx] || '';
      if (header.includes('name')) {
        row.full_name = value;
      } else if (header.includes('snippet') || header.includes('content') || header.includes('comment')) {
        row.snippet = value;
      } else if (header.includes('context')) {
        row.context = value;
      } else if (header.includes('platform')) {
        row.platform = value || 'other';
      }
      row[header] = value;
    });

    if (row.full_name && row.full_name.length > 2) {
      rows.push(row);
    }
  }

  return rows;
}

export function chunkRows(rows: CSVRow[], batchSize: number = 15): Batch[] {
  const batches: Batch[] = [];

  for (let i = 0; i < rows.length; i += batchSize) {
    batches.push({
      batchId: Math.floor(i / batchSize) + 1,
      items: rows.slice(i, i + batchSize),
    });
  }

  return batches;
}

export function chunkCSV(csvContent: string, batchSize: number = 15): Batch[] {
  const rows = parseCSV(csvContent);
  return chunkRows(rows, batchSize);
}
