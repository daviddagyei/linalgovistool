import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { Vector2D } from '../../../types';
import { useVisualizer } from '../../../context/VisualizerContext';
import { getNiceTickStep } from '../../../utils/niceTicks';

interface VectorCanvas2DProps {
  width: number;
  height: number;
  scale: number;
  offset: { x: number; y: number };
  onPanChange: (offset: { x: number; y: number }) => void;
  onScaleChange: (scale: number) => void;
}

const VectorCanvas2D: React.FC<VectorCanvas2DProps> = ({ width, height, scale, offset, onPanChange, onScaleChange }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { 
    vectors2D, 
    setVectors2D, 
    settings,
    basisSettings,
    changeBasis
  } = useVisualizer();
  const [activeVectorIndex] = useState<number | null>(null);
  
  const margin = { top: 20, right: 20, bottom: 30, left: 40 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  
  // Color scheme for vectors
  const vectorColors = ['#3366FF', '#FF6633', '#33CC99', '#9966FF', '#FF9933'];
  const basisColors = ['#22C55E', '#EC4899']; // Green and Pink for basis vectors
  
  // --- D3 Drawing ---
  useEffect(() => {
    if (!svgRef.current) return;
    d3.select(svgRef.current).selectAll('*').remove();

    // Calculate visible range based on scale and offset
    const baseRange = 10; // World units visible at scale=1
    const visibleRange = baseRange / scale;
    const centerX = offset.x;
    const centerY = offset.y;
    const xDomain = [centerX - visibleRange, centerX + visibleRange];
    const yDomain = [centerY - visibleRange, centerY + visibleRange];

    const xScale = d3.scaleLinear().domain(xDomain).range([0, innerWidth]);
    const yScale = d3.scaleLinear().domain(yDomain).range([innerHeight, 0]);

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Draw grid
    if (settings.showGrid) {
      // Calculate nice grid step
      const gridStep = getNiceTickStep(visibleRange * 2, 10);
      // X grid lines
      const xStart = Math.ceil(xDomain[0] / gridStep) * gridStep;
      for (let x = xStart; x < xDomain[1]; x += gridStep) {
        svg.append('line')
          .attr('x1', xScale(x))
          .attr('y1', 0)
          .attr('x2', xScale(x))
          .attr('y2', innerHeight)
          .attr('stroke', '#e0e0e0');
      }
      // Y grid lines
      const yStart = Math.ceil(yDomain[0] / gridStep) * gridStep;
      for (let y = yStart; y < yDomain[1]; y += gridStep) {
        svg.append('line')
          .attr('x1', 0)
          .attr('y1', yScale(y))
          .attr('x2', innerWidth)
          .attr('y2', yScale(y))
          .attr('stroke', '#e0e0e0');
      }
    }

    // Draw axes
    svg.append('line')
      .attr('x1', xScale(xDomain[0]))
      .attr('y1', yScale(0))
      .attr('x2', xScale(xDomain[1]))
      .attr('y2', yScale(0))
      .attr('stroke', '#333')
      .attr('stroke-width', 2);
    svg.append('line')
      .attr('x1', xScale(0))
      .attr('y1', yScale(yDomain[0]))
      .attr('x2', xScale(0))
      .attr('y2', yScale(yDomain[1]))
      .attr('stroke', '#333')
      .attr('stroke-width', 2);

    // Draw axis ticks and numbers
    const tickStep = getNiceTickStep(visibleRange * 2, 10);
    // X ticks
    for (let x = Math.ceil(xDomain[0] / tickStep) * tickStep; x < xDomain[1]; x += tickStep) {
      if (Math.abs(x) < 1e-8) continue; // skip zero
      svg.append('line')
        .attr('x1', xScale(x))
        .attr('y1', yScale(0) - 5)
        .attr('x2', xScale(x))
        .attr('y2', yScale(0) + 5)
        .attr('stroke', '#333');
      svg.append('text')
        .attr('x', xScale(x))
        .attr('y', yScale(0) + 18)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('fill', '#333')
        .text(Number(x.toPrecision(6)));
    }
    // Y ticks
    for (let y = Math.ceil(yDomain[0] / tickStep) * tickStep; y < yDomain[1]; y += tickStep) {
      if (Math.abs(y) < 1e-8) continue;
      svg.append('line')
        .attr('x1', xScale(0) - 5)
        .attr('y1', yScale(y))
        .attr('x2', xScale(0) + 5)
        .attr('y2', yScale(y))
        .attr('stroke', '#333');
      svg.append('text')
        .attr('x', xScale(0) - 8)
        .attr('y', yScale(y) + 4)
        .attr('text-anchor', 'end')
        .attr('font-size', '12px')
        .attr('fill', '#333')
        .text(Number(y.toPrecision(6)));
    }
    
    // Draw basis vectors
    if (basisSettings.customBasis) {
      basisSettings.basisVectors.forEach((vector, i) => {
        const color = basisColors[i];
        
        // Draw basis vector
        svg.append('line')
          .attr('class', `basis-vector-${i}`)
          .attr('x1', xScale(0))
          .attr('y1', yScale(0))
          .attr('x2', xScale(vector.x))
          .attr('y2', yScale(vector.y))
          .attr('stroke', color)
          .attr('stroke-width', 3)
          .attr('marker-end', `url(#basis-arrowhead-${i})`);

        // Add arrowhead marker
        svg.append('defs')
          .append('marker')
          .attr('id', `basis-arrowhead-${i}`)
          .attr('viewBox', '0 -5 10 10')
          .attr('refX', 8)
          .attr('refY', 0)
          .attr('markerWidth', 6)
          .attr('markerHeight', 6)
          .attr('orient', 'auto')
          .append('path')
          .attr('d', 'M0,-5L10,0L0,5')
          .attr('fill', color);

        // Add basis vector label
        if (settings.showLabels) {
          svg.append('text')
            .attr('x', xScale(vector.x * 1.1))
            .attr('y', yScale(vector.y * 1.1))
            .attr('fill', color)
            .attr('font-weight', 'bold')
            .text(`e${i + 1}`);
        }
      });
    }
    
    // Create drag behavior with touch support
    const drag = d3.drag<SVGLineElement, Vector2D>()
      .touchable(true)
      .on('start', function() {
        const group = d3.select(this.parentNode as SVGGElement);
        group.raise();
      })
      .on('drag', function(event) {
        const group = d3.select(this.parentNode as SVGGElement);
        
        const newX = xScale.invert(event.x);
        const newY = yScale.invert(event.y);
        
        // Update visual elements
        group.select('line')
          .attr('x2', event.x)
          .attr('y2', event.y);
        
        const coords = basisSettings.customBasis ? 
          changeBasis({ x: newX, y: newY }) : 
          { x: newX, y: newY };

        // Update vector label
        group.select('foreignObject')
          .attr('x', event.x + 8)
          .attr('y', event.y - 16)
          .select('div')
          .html(`v${parseInt(group.attr('data-index')) + 1} (${coords.x.toFixed(1)}, ${coords.y.toFixed(1)})`);
      })
      .on('end', function(event) {
        const group = d3.select(this.parentNode as SVGGElement);
        const index = parseInt(group.attr('data-index'));
        
        const newX = xScale.invert(event.x);
        const newY = yScale.invert(event.y);
        
        const updatedVectors = [...vectors2D];
        updatedVectors[index] = { x: newX, y: newY };
        setVectors2D(updatedVectors);
      });
    
    // Draw vectors
    vectors2D.forEach((vector, i) => {
      const color = vectorColors[i % vectorColors.length];
      
      // Calculate vector coordinates
      const x1 = xScale(0);
      const y1 = yScale(0);
      const x2 = xScale(vector.x);
      const y2 = yScale(vector.y);
      
      // Create vector group
      const vectorGroup = svg.append('g')
        .attr('class', 'vector')
        .attr('data-index', i);
      
      // Draw vector line
      vectorGroup.append('line')
        .attr('x1', x1)
        .attr('y1', y1)
        .attr('x2', x2)
        .attr('y2', y2)
        .attr('stroke', color)
        .attr('stroke-width', i === activeVectorIndex ? 3 : 2)
        .attr('marker-end', `url(#arrowhead-${i})`)
        .style('cursor', 'move')
        .call(drag as any);
      
      // Add arrowhead marker
      svg.append('defs')
        .append('marker')
        .attr('id', `arrowhead-${i}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 8)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', color);
      
      // Add vector label if enabled
      if (settings.showLabels) {
        const coords = basisSettings.customBasis ? 
          changeBasis(vector) : 
          vector;

        // Vector label with new format
        vectorGroup.append('foreignObject')
          .attr('x', x2 + 8)
          .attr('y', y2 - 16)
          .attr('width', 120)
          .attr('height', 24)
          .append('xhtml:div')
          .attr('style', `
            background: rgba(255, 255, 255, 0.9);
            padding: 2px 6px;
            font-size: 12px;
            font-weight: 600;
            color: ${color};
            border-radius: 4px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            display: inline-block;
            white-space: nowrap;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          `)
          .html(`v${i + 1} (${coords.x.toFixed(1)}, ${coords.y.toFixed(1)})`);
      }
    });
    
  }, [vectors2D, width, height, margin, settings, activeVectorIndex, basisSettings, scale, offset]);
  
  // --- Canvas-local pan/zoom handlers ---
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; offset: { x: number; y: number } } | null>(null);
  const PAN_SPEED = 1; // Further increase for much faster panning
  // For smooth panning
  const panAnimationFrame = useRef<number | null>(null);
  const lastPanEvent = useRef<{ x: number; y: number } | null>(null);

  // Pinch-to-zoom state with threshold detection
  const pinchState = useRef<{
    initialDistance: number;
    initialScale: number;
    initialOffset: { x: number; y: number };
    initialMid: { x: number; y: number };
    startTime: number;
    isActive: boolean;
  } | null>(null);

  // Thresholds for detecting intentional canvas pinch
  const PINCH_THRESHOLD = 15; // pixels of distance change
  const TIME_THRESHOLD = 150; // milliseconds to wait

  // Selective gesture prevention - prevent all gestures on canvas to avoid browser zoom
  useEffect(() => {
    const div = document.getElementById('vector-canvas-2d-container');
    if (!div) return;
    
    const handleGestureStart = (e: Event) => {
      // Prevent all gesture events on canvas
      e.preventDefault();
    };
    
    const handleGestureChange = (e: Event) => {
      // Prevent all gesture events on canvas
      e.preventDefault();
    };
    
    const handleGestureEnd = (e: Event) => {
      // Prevent all gesture events on canvas
      e.preventDefault();
    };
    
    div.addEventListener('gesturestart', handleGestureStart);
    div.addEventListener('gesturechange', handleGestureChange);
    div.addEventListener('gestureend', handleGestureEnd);
    
    return () => {
      div.removeEventListener('gesturestart', handleGestureStart);
      div.removeEventListener('gesturechange', handleGestureChange);
      div.removeEventListener('gestureend', handleGestureEnd);
    };
  }, []);

  // Touch handlers with threshold-based pinch detection
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Prevent browser zoom immediately when 2 fingers touch canvas
      e.preventDefault();
      
      const rect = (e.target as Element).getBoundingClientRect();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dx = t2.clientX - t1.clientX;
      const dy = t2.clientY - t1.clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const midX = (t1.clientX + t2.clientX) / 2 - rect.left - margin.left;
      const midY = (t1.clientY + t2.clientY) / 2 - rect.top - margin.top;
      
      pinchState.current = {
        initialDistance: distance,
        initialScale: scale,
        initialOffset: { ...offset },
        initialMid: { x: midX, y: midY },
        startTime: Date.now(),
        isActive: false, // Not active until we detect intentional movement
      };
    } else if (e.touches.length === 1) {
      // Allow single finger touches (for dragging)
      // Don't prevent default to allow normal touch behavior
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchState.current) {
      // Always prevent default to stop browser zoom
      e.preventDefault();
      
      const rect = (e.target as Element).getBoundingClientRect();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dx = t2.clientX - t1.clientX;
      const dy = t2.clientY - t1.clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      const distanceChange = Math.abs(distance - pinchState.current.initialDistance);
      const timeElapsed = Date.now() - pinchState.current.startTime;
      
      // Activate canvas pinch mode if movement exceeds threshold OR time threshold passed
      if (!pinchState.current.isActive && 
          (distanceChange > PINCH_THRESHOLD || timeElapsed > TIME_THRESHOLD)) {
        pinchState.current.isActive = true;
      }
      
      // Only do custom zoom if we're in active canvas pinch mode
      if (pinchState.current.isActive) {
        const scaleFactor = distance / pinchState.current.initialDistance;
        const newScale = Math.max(0.0001, pinchState.current.initialScale * scaleFactor);
        
        // Zoom to midpoint
        const midX = (t1.clientX + t2.clientX) / 2 - rect.left - margin.left;
        const midY = (t1.clientY + t2.clientY) / 2 - rect.top - margin.top;
        const svgX = (midX / innerWidth) * (2 * 10 / scale) + offset.x - 10 / scale;
        const svgY = (1 - midY / innerHeight) * (2 * 10 / scale) + offset.y - 10 / scale;
        const newOffset = {
          x: svgX - (svgX - offset.x) * (scale / newScale),
          y: svgY - (svgY - offset.y) * (scale / newScale),
        };
        onScaleChange(newScale);
        onPanChange(newOffset);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      // Reset pinch state when lifting fingers
      pinchState.current = null;
    }
  };

  // Mouse and wheel handlers (restored)
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left - margin.left;
    const mouseY = e.clientY - rect.top - margin.top;
    // Zoom to mouse position
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newScale = Math.max(0.0001, scale * zoomFactor);
    // Adjust offset so zoom is centered on mouse
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
    lastPanEvent.current = { x: e.clientX, y: e.clientY };
    if (panAnimationFrame.current === null) {
      panAnimationFrame.current = requestAnimationFrame(() => {
        if (!dragStart.current || !lastPanEvent.current) return;
        const dx = (lastPanEvent.current.x - dragStart.current.x) / (innerWidth) * (2 * 10 / scale) * PAN_SPEED;
        const dy = (lastPanEvent.current.y - dragStart.current.y) / (innerHeight) * (2 * 10 / scale) * PAN_SPEED;
        onPanChange({ x: dragStart.current.offset.x - dx, y: dragStart.current.offset.y + dy });
        panAnimationFrame.current = null;
      });
    }
  };
  const handleMouseUp = () => {
    setDragging(false);
    dragStart.current = null;
    if (panAnimationFrame.current !== null) {
      cancelAnimationFrame(panAnimationFrame.current);
      panAnimationFrame.current = null;
    }
    lastPanEvent.current = null;
  };

  return (
    <div
      id="vector-canvas-2d-container"
      className="vector-canvas-2d bg-white rounded-lg shadow-lg select-none"
      style={{ 
        width, 
        height, 
        cursor: dragging ? 'grabbing' : 'grab', 
        touchAction: 'pan-x pan-y' // Allow scrolling but prevent browser zoom
      }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <svg ref={svgRef} className="w-full h-full" style={{ touchAction: 'inherit' }} />
    </div>
  );
};

export default VectorCanvas2D;