import React, { useRef, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import * as d3 from 'd3';
import { useVisualizer } from '../../../context/VisualizerContext';
import { Vector2D } from '../../../types';
import { applyMatrix2D } from '../../../utils/mathUtils';
import { getNiceTickStep } from '../../../utils/niceTicks';

// Centralized color functions for consistency
const getTestVectorColor = (index: number): string => {
  return `hsl(${300 + index * 30}, 70%, 45%)`;
};

// Draggable Legend Component for 2D Eigenvalue Analysis
const DraggableLegend: React.FC<{
  testVectors: Vector2D[];
  transformedVectors: Vector2D[];
  showTransformation: boolean;
}> = ({ testVectors, transformedVectors, showTransformation }) => {
  const [position, setPosition] = useState({ 
    x: window.innerWidth - 280, // Position from right edge (legend width + margin)
    y: 16 // Keep at top
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Handle responsive positioning on window resize
  React.useEffect(() => {
    const updatePosition = () => {
      if (!isDragging) { // Only update if not being dragged
        setPosition(prev => ({
          x: Math.max(16, window.innerWidth - 280), // Ensure minimum margin from left
          y: prev.y // Keep current y position
        }));
      }
    };

    window.addEventListener('resize', updatePosition);
    updatePosition(); // Call once on mount

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

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

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

  // Create small arrow icon for legend
  const createArrowIcon = (color: string, dashed: boolean = false) => (
    <div className="flex items-center mr-2">
      <div
        className="w-6 h-0.5 rounded"
        style={{
          backgroundColor: dashed ? 'transparent' : color,
          opacity: dashed ? 0.6 : 1,
          borderTop: dashed ? `1px dashed ${color}` : 'none',
        }}
      />
      <div
        className="w-0 h-0 ml-1"
        style={{
          borderLeft: `3px solid ${color}`,
          borderTop: '2px solid transparent',
          borderBottom: '2px solid transparent',
          opacity: dashed ? 0.6 : 1,
        }}
      />
    </div>
  );

  const testVectorNames = ['e₁ (unit x)', 'e₂ (unit y)', 'v₁ (diagonal)', 'v₂ (anti-diag)'];
  const transformedVectorNames = ['Ae₁', 'Ae₂', 'Av₁', 'Av₂'];

  return ReactDOM.createPortal(
    <div
      className="fixed bg-white bg-opacity-95 rounded-lg border border-gray-300 p-3 shadow-lg cursor-move select-none z-50 touch-none"
      style={{
        left: position.x,
        top: position.y,
        userSelect: 'none',
        minWidth: '250px',
        maxWidth: '90vw',
        maxHeight: '80vh',
        overflowY: 'auto',
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-bold text-gray-800">2D Vector Legend</h4>
        <div className="text-xs text-gray-400">⋮⋮</div>
      </div>
      <div className="space-y-2 text-xs">
        {/* Eigenvectors section removed by user request */}
        
        {/* Test vectors */}
        {showTransformation && (
          <div className="pt-2 border-t border-gray-200">
            <div className="font-medium text-gray-700 mb-2">Test Vectors:</div>
            
            {/* Original vectors */}
            <div className="mb-3">
              <div className="text-xs font-medium text-gray-600 mb-1">Original:</div>
              {testVectors.map((vector, index) => (
                <div key={`test-${index}`} className="flex items-center mb-1">
                  {createArrowIcon(getTestVectorColor(index), true)}
                  <span className="text-gray-600">
                    {testVectorNames[index]} = ({vector.x.toFixed(1)}, {vector.y.toFixed(1)})
                  </span>
                </div>
              ))}
            </div>
            
            {/* Transformed vectors */}
            <div>
              <div className="text-xs font-medium text-gray-600 mb-1">Transformed:</div>
              {transformedVectors.map((vector, index) => (
                <div key={`transformed-${index}`} className="flex items-center mb-1">
                  {createArrowIcon(getTestVectorColor(index))}
                  <span className="text-gray-600">
                    {transformedVectorNames[index]} = ({vector.x.toFixed(1)}, {vector.y.toFixed(1)})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
        <span className="font-medium">Controls:</span> 
        <span className="hidden sm:inline"> Click & drag canvas to pan, scroll to zoom</span>
        <span className="sm:hidden"> Pinch to zoom, drag to pan</span>
      </div>
    </div>,
    document.body
  );
};

interface EigenvalueCanvas2DProps {
  width: number;
  height: number;
  scale: number;
  offset: { x: number; y: number };
  onPanChange: (offset: { x: number; y: number }) => void;
  onScaleChange: (scale: number) => void;
}

const EigenvalueCanvas2D: React.FC<EigenvalueCanvas2DProps> = ({ 
  width, 
  height, 
  scale, 
  offset, 
  onPanChange, 
  onScaleChange 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { matrix2D, settings, eigenvalueSettings } = useVisualizer();
  
  const margin = { top: 20, right: 20, bottom: 30, left: 40 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  useEffect(() => {
    if (!svgRef.current) return;
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);
    
    const g = svg.append('g')
      .attr('class', 'main-group')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Calculate test vectors for transformation visualization
    const testVectors: Vector2D[] = [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: -1, y: 1 }
    ];
    
    const transformedVectors = testVectors.map(v => applyMatrix2D(matrix2D, v));
    
    // Calculate range based on zoom/pan props
    const baseRange = 10;
    const visibleRange = baseRange / scale;
    const centerX = offset.x;
    const centerY = offset.y;
    const xDomain = [centerX - visibleRange, centerX + visibleRange];
    const yDomain = [centerY - visibleRange, centerY + visibleRange];
    
    // Set up scales
    const xScale = d3.scaleLinear()
      .domain(xDomain)
      .range([0, innerWidth]);
    
    const yScale = d3.scaleLinear()
      .domain(yDomain)
      .range([innerHeight, 0]);
    
    // Draw grid if enabled
    if (settings.showGrid) {
      const gridStep = getNiceTickStep(visibleRange * 2, 10);
      const gridGroup = g.append('g').attr('class', 'grid');
      
      const xStart = Math.ceil(xDomain[0] / gridStep) * gridStep;
      for (let x = xStart; x < xDomain[1]; x += gridStep) {
        gridGroup.append('line')
          .attr('x1', xScale(x)).attr('y1', 0)
          .attr('x2', xScale(x)).attr('y2', innerHeight)
          .attr('stroke', '#e0e0e0')
          .attr('stroke-width', Math.abs(x) < 1e-10 ? 2 : 0.5)
          .attr('opacity', Math.abs(x) < 1e-10 ? 0.8 : 0.3);
      }
      
      const yStart = Math.ceil(yDomain[0] / gridStep) * gridStep;
      for (let y = yStart; y < yDomain[1]; y += gridStep) {
        gridGroup.append('line')
          .attr('x1', 0).attr('y1', yScale(y))
          .attr('x2', innerWidth).attr('y2', yScale(y))
          .attr('stroke', '#e0e0e0')
          .attr('stroke-width', Math.abs(y) < 1e-10 ? 2 : 0.5)
          .attr('opacity', Math.abs(y) < 1e-10 ? 0.8 : 0.3);
      }
    }
    
    // Draw axes if enabled
    if (settings.showAxes) {
      const axesGroup = g.append('g').attr('class', 'axes');
      
      // X-axis
      axesGroup.append('line')
        .attr('x1', 0)
        .attr('y1', yScale(0))
        .attr('x2', innerWidth)
        .attr('y2', yScale(0))
        .attr('stroke', '#333')
        .attr('stroke-width', 2);
      
      // Y-axis
      axesGroup.append('line')
        .attr('x1', xScale(0))
        .attr('y1', 0)
        .attr('x2', xScale(0))
        .attr('y2', innerHeight)
        .attr('stroke', '#333')
        .attr('stroke-width', 2);
      
      // Add axis tick marks and numbers
      if (settings.showLabels) {
        const tickStep = getNiceTickStep(visibleRange * 2, 8);
        
        // X-axis ticks and labels
        const xStart = Math.ceil(xDomain[0] / tickStep) * tickStep;
        for (let x = xStart; x <= xDomain[1]; x += tickStep) {
          if (Math.abs(x) > 1e-10) { // Skip origin
            const tickX = xScale(x);
            const tickY = yScale(0);
            
            // Tick mark
            axesGroup.append('line')
              .attr('x1', tickX)
              .attr('y1', tickY - 4)
              .attr('x2', tickX)
              .attr('y2', tickY + 4)
              .attr('stroke', '#333')
              .attr('stroke-width', 1);
            
            // Number label
            axesGroup.append('text')
              .attr('x', tickX)
              .attr('y', tickY + 18)
              .attr('text-anchor', 'middle')
              .attr('font-family', 'system-ui, -apple-system, sans-serif')
              .attr('font-size', '11px')
              .attr('fill', '#666')
              .text(x.toFixed(Math.abs(x) < 1 ? 1 : 0));
          }
        }
        
        // Y-axis ticks and labels
        const yStart = Math.ceil(yDomain[0] / tickStep) * tickStep;
        for (let y = yStart; y <= yDomain[1]; y += tickStep) {
          if (Math.abs(y) > 1e-10) { // Skip origin
            const tickX = xScale(0);
            const tickY = yScale(y);
            
            // Tick mark
            axesGroup.append('line')
              .attr('x1', tickX - 4)
              .attr('y1', tickY)
              .attr('x2', tickX + 4)
              .attr('y2', tickY)
              .attr('stroke', '#333')
              .attr('stroke-width', 1);
            
            // Number label
            axesGroup.append('text')
              .attr('x', tickX - 8)
              .attr('y', tickY + 4)
              .attr('text-anchor', 'end')
              .attr('font-family', 'system-ui, -apple-system, sans-serif')
              .attr('font-size', '11px')
              .attr('fill', '#666')
              .text(y.toFixed(Math.abs(y) < 1 ? 1 : 0));
          }
        }
        
        // Axis labels
        axesGroup.append('text')
          .attr('x', innerWidth - 10)
          .attr('y', yScale(0) - 8)
          .attr('text-anchor', 'end')
          .attr('font-family', 'system-ui, -apple-system, sans-serif')
          .attr('font-size', '14px')
          .attr('font-weight', '600')
          .attr('fill', '#333')
          .text('x');
        
        axesGroup.append('text')
          .attr('x', xScale(0) + 8)
          .attr('y', 15)
          .attr('text-anchor', 'start')
          .attr('font-family', 'system-ui, -apple-system, sans-serif')
          .attr('font-size', '14px')
          .attr('font-weight', '600')
          .attr('fill', '#333')
          .text('y');
        
        // Origin label
        axesGroup.append('text')
          .attr('x', xScale(0) - 8)
          .attr('y', yScale(0) + 18)
          .attr('text-anchor', 'end')
          .attr('font-family', 'system-ui, -apple-system, sans-serif')
          .attr('font-size', '11px')
          .attr('fill', '#666')
          .text('0');
      }
    }
    
    // Draw test vectors (before transformation) - no labels on canvas
    if (eigenvalueSettings?.showTransformation) {
      testVectors.forEach((vector, index) => {
        g.append('line')
          .attr('x1', xScale(0))
          .attr('y1', yScale(0))
          .attr('x2', xScale(vector.x))
          .attr('y2', yScale(vector.y))
          .attr('stroke', getTestVectorColor(index))
          .attr('stroke-width', 2)
          .attr('opacity', 0.6)
          .attr('stroke-dasharray', '5,5');
        
        g.append('circle')
          .attr('cx', xScale(vector.x))
          .attr('cy', yScale(vector.y))
          .attr('r', 4)
          .attr('fill', getTestVectorColor(index))
          .attr('opacity', 0.6);
      });
      
      // Draw transformed vectors - no labels on canvas
      transformedVectors.forEach((vector, index) => {
        g.append('line')
          .attr('x1', xScale(0))
          .attr('y1', yScale(0))
          .attr('x2', xScale(vector.x))
          .attr('y2', yScale(vector.y))
          .attr('stroke', getTestVectorColor(index))
          .attr('stroke-width', 3);
        
        g.append('circle')
          .attr('cx', xScale(vector.x))
          .attr('cy', yScale(vector.y))
          .attr('r', 5)
          .attr('fill', getTestVectorColor(index));
      });
    }
    
    // Eigenvectors are not drawn on the canvas (removed by user request)
    // They are still shown in the legend for reference
    
  }, [matrix2D, width, height, margin, settings, eigenvalueSettings, scale, offset]);
  
  // Pan and zoom handlers
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; offset: { x: number; y: number } } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const handleWheelNative = (e: WheelEvent) => {
    e.preventDefault();
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = e.clientX - rect.left - margin.left;
    const mouseY = e.clientY - rect.top - margin.top;
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newScale = Math.max(0.1, Math.min(10, scale * zoomFactor));
    
    const baseRange = 10;
    const svgX = (mouseX / innerWidth) * (2 * baseRange / scale) + offset.x - baseRange / scale;
    const svgY = (1 - mouseY / innerHeight) * (2 * baseRange / scale) + offset.y - baseRange / scale;
    const newOffset = {
      x: svgX - (svgX - offset.x) * (scale / newScale),
      y: svgY - (svgY - offset.y) * (scale / newScale),
    };
    
    onScaleChange(newScale);
    onPanChange(newOffset);
  };
  
  // Handle wheel events with non-passive listener for zoom functionality
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    container.addEventListener('wheel', handleWheelNative, { passive: false });
    
    return () => {
      container.removeEventListener('wheel', handleWheelNative);
    };
  }, [scale, offset, innerWidth, innerHeight, onScaleChange, onPanChange]);
  
  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, offset: { ...offset } };
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !dragStart.current) return;
    
    const baseRange = 10;
    const dx = (e.clientX - dragStart.current.x) / innerWidth * (2 * baseRange / scale);
    const dy = (e.clientY - dragStart.current.y) / innerHeight * (2 * baseRange / scale);
    
    onPanChange({
      x: dragStart.current.offset.x - dx,
      y: dragStart.current.offset.y + dy
    });
  };
  
  const handleMouseUp = () => {
    setDragging(false);
    dragStart.current = null;
  };
  
  return (
    <div className="eigenvalue-canvas-2d bg-white rounded-lg shadow-lg">
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ cursor: dragging ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg ref={svgRef} className="w-full h-full"></svg>
      </div>
      <DraggableLegend 
        testVectors={[
          { x: 1, y: 0 },
          { x: 0, y: 1 },
          { x: 1, y: 1 },
          { x: -1, y: 1 }
        ]}
        transformedVectors={[
          { x: 1, y: 0 },
          { x: 0, y: 1 },
          { x: 1, y: 1 },
          { x: -1, y: 1 }
        ].map(v => applyMatrix2D(matrix2D, v))}
        showTransformation={eigenvalueSettings?.showTransformation}
      />
    </div>
  );
};

export default EigenvalueCanvas2D;