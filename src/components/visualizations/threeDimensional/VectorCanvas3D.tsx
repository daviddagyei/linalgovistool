import React, { useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Text } from '@react-three/drei';
import { Vector3, Matrix4, Quaternion } from 'three';
import { useVisualizer } from '../../../context/VisualizerContext';
import { Vector3D } from '../../../types';

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
  const up = new Vector3(0, 1, 0);
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

// Grid planes for better orientation
const GridPlanes: React.FC = () => {
  return (
    <group>
      {/* XY plane (ground) */}
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
      
      {/* XZ plane */}
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
      
      {/* YZ plane */}
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
    </group>
  );
};

// Scene component
const Scene: React.FC = () => {
  const { 
    vectors3D, 
    settings,
    basisSettings3D,
    changeBasis3D
  } = useVisualizer();
  
  // Vector colors
  const vectorColors = ['#3366FF', '#FF6633', '#33CC99', '#9966FF', '#FF9933'];
  const basisColors = ['#22C55E', '#EC4899', '#F59E0B']; // Green, Pink, and Orange for basis vectors
  
  return (
    <group>
      {/* Grid planes */}
      {settings.showGrid && <GridPlanes />}
      
      {/* Coordinate axes */}
      {settings.showAxes && !basisSettings3D.customBasis && <Axes size={5} />}

      {/* Custom basis vectors */}
      {basisSettings3D.customBasis && basisSettings3D.basisVectors.map((vector, index) => (
        <VectorArrow
          key={`basis-${index}`}
          vector={vector}
          color={basisColors[index]}
          label={`e${index + 1}`}
          thickness={0.03}
        />
      ))}
      
      {/* Vectors */}
      {vectors3D.map((vector, index) => {
        const coords = basisSettings3D.customBasis ? 
          changeBasis3D(vector) : 
          vector;

        return (
          <VectorArrow
            key={index}
            vector={vector}
            color={vectorColors[index % vectorColors.length]}
            label={`v${index + 1}(${coords.x.toFixed(1)}, ${coords.y.toFixed(1)}, ${coords.z.toFixed(1)})`}
          />
        );
      })}
    </group>
  );
};

// Camera controller with improved initial position
const CameraController: React.FC = () => {
  const { camera } = useThree();
  const [isRotating, setIsRotating] = useState(true);
  
  useFrame(({ clock }) => {
    if (!isRotating) return;
    const t = clock.getElapsedTime() * 0.1;
    const radius = 10;
    camera.position.x = Math.cos(t) * radius;
    camera.position.z = Math.sin(t) * radius;
    camera.position.y = radius * 0.5;
    camera.lookAt(0, 0, 0);
  });
  
  return (
    <OrbitControls
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={5}
      maxDistance={20}
      onChange={() => setIsRotating(false)}
    />
  );
};

// Main 3D Vector Canvas component
const VectorCanvas3D: React.FC<{ width: number; height: number }> = ({ width, height }) => {
  return (
    <div 
      className="vector-canvas-3d bg-white rounded-lg shadow-lg overflow-hidden"
      style={{ width, height }}
    >
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
        
        {/* Scene content */}
        <Scene />
        
        {/* Camera controls */}
        <CameraController />
      </Canvas>
    </div>
  );
};

export default VectorCanvas3D;