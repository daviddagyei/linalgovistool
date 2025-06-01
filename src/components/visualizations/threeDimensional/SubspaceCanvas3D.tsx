import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Line } from '@react-three/drei';
import { Vector3, BufferGeometry, Float32BufferAttribute, Quaternion } from 'three';
import { useVisualizer } from '../../../context/VisualizerContext';
import { calculateSpanPoints3D, isLinearlyIndependent3D } from '../../../utils/mathUtils';

interface SubspaceCanvas3DProps {
  width: number;
  height: number;
}

// Vector Arrow component
const VectorArrow: React.FC<{
  vector: { x: number; y: number; z: number };
  color: string;
  label?: string;
  thickness?: number;
}> = ({ vector, color, label, thickness = 0.02 }) => {
  const start = new Vector3(0, 0, 0);
  const end = new Vector3(vector.x, vector.y, vector.z);
  const direction = end.clone().sub(start).normalize();
  const length = end.length();

  // Calculate rotation quaternion for proper orientation
  const quaternion = new Quaternion();
  const axis = new Vector3();
  
  if (direction.y > 0.99999) {
    quaternion.set(0, 0, 0, 1);
  } else if (direction.y < -0.99999) {
    quaternion.setFromAxisAngle(new Vector3(1, 0, 0), Math.PI);
  } else {
    axis.set(direction.z, 0, -direction.x).normalize();
    const radians = Math.acos(direction.y);
    quaternion.setFromAxisAngle(axis, radians);
  }

  return (
    <group>
      {/* Arrow shaft */}
      <mesh 
        position={end.clone().multiplyScalar(0.5)}
        quaternion={quaternion}
      >
        <cylinderGeometry args={[thickness, thickness, length, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Arrow head */}
      <mesh 
        position={end}
        quaternion={quaternion}
      >
        <coneGeometry args={[thickness * 3, thickness * 10, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Label - simplified without canvas texture */}
      {label && (
        <mesh position={end.clone().add(direction.multiplyScalar(0.5))}>
          <sphereGeometry args={[0.05]} />
          <meshBasicMaterial color={color} />
        </mesh>
      )}
    </group>
  );
};

// Span visualization component
const SpanVisualization: React.FC<{
  vectors: { x: number; y: number; z: number }[];
  color: string;
}> = ({ vectors, color }) => {
  if (vectors.length === 0) return null;

  // Calculate span points
  const spanPoints = calculateSpanPoints3D(vectors, 5, 20);

  // Create geometry for span visualization
  const geometry = new BufferGeometry();
  const positions = new Float32Array(spanPoints.length * 3);

  spanPoints.forEach((point, i) => {
    positions[i * 3] = point.x;
    positions[i * 3 + 1] = point.y;
    positions[i * 3 + 2] = point.z;
  });

  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));

  if (vectors.length === 1) {
    // Line span - use Line component from @react-three/drei
    const linePoints: [number, number, number][] = spanPoints.map(p => [p.x, p.y, p.z]);
    return (
      <Line
        points={linePoints}
        color={color}
        opacity={0.6}
        transparent
        lineWidth={2}
      />
    );
  } else if (vectors.length === 2) {
    // Plane span - create a grid of points showing the plane
    const gridPoints: [number, number, number][] = [];
    const range = 3;
    const steps = 10;
    const step = (2 * range) / (steps - 1);
    
    for (let s = -range; s <= range; s += step) {
      for (let t = -range; t <= range; t += step) {
        const point = {
          x: vectors[0].x * s + vectors[1].x * t,
          y: vectors[0].y * s + vectors[1].y * t,
          z: vectors[0].z * s + vectors[1].z * t
        };
        gridPoints.push([point.x, point.y, point.z]);
      }
    }
    
    return (
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={new Float32Array(gridPoints.flat())}
            count={gridPoints.length}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial color={color} size={0.05} opacity={0.6} transparent />
      </points>
    );
  } else if (vectors.length === 3) {
    // 3D span - if linearly independent, it spans all of R³
    // If linearly dependent, it spans a plane or line
    // Check if linearly independent by checking if vectors can form a basis
    const isIndependent = isLinearlyIndependent3D(vectors);
    
    if (isIndependent) {
      // Spans all of R³ - show two perpendicular planes to represent this
      const gridPoints: [number, number, number][] = [];
      const range = 3;
      const steps = 12;
      const step = (2 * range) / (steps - 1);
      
      // First plane: span of vectors[0] and vectors[1] (v1 and v2)
      for (let s = -range; s <= range; s += step) {
        for (let t = -range; t <= range; t += step) {
          const point = {
            x: vectors[0].x * s + vectors[1].x * t,
            y: vectors[0].y * s + vectors[1].y * t,
            z: vectors[0].z * s + vectors[1].z * t
          };
          gridPoints.push([point.x, point.y, point.z]);
        }
      }
      
      // Second plane: span of vectors[1] and vectors[2] (v2 and v3)
      for (let t = -range; t <= range; t += step) {
        for (let u = -range; u <= range; u += step) {
          const point = {
            x: vectors[1].x * t + vectors[2].x * u,
            y: vectors[1].y * t + vectors[2].y * u,
            z: vectors[1].z * t + vectors[2].z * u
          };
          gridPoints.push([point.x, point.y, point.z]);
        }
      }
      
      return (
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              array={new Float32Array(gridPoints.flat())}
              count={gridPoints.length}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial color={color} size={0.04} opacity={0.5} transparent />
        </points>
      );
    } else {
      // Linearly dependent - find the effective span dimension
      // For now, show the span of the first two linearly independent vectors
      // This is a simplified approach - in practice, you'd want to find the actual basis
      return (
        <SpanVisualization
          vectors={vectors.slice(0, 2)}
          color={color}
        />
      );
    }
  }
  
  return null;
};

