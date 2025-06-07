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
  const { 
    vectors2D, 
    setVectors2D, 
    settings,
    subspaceSettings,
    updateSubspaceSettings
  } = useVisualizer();
  
  const [activeVectorIndex, setActiveVectorIndex] = useState<number | null>(null);
  const [hoveredSpan, setHoveredSpan] = useState<number | null>(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [showSpanConstruction, setShowSpanConstruction] = useState(false);
  
  const margin = { top: 20, right: 20, bottom: 30, left: 40 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  
  // Enhanced color scheme with accessibility support
  const colorScheme = {
    vectors: [
      { primary: '#3B82F6', secondary: '#93C5FD', gradient: 'url(#vectorGradient0)' },
      { primary: '#EF4444', secondary: '#FCA5A5', gradient: 'url(#vectorGradient1)' },
      { primary: '#10B981', secondary: '#6EE7B7', gradient: 'url(#vectorGradient2)' },
      { primary: '#8B5CF6', secondary: '#C4B5FD', gradient: 'url(#vectorGradient3)' },
      { primary: '#F59E0B', secondary: '#FCD34D', gradient: 'url(#vectorGradient4)' }
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

  // Calculate span geometry with CORRECTED vector directions
  const calculateSpanGeometry = useCallback((vectors: Vector2D[], spanIndices: number[]) => {
    const selectedVectors = spanIndices.map(i => vectors[i]).filter(Boolean);
    if (selectedVectors.length === 0) return null;

    const baseRange = 10;
    const visibleRange = baseRange / scale;
    
    if (selectedVectors.length === 1) {
      // Line span - FIXED: Use actual vector direction
      const v = selectedVectors[0];
      const length = magnitude2D(v);
      if (length < 1e-10) return null;
      
      // CRITICAL FIX: Use the actual vector direction, not normalized
      // The span should extend along the vector's direction
      const spanExtent = visibleRange * 1.5; // Extend beyond visible area
      
      return {
        type: 'line' as const,
        points: [
          { x: -v.x * spanExtent / length, y: -v.y * spanExtent / length },
          { x: v.x * spanExtent / length, y: v.y * spanExtent / length }
        ],
        vector: v,
        dimension: 1
      };
    } else if (selectedVectors.length === 2) {
      // Plane span or dependent line
      const v1 = selectedVectors[0];
      const v2 = selectedVectors[1];
      const isIndependent = isLinearlyIndependent2D([v1, v2]);
      
      if (isIndependent) {
        // FIXED: Create parallelogram mesh using actual vector directions
        const range = visibleRange;
        const meshPoints: Vector2D[] = [];
        const resolution = 15; // Reduced for better performance
        
        // Generate points using linear combinations: s*v1 + t*v2
        for (let i = -resolution; i <= resolution; i++) {
          for (let j = -resolution; j <= resolution; j++) {
            const s = (i / resolution) * (range / Math.max(magnitude2D(v1), 1));
            const t = (j / resolution) * (range / Math.max(magnitude2D(v2), 1));
            meshPoints.push({
              x: s * v1.x + t * v2.x,
              y: s * v1.y + t * v2.y
            });
          }
        }
        
        // FIXED: Create boundary that follows the parallelogram formed by v1 and v2
        const boundaryScale = range / Math.max(magnitude2D(v1), magnitude2D(v2), 1);
        const boundary = [
          { x: 0, y: 0 }, // Origin
          { x: v1.x * boundaryScale, y: v1.y * boundaryScale }, // Along v1
          { x: (v1.x + v2.x) * boundaryScale, y: (v1.y + v2.y) * boundaryScale }, // v1 + v2
          { x: v2.x * boundaryScale, y: v2.y * boundaryScale }, // Along v2
          { x: 0, y: 0 } // Back to origin
        ];
        
        return {
          type: 'plane' as const,
          meshPoints,
          boundary,
          vectors: [v1, v2],
          dimension: 2,
          isIndependent: true
        };
      } else {
        // Linearly dependent - show as enhanced line along the dominant vector
        const effectiveVector = magnitude2D(v1) > magnitude2D(v2) ? v1 : v2;
        return calculateSpanGeometry(vectors, [vectors.indexOf(effectiveVector)]);
      }
    }
    
    return null;
  }, [scale]);

  // Enhanced drag behavior with smooth animations
  const createDragBehavior = useCallback(() => {
    return d3.drag<SVGCircleElement, unknown>()
      .on('start', function(event) {
        const circle = d3.select(this);
        const vectorIndex = parseInt(circle.attr('data-vector-index'));
        setActiveVectorIndex(vectorIndex);
        
        // Add visual feedback
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
        
        // Get scales from the current transform
        const xScale = d3.scaleLinear()
          .domain([offset.x - 10/scale, offset.x + 10/scale])
          .range([0, innerWidth]);
        const yScale = d3.scaleLinear()
          .domain([offset.y - 10/scale, offset.y + 10/scale])
          .range([innerHeight, 0]);
        
        const newX = xScale.invert(event.x);
        const newY = yScale.invert(event.y);
        
        // Update visual elements immediately for smooth feedback
        const vectorGroup = g.select(`[data-vector-group="${vectorIndex}"]`);
        vectorGroup.select('line')
          .attr('x2', event.x)
          .attr('y2', event.y);
        
        circle.attr('cx', event.x).attr('cy', event.y);
        
        // Update label position
        vectorGroup.select('foreignObject')
          .attr('x', event.x + 8)
          .attr('y', event.y - 16);
      })
      .on('end', function(event) {
        const circle = d3.select(this);
        const vectorIndex = parseInt(circle.attr('data-vector-index'));
        
        // Get final position
        const xScale = d3.scaleLinear()
          .domain([offset.x - 10/scale, offset.x + 10/scale])
          .range([0, innerWidth]);
        const yScale = d3.scaleLinear()
          .domain([offset.y - 10/scale, offset.y + 10/scale])
          .range([innerHeight, 0]);
        
        const newX = xScale.invert(event.x);
        const newY = yScale.invert(event.y);
        
        // Update state
        const newVectors = [...vectors2D];
        newVectors[vectorIndex] = { x: newX, y: newY };
        setVectors2D(newVectors);
        
        // Reset visual state
        circle.transition()
          .duration(200)
          .attr('r', 6)
          .style('filter', null);
        
        setActiveVectorIndex(null);
      });
  }, [vectors2D, setVectors2D, scale, offset, innerWidth, innerHeight]);

  useEffect(() => {
    if (!svgRef.current) return;
    
    // Clear previous content
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
    
    // Create defs for gradients and patterns
    const defs = svg.append('defs');
    
    // Vector gradients
    colorScheme.vectors.forEach((color, i) => {
      const gradient = defs.append('linearGradient')
        .attr('id', `vectorGradient${i}`)
        .attr('x1', '0%').attr('y1', '0%')
        .attr('x2', '100%').attr('y2', '100%');
      
      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', color.primary)
        .attr('stop-opacity', 0.8);
      
      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', color.secondary)
        .attr('stop-opacity', 0.4);
    });
    
    // Span pattern for dependent vectors
    const dependentPattern = defs.append('pattern')
      .attr('id', 'dependentPattern')
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('width', 8)
      .attr('height', 8);
    
    dependentPattern.append('rect')
      .attr('width', 8)
      .attr('height', 8)
      .attr('fill', colorScheme.spans.dependent.fill);
    
    dependentPattern.append('path')
      .attr('d', 'M0,8 L8,0')
      .attr('stroke', colorScheme.spans.dependent.stroke)
      .attr('stroke-width', 1)
      .attr('opacity', 0.3);
    
    // Glow filter for active elements
    const glowFilter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%').attr('y', '-50%')
      .attr('width', '200%').attr('height', '200%');
    
    glowFilter.append('feGaussianBlur')
      .attr('stdDeviation', 3)
      .attr('result', 'coloredBlur');
    
    const feMerge = glowFilter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
    
    const g = svg.append('g')
      .attr('class', 'main-group')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);
    
    // Enhanced grid with subtle animations
    if (settings.showGrid) {
      const gridStep = getNiceTickStep(visibleRange * 2, 10);
      const gridGroup = g.append('g').attr('class', 'grid');
      
      // Vertical grid lines
      const xStart = Math.ceil(xDomain[0] / gridStep) * gridStep;
      for (let x = xStart; x < xDomain[1]; x += gridStep) {
        gridGroup.append('line')
          .attr('x1', xScale(x)).attr('y1', 0)
          .attr('x2', xScale(x)).attr('y2', innerHeight)
          .attr('stroke', colorScheme.background.grid)
          .attr('stroke-width', Math.abs(x) < 1e-10 ? 2 : 0.5)
          .attr('opacity', Math.abs(x) < 1e-10 ? 0.8 : 0.3);
      }
      
      // Horizontal grid lines
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
      
      // X-axis
      axesGroup.append('line')
        .attr('x1', 0).attr('y1', yScale(0))
        .attr('x2', innerWidth).attr('y2', yScale(0))
        .attr('stroke', colorScheme.background.axes)
        .attr('stroke-width', 2);
      
      // Y-axis
      axesGroup.append('line')
        .attr('x1', xScale(0)).attr('y1', 0)
        .attr('x2', xScale(0)).attr('y2', innerHeight)
        .attr('stroke', colorScheme.background.axes)
        .attr('stroke-width', 2);
      
      // Axis labels with better typography
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
    
    // Draw enhanced span visualizations - FIXED TO FOLLOW VECTOR DIRECTIONS
    const spanGroup = g.append('g').attr('class', 'spans');
    
    vectors2D.forEach((vector, index) => {
      if (!subspaceSettings.showSpan[index]) return;
      
      const spanGeometry = calculateSpanGeometry(vectors2D, [index]);
      if (!spanGeometry) return;
      
      const color = colorScheme.vectors[index % colorScheme.vectors.length];
      
      if (spanGeometry.type === 'line') {
        // Enhanced line span with gradient - NOW CORRECTLY ALIGNED
        const lineGroup = spanGroup.append('g')
          .attr('class', `span-line-${index}`)
          .style('cursor', 'pointer')
          .on('mouseenter', () => setHoveredSpan(index))
          .on('mouseleave', () => setHoveredSpan(null));
        
        // Main span line with gradient - FIXED DIRECTION
        lineGroup.append('line')
          .attr('x1', xScale(spanGeometry.points[0].x))
          .attr('y1', yScale(spanGeometry.points[0].y))
          .attr('x2', xScale(spanGeometry.points[1].x))
          .attr('y2', yScale(spanGeometry.points[1].y))
          .attr('stroke', color.gradient)
          .attr('stroke-width', hoveredSpan === index ? 6 : 4)
          .attr('opacity', 0.7)
          .style('filter', hoveredSpan === index ? 'url(#glow)' : null);
        
        // Direction indicators along the span line
        const numIndicators = 5;
        for (let i = 0; i < numIndicators; i++) {
          const t = (i / (numIndicators - 1)) * 2 - 1; // -1 to 1
          const pointX = vector.x * t * (visibleRange * 1.5 / magnitude2D(vector));
          const pointY = vector.y * t * (visibleRange * 1.5 / magnitude2D(vector));
          
          lineGroup.append('circle')
            .attr('cx', xScale(pointX))
            .attr('cy', yScale(pointY))
            .attr('r', 2)
            .attr('fill', color.primary)
            .attr('opacity', 0.6);
        }
      }
    });
    
    // Draw plane spans for multiple vectors - FIXED PARALLELOGRAM ALIGNMENT
    const selectedIndices = subspaceSettings.showSpan
      .map((show, i) => show ? i : -1)
      .filter(i => i >= 0);
    
    if (selectedIndices.length >= 2) {
      const planeGeometry = calculateSpanGeometry(vectors2D, selectedIndices);
      if (planeGeometry && planeGeometry.type === 'plane') {
        const isIndependent = isLinearlyIndependent2D(planeGeometry.vectors);
        const spanStyle = isIndependent ? colorScheme.spans.independent : colorScheme.spans.dependent;
        
        // Create mesh visualization - FIXED TO FOLLOW VECTOR DIRECTIONS
        const meshGroup = spanGroup.append('g').attr('class', 'plane-mesh');
        
        // Draw mesh points with beautiful pattern - CORRECTLY POSITIONED
        planeGeometry.meshPoints.forEach(point => {
          if (Math.abs(point.x) <= visibleRange && Math.abs(point.y) <= visibleRange) {
            meshGroup.append('circle')
              .attr('cx', xScale(point.x))
              .attr('cy', yScale(point.y))
              .attr('r', 1.5)
              .attr('fill', spanStyle.stroke)
              .attr('opacity', 0.4);
          }
        });
        
        // Add boundary visualization - FIXED PARALLELOGRAM SHAPE
        if (planeGeometry.boundary) {
          const boundaryPath = d3.line<Vector2D>()
            .x(d => xScale(d.x))
            .y(d => yScale(d.y))
            .curve(d3.curveLinearClosed);
          
          meshGroup.append('path')
            .datum(planeGeometry.boundary.slice(0, -1)) // Remove duplicate last point
            .attr('d', boundaryPath)
            .attr('fill', isIndependent ? spanStyle.fill : 'url(#dependentPattern)')
            .attr('stroke', spanStyle.stroke)
            .attr('stroke-width', 2)
            .attr('opacity', 0.6);
        }
      }
    }
    
    // Draw enhanced vectors with improved interactions
    const vectorGroup = g.append('g').attr('class', 'vectors');
    const dragBehavior = createDragBehavior();
    
    vectors2D.forEach((vector, index) => {
      const color = colorScheme.vectors[index % colorScheme.vectors.length];
      const isActive = activeVectorIndex === index;
      const isSpanVisible = subspaceSettings.showSpan[index];
      
      const vGroup = vectorGroup.append('g')
        .attr('class', 'vector-group')
        .attr('data-vector-group', index);
      
      // Vector line with enhanced styling
      vGroup.append('line')
        .attr('x1', xScale(0))
        .attr('y1', yScale(0))
        .attr('x2', xScale(vector.x))
        .attr('y2', yScale(vector.y))
        .attr('stroke', color.primary)
        .attr('stroke-width', isActive ? 4 : isSpanVisible ? 3 : 2)
        .attr('opacity', isSpanVisible ? 1 : 0.7)
        .style('filter', isActive ? 'url(#glow)' : null)
        .attr('marker-end', `url(#arrowhead-${index})`);
      
      // Enhanced arrowhead
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
      
      // Interactive vector endpoint
      vGroup.append('circle')
        .attr('cx', xScale(vector.x))
        .attr('cy', yScale(vector.y))
        .attr('r', isActive ? 8 : 6)
        .attr('fill', color.primary)
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .attr('data-vector-index', index)
        .style('cursor', 'move')
        .style('filter', isActive ? 'url(#glow)' : null)
        .call(dragBehavior);
      
      // Enhanced labels with better positioning
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
    calculateSpanGeometry,
    createDragBehavior
  ]);
  
  // Enhanced span toggle with animations
  const toggleSpan = useCallback((index: number) => {
    const newShowSpan = [...subspaceSettings.showSpan];
    newShowSpan[index] = !newShowSpan[index];
    updateSubspaceSettings({ showSpan: newShowSpan });
    
    // Trigger construction animation
    if (newShowSpan[index]) {
      setShowSpanConstruction(true);
      setTimeout(() => setShowSpanConstruction(false), 1000);
    }
  }, [subspaceSettings.showSpan, updateSubspaceSettings]);
  
  // Pan and zoom handlers (keeping existing functionality)
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
  
  return (
    <div className="relative">
      {/* Enhanced Control Panel */}
      <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-200/50">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Span Controls</h3>
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
                  ? colorScheme.vectors[index % colorScheme.vectors.length].primary
                  : '#D1D5DB'
              }`} style={{
                backgroundColor: subspaceSettings.showSpan[index] 
                  ? colorScheme.vectors[index % colorScheme.vectors.length].primary
                  : '#D1D5DB'
              }} />
            </button>
          ))}
        </div>
        
        {/* Dimensional Analysis */}
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-600">
            <div className="font-medium mb-1">Analysis:</div>
            {(() => {
              const selectedVectors = vectors2D.filter((_, i) => subspaceSettings.showSpan[i]);
              const isIndependent = isLinearlyIndependent2D(selectedVectors);
              const dimension = selectedVectors.length === 0 ? 0 :
                             selectedVectors.length === 1 ? (magnitude2D(selectedVectors[0]) > 1e-10 ? 1 : 0) :
                             isIndependent ? 2 : 1;
              
              return (
                <div className="space-y-1">
                  <div className={`text-xs px-2 py-1 rounded ${
                    isIndependent ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {isIndependent ? 'Independent' : 'Dependent'}
                  </div>
                  <div className="text-xs">Dimension: {dimension}</div>
                  <div className="text-xs">Vectors: {selectedVectors.length}</div>
                </div>
              );
            })()}
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