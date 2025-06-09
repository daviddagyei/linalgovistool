import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { useVisualizer } from '../../../context/VisualizerContext';
import { Vector2D } from '../../../types';
import { calculateEigenvalues2D, applyMatrix2D } from '../../../utils/mathUtils';
import { getNiceTickStep } from '../../../utils/niceTicks';

// Centralized color functions for consistency
const getEigenvalueColor = (index: number): string => {
  return `hsl(${200 + index * 80}, 80%, 40%)`;
};

const getTestVectorColor = (index: number): string => {
  return `hsl(${300 + index * 30}, 70%, 45%)`;
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
  
  // State for draggable legend
  const [legendPosition, setLegendPosition] = useState({ x: innerWidth - 150, y: 5 });
  
  // Calculate responsive legend dimensions - reduced for more compact legend
  const legendWidth = width < 640 ? Math.min(160, width - 30) : 180;
  const legendHeight = width < 640 ? 180 : 250;
  
  useEffect(() => {
    // Reset legend position when dimensions change - positioned more to the top right
    setLegendPosition({ x: Math.max(5, innerWidth - legendWidth - 5), y: 5 });
  }, [innerWidth, legendWidth]);

  useEffect(() => {
    if (!svgRef.current) return;
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);
    
    const g = svg.append('g')
      .attr('class', 'main-group')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Calculate eigenvalues and eigenvectors
    const eigenvalues = calculateEigenvalues2D(matrix2D);
    
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
    
    // Draw eigenvectors if enabled - no labels on canvas
    if (eigenvalueSettings?.showEigenvectors && eigenvalues.length > 0) {
      eigenvalues.forEach((eigenvalue, index) => {
        const eigenvector = eigenvalue.vector as Vector2D;
        const scaledVector = {
          x: eigenvector.x * 3,
          y: eigenvector.y * 3
        };
        
        g.append('line')
          .attr('x1', xScale(-scaledVector.x))
          .attr('y1', yScale(-scaledVector.y))
          .attr('x2', xScale(scaledVector.x))
          .attr('y2', yScale(scaledVector.y))
          .attr('stroke', getEigenvalueColor(index))
          .attr('stroke-width', 4)
          .attr('opacity', 0.8);
        
        g.append('circle')
          .attr('cx', xScale(scaledVector.x))
          .attr('cy', yScale(scaledVector.y))
          .attr('r', 6)
          .attr('fill', getEigenvalueColor(index));
        
        g.append('circle')
          .attr('cx', xScale(-scaledVector.x))
          .attr('cy', yScale(-scaledVector.y))
          .attr('r', 6)
          .attr('fill', getEigenvalueColor(index));
      });
    }
    
    // Draw comprehensive legend with all vector information
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${legendPosition.x}, ${legendPosition.y})`);
    
    // Legend background
    legend.append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .attr('fill', 'white')
      .attr('stroke', '#ccc')
      .attr('stroke-width', 1)
      .attr('rx', 8)
      .attr('opacity', 0.95)
      .attr('filter', 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))');
    
    // Legend title
    legend.append('text')
      .attr('x', 15)
      .attr('y', 25)
      .attr('fill', '#1f2937')
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'system-ui, -apple-system, sans-serif')
      .text('Eigenvalue Analysis');
    
    // Legend content
    let yOffset = 50;
    
    // Eigenvectors section
    if (eigenvalueSettings?.showEigenvectors && eigenvalues.length > 0) {
      legend.append('text')
        .attr('x', 15)
        .attr('y', yOffset)
        .attr('fill', '#374151')
        .attr('font-size', '13px')
        .attr('font-weight', '600')
        .attr('font-family', 'system-ui, -apple-system, sans-serif')
        .text('Eigenvectors:');
      
      yOffset += 20;
      
      eigenvalues.forEach((eigenvalue, index) => {
        const eigenvector = eigenvalue.vector as Vector2D;
        
        // Color indicator
        legend.append('circle')
          .attr('cx', 20)
          .attr('cy', yOffset - 3)
          .attr('r', 4)
          .attr('fill', getEigenvalueColor(index));
        
        // Eigenvalue and eigenvector info
        legend.append('text')
          .attr('x', 30)
          .attr('y', yOffset)
          .attr('fill', '#1f2937')
          .attr('font-size', '11px')
          .attr('font-weight', '600')
          .attr('font-family', 'system-ui, -apple-system, sans-serif')
          .text(`λ${index + 1} = ${eigenvalue.value.toFixed(3)}`);
        
        legend.append('text')
          .attr('x', 30)
          .attr('y', yOffset + 12)
          .attr('fill', '#6b7280')
          .attr('font-size', '10px')
          .attr('font-family', 'system-ui, -apple-system, sans-serif')
          .text(`v = (${eigenvector.x.toFixed(2)}, ${eigenvector.y.toFixed(2)})`);
        
        yOffset += 30;
      });
      
      yOffset += 10;
    }
    
    // Test vectors section
    if (eigenvalueSettings?.showTransformation) {
      const testVectorNames = ['e₁', 'e₂', 'v₁', 'v₂'];
      const transformedVectorNames = ['Ae₁', 'Ae₂', 'Av₁', 'Av₂'];
      
      legend.append('text')
        .attr('x', 15)
        .attr('y', yOffset)
        .attr('fill', '#374151')
        .attr('font-size', '13px')
        .attr('font-weight', '600')
        .attr('font-family', 'system-ui, -apple-system, sans-serif')
        .text('Test vectors:');
      
      yOffset += 20;
      
      // Original vectors
      legend.append('line')
        .attr('x1', 15)
        .attr('y1', yOffset - 3)
        .attr('x2', 35)
        .attr('y2', yOffset - 3)
        .attr('stroke', getTestVectorColor(0))
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '3,2')
        .attr('opacity', 0.7);
      
      legend.append('text')
        .attr('x', 40)
        .attr('y', yOffset)
        .attr('fill', '#1f2937')
        .attr('font-size', '11px')
        .attr('font-weight', '600')
        .attr('font-family', 'system-ui, -apple-system, sans-serif')
        .text('Original vectors');
      
      yOffset += 18;
      
      testVectors.forEach((vector, index) => {
        // Color indicator
        legend.append('circle')
          .attr('cx', 25)
          .attr('cy', yOffset - 3)
          .attr('r', 3)
          .attr('fill', getTestVectorColor(index))
          .attr('opacity', 0.7);
        
        // Vector name and coordinates
        legend.append('text')
          .attr('x', 35)
          .attr('y', yOffset)
          .attr('fill', '#6b7280')
          .attr('font-size', '10px')
          .attr('font-family', 'system-ui, -apple-system, sans-serif')
          .text(`${testVectorNames[index]} = (${vector.x.toFixed(1)}, ${vector.y.toFixed(1)})`);
        
        yOffset += 15;
      });
      
      yOffset += 10;
      
      // Transformed vectors
      legend.append('line')
        .attr('x1', 15)
        .attr('y1', yOffset - 3)
        .attr('x2', 35)
        .attr('y2', yOffset - 3)
        .attr('stroke', getTestVectorColor(0))
        .attr('stroke-width', 3);
      
      legend.append('text')
        .attr('x', 40)
        .attr('y', yOffset)
        .attr('fill', '#1f2937')
        .attr('font-size', '11px')
        .attr('font-weight', '600')
        .attr('font-family', 'system-ui, -apple-system, sans-serif')
        .text('Transformed vectors');
      
      yOffset += 18;
      
      transformedVectors.forEach((vector, index) => {
        // Color indicator
        legend.append('circle')
          .attr('cx', 25)
          .attr('cy', yOffset - 3)
          .attr('r', 3)
          .attr('fill', getTestVectorColor(index));
        
        // Vector name and coordinates
        legend.append('text')
          .attr('x', 35)
          .attr('y', yOffset)
          .attr('fill', '#6b7280')
          .attr('font-size', '10px')
          .attr('font-family', 'system-ui, -apple-system, sans-serif')
          .text(`${transformedVectorNames[index]} = (${vector.x.toFixed(1)}, ${vector.y.toFixed(1)})`);
        
        yOffset += 15;
      });
    }
    
  }, [matrix2D, width, height, margin, settings, eigenvalueSettings, legendPosition, scale, offset]);
  
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
        className="w-full h-full"
        style={{ cursor: dragging ? 'grabbing' : 'grab' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg ref={svgRef} className="w-full h-full"></svg>
      </div>
    </div>
  );
};

export default EigenvalueCanvas2D;