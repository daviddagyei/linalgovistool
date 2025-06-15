import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { Vector3, Quaternion } from 'three';
import { useVisualizer } from '../../../context/VisualizerContext';
import { Vector3D } from '../../../types';
import { ReactiveGridPlanes } from './ReactiveGrid';
import { CameraController } from './CameraController';

// Vector Arrow component
const VectorArrow: React.FC<{
  vector: Vector3D;
  color: string;
  label: string;
  thickness?: number;
}> = ({ vector, color, label, thickness = 0.02 }) => {
  const start = new Vector3(0, 0, 0);
  const end = new Vector3(vector.x, vector.y, vector.z);
  const direction = end.clone().sub(start).normalize();
  const length = end.length();
  
  // Calculate rotation quaternion for the arrow
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
      
      {/* Label */}
      <Text
        position={end.clone().add(direction.multiplyScalar(0.3))}
        fontSize={0.2}
        color={color}
        anchorX="left"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
};

// Axes component with proper orientation
const Axes: React.FC<{ size: number }> = ({ size }) => {
  return (
    <group>
      {/* X axis (red) */}
      <mesh position={[size/2, 0, 0]} rotation={[0, 0, -Math.PI/2]}>
        <cylinderGeometry args={[0.02, 0.02, size, 8]} />
        <meshStandardMaterial color="red" />
      </mesh>
      <mesh position={[size, 0, 0]} rotation={[0, 0, -Math.PI/2]}>
        <coneGeometry args={[0.06, 0.2, 8]} />
        <meshStandardMaterial color="red" />
      </mesh>
      <Text position={[size + 0.3, 0, 0]} fontSize={0.3} color="red">
        x
      </Text>
      
      {/* Y axis (green) */}
      <mesh position={[0, size/2, 0]}>
        <cylinderGeometry args={[0.02, 0.02, size, 8]} />
        <meshStandardMaterial color="green" />
      </mesh>
      <mesh position={[0, size, 0]}>
        <coneGeometry args={[0.06, 0.2, 8]} />
        <meshStandardMaterial color="green" />
      </mesh>
      <Text position={[0, size + 0.3, 0]} fontSize={0.3} color="green">
        y
      </Text>
      
      {/* Z axis (blue) */}
      <mesh position={[0, 0, size/2]} rotation={[Math.PI/2, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, size, 8]} />
        <meshStandardMaterial color="blue" />
      </mesh>
      <mesh position={[0, 0, size]} rotation={[Math.PI/2, 0, 0]}>
        <coneGeometry args={[0.06, 0.2, 8]} />
        <meshStandardMaterial color="blue" />
      </mesh>
      <Text position={[0, 0, size + 0.3]} fontSize={0.3} color="blue">
        z
      </Text>
    </group>
  );
};

// Main 3D Vector Canvas component
const VectorCanvas3D: React.FC<{ width: number; height: number }> = ({ width, height }) => {
  const { 
    vectors3D, 
    settings
  } = useVisualizer();

  // Vector colors
  const vectorColors = ['#3366FF', '#FF6633', '#33CC99', '#9966FF', '#FF9933'];

  return (
    <div 
      className="vector-canvas-3d bg-white rounded-lg shadow-lg overflow-hidden relative"
      style={{ width, height }}
    >
      {/* Header for Vector Tool */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 border-b border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-1">
          3D Vector Visualization
        </h3>
        <p className="text-sm text-gray-600">
          Perform and visualize vector operations in three dimensions
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
        
        {/* Enhanced Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={0.8}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        
        {/* Reactive Grid System */}
        {settings.showGrid && (
          <ReactiveGridPlanes
            showXY={true}
            showXZ={true}
            showYZ={true}
          />
        )}
        
        {/* Standard coordinate axes */}
        {settings.showAxes && <Axes size={5} />}
        
        {/* Vectors */}
        {vectors3D.map((vector, index) => (
          <VectorArrow
            key={index}
            vector={vector}
            color={vectorColors[index % vectorColors.length]}
            label={`v${index + 1}(${vector.x.toFixed(1)}, ${vector.y.toFixed(1)}, ${vector.z.toFixed(1)})`}
          />
        ))}
        
        {/* Intelligent Camera Controller */}
        <CameraController
          vectors={vectors3D}
          autoFrame={true}
          enableAutoRotate={false}
        />
      </Canvas>
    </div>
  );
};

export default VectorCanvas3D;