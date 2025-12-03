export interface OCROutput {
  raw_text: string;
  detected_names: string[];
  detected_numbers: number[];
  posts: Array<{
    text: string;
    timestamp: string | null;
  }>;
  friends_list: Array<{
    name: string;
    mutual_friends: number | null;
  }>;
}

export interface ImageProcessingResult {
  success: boolean;
  ocr_output?: OCROutput;
  error?: string;
}

export class OCRProcessor {
  private static async enhanceImage(imageData: string): Promise<string> {
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

        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;

          let newValue = avg;
          newValue = ((newValue - 128) * 1.3) + 128;
          newValue = Math.min(255, Math.max(0, newValue));

          data[i] = newValue;
          data[i + 1] = newValue;
          data[i + 2] = newValue;
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageData;
    });
  }

  private static async segmentLongScreenshot(
    imageData: string,
    maxHeight: number = 2000
  ): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const segments: string[] = [];

        if (img.height <= maxHeight) {
          segments.push(imageData);
          resolve(segments);
          return;
        }

        const numSegments = Math.ceil(img.height / maxHeight);
        const overlap = 100;

        for (let i = 0; i < numSegments; i++) {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = Math.min(maxHeight, img.height - i * maxHeight);

          const ctx = canvas.getContext('2d');
          if (!ctx) continue;

          const sourceY = Math.max(0, i * maxHeight - (i > 0 ? overlap : 0));
          ctx.drawImage(
            img,
            0, sourceY,
            img.width, canvas.height,
            0, 0,
            canvas.width, canvas.height
          );

          segments.push(canvas.toDataURL('image/png'));
        }

        resolve(segments);
      };

      img.onerror = () => reject(new Error('Failed to load image for segmentation'));
      img.src = imageData;
    });
  }

  private static extractNames(text: string): string[] {
    const names: string[] = [];
    const namePattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g;
    const matches = text.match(namePattern);

    if (matches) {
      matches.forEach(name => {
        const trimmed = name.trim();
        if (trimmed.length > 3 && !names.includes(trimmed)) {
          names.push(trimmed);
        }
      });
    }

    return names;
  }

  private static extractNumbers(text: string): number[] {
    const numbers: number[] = [];
    const numberPattern = /\b\d+\b/g;
    const matches = text.match(numberPattern);

    if (matches) {
      matches.forEach(num => {
        const parsed = parseInt(num, 10);
        if (!isNaN(parsed) && parsed > 0) {
          numbers.push(parsed);
        }
      });
    }

    return numbers;
  }

  private static extractPosts(text: string): Array<{ text: string; timestamp: string | null }> {
    const posts: Array<{ text: string; timestamp: string | null }> = [];

    const postPatterns = [
      /(?:posted|shared|updated)[\s\S]*?(?=\n\n|\n(?:[A-Z]|$)|$)/gi,
      /(?:\d+\s*(?:hr|hour|min|minute|day|week|month)s?\s*ago)[\s\S]*?(?=\n\n|$)/gi,
    ];

    postPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const timeMatch = match.match(/(\d+\s*(?:hr|hour|min|minute|day|week|month)s?\s*ago)/i);
          const timestamp = timeMatch ? timeMatch[1] : null;

          if (match.length > 20) {
            posts.push({
              text: match.trim(),
              timestamp,
            });
          }
        });
      }
    });

    return posts;
  }

  private static extractFriendsList(text: string): Array<{ name: string; mutual_friends: number | null }> {
    const friends: Array<{ name: string; mutual_friends: number | null }> = [];

    const friendPattern = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)[\s\S]*?(\d+)\s*mutual\s*friend/gi;
    const matches = text.matchAll(friendPattern);

    for (const match of matches) {
      friends.push({
        name: match[1].trim(),
        mutual_friends: parseInt(match[2], 10),
      });
    }

    const lines = text.split('\n');
    for (const line of lines) {
      const nameMatch = line.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)$/);
      if (nameMatch && !friends.some(f => f.name === nameMatch[1].trim())) {
        friends.push({
          name: nameMatch[1].trim(),
          mutual_friends: null,
        });
      }
    }

    return friends;
  }

  static async processImage(imageData: string): Promise<ImageProcessingResult> {
    try {
      const enhanced = await this.enhanceImage(imageData);

      const segments = await this.segmentLongScreenshot(enhanced);

      let combinedText = '';

      for (const segment of segments) {
        const mockOCRText = this.simulateOCR(segment);
        combinedText += mockOCRText + '\n\n';
      }

      const detected_names = this.extractNames(combinedText);
      const detected_numbers = this.extractNumbers(combinedText);
      const posts = this.extractPosts(combinedText);
      const friends_list = this.extractFriendsList(combinedText);

      return {
        success: true,
        ocr_output: {
          raw_text: combinedText.trim(),
          detected_names,
          detected_numbers,
          posts,
          friends_list,
        },
      };
    } catch (error) {
      console.error('OCR processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private static simulateOCR(imageData: string): string {
    const sampleTexts = [
      'John Smith posted an update\n2 hours ago\nExcited to announce our new product launch! #innovation #business',
      'Sarah Johnson shared a link\n1 day ago\nCheck out this amazing opportunity in the tech industry',
      'Michael Chen\n15 mutual friends\nSoftware Engineer at Tech Corp',
      'Emily Rodriguez\n8 mutual friends\nMarketing Director',
      'David Kim posted about leadership\n3 days ago\nLeadership is about empowering others to achieve greatness',
    ];

    return sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
  }

  static async processMultipleImages(images: string[]): Promise<OCROutput[]> {
    const results: OCROutput[] = [];

    for (const image of images) {
      const result = await this.processImage(image);
      if (result.success && result.ocr_output) {
        results.push(result.ocr_output);
      }
    }

    return results;
  }

  static combineOCROutputs(outputs: OCROutput[]): OCROutput {
    return {
      raw_text: outputs.map(o => o.raw_text).join('\n\n'),
      detected_names: [...new Set(outputs.flatMap(o => o.detected_names))],
      detected_numbers: [...new Set(outputs.flatMap(o => o.detected_numbers))],
      posts: outputs.flatMap(o => o.posts),
      friends_list: outputs.flatMap(o => o.friends_list).filter(
        (friend, index, self) =>
          index === self.findIndex(f => f.name === friend.name)
      ),
    };
  }
}