// Draggable Legend Component
const DraggableLegend: React.FC<{
  vectors: { x: number; y: number; z: number }[];
  selectedIndices: boolean[];
  isIndependent: boolean;
}> = ({ vectors, selectedIndices, isIndependent }) => {
  const [position, setPosition] = useState({ x: 16, y: 16 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
    e.preventDefault();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragOffset({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    });
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (isDragging && e.touches.length > 0) {
      const touch = e.touches[0];
      setPosition({
        x: touch.clientX - dragOffset.x,
        y: touch.clientY - dragOffset.y,
      });
      e.preventDefault();
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, dragOffset]);

  // Create arrow icon helper
  const createArrowIcon = (color: string, selected: boolean = false) => (
    <div className="flex items-center mr-2">
      <div
        className={`w-6 h-0.5 rounded ${selected ? 'h-1' : ''}`}
        style={{
          backgroundColor: color,
          opacity: selected ? 1 : 0.7,
        }}
      />
      <div
        className="w-0 h-0 ml-1"
        style={{
          borderLeft: `3px solid ${color}`,
          borderTop: '2px solid transparent',
          borderBottom: '2px solid transparent',
          opacity: selected ? 1 : 0.7,
        }}
      />
    </div>
  );

  const selectedCount = selectedIndices.filter(Boolean).length;

  return ReactDOM.createPortal(
    <div
      className="fixed bg-white bg-opacity-95 rounded-lg border border-gray-300 p-3 shadow-lg cursor-move select-none z-50 touch-none"
      style={{
        left: position.x,
        top: position.y,
        userSelect: 'none',
        transform: isDragging ? 'scale(1.05)' : 'scale(1)',
        transition: isDragging ? 'none' : 'transform 0.2s ease',
        minWidth: '280px',
        maxWidth: '90vw',
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-bold text-gray-800">3D Subspace Legend</h4>
        <div className="text-xs text-gray-400">⋮⋮</div>
      </div>
      
      <div className="space-y-2 text-xs">
        {/* Vector list */}
        {vectors.map((vector, i) => (
          <div key={i} className="flex items-center">
            {createArrowIcon(selectedIndices[i] ? '#9966FF' : '#3366FF', selectedIndices[i])}
            <span className={`font-medium ${selectedIndices[i] ? 'text-purple-700' : 'text-blue-700'}`}>
              v{i + 1}: ({vector.x.toFixed(1)}, {vector.y.toFixed(1)}, {vector.z.toFixed(1)})
            </span>
          </div>
        ))}
        
        {/* Coordinate axes */}
        <div className="pt-2 border-t border-gray-200">
          <div className="flex items-center">
            {createArrowIcon('#ff0000')}
            <span className="text-red-600 font-medium">X-axis</span>
          </div>
          <div className="flex items-center">
            {createArrowIcon('#00ff00')}
            <span className="text-green-600 font-medium">Y-axis</span>
          </div>
          <div className="flex items-center">
            {createArrowIcon('#0000ff')}
            <span className="text-blue-600 font-medium">Z-axis</span>
          </div>
        </div>
        
        {/* Linear independence status */}
        {selectedCount > 1 && (
          <div className={`mt-2 p-2 rounded ${isIndependent ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${isIndependent ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={`font-medium ${isIndependent ? 'text-green-700' : 'text-red-700'}`}>
                {isIndependent ? 'Linearly Independent' : 'Linearly Dependent'}
              </span>
            </div>
            <div className="text-gray-600 mt-1">
              {selectedCount === 1 && 'Span: Line through origin'}
              {selectedCount === 2 && isIndependent && 'Span: Plane through origin'}
              {selectedCount === 2 && !isIndependent && 'Span: Line through origin'}
              {selectedCount === 3 && isIndependent && 'Span: All of 3D space'}
              {selectedCount === 3 && !isIndependent && 'Span: Plane or line through origin'}
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
        <span className="font-medium">Controls:</span> 
        <span className="hidden sm:inline"> Click & drag to rotate, scroll to zoom</span>
        <span className="sm:hidden"> Pinch to zoom, drag to rotate</span>
      </div>
    </div>,
    document.body
  );
};

// Main Canvas component
const SubspaceCanvas3D: React.FC<SubspaceCanvas3DProps> = ({ width, height }) => {
  const { vectors3D, settings, subspaceSettings } = useVisualizer();

  // Get selected vectors for span visualization
  const selectedVectors = vectors3D.filter((_, i) => subspaceSettings.showSpan[i]);
  const isIndependent = isLinearlyIndependent3D(selectedVectors);

  return (
    <div 
      className="subspace-canvas-3d bg-white rounded-lg shadow-lg overflow-hidden"
      style={{ width, height }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-1">
          3D Subspace Visualization
        </h3>
        <p className="text-sm text-gray-600">
          Explore vector spans and linear independence in 3D space
        </p>
      </div>
      
      <Canvas
        camera={{
          position: [8, 4, 8],
          fov: 50,
          near: 0.1,
          far: 1000
        }}
        shadows
      >
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
        />
        
        {/* Grid and axes */}
        {settings.showGrid && (
          <>
            <Grid
              args={[20, 20]}
              position={[0, 0, 0]}
              rotation={[0, 0, 0]}
              cellSize={1}
              cellThickness={0.5}
              cellColor="#a0a0a0"
              sectionSize={5}
              sectionThickness={1}
              sectionColor="#808080"
              fadeDistance={30}
              fadeStrength={1}
            />
            <Grid
              args={[20, 20]}
              position={[0, 0, 0]}
              rotation={[-Math.PI/2, 0, 0]}
              cellSize={1}
              cellThickness={0.5}
              cellColor="#a0a0a0"
              sectionSize={5}
              sectionThickness={1}
              sectionColor="#808080"
              fadeDistance={30}
              fadeStrength={1}
            />
            <Grid
              args={[20, 20]}
              position={[0, 0, 0]}
              rotation={[0, Math.PI/2, 0]}
              cellSize={1}
              cellThickness={0.5}
              cellColor="#a0a0a0"
              sectionSize={5}
              sectionThickness={1}
              sectionColor="#808080"
              fadeDistance={30}
              fadeStrength={1}
            />
          </>
        )}
        
        {/* Coordinate axes */}
        {settings.showAxes && (
          <>
            {/* X axis (red) */}
            <mesh position={[1.5, 0, 0]} rotation={[0, 0, -Math.PI/2]}>
              <cylinderGeometry args={[0.015, 0.015, 3, 8]} />
              <meshStandardMaterial color="#ff0000" />
            </mesh>
            <mesh position={[3, 0, 0]} rotation={[0, 0, -Math.PI/2]}>
              <coneGeometry args={[0.045, 0.15, 8]} />
              <meshStandardMaterial color="#ff0000" />
            </mesh>
            
            {/* Y axis (green) */}
            <mesh position={[0, 1.5, 0]}>
              <cylinderGeometry args={[0.015, 0.015, 3, 8]} />
              <meshStandardMaterial color="#00ff00" />
            </mesh>
            <mesh position={[0, 3, 0]}>
              <coneGeometry args={[0.045, 0.15, 8]} />
              <meshStandardMaterial color="#00ff00" />
            </mesh>
            
            {/* Z axis (blue) */}
            <mesh position={[0, 0, 1.5]} rotation={[Math.PI/2, 0, 0]}>
              <cylinderGeometry args={[0.015, 0.015, 3, 8]} />
              <meshStandardMaterial color="#0000ff" />
            </mesh>
            <mesh position={[0, 0, 3]} rotation={[Math.PI/2, 0, 0]}>
              <coneGeometry args={[0.045, 0.15, 8]} />
              <meshStandardMaterial color="#0000ff" />
            </mesh>
          </>
        )}
        
        {/* Vectors - always show all vectors */}
        {vectors3D.map((vector, i) => (
          <VectorArrow
            key={i}
            vector={vector}
            color={(subspaceSettings.showSpan[i] ?? false) ? '#9966FF' : '#3366FF'}
            label={`v${i + 1}`}
            thickness={(subspaceSettings.showSpan[i] ?? false) ? 0.03 : 0.02}
          />
        ))}
        
        {/* Span visualization */}
        {selectedVectors.length > 0 && (
          <SpanVisualization
            vectors={selectedVectors}
            color={isIndependent ? '#9966FF' : '#EF4444'}
          />
        )}
        
        {/* Camera controls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={20}
        />
      </Canvas>
      
      {/* Draggable Legend */}
      <DraggableLegend 
        vectors={vectors3D}
        selectedIndices={subspaceSettings.showSpan}
        isIndependent={isIndependent}
      />
    </div>
  );
};

export default SubspaceCanvas3D;