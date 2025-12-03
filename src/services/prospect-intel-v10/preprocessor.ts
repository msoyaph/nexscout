import { ProspectSource, ScanContext, SourceType } from './types';

export async function preprocessSource(
  source: ProspectSource,
  scanId: string,
  userId: string
): Promise<Partial<ScanContext>> {
  const ctx: Partial<ScanContext> = {
    scanId,
    userId,
    sourceId: source.id,
    state: 'PREPROCESSING',
  };

  const type = source.source_type;
  const payload = source.raw_payload;

  if (type === 'paste_text') {
    ctx.rawText = payload.text || '';
    ctx.language = detectLanguage(ctx.rawText);
    ctx.structure = 'paragraphs';
  } else if (type === 'csv') {
    ctx.rawText = payload.csv_text || '';
    ctx.structure = 'csv';
    ctx.language = 'en';
  } else if (type === 'image' || type === 'ocr') {
    ctx.rawText = payload.extracted_text || '';
    ctx.language = detectLanguage(ctx.rawText);
    ctx.structure = 'ocr';
  } else if (type === 'web_crawl') {
    ctx.rawText = payload.html || payload.text || '';
    ctx.structure = 'html';
    ctx.language = 'en';
  } else if (type === 'browser_capture') {
    ctx.rawText = payload.html || payload.text || '';
    ctx.structure = 'html';
    ctx.language = detectLanguage(ctx.rawText);
  } else if (type === 'chatbot_conversation') {
    ctx.rawText = payload.transcript || '';
    ctx.language = detectLanguage(ctx.rawText);
    ctx.structure = 'paragraphs';
  } else if (type === 'fb_data_file') {
    ctx.rawText = JSON.stringify(payload.friends || []);
    ctx.structure = 'list';
    ctx.language = 'en';
  } else if (type === 'linkedin_export') {
    ctx.rawText = payload.csv_text || '';
    ctx.structure = 'csv';
    ctx.language = 'en';
  } else if (type === 'manual_input') {
    ctx.rawText = payload.text || '';
    ctx.language = detectLanguage(ctx.rawText);
    ctx.structure = 'paragraphs';
  }

  return ctx;
}

function detectLanguage(text: string): 'en' | 'fil' | 'taglish' | 'unknown' {
  if (!text || text.length < 10) return 'unknown';

  const lower = text.toLowerCase();
  const filipinoWords = [
    'ako',
    'ikaw',
    'siya',
    'tayo',
    'kami',
    'kayo',
    'sila',
    'po',
    'opo',
    'ang',
    'ng',
    'sa',
    'ay',
    'ba',
    'na',
    'pa',
    'mga',
    'yan',
    'yung',
    'kasi',
    'lang',
    'naman',
    'talaga',
    'sana',
    'daw',
    'raw',
  ];

  let filipinoCount = 0;
  let englishCount = 0;

  const words = lower.split(/\s+/);
  words.forEach((w) => {
    if (filipinoWords.includes(w)) filipinoCount++;
    if (w.length > 3 && /^[a-z]+$/.test(w)) englishCount++;
  });

  if (filipinoCount > 3 && englishCount > 3) return 'taglish';
  if (filipinoCount > englishCount) return 'fil';
  if (englishCount > 0) return 'en';

  return 'unknown';
}
