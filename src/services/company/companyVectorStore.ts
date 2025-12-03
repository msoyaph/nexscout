import { supabase } from '../../lib/supabase';

export interface EmbeddingChunk {
  text: string;
  metadata: Record<string, any>;
}

export interface SearchResult {
  id: string;
  text: string;
  similarity: number;
  metadata: Record<string, any>;
}

/**
 * Generate embeddings using OpenAI
 */
async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-embedding`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      }
    );

    if (!response.ok) {
      throw new Error('Embedding generation failed');
    }

    const result = await response.json();
    return result.embedding;
  } catch (error) {
    console.error('Generate embedding error:', error);
    return null;
  }
}

/**
 * Split text into chunks for embedding
 */
export function chunkText(text: string, chunkSize: number = 500, overlap: number = 50): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

  let currentChunk = '';

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (currentChunk.length + trimmed.length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      const words = currentChunk.split(' ');
      currentChunk = words.slice(-overlap).join(' ') + ' ' + trimmed;
    } else {
      currentChunk += ' ' + trimmed;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Store embeddings for company data
 */
export async function storeCompanyEmbeddings(
  userId: string,
  assetId: string,
  chunks: EmbeddingChunk[]
): Promise<{ success: boolean; count: number }> {
  try {
    let successCount = 0;

    for (const chunk of chunks) {
      const embedding = await generateEmbedding(chunk.text);

      if (!embedding) {
        console.warn('Failed to generate embedding for chunk');
        continue;
      }

      const { error } = await supabase.from('company_embeddings').insert({
        user_id: userId,
        asset_id: assetId,
        chunk_text: chunk.text,
        embedding: JSON.stringify(embedding),
        metadata: chunk.metadata,
        data_type: chunk.metadata.data_type || 'general',
      });

      if (error) {
        console.error('Store embedding error:', error);
        continue;
      }

      successCount++;
    }

    return { success: successCount > 0, count: successCount };
  } catch (error) {
    console.error('Store embeddings error:', error);
    return { success: false, count: 0 };
  }
}

/**
 * Search company embeddings by similarity
 */
export async function searchCompanyKnowledge(
  userId: string,
  query: string,
  limit: number = 5,
  dataType?: string
): Promise<SearchResult[]> {
  try {
    const queryEmbedding = await generateEmbedding(query);

    if (!queryEmbedding) {
      return [];
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-company-embeddings`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          embedding: queryEmbedding,
          limit,
          dataType,
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Search failed');
    }

    const results = await response.json();
    return results.matches || [];
  } catch (error) {
    console.error('Search company knowledge error:', error);
    return [];
  }
}

/**
 * Process company asset for embeddings
 */
export async function processAssetEmbeddings(
  userId: string,
  assetId: string,
  text: string,
  metadata: Record<string, any> = {}
): Promise<{ success: boolean; count: number }> {
  try {
    const chunks = chunkText(text);

    const embeddingChunks: EmbeddingChunk[] = chunks.map((chunk, index) => ({
      text: chunk,
      metadata: {
        ...metadata,
        chunk_index: index,
        total_chunks: chunks.length,
      },
    }));

    return await storeCompanyEmbeddings(userId, assetId, embeddingChunks);
  } catch (error) {
    console.error('Process asset embeddings error:', error);
    return { success: false, count: 0 };
  }
}

/**
 * Delete all embeddings for an asset
 */
export async function deleteAssetEmbeddings(assetId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('company_embeddings')
      .delete()
      .eq('asset_id', assetId);

    if (error) {
      console.error('Delete embeddings error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete embeddings error:', error);
    return false;
  }
}

/**
 * Delete all embeddings for a user
 */
export async function deleteUserEmbeddings(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('company_embeddings')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Delete user embeddings error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete user embeddings error:', error);
    return false;
  }
}

/**
 * Get embedding statistics for user
 */
export async function getEmbeddingStats(
  userId: string
): Promise<{ total: number; byType: Record<string, number> }> {
  try {
    const { data, error } = await supabase
      .from('company_embeddings')
      .select('data_type')
      .eq('user_id', userId);

    if (error) {
      console.error('Get embedding stats error:', error);
      return { total: 0, byType: {} };
    }

    const byType: Record<string, number> = {};
    data.forEach((row) => {
      const type = row.data_type || 'general';
      byType[type] = (byType[type] || 0) + 1;
    });

    return {
      total: data.length,
      byType,
    };
  } catch (error) {
    console.error('Get embedding stats error:', error);
    return { total: 0, byType: {} };
  }
}
