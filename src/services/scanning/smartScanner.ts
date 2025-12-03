import { supabase } from '../../lib/supabase';

export interface UploadBatchResult {
  batchId: string;
  status: 'processing' | 'completed' | 'failed';
  fileCount: number;
  message: string;
  scanId?: string;
}

export interface SmartnessData {
  uploadsCount: number;
  uniqueSources: number;
  smartnessScore: number;
  level: string;
  subtitle: string;
}

export interface RecentScan {
  id: string;
  sourceType: string;
  fileCount: number;
  createdAt: string;
  status: string;
  hotLeadsFound: number;
}

export interface ExtractedEntity {
  id: string;
  entityName: string;
  entityType: string;
  confidenceScore: number;
  metadata: any;
}

export async function processScreenshotBatch(files: File[]): Promise<UploadBatchResult> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: batch, error: batchError } = await supabase
      .from('uploaded_batches')
      .insert({
        user_id: user.id,
        source_type: 'screenshot',
        file_count: files.length,
        status: 'processing',
        metadata: {
          fileNames: files.map(f => f.name),
          totalSize: files.reduce((acc, f) => acc + f.size, 0)
        }
      })
      .select()
      .single();

    if (batchError) throw batchError;

    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${batch.id}/${Date.now()}_${file.name}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('scan-uploads')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from('scan-uploads')
        .getPublicUrl(fileName);

      await supabase.from('uploaded_files').insert({
        batch_id: batch.id,
        filename: file.name,
        file_url: urlData.publicUrl,
        file_size: file.size,
        file_type: file.type
      });
    }

    await enrichBatchWithAI(batch.id);

    return {
      batchId: batch.id,
      status: 'completed',
      fileCount: files.length,
      message: `Successfully processed ${files.length} screenshots`
    };
  } catch (error: any) {
    console.error('Screenshot batch error:', error);
    throw new Error(error.message || 'Failed to process screenshots');
  }
}

