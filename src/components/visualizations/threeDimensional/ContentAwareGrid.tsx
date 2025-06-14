import React, { useMemo, useRef } from 'react';
import { Grid } from '@react-three/drei';
import { useThree, useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';

interface Vector3D {
  x: number;
  y: number;
  z: number;
}

interface ContentAwareGridProps {
  vectors: Vector3D[];
  position?: [number, number, number];
  rotation?: [number, number, number];
  fadeDistance?: number;
  fadeStrength?: number;
  plane?: 'xy' | 'xz' | 'yz';
  adaptiveMode?: 'content' | 'camera' | 'hybrid';
  showMultiLevel?: boolean;
  minGridSpacing?: number;
  maxGridSpacing?: number;
  opacity?: number;
}

// Utility functions for grid calculations
const calculateVectorStatistics = (vectors: Vector3D[]) => {
  if (vectors.length === 0) {
    return {
      minMagnitude: 1,
      maxMagnitude: 10,
      avgMagnitude: 5,
      magnitudeRange: 9,
      boundingBox: { min: new Vector3(-5, -5, -5), max: new Vector3(5, 5, 5) }
    };
  }

  let minMagnitude = Infinity;
  let maxMagnitude = 0;
  let totalMagnitude = 0;
  
  const minPos = new Vector3(Infinity, Infinity, Infinity);
  const maxPos = new Vector3(-Infinity, -Infinity, -Infinity);

  vectors.forEach(vector => {
    const magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z);
    minMagnitude = Math.min(minMagnitude, magnitude);
    maxMagnitude = Math.max(maxMagnitude, magnitude);
    totalMagnitude += magnitude;
    
    // Update bounding box
    minPos.x = Math.min(minPos.x, vector.x);
    minPos.y = Math.min(minPos.y, vector.y);
    minPos.z = Math.min(minPos.z, vector.z);
    maxPos.x = Math.max(maxPos.x, vector.x);
    maxPos.y = Math.max(maxPos.y, vector.y);
    maxPos.z = Math.max(maxPos.z, vector.z);
  });

  const avgMagnitude = totalMagnitude / vectors.length;
  const magnitudeRange = maxMagnitude - minMagnitude;

  return {
    minMagnitude: Math.max(minMagnitude, 0.1), // Avoid zero
    maxMagnitude: Math.max(maxMagnitude, 1),
    avgMagnitude: Math.max(avgMagnitude, 0.5),
    magnitudeRange: Math.max(magnitudeRange, 1),
    boundingBox: { min: minPos, max: maxPos }
  };
};

// Nice number algorithm for clean grid intervals
const calculateNiceNumber = (range: number, round: boolean = false): number => {
  const exponent = Math.floor(Math.log10(range));
  const fraction = range / Math.pow(10, exponent);
  let niceFraction: number;

  if (round) {
    if (fraction < 1.5) niceFraction = 1;
    else if (fraction < 3) niceFraction = 2;
    else if (fraction < 7) niceFraction = 5;
    else niceFraction = 10;
  } else {
    if (fraction <= 1) niceFraction = 1;
    else if (fraction <= 2) niceFraction = 2;
    else if (fraction <= 5) niceFraction = 5;
    else niceFraction = 10;
  }

  return niceFraction * Math.pow(10, exponent);
};

