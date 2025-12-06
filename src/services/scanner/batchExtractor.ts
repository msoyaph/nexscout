import { CSVRow } from './csvChunker';
import { aiOrchestrator } from '../ai/AIOrchestrator';

export interface ExtractedProspect {
  full_name: string;
  snippet: string;
  context: string;
  platform: string;
  raw: CSVRow;
}

export async function extractBatch(batch: CSVRow[], userId?: string): Promise<ExtractedProspect[]> {
  // If no userId provided, use fallback (no AI extraction)
  if (!userId) {
    console.warn('[batchExtractor] No userId provided, using fallback extraction');
    return batch.map(row => ({
      full_name: row.full_name,
      snippet: row.snippet || row.context || '',
      context: row.context || row.snippet || '',
      platform: row.platform || 'other',
      raw: row,
    }));
  }

  try {
    const prompt = `Extract prospects from the following batch.
Return STRICT JSON array ONLY. No markdown, no explanation.
Each item should include: full_name, snippet, context, platform

Batch data:
${batch.map((row, i) => `${i + 1}. Name: ${row.full_name}, Snippet: ${row.snippet}, Context: ${row.context}, Platform: ${row.platform}`).join('\n')}

Return format:
[
  {"full_name": "...", "snippet": "...", "context": "...", "platform": "..."},
  ...
]`;

    // Use AIOrchestrator for centralized AI calls
    const result = await aiOrchestrator.generate({
      messages: [
        {
          role: 'system',
          content: 'You are a data extraction assistant. Return only valid JSON arrays.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      config: {
        userId: userId,
        action: 'ai_scan',
        model: 'gpt-4o-mini',
        temperature: 0.3,
        maxTokens: 2000,
        autoSelectModel: true,
      }
    });

    if (!result.success || !result.content) {
      throw new Error(result.error || 'AI extraction failed');
    }

    const content = result.content;
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const extracted = JSON.parse(cleanContent);

    return extracted.map((item: any, idx: number) => ({
      full_name: item.full_name || batch[idx]?.full_name || '',
      snippet: item.snippet || batch[idx]?.snippet || '',
      context: item.context || batch[idx]?.context || '',
      platform: item.platform || batch[idx]?.platform || 'other',
      raw: batch[idx],
    }));
  } catch (error) {
    console.warn('LLM extraction failed, using fallback:', error);
    return batch.map(row => ({
      full_name: row.full_name,
      snippet: row.snippet || row.context || '',
      context: row.context || row.snippet || '',
      platform: row.platform || 'other',
      raw: row,
    }));
  }
}

export async function extractAllBatches(batches: CSVRow[][]): Promise<ExtractedProspect[][]> {
  const results = await Promise.all(batches.map(batch => extractBatch(batch)));
  return results;
}
