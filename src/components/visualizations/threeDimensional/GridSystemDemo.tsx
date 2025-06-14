import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { ReactiveGridPlanes, GridInfo } from './ContentAwareGrid';
import { AdaptiveVectorArrow } from './AdaptiveVectorArrow';

// Example vectors with different scales to demonstrate content-aware grid
const exampleVectorSets = {
  tiny: [
    { x: 0.01, y: 0.02, z: 0.01 },
    { x: 0.03, y: 0.01, z: 0.02 }
  ],
  small: [
    { x: 0.5, y: 1.2, z: 0.8 },
    { x: 1.1, y: 0.7, z: 1.5 }
  ],
  medium: [
    { x: 2, y: 4, z: 3 },
    { x: 5, y: 2, z: 6 },
    { x: 3, y: 7, z: 1 }
  ],
  large: [
    { x: 15, y: 25, z: 30 },
    { x: 40, y: 20, z: 35 },
    { x: 25, y: 45, z: 15 }
  ],
  mixed: [
    { x: 0.1, y: 0.2, z: 0.1 },
    { x: 2, y: 4, z: 3 },
    { x: 15, y: 25, z: 30 }
  ]
};

export const GridSystemDemo: React.FC = () => {
  const [vectorSet, setVectorSet] = useState<keyof typeof exampleVectorSets>('medium');
  const [adaptiveMode, setAdaptiveMode] = useState<'content' | 'camera' | 'hybrid'>('hybrid');
  const [showMultiLevel, setShowMultiLevel] = useState(true);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  const currentVectors = exampleVectorSets[vectorSet];

  return (
    <div className="w-full h-screen relative bg-gray-100">
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 bg-white/95 p-4 rounded-lg shadow-lg">
        <h3 className="font-bold mb-3">Reactive Grid Demo</h3>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Vector Set:</label>
            <select 
              value={vectorSet} 
              onChange={(e) => setVectorSet(e.target.value as keyof typeof exampleVectorSets)}
              className="w-full p-2 border rounded"
            >
              <option value="tiny">Tiny (0.01-0.03)</option>
              <option value="small">Small (0.5-1.5)</option>
              <option value="medium">Medium (1-7)</option>
              <option value="large">Large (15-45)</option>
              <option value="mixed">Mixed scales</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Adaptive Mode:</label>
            <select 
              value={adaptiveMode} 
              onChange={(e) => setAdaptiveMode(e.target.value as any)}
              className="w-full p-2 border rounded"
            >
              <option value="content">Content-based</option>
              <option value="camera">Camera-based</option>
              <option value="hybrid">Hybrid (default)</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              checked={showMultiLevel} 
              onChange={(e) => setShowMultiLevel(e.target.checked)}
              id="multiLevel"
            />
            <label htmlFor="multiLevel" className="text-sm">Multi-level grid</label>
          </div>

          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              checked={showDebugInfo} 
              onChange={(e) => setShowDebugInfo(e.target.checked)}
              id="debugInfo"
            />
            <label htmlFor="debugInfo" className="text-sm">Show debug info</label>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute top-4 right-4 z-10 bg-blue-50 p-4 rounded-lg shadow-lg max-w-sm">
        <h4 className="font-bold mb-2">How to Test:</h4>
        <ul className="text-sm space-y-1">
          <li>• Switch vector sets to see grid adapt</li>
          <li>• Zoom in/out to see distance scaling</li>
          <li>• Try different adaptive modes</li>
          <li>• Toggle multi-level to see fine grids</li>
          <li>• Enable debug info for details</li>
        </ul>
      </div>

      {/* 3D Scene */}
      <Canvas
        camera={{ position: [8, 6, 8], fov: 50 }}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />

        {/* Content-Aware Reactive Grid */}
        <ReactiveGridPlanes
          vectors={currentVectors}
          adaptiveMode={adaptiveMode}
          showMultiLevel={showMultiLevel}
          opacity={0.8}
          showXY={true}
          showXZ={true}
          showYZ={true}
        />

        {/* Render vectors */}
        {currentVectors.map((vector, index) => (
          <AdaptiveVectorArrow
            key={index}
            vector={vector}
            color={['#3B82F6', '#EF4444', '#10B981'][index % 3]}
            label={`v${index + 1}`}
            baseThickness={0.02}
            index={index}
            totalVectors={currentVectors.length}
          />
        ))}

        <OrbitControls enablePan enableZoom enableRotate />
      </Canvas>

      {/* Debug Info */}
      {showDebugInfo && (
        <GridInfo vectors={currentVectors} visible={true} />
      )}
    </div>
  );
};

export default GridSystemDemo;
