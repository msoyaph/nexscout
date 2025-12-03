// PURPOSE: Track user interactions (taps, clicks, scroll) for heatmap analysis
// INPUT: pageName
// OUTPUT: Automatic event tracking
// NOTES: Detects rage taps (5+ in 3 seconds), normalizes coordinates

import { useEffect, useRef } from 'react';
import { analyticsEngineV2 } from '../services/intelligence/analyticsEngineV2';

interface HeatmapTrackerOptions {
  pageName: string;
  enableRageTapDetection?: boolean;
  enableScrollTracking?: boolean;
}

interface TapRecord {
  timestamp: number;
  elementId: string;
}

export function useHeatmapTracker(options: HeatmapTrackerOptions) {
  const { pageName, enableRageTapDetection = true, enableScrollTracking = true } = options;

  const tapHistory = useRef<TapRecord[]>([]);
  const maxScrollDepth = useRef<number>(0);
  const scrollTimeout = useRef<any>(null);

  useEffect(() => {
    // Track click/tap events
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const elementId = target.getAttribute('data-analytics-id') || target.id || target.tagName.toLowerCase();
      const elementType = target.tagName.toLowerCase();

      // Track the tap
      analyticsEngineV2.trackHeatmapEvent(
        pageName,
        elementId,
        event.clientX,
        event.clientY,
        elementType
      );

      // Rage tap detection
      if (enableRageTapDetection) {
        const now = Date.now();
        tapHistory.current.push({ timestamp: now, elementId });

        // Keep only taps from last 3 seconds
        tapHistory.current = tapHistory.current.filter(
          tap => now - tap.timestamp < 3000
        );

        // Check for rage taps (5+ taps in 3 seconds on same element)
        const samElementTaps = tapHistory.current.filter(
          tap => tap.elementId === elementId
        );

        if (samElementTaps.length >= 5) {
          analyticsEngineV2.trackEvent('rage_tap_detected', {
            page: pageName,
            element: elementId,
            tap_count: samElementTaps.length,
          });
          tapHistory.current = []; // Reset after detection
        }
      }
    };

    // Track scroll depth
    const handleScroll = () => {
      if (!enableScrollTracking) return;

      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      const scrollDepth = ((scrollTop + windowHeight) / documentHeight) * 100;

      // Update max scroll depth
      if (scrollDepth > maxScrollDepth.current) {
        maxScrollDepth.current = Math.round(scrollDepth);
      }

      // Debounce scroll tracking (send after 2 seconds of no scrolling)
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      scrollTimeout.current = setTimeout(() => {
        analyticsEngineV2.trackScrollDepth(
          pageName,
          Math.round(scrollDepth),
          maxScrollDepth.current
        );
      }, 2000);
    };

    // Attach event listeners
    document.addEventListener('click', handleClick);
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Track page view
    analyticsEngineV2.trackPageView(pageName);

    // Cleanup
    return () => {
      document.removeEventListener('click', handleClick);
      window.removeEventListener('scroll', handleScroll);

      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      // Send final scroll depth on unmount
      if (maxScrollDepth.current > 0) {
        analyticsEngineV2.trackScrollDepth(
          pageName,
          maxScrollDepth.current,
          maxScrollDepth.current
        );
      }
    };
  }, [pageName, enableRageTapDetection, enableScrollTracking]);
}
