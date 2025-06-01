// Animation utilities for smooth transitions and visual feedback
export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
}

export const ANIMATION_CONFIGS = {
  // State change animations
  modeSwitch: {
    duration: 300,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    delay: 0
  },
  toolSwitch: {
    duration: 250,
    easing: 'ease-out',
    delay: 0
  },
  // User interaction animations
  drag: {
    duration: 0,
    easing: 'linear',
    delay: 0
  },
  hover: {
    duration: 200,
    easing: 'ease-out',
    delay: 0
  },
  // Loading animations
  loading: {
    duration: 1000,
    easing: 'linear',
    delay: 0
  },
  // Mathematical computation animations
  matrixChange: {
    duration: 400,
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    delay: 50
  },
  eigenvalueCalculation: {
    duration: 800,
    easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
    delay: 100
  }
} as const;

// CSS class generators for consistent animations
export const generateTransitionClasses = (config: AnimationConfig) => {
  const { duration, easing, delay = 0 } = config;
  return `transition-all duration-${duration} ${easing}${delay > 0 ? ` delay-${delay}` : ''}`;
};

// Animation state management for canvas elements
export class CanvasAnimationManager {
  private animationFrameId: number | null = null;
  private isAnimating = false;
  
  startAnimation(callback: () => void, duration: number = 16): void {
    if (this.isAnimating) return;
    
    this.isAnimating = true;
    const animate = () => {
      callback();
      this.animationFrameId = requestAnimationFrame(animate);
    };
    
    this.animationFrameId = requestAnimationFrame(animate);
    
    // Auto-stop after duration for finite animations
    if (duration > 0) {
      setTimeout(() => this.stopAnimation(), duration);
    }
  }
  
  stopAnimation(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.isAnimating = false;
  }
  
  isRunning(): boolean {
    return this.isAnimating;
  }
}

// Spring physics for smooth value interpolation
export class SpringAnimator {
  private currentValue: number;
  private targetValue: number;
  private velocity: number;
  private stiffness: number;
  private damping: number;
  
  constructor(initialValue: number, stiffness = 0.1, damping = 0.8) {
    this.currentValue = initialValue;
    this.targetValue = initialValue;
    this.velocity = 0;
    this.stiffness = stiffness;
    this.damping = damping;
  }
  
  setTarget(value: number): void {
    this.targetValue = value;
  }
  
  update(): number {
    const force = (this.targetValue - this.currentValue) * this.stiffness;
    this.velocity += force;
    this.velocity *= this.damping;
    this.currentValue += this.velocity;
    
    return this.currentValue;
  }
  
  isAtRest(threshold = 0.001): boolean {
    return Math.abs(this.currentValue - this.targetValue) < threshold &&
           Math.abs(this.velocity) < threshold;
  }
  
  getCurrentValue(): number {
    return this.currentValue;
  }
  
  reset(value: number): void {
    this.currentValue = value;
    this.targetValue = value;
    this.velocity = 0;
  }
}

// Easing functions for custom animations
export const easingFunctions = {
  linear: (t: number) => t,
  easeInOut: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeOut: (t: number) => t * (2 - t),
  easeIn: (t: number) => t * t,
  bounce: (t: number) => {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
      return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    } else if (t < 2.5 / 2.75) {
      return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    } else {
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    }
  }
};

// Value interpolation with easing
export const interpolate = (
  from: number,
  to: number,
  progress: number,
  easing: keyof typeof easingFunctions = 'easeOut'
): number => {
  const easedProgress = easingFunctions[easing](progress);
  return from + (to - from) * easedProgress;
};

// Multi-dimensional interpolation for vectors and matrices
export const interpolateVector2D = (
  from: { x: number; y: number },
  to: { x: number; y: number },
  progress: number,
  easing: keyof typeof easingFunctions = 'easeOut'
) => ({
  x: interpolate(from.x, to.x, progress, easing),
  y: interpolate(from.y, to.y, progress, easing)
});

export const interpolateMatrix2D = (
  from: number[][],
  to: number[][],
  progress: number,
  easing: keyof typeof easingFunctions = 'easeOut'
): number[][] => {
  return from.map((row, i) =>
    row.map((val, j) => interpolate(val, to[i][j], progress, easing))
  );
};

// Loading state management
export class LoadingAnimationManager {
  private loadingStates = new Map<string, boolean>();
  private callbacks = new Map<string, (() => void)[]>();
  
  setLoading(key: string, isLoading: boolean): void {
    const wasLoading = this.loadingStates.get(key) || false;
    this.loadingStates.set(key, isLoading);
    
    if (wasLoading !== isLoading) {
      this.notifyCallbacks(key);
    }
  }
  
  isLoading(key: string): boolean {
    return this.loadingStates.get(key) || false;
  }
  
  isAnyLoading(): boolean {
    return Array.from(this.loadingStates.values()).some(loading => loading);
  }
  
  subscribe(key: string, callback: () => void): () => void {
    const existing = this.callbacks.get(key) || [];
    existing.push(callback);
    this.callbacks.set(key, existing);
    
    // Return unsubscribe function
    return () => {
      const current = this.callbacks.get(key) || [];
      const index = current.indexOf(callback);
      if (index > -1) {
        current.splice(index, 1);
        this.callbacks.set(key, current);
      }
    };
  }
  
  private notifyCallbacks(key: string): void {
    const callbacks = this.callbacks.get(key) || [];
    callbacks.forEach(callback => callback());
  }
}

// Transition state manager for component state changes
export class TransitionStateManager {
  private states = new Map<string, any>();
  private transitionCallbacks = new Map<string, ((from: any, to: any) => void)[]>();
  
  setState<T>(key: string, newState: T, triggerTransition = true): void {
    const oldState = this.states.get(key);
    this.states.set(key, newState);
    
    if (triggerTransition && oldState !== undefined) {
      this.triggerTransition(key, oldState, newState);
    }
  }
  
  getState<T>(key: string): T | undefined {
    return this.states.get(key);
  }
  
  onTransition<T>(key: string, callback: (from: T, to: T) => void): () => void {
    const existing = this.transitionCallbacks.get(key) || [];
    existing.push(callback as (from: any, to: any) => void);
    this.transitionCallbacks.set(key, existing);
    
    return () => {
      const current = this.transitionCallbacks.get(key) || [];
      const index = current.indexOf(callback as (from: any, to: any) => void);
      if (index > -1) {
        current.splice(index, 1);
        this.transitionCallbacks.set(key, current);
      }
    };
  }
  
  private triggerTransition(key: string, from: any, to: any): void {
    const callbacks = this.transitionCallbacks.get(key) || [];
    callbacks.forEach(callback => callback(from, to));
  }
}

// Global instances for the application
export const globalAnimationManager = new CanvasAnimationManager();
export const loadingManager = new LoadingAnimationManager();
export const transitionManager = new TransitionStateManager();

// Performance-aware animation frame throttling
export class FrameThrottler {
  private lastFrameTime = 0;
  private targetFPS: number;
  private frameInterval: number;
  
  constructor(targetFPS = 60) {
    this.targetFPS = targetFPS;
    this.frameInterval = 1000 / targetFPS;
  }
  
  shouldRender(): boolean {
    const now = performance.now();
    if (now - this.lastFrameTime >= this.frameInterval) {
      this.lastFrameTime = now;
      return true;
    }
    return false;
  }
  
  setTargetFPS(fps: number): void {
    this.targetFPS = fps;
    this.frameInterval = 1000 / fps;
  }
}

export const frameThrottler = new FrameThrottler();
