import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Line } from '@react-three/drei';
import { Vector3, Quaternion } from 'three';
import * as THREE from 'three';
import { useVisualizer } from '../../../context/VisualizerContext';
import { Vector3D, Matrix3D } from '../../../types';
import { applyMatrix3D } from '../../../utils/mathUtils';

interface MatrixTransformationCanvas3DProps {
  width: number;
  height: number;
}

// Helper function to calculate matrix determinant
const calculateDeterminant3D = (matrix: Matrix3D): number => {
  return (
    matrix[0][0] * (matrix[1][1] * matrix[2][2] - matrix[1][2] * matrix[2][1]) -
    matrix[0][1] * (matrix[1][0] * matrix[2][2] - matrix[1][2] * matrix[2][0]) +
    matrix[0][2] * (matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0])
  );
};

// 3D Vector Arrow component
const VectorArrow: React.FC<{
  vector: Vector3D;
  color: string;
  thickness?: number;
  dashed?: boolean;
  label?: string;
}> = ({ vector, color, thickness = 0.02, dashed = false, label }) => {
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
      
      {/* Label */}
      {label && (
        <group position={end.clone().multiplyScalar(1.1)}>
          <mesh>
            <planeGeometry args={[0.5, 0.2]} />
            <meshBasicMaterial color="white" opacity={0.8} transparent />
          </mesh>
          {/* Note: Text rendering in three.js requires additional setup */}
        </group>
      )}
    </group>
  );
};

