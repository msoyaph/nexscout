import { DraftProspect, ScanContext } from '../types';
import { parseCSV } from './csvParser';
import { parseText } from './textParser';
import { parseHTML } from './htmlParser';

export async function runParser(ctx: ScanContext): Promise<DraftProspect[]> {
  const { structure, rawText } = ctx;

  if (!rawText) return [];

  let prospects: DraftProspect[] = [];

  if (structure === 'csv') {
    prospects = parseCSV(rawText);
  } else if (structure === 'html') {
    prospects = parseHTML(rawText);
  } else if (structure === 'paragraphs' || structure === 'list' || structure === 'ocr') {
    prospects = parseText(rawText);
  }

  return prospects;
}
