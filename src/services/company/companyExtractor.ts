import { supabase } from '../../lib/supabase';
import Tesseract from 'tesseract.js';

export interface ExtractionResult {
  success: boolean;
  data?: ExtractedCompanyData;
  error?: string;
}

export interface ExtractedCompanyData {
  brandKeywords: string[];
  products: ProductInfo[];
  compensationPlan: CompensationPlanInfo | null;
  valuePropositions: string[];
  objections: ObjectionInfo[];
  testimonials: TestimonialInfo[];
  toneProfile: ToneProfile;
  companyStory: string;
  targetCustomer: string;
  painPoints: string[];
  benefits: string[];
}

export interface ProductInfo {
  name: string;
  description: string;
  price?: string;
  features: string[];
}

export interface CompensationPlanInfo {
  structure: string;
  commissionRates: string[];
  bonuses: string[];
  ranks: string[];
}

export interface ObjectionInfo {
  objection: string;
  rebuttal: string;
  category: string;
}

export interface TestimonialInfo {
  text: string;
  author: string;
  result: string;
}

export interface ToneProfile {
  formality: 'casual' | 'professional' | 'formal';
  energy: 'calm' | 'moderate' | 'energetic';
  language: 'english' | 'taglish' | 'filipino';
  approach: 'consultative' | 'aggressive' | 'friendly';
}

/**
 * Extract text from PDF file
 */
export async function extractPdfText(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-pdf-text`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('PDF extraction failed');
    }

    const result = await response.json();
    return result.text || '';
  } catch (error) {
    console.error('PDF extraction error:', error);
    return '';
  }
}

/**
 * Extract text from image using OCR
 */
export async function extractImageText(file: File): Promise<string> {
  try {
    const result = await Tesseract.recognize(file, 'eng+fil', {
      logger: (m) => console.log(m),
    });

    return result.data.text;
  } catch (error) {
    console.error('OCR error:', error);
    return '';
  }
}

/**
 * Extract text from PPTX file
 */
export async function extractPptxText(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-pptx-text`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('PPTX extraction failed');
    }

    const result = await response.json();
    return result.text || '';
  } catch (error) {
    console.error('PPTX extraction error:', error);
    return '';
  }
}

/**
 * Extract text from URL (website scraping)
 */
export async function extractUrlText(url: string): Promise<string> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scrape-website`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      }
    );

    if (!response.ok) {
      throw new Error('Website scraping failed');
    }

    const result = await response.json();
    return result.text || '';
  } catch (error) {
    console.error('URL extraction error:', error);
    return '';
  }
}

/**
 * Process and extract company intelligence from raw text using AI
 */
export async function analyzeCompanyData(
  userId: string,
  assetId: string,
  rawText: string
): Promise<ExtractionResult> {
  try {
    if (!rawText || rawText.trim().length < 50) {
      return { success: false, error: 'Insufficient text content' };
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-company-data`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, assetId, rawText }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || 'Analysis failed' };
    }

    const data = await response.json();
    return { success: true, data: data.extracted };
  } catch (error: any) {
    console.error('Company data analysis error:', error);
    return { success: false, error: error.message || 'Analysis failed' };
  }
}

/**
 * Save extracted data to database
 */
export async function saveExtractedData(
  userId: string,
  assetId: string,
  dataType: string,
  data: any,
  confidence: number = 0.8
): Promise<boolean> {
  try {
    const { error } = await supabase.from('company_extracted_data').insert({
      user_id: userId,
      asset_id: assetId,
      data_type: dataType,
      data_json: data,
      confidence,
    });

    if (error) {
      console.error('Save extracted data error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Save extracted data error:', error);
    return false;
  }
}

/**
 * Update asset extraction status
 */
export async function updateAssetStatus(
  assetId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  error?: string
): Promise<void> {
  try {
    const updates: any = {
      extraction_status: status,
      updated_at: new Date().toISOString(),
    };

    if (error) {
      updates.extraction_error = error;
    }

    await supabase.from('company_assets').update(updates).eq('id', assetId);
  } catch (error) {
    console.error('Update asset status error:', error);
  }
}

/**
 * Main extraction pipeline
 */
export async function processCompanyAsset(
  userId: string,
  assetId: string,
  file: File,
  fileType: string
): Promise<ExtractionResult> {
  try {
    await updateAssetStatus(assetId, 'processing');

    let rawText = '';

    if (fileType === 'pdf') {
      rawText = await extractPdfText(file);
    } else if (fileType === 'pptx') {
      rawText = await extractPptxText(file);
    } else if (fileType === 'image') {
      rawText = await extractImageText(file);
    } else if (fileType === 'text') {
      rawText = await file.text();
    }

    if (!rawText) {
      await updateAssetStatus(assetId, 'failed', 'No text extracted');
      return { success: false, error: 'Failed to extract text from file' };
    }

    const result = await analyzeCompanyData(userId, assetId, rawText);

    if (result.success && result.data) {
      await saveAllExtractedData(userId, assetId, result.data);
      await updateAssetStatus(assetId, 'completed');
    } else {
      await updateAssetStatus(assetId, 'failed', result.error);
    }

    return result;
  } catch (error: any) {
    await updateAssetStatus(assetId, 'failed', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Save all extracted company data
 */
async function saveAllExtractedData(
  userId: string,
  assetId: string,
  data: ExtractedCompanyData
): Promise<void> {
  const saves = [
    saveExtractedData(userId, assetId, 'brand_keywords', data.brandKeywords, 0.9),
    saveExtractedData(userId, assetId, 'products', data.products, 0.85),
    saveExtractedData(userId, assetId, 'compensation_plan', data.compensationPlan, 0.8),
    saveExtractedData(userId, assetId, 'value_propositions', data.valuePropositions, 0.85),
    saveExtractedData(userId, assetId, 'objections', data.objections, 0.8),
    saveExtractedData(userId, assetId, 'testimonials', data.testimonials, 0.9),
    saveExtractedData(userId, assetId, 'tone_profile', data.toneProfile, 0.85),
    saveExtractedData(userId, assetId, 'company_story', data.companyStory, 0.8),
    saveExtractedData(userId, assetId, 'target_customer', data.targetCustomer, 0.85),
    saveExtractedData(userId, assetId, 'pain_points', data.painPoints, 0.8),
    saveExtractedData(userId, assetId, 'benefits', data.benefits, 0.85),
  ];

  await Promise.all(saves);
}
