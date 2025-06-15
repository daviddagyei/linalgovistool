import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { Vector3, Quaternion } from 'three';
import { useVisualizer } from '../../../context/VisualizerContext';
import { Vector3D } from '../../../types';
import { ReactiveGridPlanes } from './ReactiveGrid';
import { CameraController } from './CameraController';
import ModernCanvasHeader from './ModernCanvasHeader';

// Vector Arrow component for basis vectors
const BasisVectorArrow: React.FC<{
  vector: Vector3D;
  color: string;
  label: string;
  thickness?: number;
  isCustomBasis?: boolean;
}> = ({ vector, color, label, thickness = 0.025, isCustomBasis = false }) => {
  const start = new Vector3(0, 0, 0);
  const end = new Vector3(vector.x, vector.y, vector.z);
  const length = end.length();
  
  // Don't render zero-length vectors
  if (length < 1e-10) {
    return null;
  }
  
  const direction = end.clone().sub(start).normalize();
  
  // Calculate rotation quaternion for the arrow
  const quaternion = new Quaternion();
  
  if (direction.y > 0.99999) {
    quaternion.set(0, 0, 0, 1);
  } else if (direction.y < -0.99999) {
    quaternion.setFromAxisAngle(new Vector3(1, 0, 0), Math.PI);
  } else {
    const axis = new Vector3();
    axis.set(direction.z, 0, -direction.x).normalize();
    const radians = Math.acos(direction.y);
    quaternion.setFromAxisAngle(axis, radians);
  }
  
  return (
    <group>
      {/* Arrow shaft for basis vectors */}
      <mesh
        position={end.clone().multiplyScalar(0.5)}
        quaternion={quaternion}
      >
        <cylinderGeometry args={[thickness, thickness, length, 8]} />
        <meshStandardMaterial 
          color={color}
          emissive={isCustomBasis ? color : '#000000'}
          emissiveIntensity={isCustomBasis ? 0.1 : 0}
        />
      </mesh>
      
      {/* Arrow head */}
      <mesh 
        position={end}
        quaternion={quaternion}
      >
        <coneGeometry args={[thickness * 3, thickness * 8, 8]} />
        <meshStandardMaterial 
          color={color}
          emissive={isCustomBasis ? color : '#000000'}
          emissiveIntensity={isCustomBasis ? 0.1 : 0}
        />
      </mesh>
      
      {/* Vector Label */}
      <Text
        position={end.clone().add(direction.clone().multiplyScalar(0.4))}
        fontSize={0.25}
        color={color}
        anchorX="left"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
};

// Standard Axes component
const StandardAxes: React.FC<{ size: number }> = ({ size }) => {
  return (
    <group>
      {/* X axis (red) */}
      <mesh position={[size/2, 0, 0]} rotation={[0, 0, -Math.PI/2]}>
        <cylinderGeometry args={[0.015, 0.015, size, 8]} />
        <meshStandardMaterial color="#ff4444" opacity={0.7} transparent />
      </mesh>
      <mesh position={[size, 0, 0]} rotation={[0, 0, -Math.PI/2]}>
        <coneGeometry args={[0.05, 0.15, 8]} />
        <meshStandardMaterial color="#ff4444" opacity={0.7} transparent />
      </mesh>
      <Text position={[size + 0.3, 0, 0]} fontSize={0.2} color="#ff4444">
        x
      </Text>
      
      {/* Y axis (green) */}
      <mesh position={[0, size/2, 0]}>
        <cylinderGeometry args={[0.015, 0.015, size, 8]} />
        <meshStandardMaterial color="#44ff44" opacity={0.7} transparent />
      </mesh>
      <mesh position={[0, size, 0]}>
        <coneGeometry args={[0.05, 0.15, 8]} />
        <meshStandardMaterial color="#44ff44" opacity={0.7} transparent />
      </mesh>
      <Text position={[0, size + 0.3, 0]} fontSize={0.2} color="#44ff44">
        y
      </Text>
      
      {/* Z axis (blue) */}
      <mesh position={[0, 0, size/2]} rotation={[Math.PI/2, 0, 0]}>
        <cylinderGeometry args={[0.015, 0.015, size, 8]} />
        <meshStandardMaterial color="#4444ff" opacity={0.7} transparent />
      </mesh>
      <mesh position={[0, 0, size]} rotation={[Math.PI/2, 0, 0]}>
        <coneGeometry args={[0.05, 0.15, 8]} />
        <meshStandardMaterial color="#4444ff" opacity={0.7} transparent />
      </mesh>
      <Text position={[0, 0, size + 0.3]} fontSize={0.2} color="#4444ff">
        z
      </Text>
    </group>
  );
};



// Main 3D Basis Canvas component
const BasisCanvas3D: React.FC<{ width: number; height: number }> = ({ width, height }) => {
  const { 
    vectors3D, 
    settings,
    basisSettings3D,
    changeBasis3D
  } = useVisualizer();

  // Debug logging
  console.log('BasisCanvas3D - vectors3D:', vectors3D);
  console.log('BasisCanvas3D - basisSettings3D:', basisSettings3D);
  console.log('BasisCanvas3D - settings:', settings);

  // Basis vector colors (different from regular vector colors)
  const basisColors = ['#22C55E', '#EC4899', '#F59E0B']; // Green, Pink, Orange
  const vectorColors = ['#3366FF', '#FF6633', '#33CC99', '#9966FF', '#FF9933']; // Blue tones for transformed vectors

  // Get current basis vectors
  const currentBasisVectors = basisSettings3D.customBasis ? 
    basisSettings3D.basisVectors : 
    [
      { x: 1, y: 0, z: 0 }, // Standard basis
      { x: 0, y: 1, z: 0 },
      { x: 0, y: 0, z: 1 }
    ];

  console.log('BasisCanvas3D - currentBasisVectors:', currentBasisVectors);

  return (
    <div 
      className="basis-canvas-3d bg-white rounded-lg shadow-lg overflow-hidden relative"
      style={{ width, height }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-orange-50 p-4 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-1">
          3D Basis Vector Visualization
        </h3>
        <p className="text-sm text-gray-600">
          {basisSettings3D.customBasis ? 
            'Study custom basis vectors with coordinate transformation' : 
            'Explore standard orthonormal basis vectors (i, j, k)'}
        </p>
      </div>

      <Canvas
        camera={{
          position: [8, 6, 8],
          fov: 50,
          near: 0.1,
          far: 1000
        }}
        shadows
        performance={{ min: 0.5 }}
        gl={{ 
          antialias: true,
          alpha: false,
          powerPreference: "high-performance"
        }}
        dpr={[1, 2]}
        style={{ background: "white" }}
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
        />
        
        {/* Grid System */}
        {settings.showGrid && (
          <ReactiveGridPlanes
            showXY={true}
            showXZ={true}
            showYZ={true}
          />
        )}
        
        {/* Standard coordinate axes (when using custom basis) */}
        {basisSettings3D.customBasis && settings.showAxes && (
          <StandardAxes size={4} />
        )}

        {/* Basis vectors (prominent display) */}
        {currentBasisVectors.map((vector, index) => (
          <BasisVectorArrow
            key={`basis-${index}`}
            vector={vector}
            color={basisColors[index % basisColors.length]}
            label={basisSettings3D.customBasis ? `e${index + 1}` : ['î', 'ĵ', 'k̂'][index]}
            thickness={0.035}
            isCustomBasis={basisSettings3D.customBasis}
          />
        ))}
        
        {/* Original vectors expressed in the current basis */}
        {vectors3D.map((vector, index) => {
          const coords = basisSettings3D.customBasis ? 
            changeBasis3D(vector) : 
            vector;

          return (
            <BasisVectorArrow
              key={`vector-${index}`}
              vector={vector}
              color={vectorColors[index % vectorColors.length]}
              label={basisSettings3D.showCoordinates ? 
                `v${index + 1}(${coords.x.toFixed(1)}, ${coords.y.toFixed(1)}, ${coords.z.toFixed(1)})` :
                `v${index + 1}`
              }
              thickness={0.02}
            />
          );
        })}
        
        {/* Camera Controller */}
        <CameraController
          vectors={[...currentBasisVectors, ...vectors3D]}
          autoFrame={true}
          enableAutoRotate={false}
        />
      </Canvas>
    </div>
  );
};

export default BasisCanvas3D;
