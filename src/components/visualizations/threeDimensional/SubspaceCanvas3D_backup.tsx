import React, { useState, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { Vector3, BufferGeometry, Float32BufferAttribute, Quaternion, Mesh } from 'three';
import * as THREE from 'three';
import { useVisualizer } from '../../../context/VisualizerContext';
import { isLinearlyIndependent3D, magnitude3D, crossProduct, normalize3D } from '../../../utils/mathUtils';
import { ReactiveGridPlanes } from './ReactiveGrid';
import { CameraController, useCameraControls } from './CameraController';

interface SubspaceCanvas3DProps {
  width: number;
  height: number;
}

// Enhanced Vector Arrow with better materials and lighting
const VectorArrow: React.FC<{
  vector: { x: number; y: number; z: number };
  color: string;
  label?: string;
  thickness?: number;
  isActive?: boolean;
  showSpan?: boolean;
}> = ({ vector, color, label, thickness = 0.02, isActive = false, showSpan = false }) => {
  const meshRef = useRef<Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current && isActive) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });
  
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
  
  const enhancedThickness = isActive ? thickness * 1.5 : showSpan ? thickness * 1.2 : thickness;
  
  return (
    <group ref={meshRef}>
      {/* Enhanced arrow shaft */}
      <mesh
        position={end.clone().multiplyScalar(0.5)}
        quaternion={quaternion}
      >
        <cylinderGeometry args={[enhancedThickness, enhancedThickness, length, 12]} />
        <meshPhongMaterial 
          color={color} 
          shininess={100}
          transparent
          opacity={showSpan ? 0.9 : 0.8}
          emissive={isActive ? color : '#000000'}
          emissiveIntensity={isActive ? 0.2 : 0}
        />
      </mesh>
      
      {/* Enhanced arrow head */}
      <mesh 
        position={end}
        quaternion={quaternion}
      >
        <coneGeometry args={[enhancedThickness * 3, enhancedThickness * 10, 12]} />
        <meshPhongMaterial 
          color={color}
          shininess={100}
          transparent
          opacity={showSpan ? 0.9 : 0.8}
          emissive={isActive ? color : '#000000'}
          emissiveIntensity={isActive ? 0.3 : 0}
        />
      </mesh>
      
      {/* Enhanced label */}
      {label && (
        <Text
          position={end.clone().add(direction.multiplyScalar(0.4))}
          fontSize={0.15}
          color={color}
          anchorX="center"
          anchorY="middle"
        >
          {label}
        </Text>
      )}
    </group>
  );
};

// OPTIMIZED: Fast Animated Line Span with reduced complexity
const FastAnimatedSpanLine: React.FC<{
  vector: { x: number; y: number; z: number };
  color: string;
  range?: number;
}> = ({ vector, color, range = 8 }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const lastUpdateTime = useRef<number>(0);
  
  useFrame((state) => {
    // OPTIMIZED: Throttle updates to 20fps for better performance
    if (state.clock.elapsedTime - lastUpdateTime.current < 0.05) return;
    lastUpdateTime.current = state.clock.elapsedTime;
    
    if (pointsRef.current) {
      const time = state.clock.elapsedTime;
      const positions = pointsRef.current.geometry.attributes.position;
      
      if (positions) {
        const vectorMagnitude = magnitude3D(vector);
        if (vectorMagnitude > 1e-10) {
          const steps = 60; // Reduced from 100
          
          for (let i = 0; i < steps; i++) {
            const baseT = (i / (steps - 1) - 0.5) * 2 * range / vectorMagnitude;
            // OPTIMIZED: Simplified wave motion
            const waveOffset = Math.sin(time * 4 + i * 0.15) * 0.08;
            const t = baseT + waveOffset;
            
            positions.setXYZ(i, 
              vector.x * t,
              vector.y * t,
              vector.z * t
            );
          }
          
          positions.needsUpdate = true;
        }
      }
    }
  });
  
  const { geometry, material } = useMemo(() => {
    const points: Vector3[] = [];
    const steps = 60; // Reduced from 100
    
    const vectorMagnitude = magnitude3D(vector);
    if (vectorMagnitude < 1e-10) {
      points.push(new Vector3(0, 0, 0));
    } else {
      for (let i = 0; i < steps; i++) {
        const t = (i / (steps - 1) - 0.5) * 2 * range / vectorMagnitude;
        points.push(new Vector3(
          vector.x * t,
          vector.y * t,
          vector.z * t
        ));
      }
    }
    
    const geometry = new BufferGeometry().setFromPoints(points);
    const material = new THREE.PointsMaterial({
      color: color,
      size: 0.1, // Slightly larger for better visibility
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true
    });
    
    return { geometry, material };
  }, [vector, color, range]);
  
  return (
    <points ref={pointsRef} geometry={geometry} material={material} />
  );
};

