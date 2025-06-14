import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { Vector3, BufferGeometry } from 'three';
import * as THREE from 'three';
import { useVisualizer } from '../../../context/VisualizerContext';
import { isLinearlyIndependent3D, magnitude3D, crossProduct, normalize3D } from '../../../utils/mathUtils';
import { ReactiveGridPlanes } from './ContentAwareGrid';
import { CameraController, useCameraControls } from './CameraController';
import { AdaptiveVectorArrow } from './AdaptiveVectorArrow';
import { ResponsiveLegend, VectorMagnitudeIndicator } from '../../ui/ResponsiveUI';
import { ResponsiveCameraControls } from '../../ui/ResponsiveCameraControls';
import { AccessibilitySettings } from '../../ui/AccessibilitySettings';
import { useResponsiveViewport, useAccessibility, useTouchGestures } from '../../../hooks/useResponsiveUI';
// import { PerformanceMonitor } from './PerformanceMonitor'; // Uncomment for performance debugging

interface SubspaceCanvas3DProps {
  width: number;
  height: number;
}

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
        const array = positions.array as Float32Array;
        for (let i = 0; i < array.length; i += 3) {
          const t = (i / 3) / (array.length / 3 - 1) * range - range / 2;
          const animPhase = Math.sin(time * 2 + t * 0.5) * 0.1;
          array[i] = vector.x * (t + animPhase);
          array[i + 1] = vector.y * (t + animPhase);
          array[i + 2] = vector.z * (t + animPhase);
        }
        positions.needsUpdate = true;
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
        const t = (i / (steps - 1)) * range - range / 2;
        const point = new Vector3(
          vector.x * t,
          vector.y * t,
          vector.z * t
        );
        points.push(point);
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
  opacity?: number;
}> = ({ vectors, color, opacity = 0.3 }) => {
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
        const array = positions.array as Float32Array;
        
        let index = 0;
        const resolution = 10;
        const size = 6;
        
        for (let i = -resolution; i <= resolution; i++) {
          for (let j = -resolution; j <= resolution; j++) {
            const s = (i / resolution) * size;
            const t = (j / resolution) * size;
            
            const animationPhase = Math.sin(time * 1.5 + s * 0.2 + t * 0.2) * 0.05;
            
            const x = v1.x * s + v2.x * t + animationPhase;
            const y = v1.y * s + v2.y * t + animationPhase;
            const z = v1.z * s + v2.z * t + animationPhase;
            
            array[index] = x;
            array[index + 1] = y;
            array[index + 2] = z;
            index += 3;
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
        const s = (i / resolution) * size;
        const t = (j / resolution) * size;
        
        const point = new Vector3(
          v1.x * s + v2.x * t,
          v1.y * s + v2.y * t,
          v1.z * s + v2.z * t
        );
        points.push(point);
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
  // Note: reducedComplexity can be added later for performance optimization
  const selectedVectors = vectors.filter((_, i) => selectedIndices[i]);
  const isIndependent = isLinearlyIndependent3D(selectedVectors);
  
  if (selectedVectors.length === 0) return null;
  
  if (selectedVectors.length === 1) {
    const vectorIndex = vectors.findIndex(v => v === selectedVectors[0]);
    const color = colorScheme.vectors[vectorIndex % colorScheme.vectors.length].primary;
    return <FastAnimatedSpanLine vector={selectedVectors[0]} color={color} />;
  } else if (selectedVectors.length === 2) {
    const color = isIndependent ? colorScheme.spans.independent.stroke : colorScheme.spans.dependent.stroke;
    
    return (
      <group>
        <FastAnimatedSpanPlane 
          vectors={selectedVectors} 
          color={color} 
          opacity={0.4}
        />
        <FastAnimatedSpanLine vector={selectedVectors[0]} color={color} />
        <FastAnimatedSpanLine vector={selectedVectors[1]} color={color} />
        {isIndependent && (
          <FastAnimatedSpanLine 
            vector={normalize3D(crossProduct(selectedVectors[0], selectedVectors[1]))} 
            color={colorScheme.spans.intersection.stroke} 
          />
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
            opacity={0.2}
          />
          <FastAnimatedSpanPlane 
            vectors={[selectedVectors[1], selectedVectors[2]]} 
            color={colorScheme.spans.independent.stroke} 
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
        opacity={0.25}
      />;
    }
  }
  
  return null;
};

// NOTE: CameraControlsUI component replaced with ResponsiveCameraControls

// NOTE: DraggableLegend component replaced with ResponsiveLegend

// Main Canvas component
const SubspaceCanvas3D: React.FC<SubspaceCanvas3DProps> = ({ width, height }) => {
  const { vectors3D, settings, subspaceSettings, updateSubspaceSettings } = useVisualizer();
  const { focusOnVector, autoFrame, resetView } = useCameraControls();
  const viewport = useResponsiveViewport();
  const { preferences } = useAccessibility();
  const { isTouch, handlers } = useTouchGestures();

  // Convert touch handlers to React event handlers
  const reactHandlers = {
    onTouchStart: (e: React.TouchEvent) => handlers.onTouchStart(e.nativeEvent),
    onTouchMove: (e: React.TouchEvent) => handlers.onTouchMove(e.nativeEvent),
    onTouchEnd: () => handlers.onTouchEnd()
  };

  // Color scheme with accessibility support
  const colorScheme = {
    vectors: [
      { primary: preferences.highContrast ? '#000080' : '#3B82F6', secondary: '#93C5FD' },
      { primary: preferences.highContrast ? '#800000' : '#EF4444', secondary: '#FCA5A5' },
      { primary: preferences.highContrast ? '#008000' : '#10B981', secondary: '#6EE7B7' },
      { primary: preferences.highContrast ? '#800080' : '#8B5CF6', secondary: '#C4B5FD' },
      { primary: preferences.highContrast ? '#808000' : '#F59E0B', secondary: '#FCD34D' }
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
      {...(isTouch ? reactHandlers : {})}
    >
      {/* Header with Adaptive Rendering Info */}
      <div className={`absolute top-0 left-0 right-0 bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-200/50 z-10 ${
        viewport.isMobile ? 'p-2' : 'p-4'
      }`}>
        <h3 className={`font-bold text-gray-800 mb-1 ${
          viewport.isMobile ? 'text-base' : 'text-lg'
        }`}>
          3D Vector Subspace Visualization
        </h3>
        <p className={`text-gray-600 ${
          viewport.isMobile ? 'text-xs' : 'text-sm'
        }`}>
          Explore spans and linear independence of vectors in 3D space
        </p>
      </div>

      {/* Responsive Camera Controls */}
      <ResponsiveCameraControls
        onAutoFrame={autoFrame}
        onFocusVector={handleFocusVector}
        onResetView={resetView}
        vectors={vectors3D}
        selectedIndices={subspaceSettings.showSpan}
      />

      {/* Accessibility Settings Panel */}
      <AccessibilitySettings />
      
      <Canvas
        camera={{
          position: [8, 6, 8],
          fov: viewport.isMobile ? 60 : 50,
          near: 0.1,
          far: 1000
        }}
        shadows
        style={{ 
          marginTop: viewport.isMobile ? '120px' : '80px', 
          height: height - (viewport.isMobile ? 120 : 80) 
        }}
        performance={{ min: 0.5 }} // Maintain 30fps minimum
        gl={{ 
          antialias: !viewport.isMobile, // Disable on mobile for performance
          alpha: false,
          powerPreference: "high-performance"
        }}
        dpr={viewport.isMobile ? [1, 1.5] : [1, 2]} // Adaptive pixel ratio for performance
      >
        {/* Lighting with reduced intensity on mobile */}
        <ambientLight intensity={viewport.isMobile ? 0.3 : 0.4} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={viewport.isMobile ? 0.6 : 0.8}
          castShadow
          shadow-mapSize-width={viewport.isMobile ? 512 : 1024}
          shadow-mapSize-height={viewport.isMobile ? 512 : 1024}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />

        {/* Content-Aware Grid System */}
        <ReactiveGridPlanes
          vectors={vectors3D}
          showXY={true}
          showXZ={true}
          showYZ={true}
          opacity={0.8}
          adaptiveMode="hybrid"
          showMultiLevel={true}
        />

        {/* Simplified Axes for mobile */}
        {settings.showAxes && (
          <>
            {/* X axis (red) */}
            <group>
              <mesh position={[2.5, 0, 0]} rotation={[0, 0, Math.PI/2]}>
                <cylinderGeometry args={[0.02, 0.02, 5, viewport.isMobile ? 4 : 8]} />
                <meshPhongMaterial color="#ff4444" />
              </mesh>
              <mesh position={[5, 0, 0]} rotation={[0, 0, Math.PI/2]}>
                <coneGeometry args={[0.06, 0.2, viewport.isMobile ? 4 : 8]} />
                <meshPhongMaterial color="#ff4444" />
              </mesh>
              <Text position={[5.5, 0, 0]} fontSize={viewport.isMobile ? 0.2 : 0.3} color="#ff4444">X</Text>
            </group>
            
            {/* Y axis (green) */}
            <group>
              <mesh position={[0, 2.5, 0]}>
                <cylinderGeometry args={[0.02, 0.02, 5, viewport.isMobile ? 4 : 8]} />
                <meshPhongMaterial color="#44ff44" />
              </mesh>
              <mesh position={[0, 5, 0]}>
                <coneGeometry args={[0.06, 0.2, viewport.isMobile ? 4 : 8]} />
                <meshPhongMaterial color="#44ff44" />
              </mesh>
              <Text position={[0, 5.5, 0]} fontSize={viewport.isMobile ? 0.2 : 0.3} color="#44ff44">Y</Text>
            </group>
            
            {/* Z axis (blue) */}
            <group>
              <mesh position={[0, 0, 2.5]} rotation={[Math.PI/2, 0, 0]}>
                <cylinderGeometry args={[0.02, 0.02, 5, viewport.isMobile ? 4 : 8]} />
                <meshPhongMaterial color="#4444ff" />
              </mesh>
              <mesh position={[0, 0, 5]} rotation={[Math.PI/2, 0, 0]}>
                <coneGeometry args={[0.06, 0.2, viewport.isMobile ? 4 : 8]} />
                <meshPhongMaterial color="#4444ff" />
              </mesh>
              <Text position={[0, 0, 5.5]} fontSize={viewport.isMobile ? 0.2 : 0.3} color="#4444ff">Z</Text>
            </group>
          </>
        )}
        
        {/* OPTIMIZED: Fast Animated Span Visualization with reduced complexity on mobile */}
        <FastAnimatedSpanVisualization
          vectors={vectors3D}
          selectedIndices={subspaceSettings.showSpan}
          colorScheme={colorScheme}
        />
        
        {/* Adaptive Vectors with LOD */}
        {vectors3D.map((vector, i) => (
          <AdaptiveVectorArrow
            key={i}
            vector={vector}
            color={colorScheme.vectors[i % colorScheme.vectors.length].primary}
            label={`v${i + 1}`}
            baseThickness={viewport.isMobile ? 0.02 : 0.025}
            isActive={false}
            showSpan={subspaceSettings.showSpan[i]}
            index={i}
            totalVectors={vectors3D.length}
          />
        ))}
        
        {/* Camera Controller */}
        <CameraController
          vectors={vectors3D}
          autoFrame={true}
          enableAutoRotate={false}
        />
      </Canvas>
      
      {/* Responsive Legend with Vector Magnitude Indicators */}
      <ResponsiveLegend 
        vectors={vectors3D}
        selectedIndices={subspaceSettings.showSpan}
        isIndependent={isIndependent}
        onToggleSpan={toggleSpan}
        colorScheme={colorScheme}
      />

      {/* Vector Magnitude Indicators */}
      <div className={`absolute bottom-4 left-4 ${
        viewport.isMobile ? 'bottom-2 left-2' : 'bottom-4 left-4'
      }`}>
        <VectorMagnitudeIndicator
          vectors={vectors3D}
          colorScheme={colorScheme}
          compact={viewport.isMobile}
        />
      </div>
    </div>
  );
};

export default SubspaceCanvas3D;
