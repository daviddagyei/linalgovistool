import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { useVisualizer } from '../../../context/VisualizerContext';
import { Vector2D } from '../../../types';
import { calculateEigenvalues2D, applyMatrix2D } from '../../../utils/mathUtils';

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
}

const EigenvalueCanvas2D: React.FC<EigenvalueCanvas2DProps> = ({ width, height }) => {
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
    
    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();
    
    // Calculate eigenvalues and eigenvectors
    const eigenvalues = calculateEigenvalues2D(matrix2D);
    
    // Calculate range based on vectors and transformed vectors
    const testVectors: Vector2D[] = [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: -1, y: 1 }
    ];
    
    const transformedVectors = testVectors.map(v => applyMatrix2D(matrix2D, v));
    const allPoints = [
      ...testVectors,
      ...transformedVectors,
      ...eigenvalues.map(e => e.vector as Vector2D)
    ];
    
    const maxCoord = Math.max(
      ...allPoints.map(v => Math.abs(v.x)),
      ...allPoints.map(v => Math.abs(v.y)),
      3 // Minimum range
    );
    
    // Set up scales
    const xScale = d3.scaleLinear()
      .domain([-maxCoord, maxCoord])
      .range([0, innerWidth]);
    
    const yScale = d3.scaleLinear()
      .domain([-maxCoord, maxCoord])
      .range([innerHeight, 0]);
    
    // Create SVG container
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);
    
    // Draw grid if enabled
    if (settings.showGrid) {
      const gridStep = Math.ceil(maxCoord / 5);
      const gridLines = d3.range(-maxCoord, maxCoord + gridStep, gridStep);
      
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
    
    // Draw test vectors (before transformation)
    if (eigenvalueSettings?.showTransformation) {
      testVectors.forEach((vector, index) => {
        svg.append('line')
          .attr('x1', xScale(0))
          .attr('y1', yScale(0))
          .attr('x2', xScale(vector.x))
          .attr('y2', yScale(vector.y))
          .attr('stroke', getTestVectorColor(index))
          .attr('stroke-width', 2)
          .attr('opacity', 0.6)
          .attr('stroke-dasharray', '5,5');
        
        // Arrow head for test vectors
        svg.append('circle')
          .attr('cx', xScale(vector.x))
          .attr('cy', yScale(vector.y))
          .attr('r', 4)
          .attr('fill', getTestVectorColor(index))
          .attr('opacity', 0.6);
      });
      
      // Draw transformed vectors
      transformedVectors.forEach((vector, index) => {
        svg.append('line')
          .attr('x1', xScale(0))
          .attr('y1', yScale(0))
          .attr('x2', xScale(vector.x))
          .attr('y2', yScale(vector.y))
          .attr('stroke', getTestVectorColor(index))
          .attr('stroke-width', 3);
        
        // Arrow head for transformed vectors
        svg.append('circle')
          .attr('cx', xScale(vector.x))
          .attr('cy', yScale(vector.y))
          .attr('r', 5)
          .attr('fill', getTestVectorColor(index));
      });
    }
    
    // Draw eigenvectors if enabled
    if (eigenvalueSettings?.showEigenvectors && eigenvalues.length > 0) {
      eigenvalues.forEach((eigenvalue, index) => {
        const eigenvector = eigenvalue.vector as Vector2D;
        const scaledVector = {
          x: eigenvector.x * 3, // Scale for visibility
          y: eigenvector.y * 3
        };
        
        // Draw eigenvector line extending in both directions
        svg.append('line')
          .attr('x1', xScale(-scaledVector.x))
          .attr('y1', yScale(-scaledVector.y))
          .attr('x2', xScale(scaledVector.x))
          .attr('y2', yScale(scaledVector.y))
          .attr('stroke', getEigenvalueColor(index))
          .attr('stroke-width', 4)
          .attr('opacity', 0.8);
        
        // Add arrow markers
        svg.append('circle')
          .attr('cx', xScale(scaledVector.x))
          .attr('cy', yScale(scaledVector.y))
          .attr('r', 6)
          .attr('fill', getEigenvalueColor(index));
        
        svg.append('circle')
          .attr('cx', xScale(-scaledVector.x))
          .attr('cy', yScale(-scaledVector.y))
          .attr('r', 6)
          .attr('fill', getEigenvalueColor(index));
      });
    }
    
    // Add labels if enabled
    if (settings.showLabels) {
      // Origin label
      svg.append('text')
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
          
          svg.append('text')
            .attr('x', xScale(scaledVector.x) + 10)
            .attr('y', yScale(scaledVector.y) - 10)
            .attr('fill', getEigenvalueColor(index))
            .attr('font-size', '12px')
            .attr('font-weight', 'bold')
            .text(`λ${index + 1} = ${eigenvalue.value.toFixed(2)}`);
        });
      }
    }
    
    // Draw legend
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
    
  }, [matrix2D, width, height, margin, settings, eigenvalueSettings, legendPosition]);
  
  return (
    <div className="eigenvalue-canvas-2d bg-white rounded-lg shadow-lg">
      <svg ref={svgRef} className="w-full h-full"></svg>
    </div>
  );
};

export default EigenvalueCanvas2D;