// OPTIMIZED: Fast Animated Plane Span with reduced complexity
const FastAnimatedSpanPlane: React.FC<{
  vectors: { x: number; y: number; z: number }[];
  color: string;
  isIndependent: boolean;
  opacity?: number;
}> = ({ vectors, color, isIndependent, opacity = 0.3 }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const lastUpdateTime = useRef<number>(0);
  
  useFrame((state) => {
    // OPTIMIZED: Throttle updates to 15fps for plane animations
    if (state.clock.elapsedTime - lastUpdateTime.current < 0.067) return;
    lastUpdateTime.current = state.clock.elapsedTime;
    
    if (pointsRef.current) {
      const time = state.clock.elapsedTime;
      const positions = pointsRef.current.geometry.attributes.position;
      
      if (positions && vectors.length >= 2) {
        const v1 = vectors[0];
        const v2 = vectors[1];
        const resolution = 10; // Reduced from 15
        const size = 6;
        let index = 0;
        
        for (let i = -resolution; i <= resolution; i++) {
          for (let j = -resolution; j <= resolution; j++) {
            const scale1 = size / (2 * Math.max(magnitude3D(v1), 1));
            const scale2 = size / (2 * Math.max(magnitude3D(v2), 1));
            
            // OPTIMIZED: Simplified wave motion
            const waveS = (i / resolution) * scale1 + Math.sin(time * 3 + i * 0.2) * 0.015;
            const waveT = (j / resolution) * scale2 + Math.cos(time * 3.5 + j * 0.2) * 0.015;
            
            const newX = waveS * v1.x + waveT * v2.x;
            const newY = waveS * v1.y + waveT * v2.y;
            const newZ = waveS * v1.z + waveT * v2.z;
            
            positions.setXYZ(index, newX, newY, newZ);
            index++;
          }
        }
        
        positions.needsUpdate = true;
      }
    }
  });
  
  const { geometry, material } = useMemo(() => {
    if (vectors.length < 2) return { geometry: new BufferGeometry(), material: new THREE.PointsMaterial() };
    
    const v1 = vectors[0];
    const v2 = vectors[1];
    const points: Vector3[] = [];
    const resolution = 10; // Reduced from 15
    const size = 6;
    
    for (let i = -resolution; i <= resolution; i++) {
      for (let j = -resolution; j <= resolution; j++) {
        const scale1 = size / (2 * Math.max(magnitude3D(v1), 1));
        const scale2 = size / (2 * Math.max(magnitude3D(v2), 1));
        
        const s = (i / resolution) * scale1;
        const t = (j / resolution) * scale2;
        
        points.push(new Vector3(
          s * v1.x + t * v2.x,
          s * v1.y + t * v2.y,
          s * v1.z + t * v2.z
        ));
      }
    }
    
    const geometry = new BufferGeometry().setFromPoints(points);
    const material = new THREE.PointsMaterial({
      color: color,
      size: 0.08, // Slightly larger
      transparent: true,
      opacity: opacity * 1.2,
      sizeAttenuation: true
    });
    
    return { geometry, material };
  }, [vectors, color, opacity]);
  
  return (
    <points ref={pointsRef} geometry={geometry} material={material} />
  );
};

