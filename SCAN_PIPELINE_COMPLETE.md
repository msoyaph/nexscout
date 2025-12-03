# NexScout Scan Pipeline - Complete Implementation

## Overview

This document describes the complete, production-ready scan pipeline that fixes the "0% stuck" issue and provides robust text, CSV, and image scanning capabilities with real-time progress tracking.

## Architecture

### Backend Scanner Infrastructure

#### 1. **Scan Queue** (`/src/services/scanner/scanQueue.ts`)
- Manages scan job execution with proper state machine
- Prevents duplicate processing
- Emits progress updates at key stages:
  - 0%: Queued
  - 5-20%: Extracting text
  - 25-40%: Detecting prospects
  - 45-75%: Scoring prospects
  - 80-95%: Saving results
  - 100%: Completed

#### 2. **Text Extractors** (`/src/services/scanner/extractText.ts`)
- **Text Handler**: Direct text pass-through
- **CSV Handler**:
  - Parses CSV with quoted field support
  - Extracts name columns and content columns
  - Merges rows into formatted text
- **Image Handler**:
  - Uses Tesseract.js for OCR
  - Returns confidence scores
  - Supports base64 and URL inputs

#### 3. **Prospect Detection** (`/src/services/scanner/extractProspects.ts`)
- Pattern matching for name extraction:
  - `Name — Content` format (primary)
  - Standalone names with context
  - Inline name patterns
- Deduplicates prospects by name
- Preserves context and line numbers

#### 4. **AI Scoring Engine** (`/src/services/scanner/scoutScoreEngine.ts`)
- **ScoutScore v2.0** with 7-feature vectors:
  - Pain point detection (8 points each)
  - Opportunity signals (10 points each)
  - Urgency keywords (12 points each)
  - Positive sentiment (8 points)
  - Life events (7 points each)
  - Business/product intent (10 points for both)
  - Financial motivation (8 points)
- **Bucketing**: Hot (70+), Warm (50-69), Cold (<50)
- **Confidence scoring**: 60-95% based on signal strength
- **Multi-language support**: English and Filipino keywords

#### 5. **Database Persistence** (`/src/services/scanner/saveResults.ts`)
- Batch inserts to `scan_processed_items` (100 items per batch)
- Upserts to `prospects` table with conflict resolution
- Preserves all metadata: factors, signals, sentiment

### Edge Functions

#### **scan-processor-v2** (`/supabase/functions/scan-processor-v2/index.ts`)
- Self-contained processor with embedded logic
- Handles text, CSV, and image types
- Emits progress at each stage
- Comprehensive error handling
- Returns final counts (hot/warm/cold)

#### **paste-scan-start** (`/supabase/functions/paste-scan-start/index.ts`)
- Creates initial scan status
- Triggers processor asynchronously
- Returns immediately to client

### Frontend Services

#### **Scanner Client** (`/src/services/scanner/scannerClient.ts`)
- `startTextScan(text, userId)`: Paste text scanning
- `startCsvScan(csvContent, userId)`: CSV file scanning
- `startImageScan(imageBase64, userId)`: Image OCR scanning
- `checkScanReadiness()`: Pre-flight validation

#### **Progress Hook** (`/src/hooks/useScanProgress.ts`)
- Real-time updates via Supabase Realtime
- Polling fallback every 2 seconds
- Tracks stage, percent, message, counts
- Auto-cleanup on unmount

## Database Schema

### Required Tables

```sql
-- Main scan record
scans (
  id, user_id, source_label, source_type, status,
  total_items, hot_leads, warm_leads, cold_leads,
  created_at, completed_at, updated_at
)

-- Progress tracking
scan_status (
  id, scan_id, step, percent, message,
  items_processed, total_items, updated_at
)

-- Processed results
scan_processed_items (
  id, scan_id, type, name, content, score, metadata
)

-- Prospect records
prospects (
  id, user_id, full_name, snippet, scout_score, bucket,
  pain_points, interests, life_events, sentiment,
  opportunity_type, pipeline_stage, source_scan_id, metadata
)
```

## Usage Flow

### Text/CSV Scan

```typescript
import { startTextScan } from '@/services/scanner/scannerClient';

const result = await startTextScan(pastedText, userId);
if (result.success) {
  // Navigate to progress page with result.scanId
  navigateToProgress(result.scanId);
}
```

### Real-time Progress

```typescript
import { useScanProgress } from '@/hooks/useScanProgress';

const { progress, isComplete, error } = useScanProgress(scanId);

// progress.percent: 0-100
// progress.stage: 'queued' | 'extracting_text' | 'detecting_prospects' | 'scoring' | 'saving' | 'completed'
// progress.message: Human-readable status
```

### CSV Format Support

The scanner supports flexible CSV formats:

```csv
full_name,snippet,context
John Doe,"Need extra income","Looking for opportunities"
Jane Smith,"Want to start business","Interested in franchise"
```

- Handles quoted fields with commas
- Detects name columns automatically
- Merges content from multiple columns

## Stage Descriptions

| Stage | Percent | Description |
|-------|---------|-------------|
| queued | 0% | Scan accepted and queued |
| extracting_text | 5-20% | Converting input to text |
| detecting_prospects | 25-40% | Finding prospect names |
| scoring | 45-75% | AI analyzing each prospect |
| saving | 80-95% | Writing to database |
| completed | 100% | Scan finished successfully |
| failed | 0% | Error occurred |

## Error Handling

- All stages wrapped in try-catch
- Progress emitted before failure
- Scan status updated to 'failed'
- Error message preserved in scan_status
- Frontend displays user-friendly error

## Performance

- Batch database writes (100 items/batch)
- Parallel prospect scoring where possible
- Efficient regex patterns
- Minimal LLM calls (future enhancement)
- Progress updates every 5 prospects

## Testing

### Manual Test

1. Go to Paste Text Scan page
2. Paste 100 prospects (see example in prompt)
3. Click "Scan Now"
4. Verify progress bar moves through stages
5. Verify redirect to results at 100%
6. Check all prospects appear with scores

### Expected Results

- 100 prospects detected
- ~30-40 Hot leads (high urgency + pain points)
- ~40-50 Warm leads (moderate signals)
- ~10-20 Cold leads (low signals)
- Processing time: 30-60 seconds

## Deployment Checklist

- [x] Backend scanner services created
- [x] Edge function deployed: scan-processor-v2
- [x] Edge function updated: paste-scan-start
- [x] Frontend client service created
- [x] Progress tracking hook created
- [x] Database tables verified
- [x] PasteTextScanPage updated
- [x] Build passes without errors

## Future Enhancements

1. **Parallel Processing**: Process multiple prospects simultaneously
2. **LLM Integration**: Use OpenAI for deeper analysis
3. **Image OCR**: Enable ScrapeCreators API fallback
4. **Batch Scans**: Support multiple files in one scan
5. **Smart Deduplication**: Cross-scan prospect matching
6. **Export Results**: CSV/Excel export of scanned prospects

## Troubleshooting

### Scan Stuck at 0%

**Cause**: Edge function not deployed or not triggered
**Fix**: Deploy scan-processor-v2 edge function

### No Prospects Found

**Cause**: Name pattern doesn't match
**Fix**: Check input format is "Name — Content"

### Progress Not Updating

**Cause**: Realtime subscription not working
**Fix**: Polling fallback should work; check network tab

### Database Errors

**Cause**: Missing tables or RLS policies
**Fix**: Run all migrations, check RLS policies allow user access

## Support

For issues, check:
1. Browser console for errors
2. Supabase Edge Function logs
3. Database `scan_status` table for last progress
4. Database `diagnostic_logs` table for debugging info
