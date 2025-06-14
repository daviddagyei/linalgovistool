import { useState, useEffect } from 'react';

// Responsive breakpoints following Tailwind CSS standards
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

export interface ViewportInfo {
  width: number;
  height: number;
  breakpoint: BreakpointKey;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  aspectRatio: number;
  orientation: 'portrait' | 'landscape';
}

// Hook for responsive viewport information
export const useResponsiveViewport = (): ViewportInfo => {
  const [viewport, setViewport] = useState<ViewportInfo>(() => {
    if (typeof window === 'undefined') {
      return {
        width: 1024,
        height: 768,
        breakpoint: 'lg',
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        aspectRatio: 1024 / 768,
        orientation: 'landscape'
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    
    return calculateViewportInfo(width, height);
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setViewport(calculateViewportInfo(width, height));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return viewport;
};

const calculateViewportInfo = (width: number, height: number): ViewportInfo => {
  // Determine breakpoint
  let breakpoint: BreakpointKey = 'sm';
  if (width >= BREAKPOINTS['2xl']) breakpoint = '2xl';
  else if (width >= BREAKPOINTS.xl) breakpoint = 'xl';
  else if (width >= BREAKPOINTS.lg) breakpoint = 'lg';
  else if (width >= BREAKPOINTS.md) breakpoint = 'md';

  const aspectRatio = width / height;
  const orientation = width > height ? 'landscape' : 'portrait';
  
  // Device type detection
  const isMobile = width < BREAKPOINTS.md && 'ontouchstart' in window;
  const isTablet = width >= BREAKPOINTS.md && width < BREAKPOINTS.lg && 'ontouchstart' in window;
  const isDesktop = !isMobile && !isTablet;

  return {
    width,
    height,
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    aspectRatio,
    orientation
  };
};

// Hook for touch gesture support
export const useTouchGestures = () => {
  const [isTouch, setIsTouch] = useState(false);
  const [gestureState, setGestureState] = useState({
    isPinching: false,
    isRotating: false,
    initialDistance: 0,
    initialAngle: 0,
    scale: 1,
    rotation: 0
  });

  useEffect(() => {
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouch(hasTouch);
  }, []);

  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      const angle = Math.atan2(
        touch2.clientY - touch1.clientY,
        touch2.clientX - touch1.clientX
      );

      setGestureState(prev => ({
        ...prev,
        isPinching: true,
        isRotating: true,
        initialDistance: distance,
        initialAngle: angle
      }));
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 2 && gestureState.isPinching) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      const angle = Math.atan2(
        touch2.clientY - touch1.clientY,
        touch2.clientX - touch1.clientX
      );

      const scale = distance / gestureState.initialDistance;
      const rotation = angle - gestureState.initialAngle;

      setGestureState(prev => ({
        ...prev,
        scale,
        rotation
      }));
    }
  };

  const handleTouchEnd = () => {
    setGestureState(prev => ({
      ...prev,
      isPinching: false,
      isRotating: false,
      scale: 1,
      rotation: 0
    }));
  };

  return {
    isTouch,
    gestureState,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd
    }
  };
};

// Hook for accessibility preferences
export const useAccessibility = () => {
  const [preferences, setPreferences] = useState({
    reducedMotion: false,
    highContrast: false,
    increaseTextSize: false,
    keyboardNavigation: false
  });

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPreferences(prev => ({
      ...prev,
      reducedMotion: mediaQuery.matches
    }));

    const handleChange = (e: MediaQueryListEvent) => {
      setPreferences(prev => ({
        ...prev,
        reducedMotion: e.matches
      }));
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    // Check for high contrast preference
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setPreferences(prev => ({
      ...prev,
      highContrast: mediaQuery.matches
    }));

    const handleChange = (e: MediaQueryListEvent) => {
      setPreferences(prev => ({
        ...prev,
        highContrast: e.matches
      }));
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const togglePreference = (key: keyof typeof preferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return {
    preferences,
    togglePreference
  };
};

// Utility functions for responsive calculations
export const calculateResponsiveSize = (
  baseSize: number,
  viewport: ViewportInfo,
  scaleFactors: Partial<Record<BreakpointKey, number>> = {}
): number => {
  const factor = scaleFactors[viewport.breakpoint] || 1;
  return baseSize * factor;
};

export const getResponsiveSpacing = (viewport: ViewportInfo) => {
  if (viewport.isMobile) return { padding: 8, margin: 4, gap: 8 };
  if (viewport.isTablet) return { padding: 12, margin: 6, gap: 12 };
  return { padding: 16, margin: 8, gap: 16 };
};

export const getResponsiveFontSizes = (viewport: ViewportInfo) => {
  const baseScale = viewport.isMobile ? 0.85 : viewport.isTablet ? 0.95 : 1;
  
  return {
    xs: Math.round(12 * baseScale),
    sm: Math.round(14 * baseScale),
    base: Math.round(16 * baseScale),
    lg: Math.round(18 * baseScale),
    xl: Math.round(20 * baseScale),
    '2xl': Math.round(24 * baseScale),
    '3xl': Math.round(30 * baseScale)
  };
};

export default {
  useResponsiveViewport,
  useTouchGestures,
  useAccessibility,
  calculateResponsiveSize,
  getResponsiveSpacing,
  getResponsiveFontSizes
};
