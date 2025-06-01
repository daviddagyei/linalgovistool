import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { Vector2D } from '../../../types';
import { useVisualizer } from '../../../context/VisualizerContext';

interface VectorCanvas2DProps {
  width: number;
  height: number;
}

const VectorCanvas2D: React.FC<VectorCanvas2DProps> = ({ width, height }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { 
    vectors2D, 
    setVectors2D, 
    settings,
    basisSettings,
    changeBasis,
    changeBasisInverse
  } = useVisualizer();
  const [activeVectorIndex, setActiveVectorIndex] = useState<number | null>(null);
  
  const margin = { top: 20, right: 20, bottom: 30, left: 40 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  
  // Color scheme for vectors
  const vectorColors = ['#3366FF', '#FF6633', '#33CC99', '#9966FF', '#FF9933'];
  const basisColors = ['#22C55E', '#EC4899']; // Green and Pink for basis vectors
  
  useEffect(() => {
    if (!svgRef.current) return;
    
    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();
    
    // Set up scales
    const maxRange = Math.max(
      ...vectors2D.map(v => Math.abs(v.x)),
      ...vectors2D.map(v => Math.abs(v.y)),
      ...basisSettings.basisVectors.map(v => Math.abs(v.x)),
      ...basisSettings.basisVectors.map(v => Math.abs(v.y)),
      5 // Minimum range
    );
    
    const xScale = d3.scaleLinear()
      .domain([-maxRange, maxRange])
      .range([0, innerWidth]);
    
    const yScale = d3.scaleLinear()
      .domain([-maxRange, maxRange])
      .range([innerHeight, 0]);
    
    // Create the main SVG container
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);
    
    // Draw grid if enabled
    if (settings.showGrid) {
      const gridStep = Math.ceil(maxRange / 5);
      const gridLines = Array.from(
        { length: 2 * maxRange / gridStep + 1 },
        (_, i) => -maxRange + i * gridStep
      );
      
      // Draw standard grid
      if (!basisSettings.customBasis) {
        // Vertical grid lines
        svg.selectAll('.grid-vertical')
          .data(gridLines)
          .enter()
          .append('line')
          .attr('class', 'grid-vertical')
          .attr('x1', d => xScale(d))
          .attr('y1', 0)
          .attr('x2', d => xScale(d))
          .attr('y2', innerHeight)
          .attr('stroke', '#e0e0e0')
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '3,3');
        
        // Horizontal grid lines
        svg.selectAll('.grid-horizontal')
          .data(gridLines)
          .enter()
          .append('line')
          .attr('class', 'grid-horizontal')
          .attr('x1', 0)
          .attr('y1', d => yScale(d))
          .attr('x2', innerWidth)
          .attr('y2', d => yScale(d))
          .attr('stroke', '#e0e0e0')
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '3,3');
      } else {
        // Draw transformed grid for custom basis
        const gridPoints = [];
        for (let i = -maxRange; i <= maxRange; i += gridStep) {
          for (let j = -maxRange; j <= maxRange; j += gridStep) {
            const transformed = changeBasisInverse({ x: i, y: j });
            gridPoints.push(transformed);
          }
        }

        // Draw vertical grid lines in custom basis
        for (let i = -maxRange; i <= maxRange; i += gridStep) {
          const points = [];
          for (let j = -maxRange; j <= maxRange; j += gridStep) {
            const transformed = changeBasisInverse({ x: i, y: j });
            points.push(transformed);
          }
          
          svg.append('path')
            .datum(points)
            .attr('d', d3.line<Vector2D>()
              .x(d => xScale(d.x))
              .y(d => yScale(d.y))
            )
            .attr('stroke', '#e0e0e0')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '3,3')
            .attr('fill', 'none');
        }

        // Draw horizontal grid lines in custom basis
        for (let j = -maxRange; j <= maxRange; j += gridStep) {
          const points = [];
          for (let i = -maxRange; i <= maxRange; i += gridStep) {
            const transformed = changeBasisInverse({ x: i, y: j });
            points.push(transformed);
          }
          
          svg.append('path')
            .datum(points)
            .attr('d', d3.line<Vector2D>()
              .x(d => xScale(d.x))
              .y(d => yScale(d.y))
            )
            .attr('stroke', '#e0e0e0')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '3,3')
            .attr('fill', 'none');
        }
      }
    }
    
    // Draw axes if enabled
    if (settings.showAxes) {
      if (!basisSettings.customBasis) {
        // Standard axes
        // X-axis
        svg.append('line')
          .attr('class', 'axis')
          .attr('x1', 0)
          .attr('y1', yScale(0))
          .attr('x2', innerWidth)
          .attr('y2', yScale(0))
          .attr('stroke', '#333')
          .attr('stroke-width', 2);
        
        // Y-axis
        svg.append('line')
          .attr('class', 'axis')
          .attr('x1', xScale(0))
          .attr('y1', 0)
          .attr('x2', xScale(0))
          .attr('y2', innerHeight)
          .attr('stroke', '#333')
          .attr('stroke-width', 2);
      } else {
        // Custom basis axes
        const origin = { x: 0, y: 0 };
        const xAxisEnd = changeBasisInverse({ x: maxRange, y: 0 });
        const yAxisEnd = changeBasisInverse({ x: 0, y: maxRange });

        // X-axis in custom basis
        svg.append('line')
          .attr('class', 'custom-axis-x')
          .attr('x1', xScale(origin.x))
          .attr('y1', yScale(origin.y))
          .attr('x2', xScale(xAxisEnd.x))
          .attr('y2', yScale(xAxisEnd.y))
          .attr('stroke', basisColors[0])
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '5,5');

        // Y-axis in custom basis
        svg.append('line')
          .attr('class', 'custom-axis-y')
          .attr('x1', xScale(origin.x))
          .attr('y1', yScale(origin.y))
          .attr('x2', xScale(yAxisEnd.x))
          .attr('y2', yScale(yAxisEnd.y))
          .attr('stroke', basisColors[1])
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '5,5');
      }
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
      .on('start', function(event) {
        const group = d3.select(this.parentNode as SVGGElement);
        group.raise();
      })
      .on('drag', function(event) {
        const group = d3.select(this.parentNode as SVGGElement);
        const index = parseInt(group.attr('data-index'));
        
        const newX = xScale.invert(event.x);
        const newY = yScale.invert(event.y);
        
        // Update visual elements
        group.select('line')
          .attr('x2', event.x)
          .attr('y2', event.y);
        
        const coords = basisSettings.customBasis ? 
          changeBasis({ x: newX, y: newY }) : 
          { x: newX, y: newY };

        group.select('text')
          .attr('x', event.x + 10)
          .attr('y', event.y - 10)
          .text(`v${index + 1}(${coords.x.toFixed(1)}, ${coords.y.toFixed(1)})`);
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

        vectorGroup.append('text')
          .attr('x', x2 + 10)
          .attr('y', y2 - 10)
          .attr('fill', color)
          .attr('font-weight', 'bold')
          .attr('text-anchor', x2 > x1 ? 'start' : 'end')
          .text(`v${i + 1}(${coords.x.toFixed(1)}, ${coords.y.toFixed(1)})`);
      }
    });
    
  }, [vectors2D, width, height, margin, settings, activeVectorIndex, basisSettings]);
  
  return (
    <div className="vector-canvas-2d bg-white rounded-lg shadow-lg">
      <svg ref={svgRef} className="w-full h-full" style={{ touchAction: 'none' }}></svg>
    </div>
  );
};

export default VectorCanvas2D;