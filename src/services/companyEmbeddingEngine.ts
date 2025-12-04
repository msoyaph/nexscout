import { supabase } from '../lib/supabase';
import { CompanyScrapedData } from './companyWebScraper';

export class CompanyEmbeddingEngine {
  private chunkText(text: string, chunkSize: number = 500): string[] {
    const words = text.split(/\s+/);
    const chunks: string[] = [];

    for (let i = 0; i < words.length; i += chunkSize) {
      const chunk = words.slice(i, i + chunkSize).join(' ');
      if (chunk.trim().length > 50) {
        chunks.push(chunk.trim());
      }
    }

    return chunks;
  }

  async generateEmbeddings(
    userId: string,
    companyId: string | undefined,
    extractedDataId: string,
    data: CompanyScrapedData
  ): Promise<number> {
    const embeddingsToInsert: any[] = [];

    if (data.description) {
      const descChunks = this.chunkText(data.description, 300);
      descChunks.forEach((chunk, index) => {
        embeddingsToInsert.push({
          user_id: userId,
          company_id: companyId,
          extracted_data_id: extractedDataId,
          chunk_text: chunk,
          chunk_index: index,
          source: 'description',
          source_url: '',
          embedding_text: chunk,
          metadata: { type: 'description' },
        });
      });
    }

    if (data.mission) {
      embeddingsToInsert.push({
        user_id: userId,
        company_id: companyId,
        extracted_data_id: extractedDataId,
        chunk_text: data.mission,
        chunk_index: 0,
        source: 'mission',
        source_url: '',
        embedding_text: data.mission,
        metadata: { type: 'mission' },
      });
    }

    if (data.products && data.products.length > 0) {
      data.products.forEach((product, index) => {
        const productText = `${product.name}: ${product.description}`;
        embeddingsToInsert.push({
          user_id: userId,
          company_id: companyId,
          extracted_data_id: extractedDataId,
          chunk_text: productText,
          chunk_index: index,
          source: 'product',
          source_url: '',
          embedding_text: productText,
          metadata: { type: 'product', name: product.name },
        });
      });
    }

    if (data.values && data.values.length > 0) {
      data.values.forEach((value, index) => {
        embeddingsToInsert.push({
          user_id: userId,
          company_id: companyId,
          extracted_data_id: extractedDataId,
          chunk_text: value,
          chunk_index: index,
          source: 'values',
          source_url: '',
          embedding_text: value,
          metadata: { type: 'value' },
        });
      });
    }

    const rawChunks = this.chunkText(data.rawContent, 500);
    rawChunks.slice(0, 10).forEach((chunk, index) => {
      embeddingsToInsert.push({
        user_id: userId,
        company_id: companyId,
        extracted_data_id: extractedDataId,
        chunk_text: chunk,
        chunk_index: index,
        source: 'raw_content',
        source_url: '',
        embedding_text: chunk,
        metadata: { type: 'content' },
      });
    });

    if (embeddingsToInsert.length > 0) {
      const { error } = await supabase
        .from('company_embeddings')
        .insert(embeddingsToInsert);

      if (error) {
        console.error('Failed to insert embeddings:', error);
        throw error;
      }
    }

    return embeddingsToInsert.length;
  }

  async searchEmbeddings(
    userId: string,
    companyId: string,
    query: string,
    limit: number = 5
  ): Promise<string[]> {
    const { data, error } = await supabase
      .from('company_embeddings')
      .select('chunk_text, source, metadata')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(limit * 2);

    if (error || !data) return [];

    const queryLower = query.toLowerCase();
    const scored = data.map(item => ({
      chunk: item.chunk_text,
      score: this.calculateRelevance(queryLower, item.chunk_text.toLowerCase()),
    }));

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, limit).map(item => item.chunk);
  }

  private calculateRelevance(query: string, text: string): number {
    const queryWords = query.split(/\s+/);
    let score = 0;

    for (const word of queryWords) {
      if (word.length < 3) continue;
      if (text.includes(word)) score += 10;
    }

    return score;
  }

  async getCompanyContext(userId: string, companyId: string): Promise<string> {
    const { data, error } = await supabase
      .from('company_embeddings')
      .select('chunk_text, source')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .in('source', ['description', 'mission', 'product', 'values'])
      .order('chunk_index', { ascending: true })
      .limit(20);

    if (error || !data) return '';

    const contextParts: string[] = [];

    const description = data.filter(d => d.source === 'description').map(d => d.chunk_text);
    if (description.length > 0) {
      contextParts.push(`Description: ${description.join(' ')}`);
    }

    const mission = data.find(d => d.source === 'mission');
    if (mission) {
      contextParts.push(`Mission: ${mission.chunk_text}`);
    }

    const products = data.filter(d => d.source === 'product').map(d => d.chunk_text);
    if (products.length > 0) {
      contextParts.push(`Products: ${products.join('; ')}`);
    }

    const values = data.filter(d => d.source === 'values').map(d => d.chunk_text);
    if (values.length > 0) {
      contextParts.push(`Values: ${values.join('; ')}`);
    }

    return contextParts.join('\n\n');
  }
}

export const companyEmbeddingEngine = new CompanyEmbeddingEngine();
