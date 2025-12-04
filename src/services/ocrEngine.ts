import { OCREngineV2, OcrFileResult, UploadedFile } from './ocrEngineV2';

export interface OCRResult {
  raw_text: string;
  lines: string[];
  blocks: string[];
  confidence: number;
}

export { OCREngineV2, OcrFileResult, UploadedFile };

export class OCREngine {
  private static async enhanceImage(imageDataUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        const avgBrightness = this.calculateAverageBrightness(data);
        const isDarkMode = avgBrightness < 100;

        for (let i = 0; i < data.length; i += 4) {
          let r = data[i];
          let g = data[i + 1];
          let b = data[i + 2];

          if (isDarkMode) {
            r = Math.min(255, r * 1.4 + 30);
            g = Math.min(255, g * 1.4 + 30);
            b = Math.min(255, b * 1.4 + 30);
          }

          const contrastFactor = 1.3;
          const factor = (259 * (contrastFactor + 1)) / (259 - contrastFactor);

          r = Math.min(255, Math.max(0, factor * (r - 128) + 128));
          g = Math.min(255, Math.max(0, factor * (g - 128) + 128));
          b = Math.min(255, Math.max(0, factor * (b - 128) + 128));

          data[i] = r;
          data[i + 1] = g;
          data[i + 2] = b;
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageDataUrl;
    });
  }

  private static calculateAverageBrightness(data: Uint8ClampedArray): number {
    let totalBrightness = 0;
    let pixelCount = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (r + g + b) / 3;
      totalBrightness += brightness;
      pixelCount++;
    }

    return totalBrightness / pixelCount;
  }

  private static async cropLongScreenshot(
    imageDataUrl: string,
    maxHeight: number = 2500
  ): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        const segments: string[] = [];

        if (img.height <= maxHeight) {
          segments.push(imageDataUrl);
          resolve(segments);
          return;
        }

        const numSegments = Math.ceil(img.height / maxHeight);
        const overlapPixels = 150;

        for (let i = 0; i < numSegments; i++) {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;

          const startY = Math.max(0, i * maxHeight - (i > 0 ? overlapPixels : 0));
          const segmentHeight = Math.min(maxHeight + overlapPixels, img.height - startY);

          canvas.height = segmentHeight;

          const ctx = canvas.getContext('2d');
          if (!ctx) continue;

          ctx.drawImage(
            img,
            0, startY,
            img.width, segmentHeight,
            0, 0,
            canvas.width, canvas.height
          );

          segments.push(canvas.toDataURL('image/png'));
        }

        resolve(segments);
      };

      img.onerror = () => reject(new Error('Failed to load image for cropping'));
      img.src = imageDataUrl;
    });
  }

  static async processImage(imageDataUrl: string): Promise<OCRResult> {
    try {
      const enhanced = await this.enhanceImage(imageDataUrl);

      const segments = await this.cropLongScreenshot(enhanced);

      const allTexts: string[] = [];
      const allLines: string[] = [];
      const allBlocks: string[] = [];
      let totalConfidence = 0;

      for (const segment of segments) {
        const ocrResult = await this.performOCR(segment);
        allTexts.push(ocrResult.raw_text);
        allLines.push(...ocrResult.lines);
        allBlocks.push(...ocrResult.blocks);
        totalConfidence += ocrResult.confidence;
      }

      const avgConfidence = segments.length > 0 ? totalConfidence / segments.length : 0;

      return {
        raw_text: allTexts.join('\n\n'),
        lines: allLines,
        blocks: allBlocks,
        confidence: avgConfidence,
      };
    } catch (error) {
      console.error('OCR processing error:', error);
      return {
        raw_text: '',
        lines: [],
        blocks: [],
        confidence: 0,
      };
    }
  }

  private static async performOCR(imageDataUrl: string): Promise<OCRResult> {
    const mockTexts = [
      `Juan dela Cruz
15 mutual friends
Entrepreneur | Business Owner

Maria Santos
23 mutual friends
Marketing Manager at Tech Corp

Pedro Reyes
8 mutual friends
Interested in: Business, Technology, Real Estate

Jose Gonzales posted an update
2 hrs ago
Excited to share our new product launch! Ang ganda ng resulta ng ating hard work. Looking for partners sa Metro Manila area. #business #startup

Anna Martinez shared a link
1 day ago
Check out this amazing business opportunity. Perfect para sa mga gustong mag-negosyo. May seminar next week!

Carlos Ramos
12 mutual friends
CEO at Digital Solutions PH

See more...

Like · Comment · Share

Mark Fernandez commented:
"Congrats bro! Proud of you!"

2.5k reactions · 234 comments · 89 shares`,
    ];

    const selectedText = mockTexts[Math.floor(Math.random() * mockTexts.length)];

    const lines = selectedText.split('\n').filter(line => line.trim().length > 0);

    const blocks: string[] = [];
    let currentBlock = '';

    for (const line of lines) {
      currentBlock += line + '\n';

      if (line.trim() === '' || line.includes('mutual friends') || line.includes('...')) {
        if (currentBlock.trim()) {
          blocks.push(currentBlock.trim());
        }
        currentBlock = '';
      }
    }

    if (currentBlock.trim()) {
      blocks.push(currentBlock.trim());
    }

    const confidence = 75 + Math.random() * 20;

    return {
      raw_text: selectedText,
      lines,
      blocks,
      confidence,
    };
  }

  static async processMultipleImages(images: string[]): Promise<OCRResult[]> {
    const results: OCRResult[] = [];

    for (const image of images) {
      const result = await this.processImage(image);
      if (result.confidence > 50) {
        results.push(result);
      }
    }

    return results;
  }

  static combineOCRResults(results: OCRResult[]): OCRResult {
    if (results.length === 0) {
      return {
        raw_text: '',
        lines: [],
        blocks: [],
        confidence: 0,
      };
    }

    const totalConfidence = results.reduce((sum, r) => sum + r.confidence, 0);
    const avgConfidence = totalConfidence / results.length;

    return {
      raw_text: results.map(r => r.raw_text).join('\n\n---\n\n'),
      lines: results.flatMap(r => r.lines),
      blocks: results.flatMap(r => r.blocks),
      confidence: avgConfidence,
    };
  }
}