// OPTIMIZED: Fast Span Visualization with performance improvements
const FastAnimatedSpanVisualization: React.FC<{
  vectors: { x: number; y: number; z: number }[];
  selectedIndices: boolean[];
  colorScheme: any;
}> = ({ vectors, selectedIndices, colorScheme }) => {
  const selectedVectors = vectors.filter((_, i) => selectedIndices[i]);
  const isIndependent = isLinearlyIndependent3D(selectedVectors);
  
  if (selectedVectors.length === 0) return null;
  
  if (selectedVectors.length === 1) {
    const vectorIndex = vectors.findIndex(v => v === selectedVectors[0]);
    const color = colorScheme.vectors[vectorIndex % colorScheme.vectors.length].primary;
    return <FastAnimatedSpanLine vector={selectedVectors[0]} color={color} />;
  } else if (selectedVectors.length === 2) {
    const vectorIndex1 = vectors.findIndex(v => v === selectedVectors[0]);
    const vectorIndex2 = vectors.findIndex(v => v === selectedVectors[1]);
    const color = isIndependent ? colorScheme.spans.independent.stroke : colorScheme.spans.dependent.stroke;
    
    return (
      <group>
        <FastAnimatedSpanPlane 
          vectors={selectedVectors} 
          color={color} 
          isIndependent={isIndependent}
          opacity={0.4}
        />
        {/* OPTIMIZED: Only show vector lines if independent */}
        {isIndependent && (
          <group>
            <FastAnimatedSpanLine vector={selectedVectors[0]} color={colorScheme.vectors[vectorIndex1 % colorScheme.vectors.length].primary} range={5} />
            <FastAnimatedSpanLine vector={selectedVectors[1]} color={colorScheme.vectors[vectorIndex2 % colorScheme.vectors.length].primary} range={5} />
          </group>
        )}
      </group>
    );
  } else if (selectedVectors.length === 3) {
    if (isIndependent) {
      // OPTIMIZED: Show only 2 planes instead of 3 for better performance
      return (
        <group>
          <FastAnimatedSpanPlane 
            vectors={[selectedVectors[0], selectedVectors[1]]} 
            color={colorScheme.spans.independent.stroke} 
            isIndependent={true}
            opacity={0.15}
          />
          <FastAnimatedSpanPlane 
            vectors={[selectedVectors[1], selectedVectors[2]]} 
            color={colorScheme.spans.independent.stroke} 
            isIndependent={true}
            opacity={0.15}
          />
        </group>
      );
    } else {
      // Find effective independent pair
      let effectiveVectors = selectedVectors.slice(0, 2);
      if (!isLinearlyIndependent3D(effectiveVectors)) {
        effectiveVectors = [selectedVectors[0], selectedVectors[2]];
        if (!isLinearlyIndependent3D(effectiveVectors)) {
          effectiveVectors = [selectedVectors[1], selectedVectors[2]];
        }
      }
      
      return <FastAnimatedSpanPlane 
        vectors={effectiveVectors} 
        color={colorScheme.spans.dependent.stroke} 
        isIndependent={false}
        opacity={0.25}
      />;
    }
  }
  
  return null;
};

