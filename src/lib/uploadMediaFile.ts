/**
 * MEDIA UPLOAD HELPER
 * 
 * Real Supabase Storage implementation for uploading media files
 * 
 * Features:
 * - Uploads to Supabase Storage bucket 'ai-instructions-media'
 * - Organizes files by userId/type/timestamp
 * - Returns public URLs for uploaded files
 * - Validates file size and type
 */

import { supabase } from './supabase';

export type MediaFileType = 'image' | 'audio' | 'pdf' | 'other';

export interface UploadResult {
  url: string;
  error?: string;
  path?: string; // Storage path for deletion
}

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const STORAGE_BUCKET = 'ai-instructions-media';

/**
 * Validate file before upload
 */
function validateFile(file: File, type: MediaFileType): string | null {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return `File is too large. Maximum allowed size is 25 MB.`;
  }

  // Validate image types
  if (type === 'image') {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return `Invalid image type. Allowed: JPG, PNG, GIF, WebP`;
    }
  }

  // Validate audio types
  if (type === 'audio') {
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave', 'audio/x-wav'];
    const validExtensions = ['.mp3', '.wav'];
    const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    
    if (!validTypes.includes(file.type) && !hasValidExtension) {
      return `Invalid audio type. Allowed: MP3, WAV`;
    }
  }

  // Validate PDF/document types
  if (type === 'pdf') {
    const validTypes = ['application/pdf'];
    const validExtensions = ['.pdf', '.doc', '.docx', '.pptx', '.xlsx', '.xls'];
    const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    
    if (!validTypes.includes(file.type) && !hasValidExtension) {
      return `Invalid file type. Allowed: PDF, DOC, DOCX, PPTX, XLSX`;
    }
  }

  return null;
}

/**
 * Upload media file to Supabase Storage
 * 
 * @param file - File to upload
 * @param type - Type of media (image, audio, pdf, other)
 * @param userId - User ID for organizing uploads (required)
 * @returns Promise with upload URL or error
 */
export async function uploadMediaFile(
  file: File,
  type: MediaFileType,
  userId?: string
): Promise<UploadResult> {
  try {
    // Validate file
    const validationError = validateFile(file, type);
    if (validationError) {
      return { url: '', error: validationError };
    }

    if (!userId) {
      return { url: '', error: 'User ID is required for file uploads' };
    }

    // Generate unique file path
    const fileExt = file.name.split('.').pop() || 'file';
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 9);
    const filePath = `${userId}/${type}/${timestamp}_${randomId}_${sanitizedFileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false // Don't overwrite existing files
      });

    if (uploadError) {
      console.error('[uploadMediaFile] Storage upload error:', uploadError);
      
      // If bucket doesn't exist, provide helpful error
      if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('not found')) {
        return {
          url: '',
          error: `Storage bucket "${STORAGE_BUCKET}" not found. Please create it in Supabase Storage settings.`
        };
      }
      
      return {
        url: '',
        error: uploadError.message || 'Failed to upload file to storage'
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      return {
        url: '',
        error: 'Failed to get public URL for uploaded file'
      };
    }

    console.log('[uploadMediaFile] Successfully uploaded:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      mediaType: type,
      userId,
      path: filePath,
      url: urlData.publicUrl
    });

    return {
      url: urlData.publicUrl,
      path: filePath
    };
  } catch (error) {
    console.error('[uploadMediaFile] Upload error:', error);
    return {
      url: '',
      error: error instanceof Error ? error.message : 'Upload failed. Please try again.'
    };
  }
}

/**
 * Delete a file from Supabase Storage
 * 
 * @param filePath - Storage path of the file to delete
 * @returns Promise with success status or error
 */
export async function deleteMediaFile(filePath: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error('[deleteMediaFile] Delete error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('[deleteMediaFile] Delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete file'
    };
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}


