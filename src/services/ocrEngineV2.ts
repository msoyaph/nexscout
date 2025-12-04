export type OcrFileResult = {
  fileId: string;
  fileName: string;
  width: number;
  height: number;
  rawText: string;
  lines: string[];
  blocks: string[];
  confidence: number;
  languageGuess: 'en' | 'tl' | 'taglish' | 'other';
};

export interface UploadedFile {
  id: string;
  name: string;
  dataUrl: string;
}

interface ImageMetrics {
  avgBrightness: number;
  isDarkMode: boolean;
  hasNoise: boolean;
}

export class OCREngineV2 {
  private static readonly MAX_CONCURRENCY = 3;
  private static readonly FILIPINO_KEYWORDS = ['ng', 'mga', 'sa', 'ang', 'na', 'ay', 'ko', 'mo', 'ka'];
  private static readonly TAGLISH_INDICATORS = ['kasi', 'pero', 'yung', 'lang', 'talaga', 'naman'];

  static async runOcrBatch(files: UploadedFile[]): Promise<OcrFileResult[]> {
    const results: OcrFileResult[] = [];
    const chunks = this.chunkArray(files, this.MAX_CONCURRENCY);

    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(file => this.processFile(file))
      );
      results.push(...chunkResults);
    }

    return results;
  }

  private static async processFile(file: UploadedFile): Promise<OcrFileResult> {
    try {
      const preprocessed = await this.preprocessImage(file.dataUrl);

      const ocrResult = await this.performOCR(preprocessed);

      const languageGuess = this.detectLanguage(ocrResult.rawText);

      return {
        fileId: file.id,
        fileName: file.name,
        width: preprocessed.width,
        height: preprocessed.height,
        rawText: ocrResult.rawText,
        lines: ocrResult.lines,
        blocks: ocrResult.blocks,
        confidence: ocrResult.confidence,
        languageGuess,
      };
    } catch (error) {
      console.error(`OCR failed for file ${file.name}:`, error);

      return {
        fileId: file.id,
        fileName: file.name,
        width: 0,
        height: 0,
        rawText: '',
        lines: [],
        blocks: [],
        confidence: 0,
        languageGuess: 'other',
      };
    }
  }

  private static async preprocessImage(imageDataUrl: string): Promise<{
    dataUrl: string;
    width: number;
    height: number;
  }> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = async () => {
        try {
          let canvas = document.createElement('canvas');
          let ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          const metrics = this.analyzeImage(ctx, canvas.width, canvas.height);

          const cropped = this.autoCropBorders(ctx, canvas.width, canvas.height);
          canvas = cropped.canvas;
          ctx = cropped.ctx;

          this.enhanceBrightnessContrast(ctx, canvas.width, canvas.height, metrics);

          if (metrics.hasNoise) {
            this.reduceNoise(ctx, canvas.width, canvas.height);
          }

          resolve({
            dataUrl: canvas.toDataURL('image/png'),
            width: canvas.width,
            height: canvas.height,
          });
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageDataUrl;
    });
  }

  private static analyzeImage(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): ImageMetrics {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    let totalBrightness = 0;
    let darkPixels = 0;
    let brightPixels = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (r + g + b) / 3;

      totalBrightness += brightness;

      if (brightness < 50) darkPixels++;
      if (brightness > 200) brightPixels++;
    }

    const pixelCount = data.length / 4;
    const avgBrightness = totalBrightness / pixelCount;
    const isDarkMode = avgBrightness < 100 || darkPixels / pixelCount > 0.5;
    const hasNoise = Math.abs(brightPixels - darkPixels) / pixelCount > 0.3;

    return { avgBrightness, isDarkMode, hasNoise };
  }

  private static autoCropBorders(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    let top = 0;
    let bottom = height;
    let left = 0;
    let right = width;

    const BORDER_THRESHOLD = 30;

    for (let y = 0; y < height; y++) {
      let darkCount = 0;
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        if (brightness < BORDER_THRESHOLD) darkCount++;
      }
      if (darkCount / width > 0.9) {
        top = y + 1;
      } else {
        break;
      }
    }

    for (let y = height - 1; y >= 0; y--) {
      let darkCount = 0;
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        if (brightness < BORDER_THRESHOLD) darkCount++;
      }
      if (darkCount / width > 0.9) {
        bottom = y;
      } else {
        break;
      }
    }

    const cropHeight = bottom - top;
    const cropWidth = right - left;

    if (cropHeight <= 0 || cropWidth <= 0) {
      const newCanvas = document.createElement('canvas');
      newCanvas.width = width;
      newCanvas.height = height;
      const newCtx = newCanvas.getContext('2d')!;
      newCtx.drawImage(ctx.canvas, 0, 0);
      return { canvas: newCanvas, ctx: newCtx };
    }

    const newCanvas = document.createElement('canvas');
    newCanvas.width = cropWidth;
    newCanvas.height = cropHeight;
    const newCtx = newCanvas.getContext('2d')!;

    newCtx.drawImage(
      ctx.canvas,
      left, top, cropWidth, cropHeight,
      0, 0, cropWidth, cropHeight
    );

    return { canvas: newCanvas, ctx: newCtx };
  }

  private static enhanceBrightnessContrast(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    metrics: ImageMetrics
  ): void {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const brightnessAdjust = metrics.isDarkMode ? 40 : 0;
    const contrastFactor = 1.3;
    const factor = (259 * (contrastFactor + 1)) / (259 - contrastFactor);

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      if (metrics.isDarkMode) {
        r = Math.min(255, r * 1.4 + brightnessAdjust);
        g = Math.min(255, g * 1.4 + brightnessAdjust);
        b = Math.min(255, b * 1.4 + brightnessAdjust);
      }

      r = Math.min(255, Math.max(0, factor * (r - 128) + 128));
      g = Math.min(255, Math.max(0, factor * (g - 128) + 128));
      b = Math.min(255, Math.max(0, factor * (b - 128) + 128));

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }

    ctx.putImageData(imageData, 0, 0);
  }

  private static reduceNoise(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): void {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const output = new Uint8ClampedArray(data);

    const kernel = [1, 2, 1, 2, 4, 2, 1, 2, 1];
    const kernelSum = 16;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let r = 0, g = 0, b = 0;

        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const i = ((y + ky) * width + (x + kx)) * 4;
            const weight = kernel[(ky + 1) * 3 + (kx + 1)];

            r += data[i] * weight;
            g += data[i + 1] * weight;
            b += data[i + 2] * weight;
          }
        }

        const i = (y * width + x) * 4;
        output[i] = r / kernelSum;
        output[i + 1] = g / kernelSum;
        output[i + 2] = b / kernelSum;
      }
    }

    for (let i = 0; i < data.length; i++) {
      data[i] = output[i];
    }

    ctx.putImageData(imageData, 0, 0);
  }

  private static async performOCR(preprocessed: {
    dataUrl: string;
    width: number;
    height: number;
  }): Promise<{
    rawText: string;
    lines: string[];
    blocks: string[];
    confidence: number;
  }> {
    const mockTexts = [
      `Juan dela Cruz\n15 mutual friends\nEntrepreneur | Business Owner\n\nMaria Santos\n23 mutual friends\nMarketing Manager at Tech Corp\n\nPedro Reyes\n8 mutual friends\nInterested in: Business, Technology\n\nJose Gonzales posted\n2 hrs ago\nExcited about our new sideline! Gusto ko mag-share ng opportunity. Perfect para sa mga gustong kumita extra income. Message me for details! 💰\n\nAnna Martinez shared\n1 day ago\nLooking for partners sa Metro Manila. May negosyo ako na perfect for OFWs and working professionals. Low capital, high returns!\n\nCarlos Ramos\n12 mutual friends\nCEO at Digital Solutions PH`,

      `Friends (2,847)\n\nRobert Tan\n52 mutual friends\nLives in Makati City\n\nJenny Lim\n34 mutual friends\nWorks at BPO Company\n\nMichael Cruz\n18 mutual friends\nStudied at UP Diliman\n\nSarah Reyes\n67 mutual friends\nFounder at StartupPH\n\nDavid Garcia\nFriends · 45 mutual friends\n\nLisa Fernandez\n29 mutual friends\nInterested in entrepreneurship`,
    ];

    const selectedText = mockTexts[Math.floor(Math.random() * mockTexts.length)];

    const lines = selectedText.split('\n').filter(line => line.trim().length > 0);

    const blocks: string[] = [];
    let currentBlock = '';

    for (const line of lines) {
      currentBlock += line + '\n';

      if (line.trim() === '' || line.includes('mutual friends') || line.includes('posted')) {
        if (currentBlock.trim()) {
          blocks.push(currentBlock.trim());
        }
        currentBlock = '';
      }
    }

    if (currentBlock.trim()) {
      blocks.push(currentBlock.trim());
    }

    const confidence = 0.75 + Math.random() * 0.2;

    return {
      rawText: selectedText,
      lines,
      blocks,
      confidence,
    };
  }

  private static detectLanguage(text: string): 'en' | 'tl' | 'taglish' | 'other' {
    const lowerText = text.toLowerCase();
    const words = lowerText.split(/\s+/);

    let filipinoCount = 0;
    let taglishCount = 0;

    for (const word of words) {
      if (this.FILIPINO_KEYWORDS.includes(word)) {
        filipinoCount++;
      }
      if (this.TAGLISH_INDICATORS.includes(word)) {
        taglishCount++;
      }
    }

    const totalWords = words.length;

    if (totalWords === 0) return 'other';

    const filipinoRatio = filipinoCount / totalWords;
    const taglishRatio = taglishCount / totalWords;

    if (taglishRatio > 0.02 || (filipinoRatio > 0.02 && filipinoRatio < 0.15)) {
      return 'taglish';
    }

    if (filipinoRatio > 0.15) {
      return 'tl';
    }

    if (filipinoRatio < 0.01) {
      return 'en';
    }

    return 'other';
  }

  private static chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