// Enhanced Draggable Legend
const DraggableLegend: React.FC<{
  vectors: { x: number; y: number; z: number }[];
  selectedIndices: boolean[];
  isIndependent: boolean;
  onToggleSpan: (index: number) => void;
  colorScheme: any;
}> = ({ vectors, selectedIndices, isIndependent, onToggleSpan, colorScheme }) => {
  const [position, setPosition] = useState({ 
    x: window.innerWidth - 320,
    y: 16
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  React.useEffect(() => {
    const updatePosition = () => {
      if (!isDragging) {
        setPosition(prev => ({
          x: Math.max(16, window.innerWidth - 320),
          y: prev.y
        }));
      }
    };

    window.addEventListener('resize', updatePosition);
    updatePosition();

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

  const handleMouseUp = () => setIsDragging(false);
  const handleTouchEnd = () => setIsDragging(false);

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

  const selectedCount = selectedIndices.filter(Boolean).length;

  return ReactDOM.createPortal(
    <div
      className="fixed bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200/50 p-4 shadow-xl cursor-move select-none z-50 touch-none"
      style={{
        left: position.x,
        top: position.y,
        transform: isDragging ? 'scale(1.02)' : 'scale(1)',
        transition: isDragging ? 'none' : 'transform 0.2s ease',
        minWidth: '300px',
        maxWidth: '90vw',
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-bold text-gray-800">⚡ Fast 3D Spans</h4>
        <div className="text-xs text-gray-400">⋮⋮</div>
      </div>
      
      {/* Vector Controls */}
      <div className="space-y-3 mb-4">
        <h5 className="text-sm font-semibold text-gray-700">Vector Spans</h5>
        {vectors.map((vector, i) => (
          <button
            key={i}
            onClick={() => onToggleSpan(i)}
            className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
              selectedIndices[i]
                ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 text-blue-700 shadow-sm'
                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div 
                className={`w-4 h-4 rounded-full border-2 ${selectedIndices[i] ? 'animate-pulse' : ''}`}
                style={{
                  backgroundColor: selectedIndices[i] ? colorScheme.vectors[i % colorScheme.vectors.length].primary : 'transparent',
                  borderColor: colorScheme.vectors[i % colorScheme.vectors.length].primary
                }}
              />
              <span className="font-medium text-sm">
                v<sub>{i + 1}</sub>
              </span>
              <span className="text-xs text-gray-500 font-mono">
                ({vector.x.toFixed(1)}, {vector.y.toFixed(1)}, {vector.z.toFixed(1)})
              </span>
            </div>
          </button>
        ))}
      </div>
      
      {/* Analysis Panel */}
      {selectedCount > 0 && (
        <div className={`p-4 rounded-lg border-l-4 ${
          isIndependent ? 'bg-green-50 border-green-400' : 'bg-orange-50 border-orange-400'
        }`}>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Linear Independence</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                isIndependent ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
              }`}>
                {isIndependent ? 'Independent' : 'Dependent'}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Vectors:</span>
                <span className="ml-2 font-medium">{selectedCount}</span>
              </div>
              <div>
                <span className="text-gray-600">Dimension:</span>
                <span className="ml-2 font-medium">
                  {selectedCount === 0 ? 0 :
                   selectedCount === 1 ? 1 :
                   selectedCount === 2 && isIndependent ? 2 :
                   selectedCount === 3 && isIndependent ? 3 :
                   selectedCount === 2 ? 1 : 2}
                </span>
              </div>
            </div>
            
            <div className="text-xs text-gray-600 mt-2">
              {selectedCount === 1 && '⚡ Fast flowing dots along vector direction'}
              {selectedCount === 2 && isIndependent && '⚡ Optimized animated plane'}
              {selectedCount === 2 && !isIndependent && '⚡ Fast line animation (dependent vectors)'}
              {selectedCount === 3 && isIndependent && '⚡ Efficient multi-plane visualization'}
              {selectedCount === 3 && !isIndependent && '⚡ Optimized plane or line'}
            </div>
          </div>
        </div>
      )}
      
      {/* Performance Info */}
      <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
        <div className="text-sm text-green-800">
          <div className="font-medium mb-2">⚡ Performance Optimized</div>
          <div className="text-xs space-y-1">
            <div>• <strong>Reduced complexity:</strong> Fewer dots for speed</div>
            <div>• <strong>Throttled updates:</strong> 15-20fps for smooth motion</div>
            <div>• <strong>Smart rendering:</strong> Only visible elements</div>
            <div>• <strong>Efficient algorithms:</strong> Optimized calculations</div>
          </div>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
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
  const { vectors3D, settings, subspaceSettings, updateSubspaceSettings } = useVisualizer();
  const [hoveredVector, setHoveredVector] = useState<number | null>(null);

  // Enhanced color scheme
  const colorScheme = {
    vectors: [
      { primary: '#3B82F6', secondary: '#93C5FD' },
      { primary: '#EF4444', secondary: '#FCA5A5' },
      { primary: '#10B981', secondary: '#6EE7B7' },
      { primary: '#8B5CF6', secondary: '#C4B5FD' },
      { primary: '#F59E0B', secondary: '#FCD34D' }
    ],
    spans: {
      independent: { fill: 'rgba(59, 130, 246, 0.15)', stroke: '#3B82F6' },
      dependent: { fill: 'rgba(239, 68, 68, 0.15)', stroke: '#EF4444' },
      intersection: { fill: 'rgba(139, 92, 246, 0.2)', stroke: '#8B5CF6' }
    }
  };

// Camera Controls UI Component
const CameraControlsUI: React.FC<{
  onAutoFrame: () => void;
  onFocusVector: (index: number) => void;
  onResetView: () => void;
  vectors: { x: number; y: number; z: number }[];
  selectedIndices: boolean[];
}> = ({ onAutoFrame, onFocusVector, onResetView, vectors, selectedIndices }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="absolute top-20 right-4 z-20">
      <div className="bg-white/95 backdrop-blur-sm rounded-lg border border-gray-200/50 shadow-lg">
        {/* Camera Controls Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200/50">
          <h4 className="text-sm font-semibold text-gray-700">Camera Controls</h4>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>

        {/* Always visible essential controls */}
        <div className="p-3 space-y-2">
          <button
            onClick={onAutoFrame}
            className="w-full px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm font-medium"
            title="Automatically frame all vectors in view"
          >
            📐 Auto-Frame All
          </button>
          
          <button
            onClick={onResetView}
            className="w-full px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm font-medium"
            title="Reset to default isometric view"
          >
            🔄 Reset View
          </button>
        </div>

        {/* Expandable vector focus controls */}
        {isExpanded && (
          <div className="p-3 border-t border-gray-200/50">
            <h5 className="text-xs font-semibold text-gray-600 mb-2">Focus on Vector:</h5>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {vectors.map((vector, index) => (
                <button
                  key={index}
                  onClick={() => onFocusVector(index)}
                  className={`w-full px-2 py-1 text-left rounded text-xs transition-colors ${
                    selectedIndices[index]
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={`Focus camera on vector v${index + 1}`}
                >
                  <span className="font-mono">
                    v{index + 1}: ({vector.x.toFixed(1)}, {vector.y.toFixed(1)}, {vector.z.toFixed(1)})
                  </span>
                  {selectedIndices[index] && <span className="ml-1">✨</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Camera info */}
        <div className="px-3 py-2 border-t border-gray-200/50 bg-gray-50/50">
          <p className="text-xs text-gray-500">
            🎯 Intelligent camera with adaptive zoom limits
          </p>
        </div>
      </div>
    </div>
  );
};

// Main Canvas component
const SubspaceCanvas3D: React.FC<SubspaceCanvas3DProps> = ({ width, height }) => {
  const { vectors3D, settings, subspaceSettings, updateSubspaceSettings } = useVisualizer();
  const [hoveredVector, setHoveredVector] = useState<number | null>(null);
  const { focusOnVector, autoFrame, resetView } = useCameraControls();

  // Enhanced color scheme
  const colorScheme = {
    vectors: [
      { primary: '#3B82F6', secondary: '#93C5FD' },
      { primary: '#EF4444', secondary: '#FCA5A5' },
      { primary: '#10B981', secondary: '#6EE7B7' },
      { primary: '#8B5CF6', secondary: '#C4B5FD' },
      { primary: '#F59E0B', secondary: '#FCD34D' }
    ],
    spans: {
      independent: { fill: 'rgba(59, 130, 246, 0.15)', stroke: '#3B82F6' },
      dependent: { fill: 'rgba(239, 68, 68, 0.15)', stroke: '#EF4444' },
      intersection: { fill: 'rgba(139, 92, 246, 0.2)', stroke: '#8B5CF6' }
    }
  };

  const selectedVectors = vectors3D.filter((_, i) => subspaceSettings.showSpan[i]);
  const isIndependent = isLinearlyIndependent3D(selectedVectors);

  const toggleSpan = (index: number) => {
    const newShowSpan = [...subspaceSettings.showSpan];
    newShowSpan[index] = !newShowSpan[index];
    updateSubspaceSettings({ showSpan: newShowSpan });
  };

  const handleFocusVector = (index: number) => {
    if (vectors3D[index]) {
      focusOnVector(vectors3D[index]);
    }
  };

  return (
    <div 
      className="subspace-canvas-3d bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-xl overflow-hidden relative"
      style={{ width, height }}
    >
      {/* Enhanced Header */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-green-50 to-blue-50 p-4 border-b border-gray-200/50 z-10">
        <h3 className="text-lg font-bold text-gray-800 mb-1">
          ⚡ Fast 3D Animated Subspace Visualization
        </h3>
        <p className="text-sm text-gray-600">
          Optimized performance with smooth 15-20fps animations following exact vector directions
        </p>
      </div>

      {/* Camera Controls UI */}
      <CameraControlsUI
        onAutoFrame={autoFrame}
        onFocusVector={handleFocusVector}
        onResetView={resetView}
        vectors={vectors3D}
        selectedIndices={subspaceSettings.showSpan}
      />
      
      <Canvas
        camera={{
          position: [8, 6, 8],
          fov: 50,
          near: 0.1,
          far: 1000
        }}
        shadows
        style={{ marginTop: '80px', height: height - 80 }}
      >
        {/* Enhanced Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-10, -10, -10]} intensity={0.3} />
        
        {/* Enhanced Reactive Grid System */}
        {settings.showGrid && (
          <ReactiveGridPlanes 
            showXY={true}
            showXZ={true}
            showYZ={true}
            opacity={0.8}
          />
        )}
        
        {/* Enhanced Coordinate Axes */}
        {settings.showAxes && (
          <>
            {/* X axis (red) */}
            <group>
              <mesh position={[2.5, 0, 0]} rotation={[0, 0, -Math.PI/2]}>
                <cylinderGeometry args={[0.02, 0.02, 5, 8]} />
                <meshPhongMaterial color="#ff4444" />
              </mesh>
              <mesh position={[5, 0, 0]} rotation={[0, 0, -Math.PI/2]}>
                <coneGeometry args={[0.06, 0.2, 8]} />
                <meshPhongMaterial color="#ff4444" />
              </mesh>
              <Text position={[5.5, 0, 0]} fontSize={0.3} color="#ff4444">X</Text>
            </group>
            
            {/* Y axis (green) */}
            <group>
              <mesh position={[0, 2.5, 0]}>
                <cylinderGeometry args={[0.02, 0.02, 5, 8]} />
                <meshPhongMaterial color="#44ff44" />
              </mesh>
              <mesh position={[0, 5, 0]}>
                <coneGeometry args={[0.06, 0.2, 8]} />
                <meshPhongMaterial color="#44ff44" />
              </mesh>
              <Text position={[0, 5.5, 0]} fontSize={0.3} color="#44ff44">Y</Text>
            </group>
            
            {/* Z axis (blue) */}
            <group>
              <mesh position={[0, 0, 2.5]} rotation={[Math.PI/2, 0, 0]}>
                <cylinderGeometry args={[0.02, 0.02, 5, 8]} />
                <meshPhongMaterial color="#4444ff" />
              </mesh>
              <mesh position={[0, 0, 5]} rotation={[Math.PI/2, 0, 0]}>
                <coneGeometry args={[0.06, 0.2, 8]} />
                <meshPhongMaterial color="#4444ff" />
              </mesh>
              <Text position={[0, 0, 5.5]} fontSize={0.3} color="#4444ff">Z</Text>
            </group>
          </>
        )}
        
        {/* OPTIMIZED: Fast Animated Span Visualization */}
        <FastAnimatedSpanVisualization
          vectors={vectors3D}
          selectedIndices={subspaceSettings.showSpan}
          colorScheme={colorScheme}
        />
        
        {/* Enhanced Vectors */}
        {vectors3D.map((vector, i) => (
          <VectorArrow
            key={i}
            vector={vector}
            color={colorScheme.vectors[i % colorScheme.vectors.length].primary}
            label={`v${i + 1}`}
            thickness={0.025}
            isActive={hoveredVector === i}
            showSpan={subspaceSettings.showSpan[i]}
          />
        ))}
        
        {/* Intelligent Camera Controller */}
        <CameraController
          vectors={vectors3D}
          autoFrame={true}
          enableAutoRotate={false}
        />
      </Canvas>
      
      {/* Enhanced Draggable Legend */}
      <DraggableLegend 
        vectors={vectors3D}
        selectedIndices={subspaceSettings.showSpan}
        isIndependent={isIndependent}
        onToggleSpan={toggleSpan}
        colorScheme={colorScheme}
      />
    </div>
  );
};

export default SubspaceCanvas3D;