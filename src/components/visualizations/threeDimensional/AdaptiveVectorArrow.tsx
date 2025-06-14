import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { Vector3, Quaternion, Group, Color } from 'three';
import * as THREE from 'three';

interface AdaptiveVectorArrowProps {
  vector: { x: number; y: number; z: number };
  color: string;
  label?: string;
  baseThickness?: number;
  isActive?: boolean;
  showSpan?: boolean;
  index?: number;
  totalVectors?: number;
}

// Utility functions for adaptive rendering
const calculateCameraDistance = (camera: THREE.Camera, position: Vector3): number => {
  return camera.position.distanceTo(position);
};

const getLODSegments = (distance: number, baseSegments: number = 12): number => {
  if (distance < 5) return Math.max(baseSegments, 16); // High detail when close
  if (distance < 15) return baseSegments; // Medium detail
  if (distance < 30) return Math.max(Math.floor(baseSegments * 0.75), 8); // Reduced detail
  return Math.max(Math.floor(baseSegments * 0.5), 6); // Low detail when far
};

const calculateAdaptiveThickness = (
  baseThickness: number,
  vectorMagnitude: number,
  cameraDistance: number,
  isActive: boolean,
  showSpan: boolean
): number => {
  // Base thickness scaling
  let adaptiveThickness = baseThickness;
  
  // Scale with vector magnitude (larger vectors get thicker)
  const magnitudeScale = Math.min(1 + Math.log10(Math.max(vectorMagnitude, 0.1)) * 0.3, 2.5);
  adaptiveThickness *= magnitudeScale;
  
  // Scale with camera distance (maintain visual thickness)
  const distanceScale = Math.max(0.5, Math.min(cameraDistance / 10, 3));
  adaptiveThickness *= distanceScale;
  
  // Active and span state multipliers
  if (isActive) adaptiveThickness *= 1.5;
  if (showSpan) adaptiveThickness *= 1.2;
  
  return Math.max(adaptiveThickness, 0.005); // Minimum thickness threshold
};

const calculateMagnitudeIntensity = (magnitude: number, maxMagnitude: number): number => {
  const normalizedMagnitude = magnitude / Math.max(maxMagnitude, 1);
  return 0.3 + normalizedMagnitude * 0.7; // Range from 0.3 to 1.0
};

const calculateLabelOffset = (
  direction: Vector3,
  magnitude: number,
  cameraDistance: number,
  vectorIndex: number,
  totalVectors: number
): Vector3 => {
  // Base offset along direction
  const baseOffset = Math.max(0.4, magnitude * 0.1);
  
  // Add slight angular offset to avoid overlaps
  const angleOffset = (vectorIndex / Math.max(totalVectors - 1, 1)) * Math.PI * 0.3;
  const offsetDirection = direction.clone();
  
  // Rotate offset direction slightly for each vector
  const perpendicular = new Vector3(0, 1, 0).cross(direction).normalize();
  if (perpendicular.length() < 0.1) {
    perpendicular.set(1, 0, 0).cross(direction).normalize();
  }
  
  const rotatedOffset = offsetDirection
    .clone()
    .multiplyScalar(baseOffset)
    .add(perpendicular.clone().multiplyScalar(Math.sin(angleOffset) * 0.3));
  
  // Scale offset with camera distance
  const distanceScale = Math.max(0.8, Math.min(cameraDistance / 15, 2));
  
  return rotatedOffset.multiplyScalar(distanceScale);
};

