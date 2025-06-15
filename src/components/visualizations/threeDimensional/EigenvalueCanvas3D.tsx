import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Canvas } from '@react-three/fiber';
import { Vector3, Quaternion } from 'three';
import { useVisualizer } from '../../../context/VisualizerContext';
import { Vector3D, Vector2D } from '../../../types';
import { calculateEigenvalues3D, applyMatrix3D } from '../../../utils/mathUtils';
import { ReactiveGridPlanes } from './ReactiveGrid';
import { CameraController } from './CameraController';
import ModernCanvasHeader from './ModernCanvasHeader';

// Helper function to ensure 3D vector
const ensureVector3D = (vector: Vector3D | Vector2D): Vector3D => {
  if ('z' in vector) {
    return vector as Vector3D;
  }
  return { ...vector, z: 0 } as Vector3D;
};

interface EigenvalueCanvas3DProps {
  width: number;
  height: number;
}

// Vector Arrow component (simplified without labels)
const VectorArrow: React.FC<{
  vector: Vector3D;
  color: string;
  thickness?: number;
  dashed?: boolean;
}> = ({ vector, color, thickness = 0.02, dashed = false }) => {
  const start = new Vector3(0, 0, 0);
  const end = new Vector3(vector.x, vector.y, vector.z);
  const direction = end.clone().sub(start).normalize();
  const length = end.length();
  
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
        <meshStandardMaterial 
          color={color} 
          opacity={dashed ? 0.6 : 1}
          transparent={dashed}
        />
      </mesh>
      
      {/* Arrow head */}
      <mesh 
        position={end}
        quaternion={quaternion}
      >
        <coneGeometry args={[thickness * 3, thickness * 10, 8]} />
        <meshStandardMaterial 
          color={color}
          opacity={dashed ? 0.6 : 1}
          transparent={dashed}
        />
      </mesh>
    </group>
  );
};

