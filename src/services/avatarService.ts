import { supabase } from '../lib/supabase';

const DICEBEAR_BASE_URL = 'https://api.dicebear.com/7.x/adventurer/svg';
const FALLBACK_AVATAR = 'https://api.dicebear.com/7.x/adventurer/svg?seed=nexscout-default';

export interface ProspectAvatarData {
  id: string;
  uploaded_image_url?: string | null;
  social_image_url?: string | null;
  avatar_seed?: string | null;
  full_name?: string | null;
}

/**
 * Get prospect avatar URL with priority resolution:
 * 1. uploaded_image_url (highest priority)
 * 2. social_image_url
 * 3. Generated Dicebear avatar using avatar_seed
 * 4. App-wide fallback avatar
 */
export function getProspectAvatar(prospect: ProspectAvatarData | null | undefined): string {
  if (!prospect) {
    return FALLBACK_AVATAR;
  }

  // Priority 1: User uploaded image
  if (prospect.uploaded_image_url) {
    return prospect.uploaded_image_url;
  }

  // Priority 2: Social media image
  if (prospect.social_image_url) {
    return prospect.social_image_url;
  }

  // Priority 3: Generated Dicebear avatar
  if (prospect.avatar_seed) {
    return `${DICEBEAR_BASE_URL}?seed=${encodeURIComponent(prospect.avatar_seed)}`;
  }

  // Priority 4: Generate from name if available
  if (prospect.full_name) {
    const seed = generateAvatarSeed(prospect.full_name);
    return `${DICEBEAR_BASE_URL}?seed=${encodeURIComponent(seed)}`;
  }

  // Fallback
  return FALLBACK_AVATAR;
}

/**
 * Generate deterministic avatar seed from name
 * Uses simple hash to create consistent seed
 * Enhanced with demographic awareness for personalization
 */
export function generateAvatarSeed(
  name: string,
  metadata?: {
    age_bracket?: string;
    personality_type?: string;
    industry?: string;
    tone?: string;
  }
): string {
  if (!name || name.trim().length === 0) {
    return 'anonymous-user';
  }

  // Simple hash function for deterministic seed generation
  const normalized = name.toLowerCase().trim();

  // Add demographic factors to seed if available
  const seedComponents = [normalized];
  if (metadata?.personality_type) seedComponents.push(metadata.personality_type);
  if (metadata?.age_bracket) seedComponents.push(metadata.age_bracket);
  if (metadata?.industry) seedComponents.push(metadata.industry.substring(0, 3));

  const seedString = seedComponents.join('-');

  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    const char = seedString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Convert to positive hex string
  return Math.abs(hash).toString(36).substring(0, 16);
}

/**
 * Generate enhanced Dicebear URL with style options
 */
export function generateDicebearUrl(
  seed: string,
  options?: {
    backgroundColor?: string[];
    mood?: string[];
  }
): string {
  const params = new URLSearchParams({ seed });

  if (options?.backgroundColor) {
    params.append('backgroundColor', options.backgroundColor.join(','));
  }

  if (options?.mood) {
    params.append('mood', options.mood.join(','));
  }

  return `${DICEBEAR_BASE_URL}?${params.toString()}`;
}

/**
 * Upload prospect photo to Supabase Storage
 * @returns URL of uploaded image or null on error
 */
export async function uploadProspectPhoto(
  prospectId: string,
  userId: string,
  file: File
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return { success: false, error: 'Invalid file type. Please upload PNG, JPG, or WebP.' };
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { success: false, error: 'File too large. Maximum size is 5MB.' };
    }

    // Generate file path: {userId}/{prospectId}.{ext}
    const fileExt = file.name.split('.').pop() || 'jpg';
    const filePath = `${userId}/${prospectId}.${fileExt}`;

    // Delete existing file if any
    await supabase.storage
      .from('prospect-photos')
      .remove([filePath]);

    // Upload new file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('prospect-photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { success: false, error: uploadError.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('prospect-photos')
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      return { success: false, error: 'Failed to get public URL' };
    }

    // Update prospect record with uploaded_image_url
    const { error: updateError } = await supabase
      .from('prospects')
      .update({ uploaded_image_url: urlData.publicUrl })
      .eq('id', prospectId);

    if (updateError) {
      console.error('Database update error:', updateError);
      return { success: false, error: 'Failed to update prospect record' };
    }

    return { success: true, url: urlData.publicUrl };
  } catch (error: any) {
    console.error('Upload prospect photo error:', error);
    return { success: false, error: error.message || 'Upload failed' };
  }
}

/**
 * Delete prospect photo from Supabase Storage
 */
export async function deleteProspectPhoto(
  prospectId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the prospect to find the file path
    const { data: prospect, error: fetchError } = await supabase
      .from('prospects')
      .select('uploaded_image_url')
      .eq('id', prospectId)
      .maybeSingle();

    if (fetchError) {
      return { success: false, error: fetchError.message };
    }

    if (!prospect?.uploaded_image_url) {
      return { success: true }; // Nothing to delete
    }

    // Extract file path from URL
    const url = new URL(prospect.uploaded_image_url);
    const pathParts = url.pathname.split('/');
    const filePath = pathParts.slice(-2).join('/'); // userId/prospectId.ext

    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from('prospect-photos')
      .remove([filePath]);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return { success: false, error: deleteError.message };
    }

    // Clear uploaded_image_url from database
    const { error: updateError } = await supabase
      .from('prospects')
      .update({ uploaded_image_url: null })
      .eq('id', prospectId);

    if (updateError) {
      console.error('Database update error:', updateError);
      return { success: false, error: 'Failed to update prospect record' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Delete prospect photo error:', error);
    return { success: false, error: error.message || 'Delete failed' };
  }
}

/**
 * Update prospect social image URL
 * Called during social media scanning
 */
export async function updateSocialImageUrl(
  prospectId: string,
  socialImageUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('prospects')
      .update({ social_image_url: socialImageUrl })
      .eq('id', prospectId);

    if (error) {
      console.error('Update social image error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Update social image error:', error);
    return { success: false, error: error.message || 'Update failed' };
  }
}

/**
 * Ensure prospect has avatar_seed
 * Auto-generates if missing
 */
export async function ensureAvatarSeed(prospectId: string, fullName: string): Promise<void> {
  try {
    const seed = generateAvatarSeed(fullName);

    await supabase
      .from('prospects')
      .update({ avatar_seed: seed })
      .eq('id', prospectId)
      .is('avatar_seed', null);
  } catch (error) {
    console.error('Ensure avatar seed error:', error);
  }
}
