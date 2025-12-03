/**
 * Avatar Utility Service
 * Generates consistent, unique Gravatar-style avatars for visitors
 */

// Color palette for avatar backgrounds (vibrant, professional colors)
const AVATAR_COLORS = [
  { bg: 'from-blue-500 to-blue-600', text: 'text-white' },
  { bg: 'from-green-500 to-green-600', text: 'text-white' },
  { bg: 'from-pink-500 to-pink-600', text: 'text-white' },
  { bg: 'from-purple-500 to-purple-600', text: 'text-white' },
  { bg: 'from-orange-500 to-orange-600', text: 'text-white' },
  { bg: 'from-teal-500 to-teal-600', text: 'text-white' },
  { bg: 'from-red-500 to-red-600', text: 'text-white' },
  { bg: 'from-cyan-500 to-cyan-600', text: 'text-white' },
  { bg: 'from-amber-500 to-amber-600', text: 'text-white' },
  { bg: 'from-emerald-500 to-emerald-600', text: 'text-white' },
  { bg: 'from-rose-500 to-rose-600', text: 'text-white' },
  { bg: 'from-sky-500 to-sky-600', text: 'text-white' },
];

// Fun emojis for avatar faces
const AVATAR_EMOJIS = [
  '😊', '🙂', '😄', '🤗', '😃', '🙃',
  '😌', '😎', '🤓', '🧐', '🤠', '👋',
  '✨', '⭐', '🌟', '💫', '🎯', '🎨',
  '🚀', '🎪', '🎭', '🎬', '🎮', '🎲'
];

/**
 * Generate a unique seed for a visitor
 */
export function generateAvatarSeed(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get consistent avatar properties from a seed
 */
export function getAvatarFromSeed(seed: string) {
  // Use seed to generate consistent hash
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }

  const absHash = Math.abs(hash);

  // Select color and emoji based on hash
  const colorIndex = absHash % AVATAR_COLORS.length;
  const emojiIndex = absHash % AVATAR_EMOJIS.length;

  return {
    color: AVATAR_COLORS[colorIndex],
    emoji: AVATAR_EMOJIS[emojiIndex],
    initial: AVATAR_EMOJIS[emojiIndex]
  };
}

/**
 * Get avatar initial from name (fallback)
 */
export function getInitialFromName(name: string): string {
  if (!name || name === 'Anonymous Visitor') {
    return '?';
  }
  return name.charAt(0).toUpperCase();
}

/**
 * Generate CSS classes for avatar background
 */
export function getAvatarClasses(seed: string | null, hasName: boolean = false): string {
  if (!seed) {
    // Default blue gradient for no seed
    return 'bg-gradient-to-br from-blue-500 to-blue-600';
  }

  const avatar = getAvatarFromSeed(seed);
  return `bg-gradient-to-br ${avatar.color.bg}`;
}

/**
 * Get avatar content (emoji or initial)
 */
export function getAvatarContent(seed: string | null, name: string | null): string {
  if (seed) {
    const avatar = getAvatarFromSeed(seed);
    return avatar.emoji;
  }

  if (name && name !== 'Anonymous Visitor') {
    return getInitialFromName(name);
  }

  return '👤';
}