export const AdaptiveVectorArrow: React.FC<AdaptiveVectorArrowProps> = ({
  vector,
  color,
  label,
  baseThickness = 0.02,
  isActive = false,
  showSpan = false,
  index = 0,
  totalVectors = 1
}) => {
  const meshRef = useRef<Group>(null);
  const { camera } = useThree();
  
  // Calculate vector properties
  const start = new Vector3(0, 0, 0);
  const end = new Vector3(vector.x, vector.y, vector.z);
  const direction = end.clone().sub(start).normalize();
  const magnitude = end.length();
  
  // Calculate orientation quaternion
  const quaternion = useMemo(() => {
    const quat = new Quaternion();
    const axis = new Vector3();
    
    if (direction.y > 0.99999) {
      quat.set(0, 0, 0, 1);
    } else if (direction.y < -0.99999) {
      quat.setFromAxisAngle(new Vector3(1, 0, 0), Math.PI);
    } else {
      axis.set(direction.z, 0, -direction.x).normalize();
      const radians = Math.acos(direction.y);
      quat.setFromAxisAngle(axis, radians);
    }
    
    return quat;
  }, [direction]);
  
  // Dynamic properties updated each frame
  const [adaptiveProps, setAdaptiveProps] = React.useState({
    thickness: baseThickness,
    segments: 12,
    opacity: 0.8,
    labelOffset: new Vector3(0.4, 0, 0),
    labelScale: 1,
    intensityScale: 1
  });
  
  useFrame((state) => {
    if (!meshRef.current) return;
    
    // Calculate camera distance to vector endpoint
    const cameraDistance = calculateCameraDistance(camera, end);
    
    // Update adaptive properties
    const thickness = calculateAdaptiveThickness(
      baseThickness,
      magnitude,
      cameraDistance,
      isActive,
      showSpan
    );
    
    const segments = getLODSegments(cameraDistance);
    
    const intensityScale = calculateMagnitudeIntensity(magnitude, 10); // Assume max magnitude of 10
    
    const labelOffset = calculateLabelOffset(
      direction,
      magnitude,
      cameraDistance,
      index,
      totalVectors
    );
    
    const labelScale = Math.max(0.6, Math.min(cameraDistance / 8, 1.5));
    
    setAdaptiveProps({
      thickness,
      segments,
      opacity: showSpan ? 0.9 : 0.8,
      labelOffset,
      labelScale,
      intensityScale
    });
    
    // Active vector animation
    if (isActive) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });
  
  // Generate enhanced color based on magnitude
  const enhancedColor = useMemo(() => {
    const baseColor = new Color(color);
    const intensity = adaptiveProps.intensityScale;
    
    // Increase saturation and brightness for higher magnitude vectors
    const hsl = { h: 0, s: 0, l: 0 };
    baseColor.getHSL(hsl);
    
    return new Color().setHSL(
      hsl.h,
      Math.min(hsl.s + intensity * 0.3, 1),
      Math.min(hsl.l + intensity * 0.2, 0.9)
    );
  }, [color, adaptiveProps.intensityScale]);
  
  return (
    <group ref={meshRef}>
      {/* Adaptive arrow shaft */}
      <mesh
        position={end.clone().multiplyScalar(0.5)}
        quaternion={quaternion}
      >
        <cylinderGeometry 
          args={[
            adaptiveProps.thickness, 
            adaptiveProps.thickness, 
            magnitude, 
            adaptiveProps.segments
          ]} 
        />
        <meshPhongMaterial 
          color={enhancedColor}
          shininess={100}
          transparent
          opacity={adaptiveProps.opacity}
          emissive={isActive ? enhancedColor : '#000000'}
          emissiveIntensity={isActive ? 0.2 * adaptiveProps.intensityScale : 0}
        />
      </mesh>
      
      {/* Adaptive arrow head with proportional sizing */}
      <mesh 
        position={end}
        quaternion={quaternion}
      >
        <coneGeometry 
          args={[
            adaptiveProps.thickness * 3, 
            Math.min(adaptiveProps.thickness * 10, magnitude * 0.3), // Proportional to vector length
            adaptiveProps.segments
          ]} 
        />
        <meshPhongMaterial 
          color={enhancedColor}
          shininess={100}
          transparent
          opacity={adaptiveProps.opacity}
          emissive={isActive ? enhancedColor : '#000000'}
          emissiveIntensity={isActive ? 0.3 * adaptiveProps.intensityScale : 0}
        />
      </mesh>
      
      {/* Magnitude-based outline for high-magnitude vectors */}
      {magnitude > 3 && (
        <mesh
          position={end.clone().multiplyScalar(0.5)}
          quaternion={quaternion}
        >
          <cylinderGeometry 
            args={[
              adaptiveProps.thickness * 1.1, 
              adaptiveProps.thickness * 1.1, 
              magnitude, 
              Math.max(adaptiveProps.segments - 2, 6)
            ]} 
          />
          <meshBasicMaterial 
            color="#ffffff"
            transparent
            opacity={0.3 * adaptiveProps.intensityScale}
            side={THREE.BackSide}
          />
        </mesh>
      )}
      
      {/* Smart positioned label */}
      {label && (
        <Text
          position={end.clone().add(adaptiveProps.labelOffset)}
          fontSize={0.15 * adaptiveProps.labelScale}
          color={enhancedColor}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#ffffff"
          font="/fonts/Inter-Regular.woff" // Fallback to system font if not available
        >
          {label}
          {magnitude > 5 && (
            <meshBasicMaterial 
              attach="material"
              color={enhancedColor}
              transparent
              opacity={Math.min(adaptiveProps.intensityScale, 0.9)}
            />
          )}
        </Text>
      )}
      
      {/* Magnitude indicator for very large vectors */}
      {magnitude > 7 && (
        <Text
          position={end.clone().add(adaptiveProps.labelOffset).add(new Vector3(0, -0.3 * adaptiveProps.labelScale, 0))}
          fontSize={0.1 * adaptiveProps.labelScale}
          color={enhancedColor}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#ffffff"
        >
          |{magnitude.toFixed(1)}|
        </Text>
      )}
    </group>
  );
};

export default AdaptiveVectorArrow;