// Unit Cube component that shows transformation
const TransformableCube: React.FC<{
  matrix: Matrix3D;
  original: boolean;
  color: string;
  opacity?: number;
}> = ({ matrix, original, color, opacity = 0.2 }) => {
  // Define the 8 vertices of a unit cube
  const unitCubeVertices: Vector3D[] = [
    { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 },
    { x: 1, y: 1, z: 0 }, { x: 0, y: 1, z: 0 },
    { x: 0, y: 0, z: 1 }, { x: 1, y: 0, z: 1 },
    { x: 1, y: 1, z: 1 }, { x: 0, y: 1, z: 1 }
  ];
  
  // Transform vertices if not original
  const vertices = original 
    ? unitCubeVertices 
    : unitCubeVertices.map(v => applyMatrix3D(matrix, v));
  
  // Define the 12 edges of the cube
  const edges = [
    [0, 1], [1, 2], [2, 3], [3, 0], // Bottom face
    [4, 5], [5, 6], [6, 7], [7, 4], // Top face
    [0, 4], [1, 5], [2, 6], [3, 7]  // Vertical edges
  ];
  
  if (original) {
    // Simple wireframe cube for original
    return (
      <group>
        <mesh position={[0.5, 0.5, 0.5]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial 
            color={color}
            wireframe={true}
            opacity={opacity}
            transparent
          />
        </mesh>
      </group>
    );
  }
  
  // For transformed cube, draw edges as lines
  return (
    <group>
      {edges.map((edge, i) => {
        const start = vertices[edge[0]];
        const end = vertices[edge[1]];
        return (
          <Line
            key={i}
            points={[[start.x, start.y, start.z], [end.x, end.y, end.z]]}
            color={color}
            lineWidth={2}
          />
        );
      })}
      
      {/* Add some face transparency to show volume */}
      <group>
        {/* Create custom geometry for the transformed cube faces */}
        <mesh>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              array={new Float32Array(vertices.flatMap(v => [v.x, v.y, v.z]))}
              count={vertices.length}
              itemSize={3}
            />
          </bufferGeometry>
          <meshBasicMaterial 
            color={color}
            opacity={opacity}
            transparent
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  );
};

// Draggable Legend Component
const DraggableLegend: React.FC<{
  matrix: Matrix3D;
  determinant: number;
}> = ({ matrix, determinant }) => {
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

  // Render the legend using a portal to make it draggable anywhere on the screen
  return ReactDOM.createPortal(
    <div
      className="fixed bg-white bg-opacity-95 rounded-lg border border-gray-300 p-3 shadow-lg cursor-move select-none z-50 touch-none"
      style={{
        left: position.x,
        top: position.y,
        userSelect: 'none',
        transform: isDragging ? 'scale(1.05)' : 'scale(1)',
        transition: isDragging ? 'none' : 'transform 0.2s ease',
        minWidth: '260px',
        maxWidth: '90vw',
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-bold text-gray-800">3D Transformation Legend</h4>
        <div className="text-xs text-gray-400">⋮⋮</div>
      </div>
      
      <div className="space-y-3 text-xs">
        {/* Matrix Display */}
        <div>
          <h5 className="text-sm font-semibold text-gray-700 mb-1">Transformation Matrix:</h5>
          <div className="text-xs font-mono bg-gray-50 p-2 rounded border">
            <div>[{matrix[0][0].toFixed(2)} {matrix[0][1].toFixed(2)} {matrix[0][2].toFixed(2)}]</div>
            <div>[{matrix[1][0].toFixed(2)} {matrix[1][1].toFixed(2)} {matrix[1][2].toFixed(2)}]</div>
            <div>[{matrix[2][0].toFixed(2)} {matrix[2][1].toFixed(2)} {matrix[2][2].toFixed(2)}]</div>
          </div>
        </div>

        {/* Determinant */}
        <div>
          <h5 className="text-sm font-semibold text-gray-700 mb-1">Determinant:</h5>
          <div className="text-lg font-bold" style={{ color: determinant >= 0 ? '#2563eb' : '#dc2626' }}>
            det(A) = {determinant.toFixed(3)}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {Math.abs(determinant) > 1 ? 'Volume expansion' : 
             Math.abs(determinant) === 1 ? 'Volume preserved' :
             Math.abs(determinant) > 0 ? 'Volume compression' : 'Volume collapse'}
            {determinant < 0 && ' + orientation flip'}
          </div>
        </div>

        {/* Legend Items */}
        <div className="border-t border-gray-200 pt-2">
          <div className="flex items-center mb-1">
            <div className="w-4 h-1 bg-blue-500 mr-2"></div>
            <span className="font-medium">Original Basis Vectors</span>
          </div>
          <div className="flex items-center mb-1">
            <div className="w-4 h-1 bg-red-500 mr-2"></div>
            <span className="font-medium">Transformed Basis Vectors</span>
          </div>
          <div className="flex items-center mb-1">
            <div className="w-4 h-3 border border-blue-500 bg-blue-100 mr-2"></div>
            <span className="font-medium">Original Unit Cube</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-3 border border-red-500 bg-red-100 mr-2"></div>
            <span className="font-medium">Transformed Cube</span>
          </div>
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
const MatrixTransformationCanvas3D: React.FC<MatrixTransformationCanvas3DProps> = ({ width, height }) => {
  const { matrix3D, vectors3D, settings } = useVisualizer();
  
  // Calculate determinant
  const determinant = calculateDeterminant3D(matrix3D);
  
  // Define basis vectors
  const basisVectors: Vector3D[] = [
    { x: 1, y: 0, z: 0 }, // i hat
    { x: 0, y: 1, z: 0 }, // j hat
    { x: 0, y: 0, z: 1 }  // k hat
  ];
  
  // Colors
  const originalColor = '#3366FF';
  const transformedColor = '#FF6633';
  
  return (
    <div 
      className="matrix-transformation-canvas-3d bg-white rounded-lg shadow-lg overflow-hidden relative"
      style={{ width, height }}
    >
      {/* Title */}
      <div className="bg-gradient-to-r from-blue-50 to-orange-50 p-4 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-1">
          3D Matrix Transformation & Determinant
        </h3>
        <p className="text-sm text-gray-600">
          Observe how the matrix transforms the unit cube and basis vectors
        </p>
      </div>
      
      <Canvas
        camera={{
          position: [6, 4, 6],
          fov: 50,
          near: 0.1,
          far: 1000
        }}
        shadows
      >
        {/* Lighting */}
        <ambientLight intensity={0.6} />
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
          </>
        )}
        
        {/* Coordinate axes */}
        {settings.showAxes && (
          <>
            <VectorArrow vector={{ x: 3, y: 0, z: 0 }} color="#ff0000" thickness={0.02} label="X" />
            <VectorArrow vector={{ x: 0, y: 3, z: 0 }} color="#00ff00" thickness={0.02} label="Y" />
            <VectorArrow vector={{ x: 0, y: 0, z: 3 }} color="#0000ff" thickness={0.02} label="Z" />
          </>
        )}
        
        {/* Original basis vectors */}
        {basisVectors.map((vector, i) => (
          <VectorArrow
            key={`original-basis-${i}`}
            vector={vector}
            color={originalColor}
            thickness={0.025}
            label={['î', 'ĵ', 'k̂'][i]}
          />
        ))}
        
        {/* Transformed basis vectors */}
        {basisVectors.map((vector, i) => {
          const transformed = applyMatrix3D(matrix3D, vector);
          return (
            <VectorArrow
              key={`transformed-basis-${i}`}
              vector={transformed}
              color={transformedColor}
              thickness={0.025}
              dashed
              label={['T(î)', 'T(ĵ)', 'T(k̂)'][i]}
            />
          );
        })}
        
        {/* Original unit cube */}
        <TransformableCube
          matrix={matrix3D}
          original={true}
          color={originalColor}
          opacity={0.15}
        />
        
        {/* Transformed cube */}
        <TransformableCube
          matrix={matrix3D}
          original={false}
          color={transformedColor}
          opacity={0.25}
        />
        
        {/* Additional vectors if any */}
        {vectors3D.map((vector, i) => {
          const transformed = applyMatrix3D(matrix3D, vector);
          return (
            <group key={`vector-${i}`}>
              <VectorArrow
                vector={vector}
                color="#8B5CF6"
                thickness={0.02}
              />
              <VectorArrow
                vector={transformed}
                color="#A855F7"
                thickness={0.02}
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
          minDistance={3}
          maxDistance={15}
        />
      </Canvas>
      
      {/* Draggable Legend */}
      <DraggableLegend matrix={matrix3D} determinant={determinant} />
    </div>
  );
};

export default MatrixTransformationCanvas3D;
