import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useResponsiveViewport, useAccessibility, getResponsiveSpacing, getResponsiveFontSizes } from '../../hooks/useResponsiveUI';

interface Vector3D {
  x: number;
  y: number;
  z: number;
}

interface VectorMagnitudeIndicatorProps {
  vectors: Vector3D[];
  colorScheme: any;
  compact?: boolean;
}

// Component to show vector magnitude indicators
export const VectorMagnitudeIndicator: React.FC<VectorMagnitudeIndicatorProps> = ({
  vectors,
  colorScheme,
  compact = false
}) => {
  const calculateMagnitude = (vector: Vector3D) => 
    Math.sqrt(vector.x ** 2 + vector.y ** 2 + vector.z ** 2);

  const magnitudes = vectors.map(calculateMagnitude);
  const maxMagnitude = Math.max(...magnitudes);
  const minMagnitude = Math.min(...magnitudes);
  const range = maxMagnitude - minMagnitude;

  const getMagnitudeCategory = (magnitude: number) => {
    if (range < 0.01) return 'equal'; // All vectors roughly same size
    const normalized = (magnitude - minMagnitude) / range;
    if (normalized < 0.33) return 'small';
    if (normalized < 0.67) return 'medium';
    return 'large';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'small': return '🔸';
      case 'medium': return '🔶';
      case 'large': return '🔷';
      default: return '🔹';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'small': return 'text-blue-500';
      case 'medium': return 'text-yellow-500';
      case 'large': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  if (compact) {
    return (
      <div className="flex space-x-1">
        {vectors.map((_, index) => {
          const magnitude = magnitudes[index];
          const category = getMagnitudeCategory(magnitude);
          return (
            <div
              key={index}
              className={`text-xs ${getCategoryColor(category)}`}
              title={`v${index + 1}: |${magnitude.toFixed(2)}|`}
            >
              {getCategoryIcon(category)}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h6 className="text-xs font-semibold text-gray-600">Vector Magnitudes</h6>
      {vectors.map((_, index) => {
        const magnitude = magnitudes[index];
        const category = getMagnitudeCategory(magnitude);
        const percentage = range > 0 ? ((magnitude - minMagnitude) / range) * 100 : 50;
        
        return (
          <div key={index} className="flex items-center space-x-2 text-xs">
            <span className="w-6 text-center font-mono">v{index + 1}</span>
            <div className="flex-1 bg-gray-200 rounded-full h-2 relative">
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: colorScheme.vectors[index % colorScheme.vectors.length].primary
                }}
              />
            </div>
            <span className={`${getCategoryColor(category)} font-mono`}>
              {magnitude.toFixed(1)}
            </span>
            <span className="text-gray-400">{getCategoryIcon(category)}</span>
          </div>
        );
      })}
    </div>
  );
};

interface ResponsiveLegendProps {
  vectors: Vector3D[];
  selectedIndices: boolean[];
  isIndependent: boolean;
  onToggleSpan: (index: number) => void;
  colorScheme: any;
  className?: string;
}

export const ResponsiveLegend: React.FC<ResponsiveLegendProps> = ({
  vectors,
  selectedIndices,
  isIndependent,
  onToggleSpan,
  colorScheme,
  className = ''
}) => {
  const viewport = useResponsiveViewport();
  const { preferences } = useAccessibility();
  const spacing = getResponsiveSpacing(viewport);
  const fonts = getResponsiveFontSizes(viewport);
  
  const [position, setPosition] = useState({
    x: viewport.isMobile ? 16 : Math.max(16, viewport.width - 320),
    y: viewport.isMobile ? viewport.height - 300 : 16
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(viewport.isMobile);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const legendRef = useRef<HTMLDivElement>(null);

  // Auto-position based on viewport
  useEffect(() => {
    if (!isDragging) {
      if (viewport.isMobile) {
        setPosition({
          x: spacing.padding,
          y: viewport.height - (isCollapsed ? 60 : 300)
        });
      } else {
        setPosition(prev => ({
          x: Math.max(spacing.padding, viewport.width - 340),
          y: Math.max(spacing.padding, Math.min(prev.y, viewport.height - 400))
        }));
      }
    }
  }, [viewport, spacing, isDragging, isCollapsed]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!preferences.keyboardNavigation) return;
      
      if (e.key === 'Tab' && e.target === legendRef.current) {
        e.preventDefault();
        setIsCollapsed(!isCollapsed);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [preferences.keyboardNavigation, isCollapsed]);

  const handleInteractionStart = (clientX: number, clientY: number) => {
    if (viewport.isMobile && !isCollapsed) return; // Prevent dragging on mobile when expanded
    
    setIsDragging(true);
    setDragOffset({
      x: clientX - position.x,
      y: clientY - position.y,
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    handleInteractionStart(e.clientX, e.clientY);
    e.preventDefault();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleInteractionStart(touch.clientX, touch.clientY);
    e.preventDefault();
  };

  const handleInteractionMove = (clientX: number, clientY: number) => {
    if (isDragging) {
      const newX = Math.max(0, Math.min(viewport.width - 300, clientX - dragOffset.x));
      const newY = Math.max(0, Math.min(viewport.height - 100, clientY - dragOffset.y));
      
      setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    handleInteractionMove(e.clientX, e.clientY);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      handleInteractionMove(touch.clientX, touch.clientY);
      e.preventDefault();
    }
  };

  const handleInteractionEnd = () => setIsDragging(false);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleInteractionEnd);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleInteractionEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleInteractionEnd);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleInteractionEnd);
      };
    }
  }, [isDragging, dragOffset]);

  const selectedCount = selectedIndices.filter(Boolean).length;

  // Responsive width calculation
  const legendWidth = viewport.isMobile ? Math.min(viewport.width - 32, 300) : 320;
  
  // High contrast mode adjustments
  const contrastClasses = preferences.highContrast 
    ? 'bg-black text-white border-white' 
    : 'bg-white/95 text-gray-800 border-gray-200/50';

  const buttonClasses = preferences.highContrast
    ? 'bg-white text-black hover:bg-gray-200'
    : 'bg-blue-500 text-white hover:bg-blue-600';

  return ReactDOM.createPortal(
    <div
      ref={legendRef}
      className={`fixed ${contrastClasses} backdrop-blur-sm rounded-xl border shadow-xl select-none z-50 touch-none transition-all duration-300 ${className}`}
      style={{
        left: position.x,
        top: position.y,
        width: legendWidth,
        transform: isDragging ? 'scale(1.02)' : 'scale(1)',
        transition: isDragging ? 'none' : 'transform 0.2s ease',
        fontSize: `${fonts.sm}px`
      }}
      role="dialog"
      aria-label="Vector Legend"
      tabIndex={0}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between cursor-move border-b ${preferences.highContrast ? 'border-white' : 'border-gray-200/50'}`}
        style={{ padding: spacing.padding }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <h4 className="font-bold" style={{ fontSize: `${fonts.lg}px` }}>
          {viewport.isMobile ? '3D Vectors' : '3D Subspace Visualization'}
        </h4>
        
        <div className="flex items-center space-x-2">
          {/* Magnitude indicators in header for mobile */}
          {viewport.isMobile && (
            <VectorMagnitudeIndicator 
              vectors={vectors} 
              colorScheme={colorScheme} 
              compact 
            />
          )}
          
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-1 rounded transition-colors ${buttonClasses}`}
            aria-label={isCollapsed ? 'Expand legend' : 'Collapse legend'}
            style={{ fontSize: `${fonts.xs}px` }}
          >
            {isCollapsed ? '⬆' : '⬇'}
          </button>
        </div>
      </div>

      {/* Collapsible content */}
      {!isCollapsed && (
        <div style={{ padding: spacing.padding }}>
          {/* Vector Controls */}
          <div className="space-y-2 mb-4">
            {vectors.map((vector, index) => (
              <div 
                key={index} 
                className={`flex items-center rounded-lg transition-colors ${
                  preferences.highContrast 
                    ? 'bg-gray-800 hover:bg-gray-700' 
                    : 'bg-gray-50/80 hover:bg-gray-100/80'
                }`}
                style={{ padding: spacing.padding / 2 }}
              >
                <button
                  onClick={() => onToggleSpan(index)}
                  className={`rounded-full flex-shrink-0 mr-3 transition-all duration-200 ${
                    selectedIndices[index]
                      ? 'text-white scale-110'
                      : `${preferences.highContrast ? 'bg-white text-black' : 'bg-gray-300 text-gray-600'} hover:bg-gray-400`
                  }`}
                  style={{
                    width: viewport.isMobile ? 32 : 32,
                    height: viewport.isMobile ? 32 : 32,
                    backgroundColor: selectedIndices[index] 
                      ? colorScheme.vectors[index % colorScheme.vectors.length].primary 
                      : undefined,
                    fontSize: `${fonts.sm}px`
                  }}
                  aria-label={`Toggle vector ${index + 1} ${selectedIndices[index] ? 'off' : 'on'}`}
                >
                  {selectedIndices[index] ? '✓' : '+'}
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center">
                    <span className="font-semibold" style={{ fontSize: `${fonts.sm}px` }}>
                      v{index + 1}
                    </span>
                    {!viewport.isMobile && (
                      <span className="text-gray-500 ml-2 font-mono truncate" style={{ fontSize: `${fonts.xs}px` }}>
                        ({vector.x.toFixed(2)}, {vector.y.toFixed(2)}, {vector.z.toFixed(2)})
                      </span>
                    )}
                  </div>
                  {selectedIndices[index] && (
                    <span className="text-blue-600 font-medium" style={{ fontSize: `${fonts.xs}px` }}>
                      Spanning subspace
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Magnitude indicators for desktop */}
          {!viewport.isMobile && (
            <div className="mb-4">
              <VectorMagnitudeIndicator 
                vectors={vectors} 
                colorScheme={colorScheme} 
              />
            </div>
          )}

          {/* Analysis Panel */}
          {selectedCount > 0 && (
            <div className={`rounded-lg border-l-4 ${
              isIndependent 
                ? `${preferences.highContrast ? 'bg-green-900 border-green-400' : 'bg-green-50 border-green-400'}` 
                : `${preferences.highContrast ? 'bg-orange-900 border-orange-400' : 'bg-orange-50 border-orange-400'}`
            }`} style={{ padding: spacing.padding }}>
              <h5 className="font-semibold mb-2" style={{ fontSize: `${fonts.sm}px` }}>
                {isIndependent ? '✅ Linear Independence' : '⚠️ Linear Dependence'}
              </h5>
              <p className="text-gray-600 mb-2" style={{ fontSize: `${fonts.xs}px` }}>
                {selectedCount} vector{selectedCount > 1 ? 's' : ''} selected
              </p>
              <p style={{ fontSize: `${fonts.xs}px` }}>
                {selectedCount === 1 && 'Spans a line through origin'}
                {selectedCount === 2 && isIndependent && 'Spans a plane through origin'}
                {selectedCount === 2 && !isIndependent && 'Spans a line (vectors are parallel)'}
                {selectedCount === 3 && isIndependent && 'Spans all of 3D space'}
                {selectedCount === 3 && !isIndependent && 'Spans a plane or line (vectors are coplanar)'}
              </p>
            </div>
          )}

          {/* Context-sensitive help */}
          <div className={`mt-4 pt-4 border-t ${preferences.highContrast ? 'border-white' : 'border-gray-200/50'}`}>
            <div style={{ fontSize: `${fonts.xs}px` }} className="space-y-1 text-gray-500">
              <div><span className="font-medium">🚀 Adaptive Rendering:</span> LOD + Smart scaling</div>
              <div><span className="font-medium">Grid:</span> Content-aware spacing</div>
              {viewport.isMobile && (
                <div><span className="font-medium">📱 Mobile:</span> Pinch to zoom, drag to rotate</div>
              )}
              {preferences.keyboardNavigation && (
                <div><span className="font-medium">⌨️ Keys:</span> Tab to toggle, arrows to navigate</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};
