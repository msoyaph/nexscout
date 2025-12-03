import Tesseract from 'tesseract.js';

export interface ExtractionResult {
  text: string;
  error?: string;
  metadata?: {
    method: 'direct' | 'csv' | 'ocr' | 'api';
    confidence?: number;
    sourceLength?: number;
  };
}

export async function extractTextFromInput(
  scanType: 'text' | 'csv' | 'image' | 'social_upload' | 'browser_extension',
  payload: any
): Promise<ExtractionResult> {
  try {
    switch (scanType) {
      case 'text':
        return extractFromText(payload);
      case 'csv':
        return extractFromCSV(payload);
      case 'image':
        return extractFromImage(payload);
      case 'social_upload':
      case 'browser_extension':
        return extractFromText(payload.text || payload.content || '');
      default:
        return { text: '', error: `Unsupported scan type: ${scanType}` };
    }
  } catch (error: any) {
    return {
      text: '',
      error: error.message || 'Failed to extract text',
    };
  }
}

function extractFromText(payload: any): ExtractionResult {
  const text = typeof payload === 'string' ? payload : payload.text || payload.content || '';

  if (!text || text.trim().length === 0) {
    return { text: '', error: 'No text provided' };
  }

  return {
    text: text.trim(),
    metadata: {
      method: 'direct',
      sourceLength: text.length,
    },
  };
}

function extractFromCSV(payload: any): ExtractionResult {
  try {
    const csvText = typeof payload === 'string' ? payload : payload.text || payload.content || '';

    if (!csvText || csvText.trim().length === 0) {
      return { text: '', error: 'No CSV data provided' };
    }

    const lines = csvText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    if (lines.length === 0) {
      return { text: '', error: 'CSV file is empty' };
    }

    const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
    const nameIndex = headers.findIndex(h => h.includes('name'));
    const contentColumns = headers
      .map((h, i) => (h.includes('snippet') || h.includes('content') || h.includes('comment') || h.includes('text') || h.includes('context')) ? i : -1)
      .filter(i => i !== -1);

    const extractedRows: string[] = [];

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

      const name = nameIndex >= 0 && fields[nameIndex] ? fields[nameIndex] : '';
      const contentParts = contentColumns.map(idx => fields[idx] || '').filter(Boolean);
      const content = contentParts.join(' ');

      if (name && name.length > 2) {
        extractedRows.push(`${name} — ${content || `Prospect: ${name}`}`);
      }
    }

    const combinedText = extractedRows.join('\n');

    return {
      text: combinedText,
      metadata: {
        method: 'csv',
        sourceLength: csvText.length,
      },
    };
  } catch (error: any) {
    return {
      text: '',
      error: `CSV parsing error: ${error.message}`,
    };
  }
}

async function extractFromImage(payload: any): Promise<ExtractionResult> {
  try {
    const imageData = payload.image || payload.base64 || payload.url || payload;

    if (!imageData) {
      return { text: '', error: 'No image data provided' };
    }

    if (typeof imageData === 'string' && imageData.startsWith('http')) {
      const result = await Tesseract.recognize(imageData, 'eng', {
        logger: (m) => console.log('OCR progress:', m),
      });

      return {
        text: result.data.text,
        metadata: {
          method: 'ocr',
          confidence: result.data.confidence,
          sourceLength: result.data.text.length,
        },
      };
    }

    if (typeof imageData === 'string' && imageData.startsWith('data:image')) {
      const result = await Tesseract.recognize(imageData, 'eng', {
        logger: (m) => console.log('OCR progress:', m),
      });

      return {
        text: result.data.text,
        metadata: {
          method: 'ocr',
          confidence: result.data.confidence,
          sourceLength: result.data.text.length,
        },
      };
    }

    return { text: '', error: 'Invalid image format' };
  } catch (error: any) {
    console.error('OCR error:', error);

    return {
      text: '',
      error: `OCR failed: ${error.message}`,
    };
  }
}
