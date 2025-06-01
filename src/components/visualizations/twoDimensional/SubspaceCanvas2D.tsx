import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { useVisualizer } from '../../../context/VisualizerContext';
import { Vector2D } from '../../../types';
import { magnitude2D } from '../../../utils/mathUtils';

interface SubspaceCanvas2DProps {
  width: number;
  height: number;
}

const SubspaceCanvas2D: React.FC<SubspaceCanvas2DProps> = ({ width, height }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { 
    vectors2D, 
    setVectors2D, 
    settings,
    subspaceSettings,
    basisSettings
  } = useVisualizer();
  
  const [activeVectorIndex, setActiveVectorIndex] = useState<number | null>(null);
  const [legendPosition, setLegendPosition] = useState({ x: width - 200, y: 10 });
  
  const margin = { top: 20, right: 20, bottom: 30, left: 40 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  
  // Color scheme for vectors
  const vectorColors = ['#3366FF', '#FF6633', '#33CC99', '#9966FF', '#FF9933'];
  
  // Calculate the span of vectors
  const calculateSpan = (vectors: Vector2D[]): Vector2D[] => {
    if (vectors.length === 0) return [];
    if (vectors.length === 1) {
      const v = vectors[0];
      const length = magnitude2D(v);
      if (length === 0) return [];
      
      // Return points along the line
      const normalized = { x: v.x / length, y: v.y / length };
      const spanPoints: Vector2D[] = [];
      for (let t = -10; t <= 10; t += 0.5) {
        spanPoints.push({
          x: normalized.x * t,
          y: normalized.y * t
        });
      }
      return spanPoints;
    }
    
    // For 2 or more vectors, calculate the parallelogram/plane they span
    const v1 = vectors[0];
    const v2 = vectors[1];
    
    const spanPoints: Vector2D[] = [];
    for (let s = -3; s <= 3; s += 0.2) {
      for (let t = -3; t <= 3; t += 0.2) {
        spanPoints.push({
          x: s * v1.x + t * v2.x,
          y: s * v1.y + t * v2.y
        });
      }
    }
    return spanPoints;
  };
  
  // Check if vectors are linearly independent
  const areLinearlyIndependent = (vectors: Vector2D[]): boolean => {
    if (vectors.length <= 1) return vectors.length === 1 && magnitude2D(vectors[0]) > 0.001;
    if (vectors.length > 2) return false; // In 2D, max 2 independent vectors
    
    const v1 = vectors[0];
    const v2 = vectors[1];
    
    // Check determinant
    const det = v1.x * v2.y - v1.y * v2.x;
    return Math.abs(det) > 0.001;
  };
  
  useEffect(() => {
    // Reset legend position when dimensions change
    setLegendPosition({ x: Math.max(10, innerWidth - 180), y: 10 });
  }, [innerWidth]);
  
  useEffect(() => {
    if (!svgRef.current) return;
    
    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();
    
    // Calculate range
    const allPoints = [
      ...vectors2D,
      ...vectors2D.flatMap(v => calculateSpan([v]))
    ];
    
    const maxRange = Math.max(
      ...allPoints.map(v => Math.abs(v.x)),
      ...allPoints.map(v => Math.abs(v.y)),
      5 // Minimum range
    );
    
    // Set up scales
    const xScale = d3.scaleLinear()
      .domain([-maxRange, maxRange])
      .range([0, innerWidth]);
    
    const yScale = d3.scaleLinear()
      .domain([-maxRange, maxRange])
      .range([innerHeight, 0]);
    
    // Create SVG container
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);
    
    // Draw grid if enabled
    if (settings.showGrid) {
      const gridStep = Math.ceil(maxRange / 5);
      const gridLines = d3.range(-maxRange, maxRange + gridStep, gridStep);
      
      svg.append('g')
        .selectAll('line')
        .data(gridLines)
        .enter()
        .append('line')
        .attr('x1', d => xScale(d))
        .attr('y1', 0)
        .attr('x2', d => xScale(d))
        .attr('y2', innerHeight)
        .attr('stroke', '#e0e0e0')
        .attr('stroke-width', 0.5);
      
      svg.append('g')
        .selectAll('line')
        .data(gridLines)
        .enter()
        .append('line')
        .attr('x1', 0)
        .attr('y1', d => yScale(d))
        .attr('x2', innerWidth)
        .attr('y2', d => yScale(d))
        .attr('stroke', '#e0e0e0')
        .attr('stroke-width', 0.5);
    }
    
    // Draw axes if enabled
    if (settings.showAxes) {
      // X-axis
      svg.append('line')
        .attr('x1', 0)
        .attr('y1', yScale(0))
        .attr('x2', innerWidth)
        .attr('y2', yScale(0))
        .attr('stroke', '#333')
        .attr('stroke-width', 2);
      
      // Y-axis
      svg.append('line')
        .attr('x1', xScale(0))
        .attr('y1', 0)
        .attr('x2', xScale(0))
        .attr('y2', innerHeight)
        .attr('stroke', '#333')
        .attr('stroke-width', 2);
    }
    
    // Draw subspace spans
    vectors2D.forEach((vector, index) => {
      if (subspaceSettings.showSpan[index]) {
        const spanPoints = calculateSpan([vector]);
        
        if (spanPoints.length > 0) {
          // Draw the span as a line for 1D subspace
          const validPoints = spanPoints.filter(p => 
            Math.abs(p.x) <= maxRange && Math.abs(p.y) <= maxRange
          );
          
          if (validPoints.length > 1) {
            // Sort points to create a proper line
            validPoints.sort((a, b) => a.x - b.x || a.y - b.y);
            
            const line = d3.line<Vector2D>()
              .x(d => xScale(d.x))
              .y(d => yScale(d.y));
            
            svg.append('path')
              .datum(validPoints)
              .attr('d', line)
              .attr('stroke', vectorColors[index])
              .attr('stroke-width', 3)
              .attr('fill', 'none')
              .attr('opacity', 0.6)
              .attr('stroke-dasharray', '10,5');
          }
        }
      }
    });
    
    // Draw plane spanned by first two vectors if enabled
    if (subspaceSettings.showPlane && vectors2D.length >= 2) {
      const spanPoints = calculateSpan(vectors2D.slice(0, 2));
      const validPoints = spanPoints.filter(p => 
        Math.abs(p.x) <= maxRange && Math.abs(p.y) <= maxRange
      );
      
      if (validPoints.length > 0) {
        svg.selectAll('.span-point')
          .data(validPoints)
          .enter()
          .append('circle')
          .attr('class', 'span-point')
          .attr('cx', d => xScale(d.x))
          .attr('cy', d => yScale(d.y))
          .attr('r', 1)
          .attr('fill', 'rgba(100, 100, 100, 0.3)');
      }
    }
    
    // Draw basis vectors if enabled
    if (subspaceSettings.showBasis && basisSettings.customBasis) {
      basisSettings.basisVectors.forEach((vector, index) => {
        svg.append('line')
          .attr('x1', xScale(0))
          .attr('y1', yScale(0))
          .attr('x2', xScale(vector.x))
          .attr('y2', yScale(vector.y))
          .attr('stroke', '#22C55E')
          .attr('stroke-width', 4)
          .attr('opacity', 0.8);
        
        // Arrow head
        svg.append('circle')
          .attr('cx', xScale(vector.x))
          .attr('cy', yScale(vector.y))
          .attr('r', 6)
          .attr('fill', '#22C55E');
        
        // Label
        if (settings.showLabels) {
          svg.append('text')
            .attr('x', xScale(vector.x) + 10)
            .attr('y', yScale(vector.y) - 10)
            .attr('fill', '#22C55E')
            .attr('font-size', '12px')
            .attr('font-weight', 'bold')
            .text(`b${index + 1}`);
        }
      });
    }
    
    // Draw vectors
    vectors2D.forEach((vector, index) => {
      const isActive = activeVectorIndex === index;
      
      svg.append('line')
        .attr('x1', xScale(0))
        .attr('y1', yScale(0))
        .attr('x2', xScale(vector.x))
        .attr('y2', yScale(vector.y))
        .attr('stroke', vectorColors[index])
        .attr('stroke-width', isActive ? 4 : 3)
        .attr('opacity', isActive ? 1 : 0.8);
      
      // Arrow head
      svg.append('circle')
        .attr('cx', xScale(vector.x))
        .attr('cy', yScale(vector.y))
        .attr('r', isActive ? 7 : 5)
        .attr('fill', vectorColors[index])
        .style('cursor', 'pointer')
        .on('mousedown', function() {
          setActiveVectorIndex(index);
          
          const drag = d3.drag<SVGCircleElement, unknown>()
            .on('drag', function(event) {
              const [x, y] = d3.pointer(event, svg.node());
              const newVector = {
                x: xScale.invert(x),
                y: yScale.invert(y)
              };
              
              const newVectors = [...vectors2D];
              newVectors[index] = newVector;
              setVectors2D(newVectors);
            })
            .on('end', function() {
              setActiveVectorIndex(null);
            });
          
          drag(d3.select(this));
        });
      
      // Vector labels
      if (settings.showLabels) {
        svg.append('text')
          .attr('x', xScale(vector.x) + 10)
          .attr('y', yScale(vector.y) - 10)
          .attr('fill', vectorColors[index])
          .attr('font-size', '12px')
          .attr('font-weight', 'bold')
          .text(`v${index + 1}(${vector.x.toFixed(1)}, ${vector.y.toFixed(1)})`);
      }
    });
    
    // Draw legend
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${legendPosition.x}, ${legendPosition.y})`);
    
    // Legend background
    legend.append('rect')
      .attr('width', 170)
      .attr('height', 120)
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
      .text('Subspace Analysis');
    
    // Legend content
    let yOffset = 40;
    
    // Independence check
    const isIndependent = areLinearlyIndependent(vectors2D);
    legend.append('text')
      .attr('x', 10)
      .attr('y', yOffset)
      .attr('fill', isIndependent ? '#22C55E' : '#EF4444')
      .attr('font-size', '11px')
      .text(`Linear Independence: ${isIndependent ? 'Yes' : 'No'}`);
    
    yOffset += 20;
    
    // Dimension
    const dimension = vectors2D.length === 0 ? 0 : 
                     vectors2D.length === 1 ? (magnitude2D(vectors2D[0]) > 0.001 ? 1 : 0) :
                     isIndependent ? 2 : 1;
    
    legend.append('text')
      .attr('x', 10)
      .attr('y', yOffset)
      .attr('fill', '#333')
      .attr('font-size', '11px')
      .text(`Subspace Dimension: ${dimension}`);
    
    yOffset += 20;
    
    // Span indicators
    vectors2D.forEach((_, index) => {
      if (subspaceSettings.showSpan[index]) {
        legend.append('line')
          .attr('x1', 10)
          .attr('y1', yOffset)
          .attr('x2', 30)
          .attr('y2', yOffset)
          .attr('stroke', vectorColors[index])
          .attr('stroke-width', 3)
          .attr('stroke-dasharray', '10,5');
        
        legend.append('text')
          .attr('x', 35)
          .attr('y', yOffset + 5)
          .attr('fill', '#333')
          .attr('font-size', '10px')
          .text(`Span v${index + 1}`);
        
        yOffset += 15;
      }
    });
    
  }, [vectors2D, width, height, settings, subspaceSettings, basisSettings, activeVectorIndex, legendPosition]);
  
  return (
    <div className="subspace-canvas-2d bg-white rounded-lg shadow-lg">
      <svg ref={svgRef} className="w-full h-full"></svg>
    </div>
  );
};

export default SubspaceCanvas2D;