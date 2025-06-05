import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { Vector2D } from '../../../types';
import { useVisualizer } from '../../../context/VisualizerContext';

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
    settings,
    basisSettings,
    changeBasis,
    changeBasisInverse
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
      const targetSteps = 10;
      const rawStep = (visibleRange * 2) / targetSteps;
      const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
      const normalized = rawStep / magnitude;
      let step;
      if (normalized <= 1) step = 1;
      else if (normalized <= 2) step = 2;
      else if (normalized <= 5) step = 5;
      else step = 10;
      step *= magnitude;
      // X grid lines
      const xStart = Math.ceil(xDomain[0] / step) * step;
      for (let x = xStart; x < xDomain[1]; x += step) {
        svg.append('line')
          .attr('x1', xScale(x))
          .attr('y1', 0)
          .attr('x2', xScale(x))
          .attr('y2', innerHeight)
          .attr('stroke', '#e0e0e0');
      }
      // Y grid lines
      const yStart = Math.ceil(yDomain[0] / step) * step;
      for (let y = yStart; y < yDomain[1]; y += step) {
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
    const tickStep = (visibleRange * 2) / 10;
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
        .text(Number(x.toFixed(2)));
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
        .text(Number(y.toFixed(2)));
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
  
  // Mouse wheel for zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    onScaleChange(Math.max(0.0001, scale * zoomFactor));
  };

  // Mouse drag for pan
  let last = useRef<{ x: number; y: number } | null>(null);
  const handleMouseDown = (e: React.MouseEvent) => {
    last.current = { x: e.clientX, y: e.clientY };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };
  const handleMouseMove = (e: MouseEvent) => {
    if (!last.current) return;
    const dx = (e.clientX - last.current.x) / (scale * 40); // 40 px per world unit
    const dy = (e.clientY - last.current.y) / (scale * 40);
    onPanChange({ x: offset.x - dx, y: offset.y + dy });
    last.current = { x: e.clientX, y: e.clientY };
  };
  const handleMouseUp = () => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
    last.current = null;
  };

  return (
    <div className="vector-canvas-2d bg-white rounded-lg shadow-lg select-none"
      style={{ width, height }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
    >
      <svg ref={svgRef} className="w-full h-full" style={{ touchAction: 'none' }}></svg>
    </div>
  );
};

export default VectorCanvas2D;