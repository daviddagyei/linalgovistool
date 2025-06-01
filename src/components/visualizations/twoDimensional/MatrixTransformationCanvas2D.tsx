import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { useVisualizer } from '../../../context/VisualizerContext';
import { Vector2D, Matrix2D } from '../../../types';
import { applyMatrix2D } from '../../../utils/mathUtils';

interface MatrixTransformationCanvas2DProps {
  width: number;
  height: number;
}

const MatrixTransformationCanvas2D: React.FC<MatrixTransformationCanvas2DProps> = ({ width, height }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { matrix2D, vectors2D, settings } = useVisualizer();
  
  const margin = { top: 20, right: 20, bottom: 30, left: 40 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  
  // Colors for original and transformed elements
  const originalColor = '#3366FF';
  const transformedColor = '#FF6633';
  const gridColor = '#e0e0e0';
  const transformedGridColor = 'rgba(255, 102, 51, 0.2)';
  
  useEffect(() => {
    if (!svgRef.current) return;
    
    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();
    
    // Calculate scale based on vectors and transformed vectors
    const transformedVectors = vectors2D.map(v => applyMatrix2D(matrix2D, v));
    const allPoints = [...vectors2D, ...transformedVectors];
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
    
    // Draw original grid
    if (settings.showGrid) {
      const gridStep = Math.ceil(maxCoord / 5);
      const gridLines = d3.range(-maxCoord, maxCoord + gridStep, gridStep);
      
      // Original grid
      svg.append('g')
        .attr('class', 'grid original')
        .selectAll('line')
        .data(gridLines)
        .enter()
        .append('line')
        .attr('x1', d => xScale(d))
        .attr('y1', 0)
        .attr('x2', d => xScale(d))
        .attr('y2', innerHeight)
        .attr('stroke', gridColor)
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3,3');
      
      svg.append('g')
        .attr('class', 'grid original')
        .selectAll('line')
        .data(gridLines)
        .enter()
        .append('line')
        .attr('x1', 0)
        .attr('y1', d => yScale(d))
        .attr('x2', innerWidth)
        .attr('y2', d => yScale(d))
        .attr('stroke', gridColor)
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3,3');
      
      // Transformed grid
      const transformedGridPoints = gridLines.flatMap(x => 
        gridLines.map(y => ({
          original: { x, y },
          transformed: applyMatrix2D(matrix2D, { x, y })
        }))
      );
      
      // Draw transformed grid cells
      svg.append('g')
        .attr('class', 'grid transformed')
        .selectAll('path')
        .data(transformedGridPoints)
        .enter()
        .append('path')
        .attr('d', d => {
          const x = xScale(d.transformed.x);
          const y = yScale(d.transformed.y);
          return `M ${x} ${y}`;
        })
        .attr('stroke', transformedGridColor)
        .attr('fill', 'none');
    }
    
    // Draw axes
    if (settings.showAxes) {
      // Original axes
      svg.append('line')
        .attr('class', 'axis-x original')
        .attr('x1', xScale(-maxCoord))
        .attr('y1', yScale(0))
        .attr('x2', xScale(maxCoord))
        .attr('y2', yScale(0))
        .attr('stroke', originalColor)
        .attr('stroke-width', 2);
      
      svg.append('line')
        .attr('class', 'axis-y original')
        .attr('x1', xScale(0))
        .attr('y1', yScale(-maxCoord))
        .attr('x2', xScale(0))
        .attr('y2', yScale(maxCoord))
        .attr('stroke', originalColor)
        .attr('stroke-width', 2);

      // Add original axis labels
      if (settings.showLabels) {
        // X-axis label
        svg.append('text')
          .attr('x', xScale(maxCoord) - 10)
          .attr('y', yScale(0) - 5)
          .attr('text-anchor', 'end')
          .attr('font-size', '14px')
          .attr('font-weight', '600')
          .attr('fill', originalColor)
          .text('x');
        
        // Y-axis label
        svg.append('text')
          .attr('x', xScale(0) + 5)
          .attr('y', yScale(maxCoord) + 15)
          .attr('text-anchor', 'start')
          .attr('font-size', '14px')
          .attr('font-weight', '600')
          .attr('fill', originalColor)
          .text('y');
      }
      
      // Transformed axes
      const transformedXAxis = [
        applyMatrix2D(matrix2D, { x: -maxCoord, y: 0 }),
        applyMatrix2D(matrix2D, { x: maxCoord, y: 0 })
      ];
      
      const transformedYAxis = [
        applyMatrix2D(matrix2D, { x: 0, y: -maxCoord }),
        applyMatrix2D(matrix2D, { x: 0, y: maxCoord })
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
    
  }, [matrix2D, vectors2D, width, height, margin, settings]);
  
  return (
    <div className="matrix-transformation-canvas bg-white rounded-lg shadow-lg">
      <svg ref={svgRef} className="w-full h-full" style={{ touchAction: 'none' }}></svg>
    </div>
  );
};

export default MatrixTransformationCanvas2D;