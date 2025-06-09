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
  const [legendPosition, setLegendPosition] = useState({ x: innerWidth - 180, y: 10 });
  
  // Calculate responsive legend dimensions based on screen size
  const legendWidth = width < 640 ? Math.min(150, width - 40) : 170;
  const legendHeight = width < 640 ? 100 : 120;
  
  useEffect(() => {
    // Reset legend position when dimensions change
    setLegendPosition({ x: Math.max(10, innerWidth - legendWidth - 10), y: 10 });
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
      // X-axis
      g.append('line')
        .attr('x1', 0)
        .attr('y1', yScale(0))
        .attr('x2', innerWidth)
        .attr('y2', yScale(0))
        .attr('stroke', '#333')
        .attr('stroke-width', 2);
      
      // Y-axis
      g.append('line')
        .attr('x1', xScale(0))
        .attr('y1', 0)
        .attr('x2', xScale(0))
        .attr('y2', innerHeight)
        .attr('stroke', '#333')
        .attr('stroke-width', 2);
    }
    
    // Draw test vectors (before transformation)
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
        
        // Modern coordinate label for test vector
        g.append('foreignObject')
          .attr('x', xScale(vector.x) + 8)
          .attr('y', yScale(vector.y) - 18)
          .attr('width', 60)
          .attr('height', 24)
          .append('xhtml:div')
          .attr('style', 'background:rgba(255,255,255,0.85);border-radius:12px;padding:2px 8px;font-size:12px;color:#333;box-shadow:0 1px 4px #0001;display:inline-block;')
          .html(`(${vector.x.toFixed(2)}, ${vector.y.toFixed(2)})`);
      });
      
      // Draw transformed vectors
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
        
        // Modern coordinate label for transformed vector
        g.append('foreignObject')
          .attr('x', xScale(vector.x) + 8)
          .attr('y', yScale(vector.y) - 18)
          .attr('width', 60)
          .attr('height', 24)
          .append('xhtml:div')
          .attr('style', 'background:rgba(59,130,246,0.12);border-radius:12px;padding:2px 8px;font-size:12px;color:#2563eb;box-shadow:0 1px 4px #0001;display:inline-block;')
          .html(`(${vector.x.toFixed(2)}, ${vector.y.toFixed(2)})`);
      });
    }
    
    // Draw eigenvectors if enabled
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
        
        // Modern coordinate label for eigenvector tip
        g.append('foreignObject')
          .attr('x', xScale(scaledVector.x) + 8)
          .attr('y', yScale(scaledVector.y) - 18)
          .attr('width', 70)
          .attr('height', 24)
          .append('xhtml:div')
          .attr('style', `background:rgba(255,255,255,0.95);border-radius:12px;padding:2px 10px;font-size:13px;color:${getEigenvalueColor(index)};font-weight:600;box-shadow:0 1px 4px #0002;display:inline-block;`)
          .html(`λ${index + 1}: (${scaledVector.x.toFixed(2)}, ${scaledVector.y.toFixed(2)})`);
      });
    }
    
    // Add labels if enabled
    if (settings.showLabels) {
      // Origin label
      g.append('text')
        .attr('x', xScale(0) + 10)
        .attr('y', yScale(0) - 10)
        .attr('fill', '#666')
        .attr('font-size', '12px')
        .text('(0,0)');
      
      // Eigenvalue labels
      if (eigenvalueSettings?.showEigenvalues && eigenvalues.length > 0) {
        eigenvalues.forEach((eigenvalue, index) => {
          const eigenvector = eigenvalue.vector as Vector2D;
          const scaledVector = {
            x: eigenvector.x * 3,
            y: eigenvector.y * 3
          };
          
          g.append('text')
            .attr('x', xScale(scaledVector.x) + 10)
            .attr('y', yScale(scaledVector.y) - 10)
            .attr('fill', getEigenvalueColor(index))
            .attr('font-size', '12px')
            .attr('font-weight', 'bold')
            .text(`λ${index + 1} = ${eigenvalue.value.toFixed(2)}`);
        });
      }
    }
    
    // Draw legend (keep outside zoom group)
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
      .attr('rx', 5)
      .attr('opacity', 0.9);
    
    // Legend title
    legend.append('text')
      .attr('x', 10)
      .attr('y', 20)
      .attr('fill', '#333')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text('Eigenvalue Analysis');
    
    // Legend content
    let yOffset = 40;
    
    if (eigenvalueSettings?.showEigenvectors) {
      eigenvalues.forEach((_, index) => {
        legend.append('line')
          .attr('x1', 10)
          .attr('y1', yOffset)
          .attr('x2', 30)
          .attr('y2', yOffset)
          .attr('stroke', getEigenvalueColor(index))
          .attr('stroke-width', 3);
        
        legend.append('text')
          .attr('x', 35)
          .attr('y', yOffset + 5)
          .attr('fill', '#333')
          .attr('font-size', '11px')
          .text(`Eigenvector ${index + 1}`);
        
        yOffset += 20;
      });
    }
    
    if (eigenvalueSettings?.showTransformation) {
      legend.append('line')
        .attr('x1', 10)
        .attr('y1', yOffset)
        .attr('x2', 30)
        .attr('y2', yOffset)
        .attr('stroke', getTestVectorColor(0))
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5');
      
      legend.append('text')
        .attr('x', 35)
        .attr('y', yOffset + 5)
        .attr('fill', '#333')
        .attr('font-size', '11px')
        .text('Original vectors');
      
      yOffset += 15;
      
      legend.append('line')
        .attr('x1', 10)
        .attr('y1', yOffset)
        .attr('x2', 30)
        .attr('y2', yOffset)
        .attr('stroke', getTestVectorColor(0))
        .attr('stroke-width', 3);
      
      legend.append('text')
        .attr('x', 35)
        .attr('y', yOffset + 5)
        .attr('fill', '#333')
        .attr('font-size', '11px')
        .text('Transformed vectors');
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