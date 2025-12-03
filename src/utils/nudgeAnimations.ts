/**
 * Nudge Animation Utilities
 *
 * Provides animation classes and utilities for nudge micro-UX
 */

/**
 * Trigger shake animation on element
 */
export function triggerShake(elementId: string): void {
  const element = document.getElementById(elementId);
  if (!element) return;

  element.classList.add('animate-shake');

  setTimeout(() => {
    element.classList.remove('animate-shake');
  }, 500);
}

/**
 * Apply blur/fog effect to element
 */
export function applyBlurEffect(elementId: string, intensity: number = 5): void {
  const element = document.getElementById(elementId);
  if (!element) return;

  element.style.filter = `blur(${intensity}px)`;
  element.style.opacity = '0.5';
  element.style.pointerEvents = 'none';
  element.style.userSelect = 'none';
}

/**
 * Remove blur/fog effect
 */
export function removeBlurEffect(elementId: string): void {
  const element = document.getElementById(elementId);
  if (!element) return;

  element.style.filter = '';
  element.style.opacity = '';
  element.style.pointerEvents = '';
  element.style.userSelect = '';
}

/**
 * Add glow pulse effect to element
 */
export function addGlowPulse(elementId: string, color: string = 'rgba(37, 99, 235, 0.7)'): void {
  const element = document.getElementById(elementId);
  if (!element) return;

  element.classList.add('animate-glow');
  element.style.setProperty('--glow-color', color);
}

/**
 * Remove glow pulse effect
 */
export function removeGlowPulse(elementId: string): void {
  const element = document.getElementById(elementId);
  if (!element) return;

  element.classList.remove('animate-glow');
}

/**
 * Create shimmer effect on locked features
 */
export function addShimmer(elementId: string): void {
  const element = document.getElementById(elementId);
  if (!element) return;

  element.classList.add('animate-shimmer');
}

/**
 * Animation CSS classes (to be added to global CSS)
 */
export const ANIMATION_CLASSES = `
  /* Shake Animation */
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
    20%, 40%, 60%, 80% { transform: translateX(4px); }
  }
  .animate-shake {
    animation: shake 0.2s ease-in-out;
  }

  /* Glow Pulse Animation */
  @keyframes glow {
    0% { box-shadow: 0 0 0px var(--glow-color, rgba(37, 99, 235, 0.3)); }
    50% { box-shadow: 0 0 15px var(--glow-color, rgba(37, 99, 235, 0.7)); }
    100% { box-shadow: 0 0 0px var(--glow-color, rgba(37, 99, 235, 0.3)); }
  }
  .animate-glow {
    animation: glow 2s infinite;
  }

  /* Shimmer Animation */
  @keyframes shimmer {
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
  }
  .animate-shimmer {
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.3) 50%,
      rgba(255, 255, 255, 0) 100%
    );
    background-size: 1000px 100%;
    animation: shimmer 2s infinite;
  }

  /* Locked Blur Effect */
  .locked-blur {
    filter: blur(5px);
    opacity: 0.5;
    pointer-events: none;
    user-select: none;
  }

  /* Pulse Animation */
  @keyframes pulse-scale {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  .animate-pulse-scale {
    animation: pulse-scale 2s infinite;
  }

  /* Bounce Animation */
  @keyframes bounce-subtle {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
  }
  .animate-bounce-subtle {
    animation: bounce-subtle 1s infinite;
  }

  /* Slide Up Animation */
  @keyframes slide-up {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .animate-slide-up {
    animation: slide-up 0.4s ease-out;
  }

  /* Slide Down Animation */
  @keyframes slide-down {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .animate-slide-down {
    animation: slide-down 0.3s ease-out;
  }

  /* Scale In Animation */
  @keyframes scale-in {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  .animate-scale-in {
    animation: scale-in 0.3s ease-out;
  }

  /* Fade In Animation */
  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  .animate-fade-in {
    animation: fade-in 0.3s ease-out;
  }

  /* Countdown Animation */
  @keyframes countdown {
    from { width: 100%; }
    to { width: 0%; }
  }
  .animate-countdown {
    animation: countdown var(--countdown-duration, 8000ms) linear forwards;
  }
`;

/**
 * Inject animation styles into document
 */
export function injectAnimationStyles(): void {
  if (typeof document === 'undefined') return;

  const styleId = 'nudge-animations';

  // Don't inject if already present
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = ANIMATION_CLASSES;
  document.head.appendChild(style);
}

/**
 * React hook to inject animations on mount
 */
export function useNudgeAnimations() {
  if (typeof window !== 'undefined') {
    injectAnimationStyles();
  }
}
