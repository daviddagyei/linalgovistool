import React, { useState, useEffect } from 'react';
import { Box, Layers, Activity, Grid, Eye, EyeOff, Workflow, Compass, X } from 'lucide-react';
import { useVisualizer } from '../../context/VisualizerContext';
import VectorControls from './VectorControls';
import MatrixControls from './MatrixControls';
import SubspaceControls from './SubspaceControls';
import BasisControls from './BasisControls';
import EigenvalueControls from './EigenvalueControls';
import Tooltip from '../ui/Tooltip';

const ControlPanel: React.FC = () => {
  const { 
    mode, 
    setMode, 
    tool, 
    setTool,
    settings,
    updateSettings
  } = useVisualizer();

  const [showControls, setShowControls] = useState(true);
  const [panelDimensions, setPanelDimensions] = useState({ width: 384, maxHeight: 600 });

  // Update panel dimensions on window resize
  useEffect(() => {
    const updateDimensions = () => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      // Calculate available space
      const bottomBarHeight = 64; // Height of the bottom toolbar
      const margin = 16; // Minimum margin from edges
      const maxPanelWidth = Math.min(384, windowWidth - (margin * 2));
      const maxPanelHeight = windowHeight - bottomBarHeight - (margin * 2);

      setPanelDimensions({
        width: maxPanelWidth,
        maxHeight: maxPanelHeight
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Render the appropriate control component based on the selected tool
  const renderControls = () => {
    switch (tool) {
      case 'vector':
        return <VectorControls />;
      case 'matrix':
        return <MatrixControls />;
      case 'subspace':
        return <SubspaceControls />;
      case 'eigenvalue':
        return <EigenvalueControls />;
      case 'basis':
        return <BasisControls />;
      default:
        return null;
    }
  };

  return (
    <>
      {/* Fixed bottom control bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            {/* Left side - Mode toggle and tools */}
            <div className="flex items-center space-x-2">
              {/* Mode Toggle */}
              <Tooltip 
                content={`${mode === '2d' ? '2D' : '3D'} Mode`}
                description={`Switch to ${mode === '2d' ? '3D' : '2D'} visualization mode for ${mode === '2d' ? 'three-dimensional' : 'two-dimensional'} linear algebra`}
                position="top"
              >
                <button
                  onClick={() => setMode(mode === '2d' ? '3d' : '2d')}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    mode === '2d'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-orange-100 text-orange-700'
                  }`}
                >
                  {mode.toUpperCase()}
                </button>
              </Tooltip>

              {/* Tool buttons */}
              <div className="flex items-center space-x-1">
                <Tooltip 
                  content="Vector Tool" 
                  description="Visualize vectors, add/remove vectors, and perform vector operations like addition and scalar multiplication"
                  position="top"
                >
                  <button
                    onClick={() => {
                      setTool('vector');
                      setShowControls(true);
                    }}
                    className={`p-1.5 rounded-lg transition-colors ${
                      tool === 'vector'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Box size={20} />
                  </button>
                </Tooltip>

                <Tooltip 
                  content="Matrix Transformations" 
                  description="Explore linear transformations using matrices. Adjust matrix values and see how they transform space"
                  position="top"
                >
                  <button
                    onClick={() => {
                      setTool('matrix');
                      setShowControls(true);
                    }}
                    className={`p-1.5 rounded-lg transition-colors ${
                      tool === 'matrix'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Layers size={20} />
                  </button>
                </Tooltip>

                <Tooltip 
                  content="Subspaces" 
                  description="Visualize vector spans, linear independence, and subspace properties like lines and planes"
                  position="top"
                >
                  <button
                    onClick={() => {
                      setTool('subspace');
                      setShowControls(true);
                    }}
                    className={`p-1.5 rounded-lg transition-colors ${
                      tool === 'subspace'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Workflow size={20} />
                  </button>
                </Tooltip>

                <Tooltip 
                  content="Eigenvalues & Eigenvectors" 
                  description="Analyze eigenvalues and eigenvectors of matrices. See special directions that only get scaled"
                  position="top"
                >
                  <button
                    onClick={() => {
                      setTool('eigenvalue');
                      setShowControls(true);
                    }}
                    className={`p-1.5 rounded-lg transition-colors ${
                      tool === 'eigenvalue'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Activity size={20} />
                  </button>
                </Tooltip>

                <Tooltip 
                  content="Basis Vectors" 
                  description="Work with different coordinate systems and basis vectors. Change how we measure and represent vectors"
                  position="top"
                >
                  <button
                    onClick={() => {
                      setTool('basis');
                      setShowControls(true);
                    }}
                    className={`p-1.5 rounded-lg transition-colors ${
                      tool === 'basis'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Compass size={20} />
                  </button>
                </Tooltip>
              </div>
            </div>

            {/* Right side - Display settings */}
            <div className="flex items-center space-x-2">
              {/* Quick toggles */}
              <Tooltip 
                content="Grid Toggle" 
                description="Show or hide the coordinate grid for better spatial reference"
                position="top"
              >
                <button
                  onClick={() => updateSettings({ showGrid: !settings.showGrid })}
                  className={`p-1.5 rounded-lg transition-colors ${
                    settings.showGrid
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Grid size={20} />
                </button>
              </Tooltip>

              <Tooltip 
                content="Labels Toggle" 
                description="Show or hide vector labels and coordinate information"
                position="top"
              >
                <button
                  onClick={() => updateSettings({ showLabels: !settings.showLabels })}
                  className={`p-1.5 rounded-lg transition-colors ${
                    settings.showLabels
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {settings.showLabels ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      {/* Tool-specific controls panel */}
      {tool && showControls && (
        <div 
          className="fixed left-4 bottom-20 z-50"
          style={{
            width: panelDimensions.width
          }}
        >
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            {/* Sticky header */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
              <div className="flex items-center justify-between p-3">
                <h3 className="text-lg font-semibold text-gray-800">
                  {tool.charAt(0).toUpperCase() + tool.slice(1)} Controls
                </h3>
                <button
                  onClick={() => setShowControls(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                  title="Close controls"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            
            {/* Scrollable content */}
            <div 
              className="overflow-y-auto" // removed overflow-hidden to allow tooltips to escape
              style={{ 
                maxHeight: `calc(${panelDimensions.maxHeight}px - 3.5rem)`,
                overscrollBehavior: 'contain'
              }}
            >
              <div className="p-4">
                {renderControls()}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ControlPanel;