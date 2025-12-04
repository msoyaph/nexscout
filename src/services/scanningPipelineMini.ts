import { supabase } from '@/lib/supabase';

export async function runMiniScanPipeline(scanId: string, text: string, userId: string) {
  try {
    // STEP 1: Initialize scan status
    await supabase
      .from('scan_status')
      .insert({
        scan_id: scanId,
        step: 'EXTRACTING_TEXT',
        percent: 10,
        message: 'Extracting text...'
      });

    await new Promise(r => setTimeout(r, 500));

    // STEP 2: Detect names
    await supabase
      .from('scan_status')
      .update({
        step: 'DETECTING_NAMES',
        percent: 40,
        message: 'Detecting names...',
        updated_at: new Date().toISOString()
      })
      .eq('scan_id', scanId);

    await new Promise(r => setTimeout(r, 500));

    // Extract names from text
    const names = extractFakeNames(text);

    // STEP 3: Score prospects
    await supabase
      .from('scan_status')
      .update({
        step: 'SCORING_PROSPECTS',
        percent: 80,
        message: 'Scoring prospects...',
        updated_at: new Date().toISOString()
      })
      .eq('scan_id', scanId);

    await new Promise(r => setTimeout(r, 500));

    // STEP 4: Save results
    await supabase
      .from('scan_results')
      .insert({
        scan_id: scanId,
        prospects: names
      });

    // STEP 5: Mark as completed
    await supabase
      .from('scan_status')
      .update({
        step: 'COMPLETED',
        percent: 100,
        message: 'Scan completed!',
        updated_at: new Date().toISOString()
      })
      .eq('scan_id', scanId);

    // Update scan record status
    await supabase
      .from('scans')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', scanId);

  } catch (error) {
    console.error('Error in scan pipeline:', error);

    // Mark scan as failed
    await supabase
      .from('scan_status')
      .update({
        step: 'FAILED',
        percent: 0,
        message: 'Scan failed. Please try again.',
        updated_at: new Date().toISOString()
      })
      .eq('scan_id', scanId);

    await supabase
      .from('scans')
      .update({
        status: 'failed'
      })
      .eq('id', scanId);
  }
}

function extractFakeNames(text: string): Array<{ name: string; score: number }> {
  // Match typical Filipino and English names (First Last)
  const regex = /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g;
  const detected = text.match(regex) || [];

  // Remove duplicates and return with scores
  const uniqueNames = [...new Set(detected)];

  return uniqueNames.map(name => ({
    name,
    score: Math.floor(Math.random() * 30) + 50 // Random score between 50-79
  }));
}
