import React from 'react';
import { Grid } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

interface ReactiveGridProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  color?: string;
  sectionColor?: string;
  fadeDistance?: number;
  fadeStrength?: number;
  plane?: 'xy' | 'xz' | 'yz';
}

/**
 * Reactive Grid component that adapts grid spacing based on camera distance
 */
export const ReactiveGrid: React.FC<ReactiveGridProps> = ({
  position = [0, 0, 0],
  rotation,
  color = "#a0a0a0",
  sectionColor = "#808080",
  fadeDistance = 100,
  fadeStrength = 1,
  plane = 'xy'
}) => {
  const { camera } = useThree();
  
  // Calculate camera distance from origin
  const cameraDistance = camera.position.length();
  
  // Adaptive grid parameters based on camera distance
  const getGridParams = (distance: number) => {
    // Define scale thresholds for different zoom levels
    if (distance < 0.1) {
      // Extreme close-up: very fine grid
      return {
        cellSize: 0.001,
        sectionSize: 0.01,
        gridSize: 0.1,
        cellThickness: 0.1,
        sectionThickness: 0.2
      };
    } else if (distance < 0.5) {
      // Close-up: fine grid
      return {
        cellSize: 0.01,
        sectionSize: 0.1,
        gridSize: 1,
        cellThickness: 0.2,
        sectionThickness: 0.4
      };
    } else if (distance < 2) {
      // Near: small grid
      return {
        cellSize: 0.1,
        sectionSize: 1,
        gridSize: 10,
        cellThickness: 0.3,
        sectionThickness: 0.6
      };
    } else if (distance < 10) {
      // Normal: standard grid
      return {
        cellSize: 1,
        sectionSize: 5,
        gridSize: 50,
        cellThickness: 0.5,
        sectionThickness: 1
      };
    } else if (distance < 50) {
      // Far: large grid
      return {
        cellSize: 5,
        sectionSize: 25,
        gridSize: 250,
        cellThickness: 0.7,
        sectionThickness: 1.5
      };
    } else if (distance < 200) {
      // Very far: very large grid
      return {
        cellSize: 25,
        sectionSize: 100,
        gridSize: 1000,
        cellThickness: 1,
        sectionThickness: 2
      };
    } else {
      // Extreme distance: massive grid
      return {
        cellSize: 100,
        sectionSize: 500,
        gridSize: 5000,
        cellThickness: 2,
        sectionThickness: 4
      };
    }
  };

  const gridParams = getGridParams(cameraDistance);
  
  // Define rotation based on plane
  const getRotation = (): [number, number, number] => {
    if (rotation) return rotation;
    
    switch (plane) {
      case 'xy':
        return [0, 0, 0]; // XY plane (ground)
      case 'xz':
        return [-Math.PI/2, 0, 0]; // XZ plane (vertical)
      case 'yz':
        return [0, Math.PI/2, 0]; // YZ plane (side)
      default:
        return [0, 0, 0];
    }
  };

  return (
    <Grid
      args={[gridParams.gridSize, gridParams.gridSize]}
      position={position}
      rotation={getRotation()}
      cellSize={gridParams.cellSize}
      cellThickness={gridParams.cellThickness}
      cellColor={color}
      sectionSize={gridParams.sectionSize}
      sectionThickness={gridParams.sectionThickness}
      sectionColor={sectionColor}
      fadeDistance={fadeDistance}
      fadeStrength={fadeStrength}
    />
  );
};

/**
 * Set of three reactive grid planes for 3D visualization
 */
export const ReactiveGridPlanes: React.FC<{
  showXY?: boolean;
  showXZ?: boolean;
  showYZ?: boolean;
}> = ({
  showXY = true,
  showXZ = true,
  showYZ = true
}) => {
  return (
    <group>
      {/* XY plane (ground) */}
      {showXY && (
        <ReactiveGrid
          plane="xy"
          color="#a0a0a0"
          sectionColor="#808080"
        />
      )}
      
      {/* XZ plane (vertical) */}
      {showXZ && (
        <ReactiveGrid
          plane="xz"
          color="#b0b0b0"
          sectionColor="#909090"
        />
      )}
      
      {/* YZ plane (side) */}
      {showYZ && (
        <ReactiveGrid
          plane="yz"
          color="#b0b0b0"
          sectionColor="#909090"
        />
      )}
    </group>
  );
};