const calculateOptimalGridSpacing = (
  vectorStats: ReturnType<typeof calculateVectorStatistics>,
  cameraDistance: number,
  adaptiveMode: 'content' | 'camera' | 'hybrid'
): {
  primarySpacing: number;
  secondarySpacing: number;
  gridExtent: number;
  primaryOpacity: number;
  secondaryOpacity: number;
} => {
  let baseSpacing: number;

  switch (adaptiveMode) {
    case 'content':
      // Base spacing on vector content
      baseSpacing = calculateNiceNumber(vectorStats.avgMagnitude / 4, true);
      break;
    
    case 'camera':
      // Base spacing on camera distance (original behavior)
      baseSpacing = calculateNiceNumber(cameraDistance / 10, true);
      break;
    
    case 'hybrid':
    default:
      // Combine both factors with weighted average
      const contentSpacing = calculateNiceNumber(vectorStats.avgMagnitude / 4, true);
      const cameraSpacing = calculateNiceNumber(cameraDistance / 10, true);
      const contentWeight = Math.min(1, vectorStats.magnitudeRange / 10); // Higher weight for diverse content
      baseSpacing = contentSpacing * contentWeight + cameraSpacing * (1 - contentWeight);
      baseSpacing = calculateNiceNumber(baseSpacing, true);
      break;
  }

  // Ensure reasonable bounds
  baseSpacing = Math.max(0.001, Math.min(baseSpacing, 1000));

  // Calculate secondary (fine) grid spacing
  const secondarySpacing = baseSpacing / 5;

  // Calculate grid extent based on content bounds with padding
  const contentExtent = Math.max(
    vectorStats.boundingBox.max.x - vectorStats.boundingBox.min.x,
    vectorStats.boundingBox.max.y - vectorStats.boundingBox.min.y,
    vectorStats.boundingBox.max.z - vectorStats.boundingBox.min.z
  );
  const gridExtent = Math.max(contentExtent * 2, baseSpacing * 20, 10);

  // Calculate adaptive opacity based on spacing and camera distance
  const spacingFactor = Math.log10(baseSpacing + 1) / 3; // Normalize to 0-1 range roughly
  const distanceFactor = Math.min(1, cameraDistance / 50);
  
  const primaryOpacity = Math.max(0.3, Math.min(0.9, 0.8 - spacingFactor * 0.3 + distanceFactor * 0.2));
  const secondaryOpacity = Math.max(0.1, primaryOpacity * 0.4);

  return {
    primarySpacing: baseSpacing,
    secondarySpacing,
    gridExtent,
    primaryOpacity,
    secondaryOpacity
  };
};

/**
 * Content-aware reactive grid component
 */
export const ContentAwareGrid: React.FC<ContentAwareGridProps> = ({
  vectors,
  position = [0, 0, 0],
  rotation,
  fadeDistance = 100,
  fadeStrength = 1,
  plane = 'xy',
  adaptiveMode = 'hybrid',
  showMultiLevel = true,
  minGridSpacing = 0.001,
  maxGridSpacing = 1000,
  opacity = 1.0
}) => {
  const { camera } = useThree();
  const lastUpdateTime = useRef(0);
  const [gridParams, setGridParams] = React.useState({
    primarySpacing: 1,
    secondarySpacing: 0.2,
    gridExtent: 20,
    primaryOpacity: 0.8,
    secondaryOpacity: 0.3
  });

  // Calculate vector statistics
  const vectorStats = useMemo(() => {
    return calculateVectorStatistics(vectors);
  }, [vectors]);

  // Update grid parameters with throttling for performance
  useFrame(() => {
    const currentTime = performance.now();
    if (currentTime - lastUpdateTime.current < 100) return; // Throttle to 10fps updates
    lastUpdateTime.current = currentTime;

    const cameraDistance = camera.position.length();
    const newParams = calculateOptimalGridSpacing(vectorStats, cameraDistance, adaptiveMode);
    
    // Apply bounds
    newParams.primarySpacing = Math.max(minGridSpacing, Math.min(maxGridSpacing, newParams.primarySpacing));
    newParams.secondarySpacing = Math.max(minGridSpacing, Math.min(maxGridSpacing, newParams.secondarySpacing));
    
    setGridParams(newParams);
  });

  // Define rotation based on plane
  const getRotation = (): [number, number, number] => {
    if (rotation) return rotation;
    
    switch (plane) {
      case 'xy':
        return [0, 0, 0];
      case 'xz':
        return [-Math.PI/2, 0, 0];
      case 'yz':
        return [0, Math.PI/2, 0];
      default:
        return [0, 0, 0];
    }
  };

  // Calculate section size (major grid lines)
  const sectionSize = gridParams.primarySpacing * 5;

  // Calculate opacity-adjusted colors
  const primaryOpacity = gridParams.primaryOpacity * opacity;
  const secondaryOpacity = gridParams.secondaryOpacity * opacity;

  return (
    <group>
      {/* Primary (coarse) grid */}
      <Grid
        args={[gridParams.gridExtent, gridParams.gridExtent]}
        position={position}
        rotation={getRotation()}
        cellSize={gridParams.primarySpacing}
        cellThickness={0.5}
        cellColor={`rgba(160, 160, 160, ${primaryOpacity * 0.7})`}
        sectionSize={sectionSize}
        sectionThickness={1.2}
        sectionColor={`rgba(100, 100, 100, ${primaryOpacity})`}
        fadeDistance={fadeDistance}
        fadeStrength={fadeStrength}
      />
      
      {/* Secondary (fine) grid - only show when appropriate */}
      {showMultiLevel && gridParams.secondarySpacing > minGridSpacing && (
        <Grid
          args={[gridParams.gridExtent, gridParams.gridExtent]}
          position={position}
          rotation={getRotation()}
          cellSize={gridParams.secondarySpacing}
          cellThickness={0.2}
          cellColor={`rgba(180, 180, 180, ${secondaryOpacity})`}
          sectionSize={gridParams.primarySpacing}
          sectionThickness={0.4}
          sectionColor={`rgba(140, 140, 140, ${secondaryOpacity * 1.5})`}
          fadeDistance={fadeDistance * 0.7}
          fadeStrength={fadeStrength * 1.2}
        />
      )}
    </group>
  );
};

