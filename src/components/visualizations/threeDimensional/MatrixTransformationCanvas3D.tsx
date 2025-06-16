import React, { useState, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Line } from '@react-three/drei';
import { Vector3, Quaternion } from 'three';
import * as THREE from 'three';
import { useVisualizer } from '../../../context/VisualizerContext';
import { Vector3D, Matrix3D } from '../../../types';
import { applyMatrix3D } from '../../../utils/mathUtils';
import { ReactiveGridPlanes } from './ReactiveGrid';
import { CameraController } from './CameraController';
import ModernCanvasHeader from './ModernCanvasHeader';
import { VECTOR_COLORS } from './GlassmorphismVectorLabels';

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
}> = ({ vector, color, thickness = 0.012, dashed = false }) => {
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
  vectors?: Array<{ original: Vector3D; transformed: Vector3D; color: typeof VECTOR_COLORS[0]; label: string }>;
}> = ({ matrix, determinant, vectors = [] }) => {
  const [position, setPosition] = useState({ 
    x: window.innerWidth - 290, // Position from right edge (legend width + margin)
    y: 16 // Keep at top
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Handle responsive positioning on window resize
  React.useEffect(() => {
    const updatePosition = () => {
      if (!isDragging) { // Only update if not being dragged
        setPosition(prev => ({
          x: Math.max(16, window.innerWidth - 290), // Ensure minimum margin from left
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
          <div className="flex items-center mb-1">
            <div className="w-4 h-3 border border-red-500 bg-red-100 mr-2"></div>
            <span className="font-medium">Transformed Cube</span>
          </div>
          
          {/* Vector Information */}
          {vectors.length > 0 && (
            <div className="mt-3 pt-2 border-t border-gray-200">
              <h5 className="text-sm font-semibold text-gray-700 mb-2">Vectors:</h5>
              {vectors.map((vectorData, index) => (
                <div key={index} className="mb-2 text-xs">
                  <div className="flex items-center mb-1">
                    <div 
                      className="w-3 h-3 rounded mr-2" 
                      style={{ backgroundColor: vectorData.color.primary }}
                    ></div>
                    <span className="font-medium">{vectorData.label}</span>
                  </div>
                  <div className="ml-5 space-y-1">
                    <div className="text-gray-600">
                      Original: ({vectorData.original.x.toFixed(1)}, {vectorData.original.y.toFixed(1)}, {vectorData.original.z.toFixed(1)})
                    </div>
                    <div className="text-gray-600">
                      Transformed: ({vectorData.transformed.x.toFixed(1)}, {vectorData.transformed.y.toFixed(1)}, {vectorData.transformed.z.toFixed(1)})
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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

// Responsive Camera Controls UI Component

// Main Canvas component
const MatrixTransformationCanvas3D: React.FC<MatrixTransformationCanvas3DProps> = ({ width, height }) => {
  const { matrix3D, vectors3D, settings } = useVisualizer();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Calculate determinant
  const determinant = calculateDeterminant3D(matrix3D);
  
  // Define basis vectors
  const basisVectors: Vector3D[] = [
    { x: 1, y: 0, z: 0 }, // i hat
    { x: 0, y: 1, z: 0 }, // j hat
    { x: 0, y: 0, z: 1 }  // k hat
  ];
  
  // Create transformed basis vectors
  const transformedBasisVectors = basisVectors.map(vector => applyMatrix3D(matrix3D, vector));
  
  // Combine all vectors for camera framing
  const allVectors = [
    ...basisVectors,
    ...transformedBasisVectors,
    ...vectors3D,
    ...vectors3D.map(v => applyMatrix3D(matrix3D, v))
  ];
  
  // Colors
  const originalColor = '#3366FF';
  const transformedColor = '#FF6633';
  
  // Prepare vectors for legend
  const vectorsForLegend = useMemo(() => {
    const vectors: Array<{ original: Vector3D; transformed: Vector3D; color: typeof VECTOR_COLORS[0]; label: string }> = [];
    
    vectors3D.forEach((vector, i) => {
      const colorIndex = i % VECTOR_COLORS.length;
      const colorScheme = VECTOR_COLORS[colorIndex];
      const transformed = applyMatrix3D(matrix3D, vector);
      
      vectors.push({
        original: vector,
        transformed,
        color: colorScheme,
        label: `v${i + 1}`
      });
    });
    
    return vectors;
  }, [vectors3D, matrix3D]);
  
  return (
    <div 
      className="matrix-transformation-canvas-3d bg-white rounded-lg shadow-lg overflow-hidden relative"
      style={{ width, height }}
    >
      {/* Modern Header */}
      <ModernCanvasHeader 
        title="3D Matrix Transformation"
        description={`Linear transformation visualization • Det: ${determinant.toFixed(3)} • ${Math.abs(determinant) > 1 ? 'Expansion' : 'Contraction'}`}
        variant="matrix"
      />
      
      <Canvas
        ref={canvasRef}
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
        {/* Scene Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={0.8}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        
        {/* Reactive Grid System */}
        {settings.showGrid && (
          <ReactiveGridPlanes
            showXY={true}
            showXZ={true}
            showYZ={true}
          />
        )}
        
        {/* Coordinate axes */}
        {settings.showAxes && (
          <>
            <VectorArrow vector={{ x: 3, y: 0, z: 0 }} color="#ff0000" thickness={0.012} />
            <VectorArrow vector={{ x: 0, y: 3, z: 0 }} color="#00ff00" thickness={0.012} />
            <VectorArrow vector={{ x: 0, y: 0, z: 3 }} color="#0000ff" thickness={0.012} />
          </>
        )}
        
        {/* Original basis vectors */}
        {basisVectors.map((vector, i) => (
          <VectorArrow
            key={`original-basis-${i}`}
            vector={vector}
            color={originalColor}
            thickness={0.015}
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
              thickness={0.015}
              dashed
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
          const colorIndex = i % VECTOR_COLORS.length;
          const vectorColor = VECTOR_COLORS[colorIndex].primary;
          const transformedVectorColor = VECTOR_COLORS[colorIndex].secondary; // Use secondary color instead of invalid hex
          
          return (
            <group key={`vector-${i}`}>
              <VectorArrow
                vector={vector}
                color={vectorColor}
                thickness={0.012}
              />
              <VectorArrow
                vector={transformed}
                color={transformedVectorColor}
                thickness={0.012}
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
        
        {/* Camera Projector for Labels - REMOVED FOR LEGEND */}
        
        {/* Backup OrbitControls for manual camera control */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={1}
          maxDistance={50}
        />
      </Canvas>
      
      {/* Vector Labels - REMOVED, now in legend */}
      
      {/* Draggable Legend */}
      <DraggableLegend 
        matrix={matrix3D} 
        determinant={determinant} 
        vectors={vectorsForLegend}
      />
    </div>
  );
};

export default MatrixTransformationCanvas3D;
