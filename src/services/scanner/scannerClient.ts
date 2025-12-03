import { supabase } from '../../lib/supabase';

export interface StartScanResult {
  success: boolean;
  scanId?: string;
  error?: string;
}

export interface ScanReadinessCheck {
  ready: boolean;
  issues: {
    env: string[];
    services: string[];
    database: string[];
  };
}

export async function startTextScan(text: string, userId: string): Promise<StartScanResult> {
  try {
    if (!text || text.trim().length === 0) {
      return { success: false, error: 'No text provided' };
    }

    const { data: scanRecord, error: scanError } = await supabase
      .from('scans')
      .insert({
        user_id: userId,
        source_label: 'Paste Text Scan',
        source_type: 'paste',
        status: 'pending',
      })
      .select()
      .single();

    if (scanError || !scanRecord) {
      return { success: false, error: 'Failed to create scan record' };
    }

    const { data: session } = await supabase.auth.getSession();
    const token = session?.session?.access_token;

    if (!token) {
      return { success: false, error: 'User not authenticated' };
    }

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paste-scan-start`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scanId: scanRecord.id,
        rawText: text,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      return { success: false, error: data.error || 'Failed to start scan' };
    }

    return { success: true, scanId: scanRecord.id };
  } catch (error: any) {
    return { success: false, error: error.message || 'Unexpected error' };
  }
}

export async function startCsvScan(csvContent: string, userId: string): Promise<StartScanResult> {
  try {
    if (!csvContent || csvContent.trim().length === 0) {
      return { success: false, error: 'No CSV data provided' };
    }

    const { data: scanRecord, error: scanError } = await supabase
      .from('scans')
      .insert({
        user_id: userId,
        source_label: 'CSV Scan',
        source_type: 'csv',
        status: 'pending',
      })
      .select()
      .single();

    if (scanError || !scanRecord) {
      return { success: false, error: 'Failed to create scan record' };
    }

    const { data: session } = await supabase.auth.getSession();
    const token = session?.session?.access_token;

    if (!token) {
      return { success: false, error: 'User not authenticated' };
    }

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/csv-fast-scan`;

    // Fire and forget - the edge function will update scan status asynchronously
    fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scanId: scanRecord.id,
        userId: userId,
        csvContent: csvContent,
      }),
    }).catch(err => {
      console.error('CSV fast scan edge function error:', err);
    });

    // Return immediately - polling will track progress
    return { success: true, scanId: scanRecord.id };
  } catch (error: any) {
    return { success: false, error: error.message || 'Unexpected error' };
  }
}

export async function startImageScan(imageBase64: string, userId: string): Promise<StartScanResult> {
  try {
    if (!imageBase64 || imageBase64.trim().length === 0) {
      return { success: false, error: 'No image data provided' };
    }

    const { data: scanRecord, error: scanError } = await supabase
      .from('scans')
      .insert({
        user_id: userId,
        source_label: 'Image Scan',
        source_type: 'image',
        status: 'pending',
      })
      .select()
      .single();

    if (scanError || !scanRecord) {
      return { success: false, error: 'Failed to create scan record' };
    }

    const { data: session } = await supabase.auth.getSession();
    const token = session?.session?.access_token;

    if (!token) {
      return { success: false, error: 'User not authenticated' };
    }

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scan-processor-v2`;

    // Fire and forget - the edge function will update scan status asynchronously
    fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scanId: scanRecord.id,
        userId: userId,
        scanType: 'image',
        payload: { image: imageBase64 },
      }),
    }).catch(err => {
      console.error('Image scan edge function error:', err);
    });

    // Return immediately - polling will track progress
    return { success: true, scanId: scanRecord.id };
  } catch (error: any) {
    return { success: false, error: error.message || 'Unexpected error' };
  }
}

export async function checkScanReadiness(): Promise<ScanReadinessCheck> {
  const issues = {
    env: [] as string[],
    services: [] as string[],
    database: [] as string[],
  };

  if (!import.meta.env.VITE_SUPABASE_URL) {
    issues.env.push('Missing VITE_SUPABASE_URL');
  }

  if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
    issues.env.push('Missing VITE_SUPABASE_ANON_KEY');
  }

  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session) {
      issues.services.push('User not authenticated');
    }
  } catch (error) {
    issues.services.push('Authentication check failed');
  }

  try {
    const { error } = await supabase.from('scans').select('id').limit(1);
    if (error) {
      issues.database.push('Cannot access scans table');
    }
  } catch (error) {
    issues.database.push('Database connection failed');
  }

  const ready = issues.env.length === 0 && issues.services.length === 0 && issues.database.length === 0;

  return { ready, issues };
}
