import { supabase } from '../../lib/supabase';

export interface CsvValidationIssue {
  rowIndex: number;
  type: 'missing_name' | 'invalid_email' | 'empty_row' | 'too_long' | 'unknown';
  message: string;
}

export interface CsvValidationResult {
  valid: boolean;
  totalRows: number;
  validRows: number;
  issues: CsvValidationIssue[];
  cleanedCsvContent?: string;
}

const MAX_FIELD_LENGTH = 2000;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function truncateField(field: string, maxLength: number = MAX_FIELD_LENGTH): string {
  if (field.length <= maxLength) return field;
  return field.substring(0, maxLength) + '...';
}

function cleanCsvRow(row: string[]): string[] {
  return row.map(field => {
    let cleaned = field.trim();
    cleaned = cleaned.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
    cleaned = truncateField(cleaned);
    return cleaned;
  });
}

function isRowEmpty(fields: string[]): boolean {
  return fields.every(field => field.trim().length === 0);
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(currentField);
      currentField = '';
    } else {
      currentField += char;
    }
  }

  fields.push(currentField);
  return fields;
}

export async function validateCsv(
  rawCsv: string,
  userId?: string
): Promise<CsvValidationResult> {
  const issues: CsvValidationIssue[] = [];

  const normalized = normalizeLineEndings(rawCsv);
  const lines = normalized.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  if (lines.length === 0) {
    return {
      valid: false,
      totalRows: 0,
      validRows: 0,
      issues: [{ rowIndex: 0, type: 'empty_row', message: 'CSV file is completely empty' }],
    };
  }

  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map(h => h.trim().toLowerCase().replace(/"/g, ''));

  const nameColumnIndex = headers.findIndex(h => h.includes('name'));
  const emailColumnIndex = headers.findIndex(h => h.includes('email'));
  const contentColumnIndex = headers.findIndex(h =>
    h.includes('snippet') || h.includes('content') || h.includes('comment') || h.includes('text')
  );

  if (nameColumnIndex === -1) {
    issues.push({
      rowIndex: 0,
      type: 'missing_name',
      message: 'No "name" column found in CSV headers. Expected column like "name", "full_name", etc.',
    });
  }

  const validRows: string[] = [headerLine];
  let validRowCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const fields = parseCSVLine(line);

    if (isRowEmpty(fields)) {
      issues.push({
        rowIndex: i + 1,
        type: 'empty_row',
        message: 'Row is completely empty',
      });
      continue;
    }

    const cleanedFields = cleanCsvRow(fields);
    let rowHasIssues = false;

    if (nameColumnIndex !== -1) {
      const nameField = cleanedFields[nameColumnIndex]?.trim() || '';
      if (nameField.length === 0) {
        issues.push({
          rowIndex: i + 1,
          type: 'missing_name',
          message: 'Name field is empty',
        });
        rowHasIssues = true;
      } else if (nameField.length < 2) {
        issues.push({
          rowIndex: i + 1,
          type: 'missing_name',
          message: `Name is too short: "${nameField}"`,
        });
        rowHasIssues = true;
      }
    }

    if (emailColumnIndex !== -1) {
      const emailField = cleanedFields[emailColumnIndex]?.trim() || '';
      if (emailField.length > 0 && !EMAIL_REGEX.test(emailField)) {
        issues.push({
          rowIndex: i + 1,
          type: 'invalid_email',
          message: `Invalid email format: "${emailField}"`,
        });
      }
    }

    fields.forEach((field, idx) => {
      if (field.length > MAX_FIELD_LENGTH) {
        issues.push({
          rowIndex: i + 1,
          type: 'too_long',
          message: `Field ${idx + 1} exceeds ${MAX_FIELD_LENGTH} characters (${field.length} chars). It will be truncated.`,
        });
      }
    });

    if (!rowHasIssues) {
      validRowCount++;
      const quotedFields = cleanedFields.map(f => `"${f.replace(/"/g, '""')}"`);
      validRows.push(quotedFields.join(','));
    }
  }

  const cleanedCsvContent = validRows.length > 1 ? validRows.join('\n') : undefined;

  const result: CsvValidationResult = {
    valid: validRowCount > 0 && issues.filter(i => i.type === 'missing_name').length === 0,
    totalRows: lines.length - 1,
    validRows: validRowCount,
    issues,
    cleanedCsvContent,
  };

  if (userId) {
    await saveValidationLog(userId, result, rawCsv);
  }

  return result;
}

async function saveValidationLog(
  userId: string,
  result: CsvValidationResult,
  rawCsv: string
): Promise<void> {
  try {
    const fileSizeKb = Math.round(rawCsv.length / 1024);

    await supabase.from('csv_validation_logs').insert({
      user_id: userId,
      total_rows: result.totalRows,
      valid_rows: result.validRows,
      issue_count: result.issues.length,
      issues: result.issues.slice(0, 50),
      had_cleaned_version: !!result.cleanedCsvContent,
      file_size_kb: fileSizeKb,
    });
  } catch (error) {
    console.error('Failed to save CSV validation log:', error);
  }
}

export async function getRecentValidations(userId: string, limit: number = 10): Promise<any[]> {
  const { data, error } = await supabase
    .from('csv_validation_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch validation logs:', error);
    return [];
  }

  return data || [];
}