/**
 * Reactive grid planes system with content awareness
 */
export const ReactiveGridPlanes: React.FC<{
  vectors?: Vector3D[];
  showXY?: boolean;
  showXZ?: boolean;
  showYZ?: boolean;
  opacity?: number;
  adaptiveMode?: 'content' | 'camera' | 'hybrid';
  showMultiLevel?: boolean;
}> = ({
  vectors = [],
  showXY = true,
  showXZ = true,
  showYZ = true,
  opacity = 0.8,
  adaptiveMode = 'hybrid',
  showMultiLevel = true
}) => {
  return (
    <group>
      {/* XY plane (ground) - primary reference */}
      {showXY && (
        <ContentAwareGrid
          vectors={vectors}
          plane="xy"
          adaptiveMode={adaptiveMode}
          showMultiLevel={showMultiLevel}
          opacity={opacity}
        />
      )}
      
      {/* XZ plane (vertical) - secondary reference */}
      {showXZ && (
        <ContentAwareGrid
          vectors={vectors}
          plane="xz"
          adaptiveMode={adaptiveMode}
          showMultiLevel={showMultiLevel}
          fadeDistance={150}
          opacity={opacity * 0.5}
        />
      )}
      
      {/* YZ plane (side) - tertiary reference */}
      {showYZ && (
        <ContentAwareGrid
          vectors={vectors}
          plane="yz"
          adaptiveMode={adaptiveMode}
          showMultiLevel={showMultiLevel}
          fadeDistance={150}
          opacity={opacity * 0.5}
        />
      )}
    </group>
  );
};

// Grid information component for debugging and user feedback
export const GridInfo: React.FC<{
  vectors: Vector3D[];
  visible?: boolean;
}> = ({ vectors, visible = false }) => {
  const vectorStats = useMemo(() => calculateVectorStatistics(vectors), [vectors]);
  const { camera } = useThree();
  const cameraDistance = camera.position.length();
  
  if (!visible) return null;

  const gridSpacing = calculateOptimalGridSpacing(vectorStats, cameraDistance, 'hybrid');

  return (
    <div className="absolute bottom-4 left-4 bg-black/70 text-white p-3 rounded-lg text-xs font-mono">
      <div className="space-y-1">
        <div>Grid Spacing: {gridSpacing.primarySpacing.toFixed(3)}</div>
        <div>Vector Range: {vectorStats.minMagnitude.toFixed(1)} - {vectorStats.maxMagnitude.toFixed(1)}</div>
        <div>Camera Distance: {cameraDistance.toFixed(1)}</div>
        <div>Grid Extent: {gridSpacing.gridExtent.toFixed(1)}</div>
      </div>
    </div>
  );
};

export default ContentAwareGrid;
