import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';

interface PerformanceMonitorProps {
  onPerformanceUpdate?: (fps: number, frameTime: number) => void;
  targetFPS?: number;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ 
  onPerformanceUpdate, 
  targetFPS = 60 
}) => {
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const frameTimesRef = useRef<number[]>([]);
  
  useFrame(() => {
    const currentTime = performance.now();
    const deltaTime = currentTime - lastTime.current;
    
    frameCount.current++;
    frameTimesRef.current.push(deltaTime);
    
    // Calculate FPS every 60 frames
    if (frameCount.current >= 60) {
      const avgFrameTime = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;
      const fps = 1000 / avgFrameTime;
      
      if (onPerformanceUpdate) {
        onPerformanceUpdate(fps, avgFrameTime);
      }
      
      // Log performance warnings
      if (fps < targetFPS * 0.8) {
        console.warn(`⚠️ Performance below target: ${fps.toFixed(1)}fps (target: ${targetFPS}fps)`);
      }
      
      // Reset counters
      frameCount.current = 0;
      frameTimesRef.current = [];
    }
    
    lastTime.current = currentTime;
  });
  
  return null;
};

export default PerformanceMonitor;
