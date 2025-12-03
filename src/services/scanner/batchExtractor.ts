import { CSVRow } from './csvChunker';

export interface ExtractedProspect {
  full_name: string;
  snippet: string;
  context: string;
  platform: string;
  raw: CSVRow;
}

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export async function extractBatch(batch: CSVRow[]): Promise<ExtractedProspect[]> {
  if (!OPENAI_API_KEY) {
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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
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
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '[]';
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