export async function processFileBatch(files: File[]): Promise<UploadBatchResult> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check if this is a CSV/text file that should use the scan processor
    const isScannable = files.length === 1 && (
      files[0].type === 'text/csv' ||
      files[0].type === 'text/plain' ||
      files[0].name.endsWith('.csv') ||
      files[0].name.endsWith('.txt')
    );

    if (isScannable) {
      const file = files[0];
      console.log('[SmartScanner] Processing CSV file:', file.name);
      const text = await file.text();
      console.log('[SmartScanner] File text length:', text.length);
      console.log('[SmartScanner] First 200 chars:', text.substring(0, 200));

      // Create scan record FIRST
      const { data: scan, error: scanError } = await supabase
        .from('scans')
        .insert({
          user_id: user.id,
          sources: { type: 'paste_text', filename: file.name },
          status: 'queued',
        })
        .select()
        .single();

      if (scanError) {
        console.error('[SmartScanner] Failed to create scan:', scanError);
        throw scanError;
      }

      console.log('[SmartScanner] Scan created:', scan.id);

      // Trigger paste-scan-start edge function with scanId
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;

      console.log('[SmartScanner] Calling paste-scan-start...');
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paste-scan-start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scanId: scan.id,
          rawText: text,
        }),
      });

      console.log('[SmartScanner] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[SmartScanner] Error response:', errorText);
        throw new Error(`Failed to start scan: ${response.status}`);
      }

      const result = await response.json();
      console.log('[SmartScanner] Scan started successfully:', result);

      return {
        batchId: scan.id,
        status: 'processing',
        fileCount: 1,
        message: `Processing ${file.name}...`,
        scanId: scan.id,
      };
    }

    // For non-CSV files, use old batch upload method
    const { data: batch, error: batchError } = await supabase
      .from('uploaded_batches')
      .insert({
        user_id: user.id,
        source_type: 'file',
        file_count: files.length,
        status: 'processing',
        metadata: {
          fileNames: files.map(f => f.name),
          fileTypes: files.map(f => f.type),
          totalSize: files.reduce((acc, f) => acc + f.size, 0)
        }
      })
      .select()
      .single();

    if (batchError) throw batchError;

    for (const file of files) {
      const fileName = `${user.id}/${batch.id}/${Date.now()}_${file.name}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('scan-uploads')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from('scan-uploads')
        .getPublicUrl(fileName);

      await supabase.from('uploaded_files').insert({
        batch_id: batch.id,
        filename: file.name,
        file_url: urlData.publicUrl,
        file_size: file.size,
        file_type: file.type
      });
    }

    await enrichBatchWithAI(batch.id);

    return {
      batchId: batch.id,
      status: 'completed',
      fileCount: files.length,
      message: `Successfully processed ${files.length} files`
    };
  } catch (error: any) {
    console.error('File batch error:', error);
    throw new Error(error.message || 'Failed to process files');
  }
}

export async function processTextBatch(rawText: string): Promise<UploadBatchResult> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: batch, error: batchError } = await supabase
      .from('uploaded_batches')
      .insert({
        user_id: user.id,
        source_type: 'text',
        file_count: 1,
        text_length: rawText.length,
        status: 'processing',
        metadata: {
          preview: rawText.substring(0, 200)
        }
      })
      .select()
      .single();

    if (batchError) throw batchError;

    await parseTextContent(batch.id, rawText, 'pasted-text');
    await enrichBatchWithAI(batch.id);

    return {
      batchId: batch.id,
      status: 'completed',
      fileCount: 1,
      message: 'Successfully processed pasted text'
    };
  } catch (error: any) {
    console.error('Text batch error:', error);
    throw new Error(error.message || 'Failed to process text');
  }
}

async function parseTextContent(batchId: string, text: string, source: string): Promise<void> {
  const lines = text.split('\n').filter(line => line.trim());
  const entities: any[] = [];

  const namePattern = /\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b/g;
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const phonePattern = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;

  let match;
  while ((match = namePattern.exec(text)) !== null) {
    entities.push({
      batch_id: batchId,
      raw_text: match[0],
      entity_name: match[1],
      entity_type: 'person',
      confidence_score: 75,
      metadata: { source }
    });
  }

  while ((match = emailPattern.exec(text)) !== null) {
    entities.push({
      batch_id: batchId,
      raw_text: match[0],
      entity_name: match[0],
      entity_type: 'email',
      confidence_score: 95,
      metadata: { source }
    });
  }

  while ((match = phonePattern.exec(text)) !== null) {
    entities.push({
      batch_id: batchId,
      raw_text: match[0],
      entity_name: match[0],
      entity_type: 'phone',
      confidence_score: 85,
      metadata: { source }
    });
  }

  const keywords = ['business', 'insurance', 'MLM', 'real estate', 'entrepreneur', 'coach', 'consultant'];
  keywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    if (regex.test(text)) {
      entities.push({
        batch_id: batchId,
        raw_text: keyword,
        entity_name: keyword,
        entity_type: 'keyword',
        confidence_score: 80,
        metadata: { source, category: 'interest' }
      });
    }
  });

  if (entities.length > 0) {
    await supabase.from('extracted_entities').insert(entities);
  }
}

export async function enrichBatchWithAI(batchId: string): Promise<void> {
  try {
    const { data: entities } = await supabase
      .from('extracted_entities')
      .select('*')
      .eq('batch_id', batchId);

    const personEntities = entities?.filter(e => e.entity_type === 'person') || [];

    if (personEntities.length > 0) {
      const updates = personEntities.map(entity => ({
        ...entity,
        metadata: {
          ...entity.metadata,
          aiEnriched: true,
          enrichedAt: new Date().toISOString(),
          signals: ['prospect_candidate']
        }
      }));

      for (const update of updates) {
        await supabase
          .from('extracted_entities')
          .update({ metadata: update.metadata })
          .eq('id', update.id);
      }
    }

    await supabase
      .from('uploaded_batches')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', batchId);

  } catch (error) {
    console.error('AI enrichment error:', error);
    await supabase
      .from('uploaded_batches')
      .update({ status: 'failed' })
      .eq('id', batchId);
  }
}

export async function computeSmartness(userId: string): Promise<SmartnessData> {
  try {
    const { data: smartness } = await supabase
      .from('ai_smartness')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!smartness) {
      return {
        uploadsCount: 0,
        uniqueSources: 0,
        smartnessScore: 0,
        level: 'Beginner',
        subtitle: 'Your AI is still learning.'
      };
    }

    let level = 'Beginner';
    let subtitle = 'Your AI is still learning.';

    if (smartness.smartness_score >= 75) {
      level = 'Expert';
      subtitle = 'Your AI is extremely accurate!';
    } else if (smartness.smartness_score >= 50) {
      level = 'Advanced';
      subtitle = 'Scanner is getting sharp!';
    } else if (smartness.smartness_score >= 25) {
      level = 'Intermediate';
      subtitle = 'Training in progress...';
    }

    return {
      uploadsCount: smartness.uploads_count || 0,
      uniqueSources: smartness.unique_sources || 0,
      smartnessScore: smartness.smartness_score || 0,
      level,
      subtitle
    };
  } catch (error) {
    console.error('Compute smartness error:', error);
    return {
      uploadsCount: 0,
      uniqueSources: 0,
      smartnessScore: 0,
      level: 'Beginner',
      subtitle: 'Your AI is still learning.'
    };
  }
}

export async function fetchRecentScans(userId: string, limit: number = 10): Promise<RecentScan[]> {
  try {
    const { data: batches } = await supabase
      .from('uploaded_batches')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!batches) return [];

    return Promise.all(
      batches.map(async (batch) => {
        const { data: entities } = await supabase
          .from('extracted_entities')
          .select('*')
          .eq('batch_id', batch.id)
          .eq('entity_type', 'person');

        return {
          id: batch.id,
          sourceType: batch.source_type,
          fileCount: batch.file_count || 0,
          createdAt: batch.created_at,
          status: batch.status,
          hotLeadsFound: entities?.length || 0
        };
      })
    );
  } catch (error) {
    console.error('Fetch recent scans error:', error);
    return [];
  }
}

export async function getBatchEntities(batchId: string): Promise<ExtractedEntity[]> {
  try {
    const { data: entities } = await supabase
      .from('extracted_entities')
      .select('*')
      .eq('batch_id', batchId)
      .order('confidence_score', { ascending: false });

    return entities?.map(e => ({
      id: e.id,
      entityName: e.entity_name || '',
      entityType: e.entity_type || '',
      confidenceScore: Number(e.confidence_score) || 0,
      metadata: e.metadata || {}
    })) || [];
  } catch (error) {
    console.error('Get batch entities error:', error);
    return [];
  }
}