// Draggable Legend Component
const DraggableLegend: React.FC<{
  eigenvalues: Array<{ value: number; vector: Vector3D | Vector2D }>;
}> = ({ eigenvalues }) => {
  const [position, setPosition] = useState({ 
    x: window.innerWidth - 280, // Position from right edge (legend width + margin)
    y: 16 // Keep at top
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Handle responsive positioning on window resize
  React.useEffect(() => {
    const updatePosition = () => {
      if (!isDragging) { // Only update if not being dragged
        setPosition(prev => ({
          x: Math.max(16, window.innerWidth - 280), // Ensure minimum margin from left
          y: prev.y // Keep current y position
        }));
      }
    };

    window.addEventListener('resize', updatePosition);
    updatePosition(); // Call once on mount

    return () => window.removeEventListener('resize', updatePosition);
  }, [isDragging]);

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

  // Create small arrow icon for legend
  const createArrowIcon = (color: string, dashed: boolean = false) => (
    <div className="flex items-center mr-2">
      <div
        className="w-6 h-0.5 rounded"
        style={{
          backgroundColor: dashed ? 'transparent' : color,
          opacity: dashed ? 0.6 : 1,
          borderTop: dashed ? `1px dashed ${color}` : 'none',
        }}
      />
      <div
        className="w-0 h-0 ml-1"
        style={{
          borderLeft: `3px solid ${color}`,
          borderTop: '2px solid transparent',
          borderBottom: '2px solid transparent',
          opacity: dashed ? 0.6 : 1,
        }}
      />
    </div>
  );

  return ReactDOM.createPortal(
    <div
      className="fixed bg-white bg-opacity-95 rounded-lg border border-gray-300 p-3 shadow-lg cursor-move select-none z-50 touch-none"
      style={{
        left: position.x,
        top: position.y,
        userSelect: 'none',
        minWidth: '250px',
        maxWidth: '90vw',
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-bold text-gray-800">3D Vector Legend</h4>
        <div className="text-xs text-gray-400">⋮⋮</div>
      </div>
      <div className="space-y-2 text-xs">
        {/* Eigenvectors */}
        {eigenvalues.map((eig, i) => (
          <div key={`eigen-${i}`}>
            <div className="flex items-center">
              {createArrowIcon(`hsl(${200 + i * 80}, 80%, 40%)`)}
              <span className="font-medium">Eigenvector {i + 1}:</span>
              <span className="text-gray-600 ml-1">λ = {eig.value.toFixed(3)}</span>
            </div>
            <div className="flex items-center ml-2">
              {createArrowIcon(`hsl(${200 + i * 80}, 80%, 40%)`, true)}
              <span className="text-gray-600">Transformed (λ × v)</span>
            </div>
          </div>
        ))}
        
        {/* Test vectors */}
        <div className="pt-2 border-t border-gray-200">
          {['e₁ (x-axis)', 'e₂ (y-axis)', 'e₃ (z-axis)', 'unit diagonal'].map((label, i) => (
            <div key={`test-${i}`}>
              <div className="flex items-center">
                {createArrowIcon(`hsl(${300 + i * 30}, 70%, 45%)`)}
                <span className="font-medium">{label}</span>
              </div>
              <div className="flex items-center ml-2">
                {createArrowIcon(`hsl(${300 + i * 30}, 70%, 45%)`, true)}
                <span className="text-gray-600">After transformation</span>
              </div>
            </div>
          ))}
        </div>
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
const EigenvalueCanvas3D: React.FC<EigenvalueCanvas3DProps> = ({ width, height }) => {
  const { matrix3D, settings } = useVisualizer();
  
  // Calculate eigenvalues and eigenvectors
  const eigenvalues = calculateEigenvalues3D(matrix3D);
  
  // Test vectors
  const testVectors: Vector3D[] = [
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
    { x: 0, y: 0, z: 1 },
    { x: 1, y: 1, z: 1 }
  ];

  // Combine all vectors for camera framing
  const allVectors: Vector3D[] = [
    ...eigenvalues.map(eig => ensureVector3D(eig.vector)),
    ...testVectors
  ];
  
  return (
    <div 
      className="eigenvalue-canvas-3d bg-white rounded-lg shadow-lg overflow-hidden relative"
      style={{ width, height }}
    >
      {/* Modern Header */}
      <ModernCanvasHeader 
        title="3D Eigenvalue Analysis"
        description={`Eigenvalue and eigenvector visualization • ${eigenvalues.length} eigenvalue${eigenvalues.length !== 1 ? 's' : ''} computed`}
        variant="eigenvalue"
      />
      
      <Canvas
        camera={{
          position: [8, 6, 8],
          fov: 50,
          near: 0.1,
          far: 1000
        }}
        shadows
        performance={{ min: 0.5 }} // Maintain 30fps minimum
        gl={{ 
          antialias: true,
          alpha: false,
          powerPreference: "high-performance"
        }}
        dpr={[1, 2]} // Adaptive pixel ratio for performance
        style={{ background: "white" }} // Set background to white
      >
        {/* Set scene background to white */}
        <color attach="background" args={["#ffffff"]} />
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
        />
        
        {/* Reactive Grid and axes */}
        {settings.showGrid && (
          <ReactiveGridPlanes 
            showXY={true}
            showXZ={true}
            showYZ={true}
          />
        )}
        
        {/* Eigenvectors */}
        {eigenvalues.map((eig, i) => {
          const eigenVector3D = ensureVector3D(eig.vector);
          const transformed = applyMatrix3D(matrix3D, eigenVector3D);
          return (
            <group key={i}>
              <VectorArrow
                vector={eigenVector3D}
                color={`hsl(${200 + i * 80}, 80%, 40%)`}
                thickness={0.03}
              />
              <VectorArrow
                vector={transformed}
                color={`hsl(${200 + i * 80}, 80%, 40%)`}
                thickness={0.03}
                dashed
              />
            </group>
          );
        })}
        
        {/* Test vectors */}
        {testVectors.map((vector, i) => {
          const transformed = applyMatrix3D(matrix3D, vector);
          
          return (
            <group key={`test-${i}`}>
              <VectorArrow
                vector={vector}
                color={`hsl(${300 + i * 30}, 70%, 45%)`}
                thickness={0.015}
              />
              <VectorArrow
                vector={transformed}
                color={`hsl(${300 + i * 30}, 70%, 45%)`}
                thickness={0.015}
                dashed
              />
            </group>
          );
        })}
        
        {/* Camera Controller */}
        <CameraController
          vectors={allVectors}
          autoFrame={true}
          enableAutoRotate={false}
        />
      </Canvas>
      
      {/* Draggable Legend */}
      <DraggableLegend eigenvalues={eigenvalues} />
    </div>
  );
};

export default EigenvalueCanvas3D;