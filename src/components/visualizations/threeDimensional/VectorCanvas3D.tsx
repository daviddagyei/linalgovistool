import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { Vector3, Matrix4, Quaternion } from 'three';
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

// Simplified Camera Controls UI Component (without hooks)
const SimpleCameraControlsUI: React.FC<{
  vectors: Vector3D[];
}> = ({ vectors }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="absolute top-4 right-4 z-20">
      <div className="bg-white/95 backdrop-blur-sm rounded-lg border border-gray-200/50 shadow-lg">
        <div className="flex items-center justify-between p-3 border-b border-gray-200/50">
          <h4 className="text-sm font-semibold text-gray-700">Camera Controls</h4>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>

        <div className="p-3 space-y-2">
          <div className="text-sm text-gray-600">
            🎯 Smart camera with adaptive zoom
          </div>
        </div>

        {isExpanded && (
          <div className="p-3 border-t border-gray-200/50">
            <h5 className="text-xs font-semibold text-gray-600 mb-2">Vectors in scene:</h5>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {vectors.map((vector, index) => (
                <div
                  key={index}
                  className="w-full px-2 py-1 text-left rounded text-xs bg-gray-100 text-gray-600"
                >
                  <span className="font-mono">
                    v{index + 1}: ({vector.x.toFixed(1)}, {vector.y.toFixed(1)}, {vector.z.toFixed(1)})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="px-3 py-2 border-t border-gray-200/50 bg-gray-50/50">
          <p className="text-xs text-gray-500">
            🎯 Use mouse/touch to control camera
          </p>
        </div>
      </div>
    </div>
  );
};

// Main 3D Vector Canvas component
const VectorCanvas3D: React.FC<{ width: number; height: number }> = ({ width, height }) => {
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
    <div 
      className="vector-canvas-3d bg-white rounded-lg shadow-lg overflow-hidden relative"
      style={{ width, height }}
    >
      {/* Simplified Camera Controls UI */}
      <SimpleCameraControlsUI vectors={vectors3D} />

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
        
        {/* Reactive Grid planes */}
        {settings.showGrid && <ReactiveGridPlanes />}
        
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