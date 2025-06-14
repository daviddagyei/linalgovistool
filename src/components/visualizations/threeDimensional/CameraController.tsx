import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Vector3, Box3, Sphere } from 'three';
import { Vector3D } from '../../../types';

interface CameraControllerProps {
  vectors: Vector3D[];
  autoFrame?: boolean;
  onAutoFrame?: () => void;
  enableAutoRotate?: boolean;
}

interface SceneBounds {
  boundingBox: Box3;
  boundingSphere: Sphere;
  maxMagnitude: number;
  center: Vector3;
}

/**
 * Camera Controller for 3D Vector Visualization
 * 
 * Features:
 * - Auto-framing based on vector magnitudes
 * - Adaptive zoom limits
 * - Automatic initial positioning
 * - Smooth transitions
 * - Bounding sphere calculations
 */
export const CameraController: React.FC<CameraControllerProps> = ({
  vectors,
  autoFrame = true,
  onAutoFrame,
  enableAutoRotate = false
}) => {
  const { camera, size } = useThree();
  const controlsRef = useRef<any>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [userHasInteracted, setUserHasInteracted] = useState(false);

  // Calculate scene bounds from vectors
  const sceneBounds = useMemo((): SceneBounds => {
    if (vectors.length === 0) {
      return {
        boundingBox: new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1)),
        boundingSphere: new Sphere(new Vector3(0, 0, 0), 2),
        maxMagnitude: 1,
        center: new Vector3(0, 0, 0)
      };
    }

    const box = new Box3();
    const points: Vector3[] = [];
    let maxMagnitude = 0;

    // Add origin
    points.push(new Vector3(0, 0, 0));

    // Add all vector endpoints
    vectors.forEach(vector => {
      const point = new Vector3(vector.x, vector.y, vector.z);
      points.push(point);
      maxMagnitude = Math.max(maxMagnitude, point.length());
    });

    // Calculate bounding box
    box.setFromPoints(points);

    // Ensure minimum size
    const size = box.getSize(new Vector3());
    const minSize = Math.max(maxMagnitude * 0.1, 0.5);
    if (size.length() < minSize) {
      box.expandByScalar(minSize / 2);
    }

    // Calculate bounding sphere
    const center = box.getCenter(new Vector3());
    const sphere = new Sphere();
    box.getBoundingSphere(sphere);

    // Ensure minimum radius for very small or zero vectors
    if (sphere.radius < 1) {
      sphere.radius = Math.max(maxMagnitude * 1.2, 2);
    } else {
      // Add some padding
      sphere.radius *= 1.3;
    }

    return {
      boundingBox: box,
      boundingSphere: sphere,
      maxMagnitude: Math.max(maxMagnitude, 1),
      center
    };
  }, [vectors]);

  // Calculate optimal camera position and distance
  const getCameraConfig = useCallback((bounds: SceneBounds) => {
    const { boundingSphere, center, maxMagnitude } = bounds;
    
    // Calculate optimal distance based on field of view and bounding sphere
    // Default FOV for perspective camera is typically 50-75 degrees
    const fov = (camera as any).fov || 50;
    const fovRadians = fov * (Math.PI / 180); // Convert to radians
    
    // Distance to fit the bounding sphere in view with some padding
    const distance = (boundingSphere.radius * 2.2) / Math.tan(fovRadians / 2);
    
    // Ensure reasonable bounds
    const minDistance = Math.max(maxMagnitude * 0.01, 0.01);
    const maxDistance = Math.max(distance * 20, maxMagnitude * 50, 100);
    const optimalDistance = Math.max(distance, maxMagnitude * 1.5, 3);

    // Position camera at an angle that shows all axes
    const phi = Math.PI / 6; // 30 degrees from horizontal
    const theta = Math.PI / 4; // 45 degrees azimuth
    
    const position = new Vector3(
      center.x + optimalDistance * Math.sin(phi) * Math.cos(theta),
      center.y + optimalDistance * Math.cos(phi),
      center.z + optimalDistance * Math.sin(phi) * Math.sin(theta)
    );

    return {
      position,
      target: center,
      distance: optimalDistance,
      minDistance,
      maxDistance
    };
  }, [camera, size]);

  // Auto-frame function with smooth animation
  const autoFrameCamera = useCallback(async (immediate = false) => {
    if (!controlsRef.current || isTransitioning) return;

    setIsTransitioning(true);
    const config = getCameraConfig(sceneBounds);
    const controls = controlsRef.current;

    if (immediate) {
      // Immediate positioning (for initial load)
      camera.position.copy(config.position);
      controls.target.copy(config.target);
      controls.minDistance = config.minDistance;
      controls.maxDistance = config.maxDistance;
      controls.update();
    } else {
      // Smooth transition
      const startPosition = camera.position.clone();
      const startTarget = controls.target.clone();
      const duration = 1000; // 1 second
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Use easing function for smooth transition
        const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease-out cubic

        // Interpolate position and target
        camera.position.lerpVectors(startPosition, config.position, easeProgress);
        controls.target.lerpVectors(startTarget, config.target, easeProgress);
        
        // Update distance limits
        controls.minDistance = config.minDistance;
        controls.maxDistance = config.maxDistance;
        
        controls.update();

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setIsTransitioning(false);
          onAutoFrame?.();
        }
      };

      animate();
    }
  }, [camera, sceneBounds, getCameraConfig, isTransitioning, onAutoFrame]);

  // Auto-frame on vectors change (but only if user hasn't interacted)
  useEffect(() => {
    if (autoFrame && !userHasInteracted && vectors.length > 0) {
      // Use immediate positioning for initial load
      autoFrameCamera(true);
    }
  }, [vectors, autoFrame, userHasInteracted, autoFrameCamera]);

  // Handle user interaction
  const handleControlChange = useCallback(() => {
    setUserHasInteracted(true);
  }, []);

  // Expose auto-frame function to parent
  useEffect(() => {
    if (controlsRef.current) {
      // Add autoFrame method to controls for external access
      controlsRef.current.autoFrame = () => {
        setUserHasInteracted(false);
        autoFrameCamera(false);
      };
    }
  }, [autoFrameCamera]);

  // Calculate adaptive limits based on current scene
  const { minDistance, maxDistance } = useMemo(() => {
    const config = getCameraConfig(sceneBounds);
    return {
      minDistance: config.minDistance,
      maxDistance: config.maxDistance
    };
  }, [sceneBounds, getCameraConfig]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={minDistance}
      maxDistance={maxDistance}
      autoRotate={enableAutoRotate && !userHasInteracted}
      autoRotateSpeed={0.5}
      enableDamping={true}
      dampingFactor={0.05}
      onChange={handleControlChange}
      onStart={handleControlChange}
    />
  );
};

