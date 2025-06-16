import React, { useState, useCallback, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { Vector3D } from '../../../types';

// Vector color scheme
export const VECTOR_COLORS = [
  { primary: '#3B82F6', secondary: '#93C5FD', name: 'Blue' },    // Vector 1: Blue
  { primary: '#EF4444', secondary: '#FCA5A5', name: 'Red' },     // Vector 2: Red
  { primary: '#10B981', secondary: '#6EE7B7', name: 'Green' },   // Vector 3: Green
  { primary: '#8B5CF6', secondary: '#C4B5FD', name: 'Purple' },  // Vector 4: Purple
  { primary: '#F59E0B', secondary: '#FCD34D', name: 'Orange' },  // Vector 5: Orange
];

// Camera Projector Component (to be used inside Canvas)
export const CameraProjector: React.FC<{
  vectors: Array<{ vector: Vector3D; color: typeof VECTOR_COLORS[0]; label: string; isTransformed?: boolean }>;
  onProjectionsUpdate: (projections: Array<{ x: number; y: number; visible: boolean; distance: number }>) => void;
  width: number;
  height: number;
}> = ({ vectors, onProjectionsUpdate, width, height }) => {
  const { camera } = useThree();

  useFrame(() => {
    const projections = vectors.map((vectorData) => {
      // Use the actual vector endpoint - let's position exactly at the tip
      const vec3 = new Vector3(vectorData.vector.x, vectorData.vector.y, vectorData.vector.z);
      const distance = camera.position.distanceTo(vec3);
      
      // Project to screen coordinates
      vec3.project(camera);
      
      // Convert normalized device coordinates to screen coordinates
      const screenX = (vec3.x + 1) * width / 2;
      const screenY = -(vec3.y - 1) * height / 2;
      
      // Check if the vector is visible (not behind camera)
      const isVisible = vec3.z < 1;
      
      return { 
        x: screenX, 
        y: screenY, 
        visible: isVisible,
        distance: distance
      };
    });
    
    onProjectionsUpdate(projections);
  });

  return null;
};

// HTML Vector Labels Component (outside Canvas)
export const VectorLabels: React.FC<{
  vectors: Array<{ vector: Vector3D; color: typeof VECTOR_COLORS[0]; label: string; isTransformed?: boolean }>;
  projectedPositions: Array<{ x: number; y: number; visible: boolean; distance: number }>;
  width: number;
  height: number;
  containerRef?: React.RefObject<HTMLDivElement>; // Optional container reference
}> = ({ vectors, projectedPositions, width, height, containerRef }) => {
  const [labelPositions, setLabelPositions] = useState<Array<{ x: number; y: number; visible: boolean; scale: number }>>([]);
  const [containerOffset, setContainerOffset] = useState({ x: 0, y: 0 });

  // Update container offset when container position changes
  useEffect(() => {
    const updateOffset = () => {
      if (containerRef?.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerOffset({ x: rect.left, y: rect.top + 60 }); // Add 60px for header
      }
    };

    updateOffset();
    window.addEventListener('resize', updateOffset);
    window.addEventListener('scroll', updateOffset);
    
    return () => {
      window.removeEventListener('resize', updateOffset);
      window.removeEventListener('scroll', updateOffset);
    };
  }, [containerRef]);

  // Calculate static label position right at vector tip with distance-based scaling
  const calculateStaticLabelPosition = useCallback((
    screenX: number,
    screenY: number,
    distance: number
  ) => {
    // Scale based on distance - closer objects get larger labels
    const baseScale = Math.max(0.6, Math.min(1.8, 12 / distance));
    
    // Position label EXACTLY at the vector tip + container offset
    const labelX = screenX + containerOffset.x;
    const labelY = screenY + containerOffset.y;
    
    // Ensure within bounds with some padding
    const labelWidth = 120 * baseScale;
    const labelHeight = 28 * baseScale;
    const padding = 8;
    
    const clampedX = Math.max(padding, Math.min(window.innerWidth - labelWidth - padding, labelX));
    const clampedY = Math.max(padding, Math.min(window.innerHeight - labelHeight - padding, labelY));
    
    return { x: clampedX, y: clampedY, scale: baseScale };
  }, [width, height, containerOffset]);

  // Update label positions when projections change
  useEffect(() => {
    const newPositions = vectors.map((_, index) => {
      const projection = projectedPositions[index];
      
      if (!projection?.visible) {
        return { x: 0, y: 0, visible: false, scale: 1 };
      }
      
      const position = calculateStaticLabelPosition(
        projection.x, 
        projection.y, 
        projection.distance
      );
      
      return { ...position, visible: true };
    });
    
    setLabelPositions(newPositions);
  }, [vectors, projectedPositions, calculateStaticLabelPosition]);

  return (
    <>
      {vectors.map((vectorData, index) => {
        const position = labelPositions[index];
        if (!position?.visible) return null;

        const { primary, secondary } = vectorData.color;
        
        return ReactDOM.createPortal(
          <div
            key={`vector-label-${index}`}
            className="absolute pointer-events-none select-none"
            style={{
              left: position.x,
              top: position.y,
              zIndex: 10 + index,
              transform: 'translate(-50%, -50%)', // Center the label on the vector tip
            }}
          >
            <div
              style={{
                background: `linear-gradient(135deg, ${primary}15, ${secondary}25)`,
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                padding: `${2 * position.scale}px ${4 * position.scale}px`,
                fontSize: `${10 * position.scale}px`,
                fontWeight: '600',
                color: primary,
                borderRadius: `${6 * position.scale}px`,
                border: `${Math.max(1, position.scale)}px solid ${primary}30`,
                boxShadow: `0 ${2 * position.scale}px ${6 * position.scale}px rgba(0,0,0,0.15)`,
                whiteSpace: 'nowrap',
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                minWidth: 'max-content',
                lineHeight: 1.2,
                transition: 'all 0.1s ease-out', // Smooth scaling transitions
              }}
              dangerouslySetInnerHTML={{
                __html: `${vectorData.label} (${vectorData.vector.x.toFixed(1)}, ${vectorData.vector.y.toFixed(1)}, ${vectorData.vector.z.toFixed(1)})`
              }}
            />
          </div>,
          document.body
        );
      })}
    </>
  );
};
