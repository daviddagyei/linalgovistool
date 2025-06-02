import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { Vector3, Quaternion } from 'three';
import { useVisualizer } from '../../../context/VisualizerContext';
import { Vector3D, Vector2D } from '../../../types';
import { calculateEigenvalues3D, applyMatrix3D } from '../../../utils/mathUtils';

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
  
  return (
    <div 
      className="eigenvalue-canvas-3d bg-white rounded-lg shadow-lg overflow-hidden relative"
      style={{ width, height }}
    >
      {/* Enhanced Title and Matrix Information */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-2">
          3D Eigenvalue & Eigenvector Analysis
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-1">Transformation Matrix:</h4>
            <div className="text-xs font-mono bg-white p-2 rounded border">
              <div>[{matrix3D[0][0].toFixed(2)} {matrix3D[0][1].toFixed(2)} {matrix3D[0][2].toFixed(2)}]</div>
              <div>[{matrix3D[1][0].toFixed(2)} {matrix3D[1][1].toFixed(2)} {matrix3D[1][2].toFixed(2)}]</div>
              <div>[{matrix3D[2][0].toFixed(2)} {matrix3D[2][1].toFixed(2)} {matrix3D[2][2].toFixed(2)}]</div>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-1">Eigenvalues:</h4>
            <div className="text-xs space-y-1">
              {eigenvalues.map((eig, i) => (
                <div key={i} className="flex items-center">
                  <span 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: `hsl(${200 + i * 80}, 80%, 40%)` }}
                  ></span>
                  <span>λ₍{i+1}₎ = {eig.value.toFixed(3)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
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
      <DraggableLegend eigenvalues={eigenvalues} />
    </div>
  );
};

export default EigenvalueCanvas3D;