/**
 * Hook to provide camera control functions to parent components
 */
export const useCameraControls = () => {
  const { camera } = useThree();
  const [controlsRef, setControlsRef] = useState<any>(null);

  const focusOnVector = useCallback((vector: Vector3D, distance?: number) => {
    if (!controlsRef || !camera) return;

    const targetPosition = new Vector3(vector.x, vector.y, vector.z);
    const optimalDistance = distance || Math.max(targetPosition.length() * 2, 3);
    
    // Calculate camera position to look at the vector from a good angle
    const direction = targetPosition.clone().normalize();
    const perpendicular = new Vector3(1, 0, 0).cross(direction);
    if (perpendicular.length() < 0.1) {
      perpendicular.set(0, 1, 0).cross(direction);
    }
    perpendicular.normalize();
    
    const cameraPosition = targetPosition.clone()
      .add(direction.multiplyScalar(-optimalDistance * 0.5))
      .add(perpendicular.multiplyScalar(optimalDistance * 0.3));

    // Smooth transition to new position
    const startPosition = camera.position.clone();
    const startTarget = controlsRef.target.clone();
    const duration = 800;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      camera.position.lerpVectors(startPosition, cameraPosition, easeProgress);
      controlsRef.target.lerpVectors(startTarget, targetPosition, easeProgress);
      controlsRef.update();

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }, [controlsRef, camera]);

  const autoFrame = useCallback(() => {
    if (controlsRef?.autoFrame) {
      controlsRef.autoFrame();
    }
  }, [controlsRef]);

  const resetView = useCallback(() => {
    if (controlsRef && camera) {
      // Reset to default isometric view
      const defaultPosition = new Vector3(8, 6, 8);
      const defaultTarget = new Vector3(0, 0, 0);
      
      const startPosition = camera.position.clone();
      const startTarget = controlsRef.target.clone();
      const duration = 600;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        camera.position.lerpVectors(startPosition, defaultPosition, easeProgress);
        controlsRef.target.lerpVectors(startTarget, defaultTarget, easeProgress);
        controlsRef.update();

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      animate();
    }
  }, [controlsRef, camera]);

  return {
    setControlsRef,
    focusOnVector,
    autoFrame,
    resetView
  };
};

export default CameraController;
