import React, { useState } from 'react';
import { useResponsiveViewport, useAccessibility, getResponsiveSpacing, getResponsiveFontSizes } from '../../hooks/useResponsiveUI';

interface Vector3D {
  x: number;
  y: number;
  z: number;
}

interface ResponsiveCameraControlsProps {
  onAutoFrame: () => void;
  onFocusVector: (index: number) => void;
  onResetView: () => void;
  vectors: Vector3D[];
  selectedIndices: boolean[];
  className?: string;
}

export const ResponsiveCameraControls: React.FC<ResponsiveCameraControlsProps> = ({
  onAutoFrame,
  onFocusVector,
  onResetView,
  vectors,
  selectedIndices,
  className = ''
}) => {
  const viewport = useResponsiveViewport();
  const { preferences } = useAccessibility();
  const spacing = getResponsiveSpacing(viewport);
  const fonts = getResponsiveFontSizes(viewport);
  
  const [isExpanded, setIsExpanded] = useState(!viewport.isMobile);

  // Calculate position based on viewport
  const getPosition = () => {
    if (viewport.isMobile) {
      return {
        position: 'fixed' as const,
        bottom: spacing.padding,
        left: spacing.padding,
        right: spacing.padding,
        zIndex: 30
      };
    } else {
      return {
        position: 'absolute' as const,
        top: 80 + spacing.padding,
        right: spacing.padding,
        zIndex: 20
      };
    }
  };

  const positionStyles = getPosition();

  // High contrast mode adjustments
  const containerClasses = preferences.highContrast 
    ? 'bg-black text-white border-white' 
    : 'bg-white/95 text-gray-800 border-gray-200/50';

  const buttonClasses = preferences.highContrast
    ? 'bg-white text-black hover:bg-gray-200'
    : 'bg-blue-500 text-white hover:bg-blue-600';

  const secondaryButtonClasses = preferences.highContrast
    ? 'bg-gray-200 text-black hover:bg-gray-300'
    : 'bg-gray-500 text-white hover:bg-gray-600';

  return (
    <div
      className={`backdrop-blur-sm rounded-lg border shadow-lg ${containerClasses} ${className}`}
      style={{
        ...positionStyles,
        maxWidth: viewport.isMobile ? 'none' : '280px'
      }}
      role="toolbar"
      aria-label="Camera Controls"
    >
      {/* Header - always visible */}
      <div
        className={`flex items-center justify-between border-b ${preferences.highContrast ? 'border-white' : 'border-gray-200/50'}`}
        style={{ padding: spacing.padding }}
      >
        <h4 className="font-semibold" style={{ fontSize: `${fonts.sm}px` }}>
          {viewport.isMobile ? '📹 Camera' : 'Camera Controls'}
        </h4>
        
        {!viewport.isMobile && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-1 rounded transition-colors ${preferences.highContrast ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
            aria-label={isExpanded ? 'Collapse camera controls' : 'Expand camera controls'}
            style={{ fontSize: `${fonts.xs}px` }}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        )}
      </div>

      {/* Essential controls - always visible */}
      <div style={{ padding: spacing.padding }}>
        <div className={`${viewport.isMobile ? 'flex space-x-2' : 'space-y-2'}`}>
          <button
            onClick={onAutoFrame}
            className={`transition-colors font-medium rounded-md ${buttonClasses} ${
              viewport.isMobile ? 'flex-1 py-2 px-3' : 'w-full px-3 py-2'
            }`}
            style={{ fontSize: `${fonts.sm}px` }}
            title="Automatically frame all vectors in view"
          >
            📐 {viewport.isMobile ? 'Frame' : 'Auto-Frame All'}
          </button>
          
          <button
            onClick={onResetView}
            className={`transition-colors font-medium rounded-md ${secondaryButtonClasses} ${
              viewport.isMobile ? 'flex-1 py-2 px-3' : 'w-full px-3 py-2'
            }`}
            style={{ fontSize: `${fonts.sm}px` }}
            title="Reset to default isometric view"
          >
            🔄 {viewport.isMobile ? 'Reset' : 'Reset View'}
          </button>
        </div>

        {/* Mobile gesture hints */}
        {viewport.isMobile && (
          <div className="mt-3 pt-3 border-t border-gray-200/50">
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <span>👆</span>
                <span>Drag to rotate</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>🤏</span>
                <span>Pinch to zoom</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Expandable vector focus controls - desktop only */}
      {!viewport.isMobile && isExpanded && vectors.length > 0 && (
        <div className={`border-t ${preferences.highContrast ? 'border-white' : 'border-gray-200/50'}`} style={{ padding: spacing.padding }}>
          <h5 className="font-semibold mb-2" style={{ fontSize: `${fonts.xs}px` }}>
            Focus on Vector:
          </h5>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {vectors.map((vector, index) => (
              <button
                key={index}
                onClick={() => onFocusVector(index)}
                className={`w-full px-2 py-1 text-left rounded transition-colors ${
                  selectedIndices[index]
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : `${preferences.highContrast ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`
                }`}
                style={{ fontSize: `${fonts.xs}px` }}
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
      {!viewport.isMobile && (
        <div className={`px-3 py-2 border-t ${preferences.highContrast ? 'border-white' : 'border-gray-200/50'} bg-gray-50/50`}>
          <p style={{ fontSize: `${fonts.xs}px` }} className="text-gray-500">
            🎯 Intelligent camera with adaptive zoom limits
          </p>
        </div>
      )}
    </div>
  );
};

export default ResponsiveCameraControls;
