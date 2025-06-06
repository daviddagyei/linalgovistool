import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { useVisualizer } from '../../../context/VisualizerContext';
import { Vector2D, Matrix2D } from '../../../types';
import { applyMatrix2D } from '../../../utils/mathUtils';
import { getNiceTickStep } from '../../../utils/niceTicks';

interface MatrixTransformationCanvas2DProps {
  width: number;
  height: number;
  scale: number;
  offset: { x: number; y: number };
  onPanChange: (offset: { x: number; y: number }) => void;
  onScaleChange: (scale: number) => void;
}

const MatrixTransformationCanvas2D: React.FC<MatrixTransformationCanvas2DProps> = ({ width, height, scale, offset, onPanChange, onScaleChange }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { matrix2D, vectors2D, settings } = useVisualizer();
  const margin = { top: 20, right: 20, bottom: 30, left: 40 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Colors for original and transformed elements
  const originalColor = '#3366FF';
  const transformedColor = '#FF6633';
  
  useEffect(() => {
    if (!svgRef.current) return;
    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();
    // Responsive grid/axes
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
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);
    // Draw grid
    if (settings.showGrid) {
      const gridStep = getNiceTickStep(visibleRange * 2, 10);
      const xStart = Math.ceil(xDomain[0] / gridStep) * gridStep;
      for (let x = xStart; x < xDomain[1]; x += gridStep) {
        svg.append('line')
          .attr('x1', xScale(x))
          .attr('y1', 0)
          .attr('x2', xScale(x))
          .attr('y2', innerHeight)
          .attr('stroke', '#e0e0e0');
      }
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

    // Add original axis labels
    if (settings.showLabels) {
      // X-axis label
      svg.append('text')
        .attr('x', xScale(xDomain[1]) - 10)
        .attr('y', yScale(0) - 5)
        .attr('text-anchor', 'end')
        .attr('font-size', '14px')
        .attr('font-weight', '600')
        .attr('fill', originalColor)
        .text('x');
      
      // Y-axis label
      svg.append('text')
        .attr('x', xScale(0) + 5)
        .attr('y', yScale(yDomain[1]) + 15)
        .attr('text-anchor', 'start')
        .attr('font-size', '14px')
        .attr('font-weight', '600')
        .attr('fill', originalColor)
        .text('y');
    }
    
    // Transformed axes
    const transformedXAxis = [
      applyMatrix2D(matrix2D, { x: xDomain[0], y: 0 }),
      applyMatrix2D(matrix2D, { x: xDomain[1], y: 0 })
    ];
    
    const transformedYAxis = [
      applyMatrix2D(matrix2D, { x: 0, y: yDomain[0] }),
      applyMatrix2D(matrix2D, { x: 0, y: yDomain[1] })
    ];
    
    svg.append('line')
      .attr('class', 'axis-x transformed')
      .attr('x1', xScale(transformedXAxis[0].x))
      .attr('y1', yScale(transformedXAxis[0].y))
      .attr('x2', xScale(transformedXAxis[1].x))
      .attr('y2', yScale(transformedXAxis[1].y))
      .attr('stroke', transformedColor)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5');
    
    svg.append('line')
      .attr('class', 'axis-y transformed')
      .attr('x1', xScale(transformedYAxis[0].x))
      .attr('y1', yScale(transformedYAxis[0].y))
      .attr('x2', xScale(transformedYAxis[1].x))
      .attr('y2', yScale(transformedYAxis[1].y))
      .attr('stroke', transformedColor)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5');

    // Add transformed axis labels
    if (settings.showLabels) {
      // Transformed X-axis label
      svg.append('text')
        .attr('x', xScale(transformedXAxis[1].x) + 5)
        .attr('y', yScale(transformedXAxis[1].y) - 5)
        .attr('text-anchor', 'start')
        .attr('font-size', '14px')
        .attr('font-weight', '600')
        .attr('fill', transformedColor)
        .text("x'");
      
      // Transformed Y-axis label
      svg.append('text')
        .attr('x', xScale(transformedYAxis[1].x) + 5)
        .attr('y', yScale(transformedYAxis[1].y) + 5)
        .attr('text-anchor', 'start')
        .attr('font-size', '14px')
        .attr('font-weight', '600')
        .attr('fill', transformedColor)
        .text("y'");
    }
    
    // Draw basis vectors
    const basisVectors: Vector2D[] = [
      { x: 1, y: 0 }, // i hat
      { x: 0, y: 1 }  // j hat
    ];
    
    // Draw original basis vectors
    basisVectors.forEach((vector, i) => {
      const x2 = xScale(vector.x);
      const y2 = yScale(vector.y);
      
      svg.append('line')
        .attr('class', 'basis-vector original')
        .attr('x1', xScale(0))
        .attr('y1', yScale(0))
        .attr('x2', x2)
        .attr('y2', y2)
        .attr('stroke', originalColor)
        .attr('stroke-width', 2)
        .attr('marker-end', `url(#arrowhead-basis-${i})`);
      
      if (settings.showLabels) {
        svg.append('text')
          .attr('x', x2 + 10)
          .attr('y', y2)
          .attr('fill', originalColor)
          .text(i === 0 ? 'î' : 'ĵ');
      }
    });
    
    // Draw transformed basis vectors
    basisVectors.forEach((vector, i) => {
      const transformed = applyMatrix2D(matrix2D, vector);
      const x2 = xScale(transformed.x);
      const y2 = yScale(transformed.y);
      
      svg.append('line')
        .attr('class', 'basis-vector transformed')
        .attr('x1', xScale(0))
        .attr('y1', yScale(0))
        .attr('x2', x2)
        .attr('y2', y2)
        .attr('stroke', transformedColor)
        .attr('stroke-width', 2)
        .attr('marker-end', `url(#arrowhead-transformed-${i})`);
      
      if (settings.showLabels) {
        svg.append('text')
          .attr('x', x2 + 10)
          .attr('y', y2)
          .attr('fill', transformedColor)
          .text(i === 0 ? 'T(î)' : 'T(ĵ)');
      }
    });
    
    // Add arrowhead markers
    const defs = svg.append('defs');
    
    // Original arrowheads
    basisVectors.forEach((_, i) => {
      defs.append('marker')
        .attr('id', `arrowhead-basis-${i}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 8)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', originalColor);
    });
    
    // Transformed arrowheads
    basisVectors.forEach((_, i) => {
      defs.append('marker')
        .attr('id', `arrowhead-transformed-${i}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 8)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', transformedColor);
    });
    
    // Draw determinant visualization
    const det = matrix2D[0][0] * matrix2D[1][1] - matrix2D[0][1] * matrix2D[1][0];
    const unitSquare = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 }
    ];
    
    const transformedSquare = unitSquare.map(p => applyMatrix2D(matrix2D, p));
    
    // Create path for transformed unit square
    const path = d3.path();
    path.moveTo(xScale(transformedSquare[0].x), yScale(transformedSquare[0].y));
    for (let i = 1; i < transformedSquare.length; i++) {
      path.lineTo(xScale(transformedSquare[i].x), yScale(transformedSquare[i].y));
    }
    path.closePath();
    
    svg.append('path')
      .attr('d', path.toString())
      .attr('fill', transformedColor)
      .attr('fill-opacity', 0.2)
      .attr('stroke', transformedColor)
      .attr('stroke-width', 1);
    
    if (settings.showLabels) {
      svg.append('text')
        .attr('x', xScale(transformedSquare[2].x))
        .attr('y', yScale(transformedSquare[2].y) - 20)
        .attr('fill', transformedColor)
        .attr('text-anchor', 'middle')
        .text(`det(A) = ${det.toFixed(2)}`);
    }
    
  }, [width, height, scale, offset, settings, matrix2D, vectors2D]);
  
  // --- Canvas-local pan/zoom handlers ---
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; offset: { x: number; y: number } } | null>(null);
  const PAN_SPEED = 10; // Further increase for much faster panning

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
    const div = document.getElementById('matrix-transformation-canvas-2d-container');
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
    const dx = (e.clientX - dragStart.current.x) / (innerWidth) * (2 * 10 / scale) * PAN_SPEED;
    const dy = (e.clientY - dragStart.current.y) / (innerHeight) * (2 * 10 / scale) * PAN_SPEED;
    onPanChange({ x: dragStart.current.offset.x - dx, y: dragStart.current.offset.y + dy });
  };
  const handleMouseUp = () => {
    setDragging(false);
    dragStart.current = null;
  };

  return (
    <div
      id="matrix-transformation-canvas-2d-container"
      className="matrix-transformation-canvas bg-white rounded-lg shadow-lg select-none"
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
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ touchAction: 'inherit' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      ></svg>
    </div>
  );
};

export default MatrixTransformationCanvas2D;