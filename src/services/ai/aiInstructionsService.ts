/**
 * AI INSTRUCTIONS SERVICE
 * 
 * Unified service for managing AI system instructions across all features
 * Supports: Chatbot, Pitch Decks, Messages, Sequences, Followups, etc.
 * 
 * Features:
 * - Feature-specific instructions
 * - Global instructions (fallback)
 * - Override mode (replace auto intelligence)
 * - Smart mode (merge with auto intelligence)
 * - Rich content (images, files)
 */

import { supabase } from '../../lib/supabase';

export type AIFeatureType =
  | 'chatbot'
  | 'pitch_deck'
  | 'ai_messages'
  | 'ai_sequences'
  | 'ai_followups'
  | 'ai_objections'
  | 'ai_scanning'
  | 'global';

export interface RichImage {
  type: 'product' | 'logo' | 'catalog' | 'screenshot' | 'other';
  url: string;
  caption?: string;
  alt?: string;
}

export interface RichFile {
  type: 'brochure' | 'doc' | 'pdf' | 'spreadsheet' | 'other';
  url: string;
  name: string;
  size?: number;
}

export interface RichContent {
  text: string;
  images: RichImage[];
  files: RichFile[];
}

export interface AIInstructions {
  id: string;
  userId: string;
  featureType: AIFeatureType;
  customInstructions: string;
  useCustomInstructions: boolean;
  overrideIntelligence: boolean;
  richContent: RichContent;
  isActive: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

class AIInstructionsService {
  /**
   * Get AI instructions for a specific feature
   * Falls back to global if feature-specific not found
   */
  async getInstructions(
    userId: string,
    featureType: AIFeatureType
  ): Promise<AIInstructions | null> {
    try {
      // Try feature-specific first
      let { data } = await supabase
        .from('ai_system_instructions')
        .select('*')
        .eq('user_id', userId)
        .eq('feature_type', featureType)
        .eq('is_active', true)
        .maybeSingle();

      // If not found and not global, try global fallback
      if (!data && featureType !== 'global') {
        const result = await supabase
          .from('ai_system_instructions')
          .select('*')
          .eq('user_id', userId)
          .eq('feature_type', 'global')
          .eq('is_active', true)
          .maybeSingle();

        data = result.data;
      }

      if (!data) return null;

      return this.mapToAIInstructions(data);
    } catch (error) {
      console.error('[AIInstructionsService] Error getting instructions:', error);
      return null;
    }
  }

  /**
   * Save AI instructions for a feature
   */
  async saveInstructions(
    userId: string,
    featureType: AIFeatureType,
    instructions: Partial<AIInstructions>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('ai_system_instructions')
        .upsert({
          user_id: userId,
          feature_type: featureType,
          custom_instructions: instructions.customInstructions || '',
          use_custom_instructions: instructions.useCustomInstructions || false,
          override_intelligence: instructions.overrideIntelligence || false,
          rich_content: instructions.richContent || { text: '', images: [], files: [] },
          is_active: instructions.isActive ?? true,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('[AIInstructionsService] Error saving instructions:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save',
      };
    }
  }

  /**
   * Build final system prompt with intelligence merging
   */
  async buildSystemPrompt(
    userId: string,
    featureType: AIFeatureType,
    autoIntelligence: string
  ): Promise<string> {
    const instructions = await this.getInstructions(userId, featureType);

    if (!instructions || !instructions.useCustomInstructions) {
      // Use only auto intelligence
      return autoIntelligence;
    }

    if (instructions.overrideIntelligence) {
      // Override mode: Use ONLY custom instructions
      return this.buildRichPrompt(instructions);
    }

    // Smart mode: Merge auto + custom
    const customPrompt = this.buildRichPrompt(instructions);
    return `${autoIntelligence}\n\n========================================\nCUSTOM INSTRUCTIONS\n========================================\n\n${customPrompt}`;
  }

  /**
   * Build prompt from rich content
   */
  private buildRichPrompt(instructions: AIInstructions): string {
    const parts: string[] = [];

    // Add text instructions
    parts.push(instructions.customInstructions || instructions.richContent.text);

    // Add images section
    if (instructions.richContent.images && instructions.richContent.images.length > 0) {
      parts.push('\n\n========================================');
      parts.push('IMAGES & VISUAL ASSETS');
      parts.push('========================================\n');

      instructions.richContent.images.forEach((img, idx) => {
        parts.push(`${idx + 1}. ${img.type.toUpperCase()}: ${img.caption || 'Untitled'}`);
        parts.push(`   URL: ${img.url}`);
        if (img.alt) parts.push(`   Description: ${img.alt}`);
      });
    }

    // Add files section
    if (instructions.richContent.files && instructions.richContent.files.length > 0) {
      parts.push('\n\n========================================');
      parts.push('DOWNLOADABLE FILES & DOCUMENTS');
      parts.push('========================================\n');

      instructions.richContent.files.forEach((file, idx) => {
        parts.push(`${idx + 1}. ${file.type.toUpperCase()}: ${file.name}`);
        parts.push(`   URL: ${file.url}`);
        if (file.size) parts.push(`   Size: ${this.formatFileSize(file.size)}`);
      });
    }

    return parts.join('\n');
  }

  /**
   * Upload image to Supabase Storage
   */
  async uploadImage(
    userId: string,
    file: File,
    type: RichImage['type']
  ): Promise<{ url?: string; error?: string }> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${type}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('ai-instructions-assets')
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('ai-instructions-assets')
        .getPublicUrl(fileName);

      return { url: urlData.publicUrl };
    } catch (error) {
      console.error('[AIInstructionsService] Upload error:', error);
      return {
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  /**
   * Upload file to Supabase Storage
   */
  async uploadFile(
    userId: string,
    file: File,
    type: RichFile['type']
  ): Promise<{ url?: string; error?: string }> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${type}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('ai-instructions-docs')
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('ai-instructions-docs')
        .getPublicUrl(fileName);

      return { url: urlData.publicUrl };
    } catch (error) {
      console.error('[AIInstructionsService] Upload error:', error);
      return {
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  /**
   * Delete image from storage
   */
  async deleteImage(url: string): Promise<void> {
    try {
      const path = this.extractStoragePath(url);
      if (!path) return;

      await supabase.storage.from('ai-instructions-assets').remove([path]);
    } catch (error) {
      console.error('[AIInstructionsService] Delete error:', error);
    }
  }

  /**
   * Delete file from storage
   */
  async deleteFile(url: string): Promise<void> {
    try {
      const path = this.extractStoragePath(url);
      if (!path) return;

      await supabase.storage.from('ai-instructions-docs').remove([path]);
    } catch (error) {
      console.error('[AIInstructionsService] Delete error:', error);
    }
  }

  // ========================================
  // PRIVATE HELPERS
  // ========================================

  private mapToAIInstructions(data: any): AIInstructions {
    return {
      id: data.id,
      userId: data.user_id,
      featureType: data.feature_type,
      customInstructions: data.custom_instructions || '',
      useCustomInstructions: data.use_custom_instructions || false,
      overrideIntelligence: data.override_intelligence || false,
      richContent: data.rich_content || { text: '', images: [], files: [] },
      isActive: data.is_active ?? true,
      version: data.version || 1,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private extractStoragePath(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const storageIndex = pathParts.findIndex((p) => p === 'storage');
      if (storageIndex === -1) return null;

      return pathParts.slice(storageIndex + 3).join('/');
    } catch {
      return null;
    }
  }

  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}

// Export singleton
export const aiInstructionsService = new AIInstructionsService();




