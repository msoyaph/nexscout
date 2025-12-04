import { createWorker } from 'tesseract.js';

export interface OCRResult {
  rawText: string;
  lines: string[];
  detectedNames: string[];
  detectedNumbers: string[];
  layoutHints: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
  }>;
  confidence: number;
}

const FB_JUNK_PATTERNS = [
  /Like\s*·\s*Comment\s*·\s*Share/gi,
  /See more/gi,
  /Suggested for you/gi,
  /Sponsored/gi,
  /See all/gi,
  /See All/gi,
  /Show more/gi,
  /View \d+ more comments?/gi,
  /Write a comment/gi,
  /What's on your mind/gi,
  /Create Post/gi,
  /Photo\/Video/gi,
  /Feeling\/Activity/gi,
];

const NAME_PATTERN = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g;
const NUMBER_PATTERN = /\b\d+\b/g;
const MUTUAL_FRIENDS_PATTERN = /(\d+)\s+mutual\s+friends?/gi;

export class OCREngine {
  private worker: any = null;
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    console.log('[OCR] Initializing Tesseract worker...');
    this.worker = await createWorker('eng+fil', 1, {
      logger: (m: any) => {
        if (m.status === 'recognizing text') {
          console.log(`[OCR] Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });
    this.initialized = true;
    console.log('[OCR] Worker initialized');
  }

  async processImage(imageFile: File): Promise<OCRResult> {
    await this.initialize();

    console.log('[OCR] Processing image:', imageFile.name);
    const startTime = Date.now();

    const imageUrl = URL.createObjectURL(imageFile);

    try {
      const { data } = await this.worker.recognize(imageUrl);

      const rawText = data.text || '';
      console.log('[OCR] Extracted text:', rawText.slice(0, 200));

      const cleanedText = this.cleanText(rawText);
      const lines = this.extractLines(cleanedText);
      const detectedNames = this.extractNames(cleanedText);
      const detectedNumbers = this.extractNumbers(cleanedText);
      const layoutHints = this.extractLayout(data);

      const processingTime = Date.now() - startTime;
      console.log(`[OCR] Completed in ${processingTime}ms, found ${detectedNames.length} names`);

      URL.revokeObjectURL(imageUrl);

      return {
        rawText: cleanedText,
        lines,
        detectedNames,
        detectedNumbers,
        layoutHints,
        confidence: data.confidence || 0,
      };
    } catch (error) {
      URL.revokeObjectURL(imageUrl);
      console.error('[OCR] Error processing image:', error);
      throw error;
    }
  }

  async processMultipleImages(imageFiles: File[]): Promise<OCRResult[]> {
    console.log(`[OCR] Processing ${imageFiles.length} images...`);
    const results: OCRResult[] = [];

    for (let i = 0; i < imageFiles.length; i++) {
      console.log(`[OCR] Processing image ${i + 1}/${imageFiles.length}`);
      const result = await this.processImage(imageFiles[i]);
      results.push(result);
    }

    return results;
  }

  private cleanText(text: string): string {
    let cleaned = text;

    FB_JUNK_PATTERNS.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });

    cleaned = cleaned
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');

    return cleaned;
  }

  private extractLines(text: string): string[] {
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 2);
  }

  private extractNames(text: string): string[] {
    const names = new Set<string>();
    const matches = text.match(NAME_PATTERN);

    if (matches) {
      matches.forEach(name => {
        const trimmed = name.trim();
        if (trimmed.length >= 4 && trimmed.split(' ').length >= 2) {
          names.add(trimmed);
        }
      });
    }

    return Array.from(names);
  }

  private extractNumbers(text: string): string[] {
    const numbers = new Set<string>();
    const matches = text.match(NUMBER_PATTERN);

    if (matches) {
      matches.forEach(num => numbers.add(num));
    }

    return Array.from(numbers);
  }

  private extractLayout(data: any): Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
  }> {
    const hints: Array<any> = [];

    if (data.words) {
      data.words.forEach((word: any) => {
        if (word.text && word.bbox) {
          hints.push({
            x: word.bbox.x0,
            y: word.bbox.y0,
            width: word.bbox.x1 - word.bbox.x0,
            height: word.bbox.y1 - word.bbox.y0,
            text: word.text,
          });
        }
      });
    }

    return hints;
  }

  async terminate() {
    if (this.worker) {
      await this.worker.terminate();
      this.initialized = false;
      console.log('[OCR] Worker terminated');
    }
  }
}

export const ocrEngine = new OCREngine();
