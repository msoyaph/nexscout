/**
 * File AI Integration
 *
 * Helpers to integrate file intelligence with AI engines
 */

import { supabase } from '../../lib/supabase';

export interface FileContextResult {
  chunks: Array<{
    content: string;
    documentTitle: string;
    sourceType: string;
  }>;
  entities: Array<{
    type: string;
    value: string;
    confidence: number;
  }>;
  documents: Array<{
    title: string;
    summary: string;
    qualityScore: number;
  }>;
}

/**
 * Get relevant file context for a prospect
 */
export async function getRelevantFileContextForProspect(
  prospectId: string,
  userId: string,
  limit = 3
): Promise<FileContextResult> {
  try {
    // 1. Get prospect details to search for
    const { data: prospect } = await supabase
      .from('prospects')
      .select('*')
      .eq('id', prospectId)
      .single();

    if (!prospect) {
      return { chunks: [], entities: [], documents: [] };
    }

    // 2. Find entities that match this prospect
    const searchTerms: string[] = [];
    if (prospect.email) searchTerms.push(prospect.email.toLowerCase());
    if (prospect.full_name) searchTerms.push(prospect.full_name.toLowerCase());
    if (prospect.social_media_url) searchTerms.push(prospect.social_media_url.toLowerCase());

    const { data: entities } = await supabase
      .from('file_intelligence_extracted_entities')
      .select(`
        *,
        document:file_intelligence_documents(*)
      `)
      .eq('user_id', userId)
      .in('normalized_value', searchTerms)
      .order('confidence', { ascending: false })
      .limit(10);

    // 3. Get document IDs from matched entities
    const documentIds = [...new Set(entities?.map(e => e.document_id) || [])];

    if (documentIds.length === 0) {
      return { chunks: [], entities: [], documents: [] };
    }

    // 4. Get text chunks from these documents
    const { data: chunks } = await supabase
      .from('file_intelligence_text_chunks')
      .select(`
        *,
        document:file_intelligence_documents(title, source_type)
      `)
      .in('document_id', documentIds)
      .limit(limit * 3);

    // 5. Get document summaries
    const { data: documents } = await supabase
      .from('file_intelligence_documents')
      .select('*')
      .in('id', documentIds)
      .limit(limit);

    // Format results
    const formattedChunks = (chunks || []).slice(0, limit).map(chunk => ({
      content: chunk.content,
      documentTitle: chunk.document?.title || 'Unknown',
      sourceType: chunk.document?.source_type || 'unknown',
    }));

    const formattedEntities = (entities || []).map(entity => ({
      type: entity.entity_type,
      value: entity.raw_value,
      confidence: entity.confidence,
    }));

    const formattedDocuments = (documents || []).map(doc => ({
      title: doc.title,
      summary: doc.summary || '',
      qualityScore: doc.ai_quality_score,
    }));

    return {
      chunks: formattedChunks,
      entities: formattedEntities,
      documents: formattedDocuments,
    };
  } catch (error) {
    console.error('Error getting file context for prospect:', error);
    return { chunks: [], entities: [], documents: [] };
  }
}

/**
 * Search file chunks by content
 */
export async function searchFileChunks(
  userId: string,
  query: string,
  limit = 5
): Promise<Array<{
  content: string;
  documentTitle: string;
  documentId: string;
}>> {
  try {
    const { data: chunks } = await supabase
      .from('file_intelligence_text_chunks')
      .select(`
        *,
        document:file_intelligence_documents!inner(title, user_id)
      `)
      .eq('document.user_id', userId)
      .ilike('content', `%${query}%`)
      .limit(limit);

    return (chunks || []).map(chunk => ({
      content: chunk.content,
      documentTitle: chunk.document?.title || 'Unknown',
      documentId: chunk.document_id,
    }));
  } catch (error) {
    console.error('Error searching file chunks:', error);
    return [];
  }
}

/**
 * Get all entities for a user by type
 */
export async function getUserEntitiesByType(
  userId: string,
  entityType: string
): Promise<Array<{
  value: string;
  confidence: number;
  documentTitle: string;
}>> {
  try {
    const { data: entities } = await supabase
      .from('file_intelligence_extracted_entities')
      .select(`
        *,
        document:file_intelligence_documents(title)
      `)
      .eq('user_id', userId)
      .eq('entity_type', entityType)
      .order('confidence', { ascending: false })
      .limit(100);

    return (entities || []).map(entity => ({
      value: entity.normalized_value,
      confidence: entity.confidence,
      documentTitle: entity.document?.title || 'Unknown',
    }));
  } catch (error) {
    console.error('Error getting entities by type:', error);
    return [];
  }
}

/**
 * Get file statistics for a user
 */
export async function getUserFileStats(userId: string) {
  try {
    const [
      { count: totalDocuments },
      { count: totalEntities },
      { count: prospects },
      { count: emails },
      { count: phones },
    ] = await Promise.all([
      supabase
        .from('file_intelligence_documents')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabase
        .from('file_intelligence_extracted_entities')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabase
        .from('file_intelligence_extracted_entities')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('entity_type', 'prospect'),
      supabase
        .from('file_intelligence_extracted_entities')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('entity_type', 'email'),
      supabase
        .from('file_intelligence_extracted_entities')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('entity_type', 'phone'),
    ]);

    return {
      totalDocuments: totalDocuments || 0,
      totalEntities: totalEntities || 0,
      prospects: prospects || 0,
      emails: emails || 0,
      phones: phones || 0,
    };
  } catch (error) {
    console.error('Error getting user file stats:', error);
    return {
      totalDocuments: 0,
      totalEntities: 0,
      prospects: 0,
      emails: 0,
      phones: 0,
    };
  }
}
