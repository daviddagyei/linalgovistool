import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { useVisualizer } from '../../../context/VisualizerContext';
import { Vector2D } from '../../../types';
import { magnitude2D, dotProduct2D, isLinearlyIndependent2D } from '../../../utils/mathUtils';
import { getNiceTickStep } from '../../../utils/niceTicks';

interface SubspaceCanvas2DProps {
  width: number;
  height: number;
  scale: number;
  offset: { x: number; y: number };
  onPanChange: (offset: { x: number; y: number }) => void;
  onScaleChange: (scale: number) => void;
}

const SubspaceCanvas2D: React.FC<SubspaceCanvas2DProps> = ({ 
  width, 
  height, 
  scale, 
  offset, 
  onPanChange, 
  onScaleChange 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const animationRef = useRef<number>();
  const { 
    vectors2D, 
    setVectors2D, 
    settings,
    subspaceSettings,
    updateSubspaceSettings
  } = useVisualizer();
  
  const [activeVectorIndex, setActiveVectorIndex] = useState<number | null>(null);
  const [hoveredSpan, setHoveredSpan] = useState<number | null>(null);
  const [animationTime, setAnimationTime] = useState(0);
  
  const margin = { top: 20, right: 20, bottom: 30, left: 40 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  
  // Enhanced color scheme with accessibility support
  const colorScheme = {
    vectors: [
      { primary: '#3B82F6', secondary: '#93C5FD', glow: '#3B82F620' },
      { primary: '#EF4444', secondary: '#FCA5A5', glow: '#EF444420' },
      { primary: '#10B981', secondary: '#6EE7B7', glow: '#10B98120' },
      { primary: '#8B5CF6', secondary: '#C4B5FD', glow: '#8B5CF620' },
      { primary: '#F59E0B', secondary: '#FCD34D', glow: '#F59E0B20' }
    ],
    spans: {
      independent: { fill: 'rgba(59, 130, 246, 0.15)', stroke: '#3B82F6' },
      dependent: { fill: 'rgba(239, 68, 68, 0.15)', stroke: '#EF4444' },
      intersection: { fill: 'rgba(139, 92, 246, 0.2)', stroke: '#8B5CF6' }
    },
    background: {
      grid: '#F3F4F6',
      axes: '#374151'
    }
  };

  // Animation loop for moving dots
  useEffect(() => {
    const animate = () => {
      setAnimationTime(prev => prev + 0.02);
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Calculate animated span dots with CORRECTED vector directions
  const calculateAnimatedSpanDots = useCallback((vectors: Vector2D[], spanIndices: number[]) => {
    const selectedVectors = spanIndices.map(i => vectors[i]).filter(Boolean);
    if (selectedVectors.length === 0) return [];

    const baseRange = 10;
    const visibleRange = baseRange / scale;
    const dots: Array<{ x: number; y: number; opacity: number; size: number; phase: number }> = [];
    
    if (selectedVectors.length === 1) {
      // Animated line span - dots moving along the vector direction
      const v = selectedVectors[0];
      const length = magnitude2D(v);
      if (length < 1e-10) return [];
      
      const numDots = 30;
      const spanExtent = visibleRange * 1.2;
      
      for (let i = 0; i < numDots; i++) {
        // Create wave-like motion along the vector direction
        const baseT = (i / (numDots - 1) - 0.5) * 2 * spanExtent / length;
        const waveOffset = Math.sin(animationTime * 2 + i * 0.3) * 0.1;
        const t = baseT + waveOffset;
        
        // Calculate position along the exact vector direction
        const x = v.x * t;
        const y = v.y * t;
        
        // Animated properties
        const opacity = 0.4 + 0.3 * Math.sin(animationTime * 3 + i * 0.2);
        const size = 2 + Math.sin(animationTime * 4 + i * 0.5) * 1;
        
        dots.push({ 
          x, 
          y, 
          opacity: Math.max(0.1, opacity),
          size: Math.max(1, size),
          phase: i * 0.2
        });
      }
    } else if (selectedVectors.length === 2) {
      // Animated plane span or dependent line
      const v1 = selectedVectors[0];
      const v2 = selectedVectors[1];
      const isIndependent = isLinearlyIndependent2D([v1, v2]);
      
      if (isIndependent) {
        // Animated mesh of dots following the parallelogram formed by v1 and v2
        const resolution = 12;
        const range = visibleRange * 0.8;
        
        for (let i = -resolution; i <= resolution; i++) {
          for (let j = -resolution; j <= resolution; j++) {
            const s = (i / resolution) * (range / Math.max(magnitude2D(v1), 1));
            const t = (j / resolution) * (range / Math.max(magnitude2D(v2), 1));
            
            // Add wave motion to the coefficients
            const waveS = s + Math.sin(animationTime * 2 + i * 0.2 + j * 0.1) * 0.05;
            const waveT = t + Math.cos(animationTime * 2.5 + i * 0.1 + j * 0.2) * 0.05;
            
            // Calculate position using linear combination: s*v1 + t*v2
            const x = waveS * v1.x + waveT * v2.x;
            const y = waveS * v1.y + waveT * v2.y;
            
            // Animated properties with ripple effect
            const distance = Math.sqrt(i*i + j*j);
            const opacity = 0.3 + 0.2 * Math.sin(animationTime * 3 - distance * 0.3);
            const size = 1.5 + Math.sin(animationTime * 4 + distance * 0.2) * 0.5;
            
            dots.push({ 
              x, 
              y, 
              opacity: Math.max(0.1, opacity),
              size: Math.max(0.5, size),
              phase: distance * 0.1
            });
          }
        }
      } else {
        // Linearly dependent - animate along the dominant vector
        const effectiveVector = magnitude2D(v1) > magnitude2D(v2) ? v1 : v2;
        return calculateAnimatedSpanDots(vectors, [vectors.indexOf(effectiveVector)]);
      }
    }
    
    return dots;
  }, [scale, animationTime]);

  // Enhanced drag behavior
  const createDragBehavior = useCallback(() => {
    return d3.drag<SVGCircleElement, unknown>()
      .on('start', function(event) {
        const circle = d3.select(this);
        const vectorIndex = parseInt(circle.attr('data-vector-index'));
        setActiveVectorIndex(vectorIndex);
        
        circle.transition()
          .duration(150)
          .attr('r', 8)
          .style('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))');
      })
      .on('drag', function(event) {
        const circle = d3.select(this);
        const vectorIndex = parseInt(circle.attr('data-vector-index'));
        const svg = d3.select(svgRef.current);
        const g = svg.select('.main-group');
        
        const xScale = d3.scaleLinear()
          .domain([offset.x - 10/scale, offset.x + 10/scale])
          .range([0, innerWidth]);
        const yScale = d3.scaleLinear()
          .domain([offset.y - 10/scale, offset.y + 10/scale])
          .range([innerHeight, 0]);
        
        const newX = xScale.invert(event.x);
        const newY = yScale.invert(event.y);
        
        const vectorGroup = g.select(`[data-vector-group="${vectorIndex}"]`);
        vectorGroup.select('line')
          .attr('x2', event.x)
          .attr('y2', event.y);
        
        circle.attr('cx', event.x).attr('cy', event.y);
        
        vectorGroup.select('foreignObject')
          .attr('x', event.x + 8)
          .attr('y', event.y - 16);
      })
      .on('end', function(event) {
        const circle = d3.select(this);
        const vectorIndex = parseInt(circle.attr('data-vector-index'));
        
        const xScale = d3.scaleLinear()
          .domain([offset.x - 10/scale, offset.x + 10/scale])
          .range([0, innerWidth]);
        const yScale = d3.scaleLinear()
          .domain([offset.y - 10/scale, offset.y + 10/scale])
          .range([innerHeight, 0]);
        
        const newX = xScale.invert(event.x);
        const newY = yScale.invert(event.y);
        
        const newVectors = [...vectors2D];
        newVectors[vectorIndex] = { x: newX, y: newY };
        setVectors2D(newVectors);
        
        circle.transition()
          .duration(200)
          .attr('r', 6)
          .style('filter', null);
        
        setActiveVectorIndex(null);
      });
  }, [vectors2D, setVectors2D, scale, offset, innerWidth, innerHeight]);

  useEffect(() => {
    if (!svgRef.current) return;
    
    d3.select(svgRef.current).selectAll('*').remove();
    
    const baseRange = 10;
    const visibleRange = baseRange / scale;
    const centerX = offset.x;
    const centerY = offset.y;
    const xDomain = [centerX - visibleRange, centerX + visibleRange];
    const yDomain = [centerY - visibleRange, centerY + visibleRange];
    
    const xScale = d3.scaleLinear().domain(xDomain).range([0, innerWidth]);
    const yScale = d3.scaleLinear().domain(yDomain).range([innerHeight, 0]);
    
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);
    
    // Create defs for gradients and filters
    const defs = svg.append('defs');
    
    // Vector gradients
    colorScheme.vectors.forEach((color, i) => {
      const gradient = defs.append('radialGradient')
        .attr('id', `dotGradient${i}`)
        .attr('cx', '50%').attr('cy', '50%')
        .attr('r', '50%');
      
      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', color.primary)
        .attr('stop-opacity', 1);
      
      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', color.secondary)
        .attr('stop-opacity', 0.6);
    });
    
    // Glow filter for dots
    const glowFilter = defs.append('filter')
      .attr('id', 'dotGlow')
      .attr('x', '-50%').attr('y', '-50%')
      .attr('width', '200%').attr('height', '200%');
    
    glowFilter.append('feGaussianBlur')
      .attr('stdDeviation', 2)
      .attr('result', 'coloredBlur');
    
    const feMerge = glowFilter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
    
    const g = svg.append('g')
      .attr('class', 'main-group')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);
    
    // Enhanced grid
    if (settings.showGrid) {
      const gridStep = getNiceTickStep(visibleRange * 2, 10);
      const gridGroup = g.append('g').attr('class', 'grid');
      
      const xStart = Math.ceil(xDomain[0] / gridStep) * gridStep;
      for (let x = xStart; x < xDomain[1]; x += gridStep) {
        gridGroup.append('line')
          .attr('x1', xScale(x)).attr('y1', 0)
          .attr('x2', xScale(x)).attr('y2', innerHeight)
          .attr('stroke', colorScheme.background.grid)
          .attr('stroke-width', Math.abs(x) < 1e-10 ? 2 : 0.5)
          .attr('opacity', Math.abs(x) < 1e-10 ? 0.8 : 0.3);
      }
      
      const yStart = Math.ceil(yDomain[0] / gridStep) * gridStep;
      for (let y = yStart; y < yDomain[1]; y += gridStep) {
        gridGroup.append('line')
          .attr('x1', 0).attr('y1', yScale(y))
          .attr('x2', innerWidth).attr('y2', yScale(y))
          .attr('stroke', colorScheme.background.grid)
          .attr('stroke-width', Math.abs(y) < 1e-10 ? 2 : 0.5)
          .attr('opacity', Math.abs(y) < 1e-10 ? 0.8 : 0.3);
      }
    }
    
    // Enhanced axes
    if (settings.showAxes) {
      const axesGroup = g.append('g').attr('class', 'axes');
      
      axesGroup.append('line')
        .attr('x1', 0).attr('y1', yScale(0))
        .attr('x2', innerWidth).attr('y2', yScale(0))
        .attr('stroke', colorScheme.background.axes)
        .attr('stroke-width', 2);
      
      axesGroup.append('line')
        .attr('x1', xScale(0)).attr('y1', 0)
        .attr('x2', xScale(0)).attr('y2', innerHeight)
        .attr('stroke', colorScheme.background.axes)
        .attr('stroke-width', 2);
      
      if (settings.showLabels) {
        axesGroup.append('text')
          .attr('x', innerWidth - 10)
          .attr('y', yScale(0) - 5)
          .attr('text-anchor', 'end')
          .attr('font-family', 'system-ui, -apple-system, sans-serif')
          .attr('font-size', '14px')
          .attr('font-weight', '600')
          .attr('fill', colorScheme.background.axes)
          .text('x');
        
        axesGroup.append('text')
          .attr('x', xScale(0) + 5)
          .attr('y', 15)
          .attr('text-anchor', 'start')
          .attr('font-family', 'system-ui, -apple-system, sans-serif')
          .attr('font-size', '14px')
          .attr('font-weight', '600')
          .attr('fill', colorScheme.background.axes)
          .text('y');
      }
    }
    
    // Draw ANIMATED SPAN DOTS - FIXED TO FOLLOW VECTOR DIRECTIONS
    const spanGroup = g.append('g').attr('class', 'spans');
    
    vectors2D.forEach((vector, index) => {
      if (!subspaceSettings.showSpan[index]) return;
      
      const spanDots = calculateAnimatedSpanDots(vectors2D, [index]);
      const color = colorScheme.vectors[index % colorScheme.vectors.length];
      
      const dotsGroup = spanGroup.append('g')
        .attr('class', `span-dots-${index}`)
        .style('cursor', 'pointer')
        .on('mouseenter', () => setHoveredSpan(index))
        .on('mouseleave', () => setHoveredSpan(null));
      
      // Draw animated dots
      spanDots.forEach((dot, dotIndex) => {
        if (Math.abs(dot.x) <= visibleRange && Math.abs(dot.y) <= visibleRange) {
          dotsGroup.append('circle')
            .attr('cx', xScale(dot.x))
            .attr('cy', yScale(dot.y))
            .attr('r', dot.size)
            .attr('fill', `url(#dotGradient${index})`)
            .attr('opacity', dot.opacity)
            .style('filter', hoveredSpan === index ? 'url(#dotGlow)' : null)
            .style('animation', `pulse 2s ease-in-out infinite`)
            .style('animation-delay', `${dot.phase}s`);
        }
      });
    });
    
    // Draw plane spans for multiple vectors - ANIMATED DOTS
    const selectedIndices = subspaceSettings.showSpan
      .map((show, i) => show ? i : -1)
      .filter(i => i >= 0);
    
    if (selectedIndices.length >= 2) {
      const planeDots = calculateAnimatedSpanDots(vectors2D, selectedIndices);
      const isIndependent = isLinearlyIndependent2D(selectedIndices.map(i => vectors2D[i]));
      const spanStyle = isIndependent ? colorScheme.spans.independent : colorScheme.spans.dependent;
      
      const meshGroup = spanGroup.append('g').attr('class', 'plane-dots');
      
      planeDots.forEach((dot, dotIndex) => {
        if (Math.abs(dot.x) <= visibleRange && Math.abs(dot.y) <= visibleRange) {
          meshGroup.append('circle')
            .attr('cx', xScale(dot.x))
            .attr('cy', yScale(dot.y))
            .attr('r', dot.size)
            .attr('fill', spanStyle.stroke)
            .attr('opacity', dot.opacity * 0.7)
            .style('filter', 'url(#dotGlow)')
            .style('animation', `ripple 3s ease-in-out infinite`)
            .style('animation-delay', `${dot.phase}s`);
        }
      });
    }
    
    // Draw enhanced vectors
    const vectorGroup = g.append('g').attr('class', 'vectors');
    const dragBehavior = createDragBehavior();
    
    vectors2D.forEach((vector, index) => {
      const color = colorScheme.vectors[index % colorScheme.vectors.length];
      const isActive = activeVectorIndex === index;
      const isSpanVisible = subspaceSettings.showSpan[index];
      
      const vGroup = vectorGroup.append('g')
        .attr('class', 'vector-group')
        .attr('data-vector-group', index);
      
      vGroup.append('line')
        .attr('x1', xScale(0))
        .attr('y1', yScale(0))
        .attr('x2', xScale(vector.x))
        .attr('y2', yScale(vector.y))
        .attr('stroke', color.primary)
        .attr('stroke-width', isActive ? 4 : isSpanVisible ? 3 : 2)
        .attr('opacity', isSpanVisible ? 1 : 0.7)
        .style('filter', isActive ? 'url(#dotGlow)' : null)
        .attr('marker-end', `url(#arrowhead-${index})`);
      
      defs.append('marker')
        .attr('id', `arrowhead-${index}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 8)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', color.primary);
      
      vGroup.append('circle')
        .attr('cx', xScale(vector.x))
        .attr('cy', yScale(vector.y))
        .attr('r', isActive ? 8 : 6)
        .attr('fill', color.primary)
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .attr('data-vector-index', index)
        .style('cursor', 'move')
        .style('filter', isActive ? 'url(#dotGlow)' : null)
        .call(dragBehavior);
      
      if (settings.showLabels) {
        const labelX = xScale(vector.x) + 10;
        const labelY = yScale(vector.y) - 10;
        
        vGroup.append('foreignObject')
          .attr('x', labelX)
          .attr('y', labelY - 12)
          .attr('width', 120)
          .attr('height', 24)
          .append('xhtml:div')
          .attr('style', `
            background: linear-gradient(135deg, ${color.primary}15, ${color.secondary}25);
            backdrop-filter: blur(8px);
            padding: 4px 8px;
            font-size: 12px;
            font-weight: 600;
            color: ${color.primary};
            border-radius: 8px;
            border: 1px solid ${color.primary}30;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            display: inline-block;
            white-space: nowrap;
            font-family: system-ui, -apple-system, sans-serif;
          `)
          .html(`v<sub>${index + 1}</sub> (${vector.x.toFixed(1)}, ${vector.y.toFixed(1)})`);
      }
    });
    
    // Add CSS animations
    const style = svg.append('style').text(`
      @keyframes pulse {
        0%, 100% { opacity: 0.4; transform: scale(1); }
        50% { opacity: 0.8; transform: scale(1.2); }
      }
      @keyframes ripple {
        0%, 100% { opacity: 0.3; transform: scale(1); }
        33% { opacity: 0.6; transform: scale(1.1); }
        66% { opacity: 0.4; transform: scale(0.9); }
      }
    `);
    
  }, [
    vectors2D, 
    width, 
    height, 
    settings, 
    subspaceSettings, 
    activeVectorIndex, 
    hoveredSpan,
    scale, 
    offset, 
    calculateAnimatedSpanDots,
    createDragBehavior,
    animationTime
  ]);
  
  // Pan and zoom handlers
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; offset: { x: number; y: number } } | null>(null);
  
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = e.clientX - rect.left - margin.left;
    const mouseY = e.clientY - rect.top - margin.top;
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newScale = Math.max(0.1, Math.min(10, scale * zoomFactor));
    
    const svgX = (mouseX / innerWidth) * (2 * 10 / scale) + offset.x - 10 / scale;
    const svgY = (1 - mouseY / innerHeight) * (2 * 10 / scale) + offset.y - 10 / scale;
    const newOffset = {
      x: svgX - (svgX - offset.x) * (scale / newScale),
      y: svgY - (svgY - offset.y) * (scale / newScale),
    };
    
    onScaleChange(newScale);
    onPanChange(newOffset);
  };
  
  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, offset: { ...offset } };
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !dragStart.current) return;
    
    const dx = (e.clientX - dragStart.current.x) / innerWidth * (2 * 10 / scale);
    const dy = (e.clientY - dragStart.current.y) / innerHeight * (2 * 10 / scale);
    
    onPanChange({
      x: dragStart.current.offset.x - dx,
      y: dragStart.current.offset.y + dy
    });
  };
  
  const handleMouseUp = () => {
    setDragging(false);
    dragStart.current = null;
  };
  
  const toggleSpan = useCallback((index: number) => {
    const newShowSpan = [...subspaceSettings.showSpan];
    newShowSpan[index] = !newShowSpan[index];
    updateSubspaceSettings({ showSpan: newShowSpan });
  }, [subspaceSettings.showSpan, updateSubspaceSettings]);
  
  return (
    <div className="relative">
      {/* Enhanced Control Panel */}
      <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-200/50">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Animated Span Controls</h3>
        <div className="space-y-2">
          {vectors2D.map((vector, index) => (
            <button
              key={index}
              onClick={() => toggleSpan(index)}
              className={`w-full flex items-center justify-between p-2 rounded-lg transition-all duration-200 ${
                subspaceSettings.showSpan[index]
                  ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 text-blue-700 shadow-sm'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
              } border`}
            >
              <span className="text-xs font-medium">
                Span v<sub>{index + 1}</sub>
              </span>
              <div className={`w-3 h-3 rounded-full ${
                subspaceSettings.showSpan[index] 
                  ? 'animate-pulse'
                  : ''
              }`} style={{
                backgroundColor: subspaceSettings.showSpan[index] 
                  ? colorScheme.vectors[index % colorScheme.vectors.length].primary
                  : '#D1D5DB'
              }} />
            </button>
          ))}
        </div>
        
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-600">
            <div className="font-medium mb-1">✨ Animated Dots:</div>
            <div className="space-y-1">
              <div>• Dots flow along vector directions</div>
              <div>• Plane spans show ripple effects</div>
              <div>• Real-time direction following</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Canvas */}
      <div
        className="subspace-canvas-2d bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-lg overflow-hidden select-none"
        style={{ 
          width, 
          height, 
          cursor: dragging ? 'grabbing' : 'grab'
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg ref={svgRef} className="w-full h-full" />
      </div>
    </div>
  );
};

export default SubspaceCanvas2D;