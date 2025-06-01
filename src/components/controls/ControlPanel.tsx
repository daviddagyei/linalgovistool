import React from 'react';
import { Box, Layers, Activity, Grid, Eye, EyeOff, Workflow, Compass } from 'lucide-react';
import { useVisualizer } from '../../context/VisualizerContext';
import VectorControls from './VectorControls';
import MatrixControls from './MatrixControls';
import SubspaceControls from './SubspaceControls';
import BasisControls from './BasisControls';
import EigenvalueControls from './EigenvalueControls';

const ControlPanel: React.FC = () => {
  const { 
    mode, 
    setMode, 
    tool, 
    setTool,
    settings,
    updateSettings
  } = useVisualizer();

  // Toggle between 2D and 3D modes
  const toggleMode = () => {
    setMode(mode === '2d' ? '3d' : '2d');
  };

  // Handle tool selection
  const handleToolSelection = (selectedTool: string) => {
    setTool(selectedTool as any);
  };

  // Toggle grid visibility
  const toggleGrid = () => {
    updateSettings({ showGrid: !settings.showGrid });
  };

  // Toggle axes visibility
  const toggleAxes = () => {
    updateSettings({ showAxes: !settings.showAxes });
  };

  // Toggle labels visibility
  const toggleLabels = () => {
    updateSettings({ showLabels: !settings.showLabels });
  };

  return (
    <div className="control-panel bg-white rounded-lg shadow-lg flex flex-col h-full">
      {/* Header with mode toggle */}
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold mb-2">Linear Algebra Visualizer</h2>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Mode:</span>
          <button
            onClick={toggleMode}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              mode === '2d'
                ? 'bg-blue-600 text-white'
                : 'bg-orange-500 text-white'
            }`}
          >
            {mode === '2d' ? '2D' : '3D'}
          </button>
        </div>
      </div>
      
      {/* Tool selection */}
      <div className="p-4 border-b">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Visualization Tool:</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleToolSelection('vector')}
            className={`flex flex-col items-center justify-center p-3 rounded-md transition-colors ${
              tool === 'vector'
                ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                : 'bg-gray-100 text-gray-700 border border-gray-300'
            }`}
          >
            <Box size={20} />
            <span className="text-xs mt-1">Vectors</span>
          </button>
          <button
            onClick={() => handleToolSelection('matrix')}
            className={`flex flex-col items-center justify-center p-3 rounded-md transition-colors ${
              tool === 'matrix'
                ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                : 'bg-gray-100 text-gray-700 border border-gray-300'
            }`}
          >
            <Layers size={20} />
            <span className="text-xs mt-1">Transformations</span>
          </button>
          <button
            onClick={() => handleToolSelection('subspace')}
            className={`flex flex-col items-center justify-center p-3 rounded-md transition-colors ${
              tool === 'subspace'
                ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                : 'bg-gray-100 text-gray-700 border border-gray-300'
            }`}
          >
            <Workflow size={20} />
            <span className="text-xs mt-1">Subspaces</span>
          </button>
          <button
            onClick={() => handleToolSelection('eigenvalue')}
            className={`flex flex-col items-center justify-center p-3 rounded-md transition-colors ${
              tool === 'eigenvalue'
                ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                : 'bg-gray-100 text-gray-700 border border-gray-300'
            }`}
          >
            <Activity size={20} />
            <span className="text-xs mt-1">Eigenvalues</span>
          </button>
          <button
            onClick={() => handleToolSelection('basis')}
            className={`flex flex-col items-center justify-center p-3 rounded-md transition-colors ${
              tool === 'basis'
                ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                : 'bg-gray-100 text-gray-700 border border-gray-300'
            }`}
          >
            <Compass size={20} />
            <span className="text-xs mt-1">Basis</span>
          </button>
        </div>
      </div>
      
      {/* Display settings */}
      <div className="p-4 border-b">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Display Settings:</h3>
        <div className="space-y-2">
          <button
            onClick={toggleGrid}
            className="flex items-center justify-between w-full p-2 bg-gray-100 rounded hover:bg-gray-200"
          >
            <div className="flex items-center">
              <Grid size={16} className="mr-2" />
              <span className="text-sm">Show Grid</span>
            </div>
            <div className={`w-4 h-4 rounded-full ${settings.showGrid ? 'bg-blue-600' : 'bg-gray-400'}`}></div>
          </button>
          <button
            onClick={toggleAxes}
            className="flex items-center justify-between w-full p-2 bg-gray-100 rounded hover:bg-gray-200"
          >
            <div className="flex items-center">
              <Box size={16} className="mr-2" />
              <span className="text-sm">Show Axes</span>
            </div>
            <div className={`w-4 h-4 rounded-full ${settings.showAxes ? 'bg-blue-600' : 'bg-gray-400'}`}></div>
          </button>
          <button
            onClick={toggleLabels}
            className="flex items-center justify-between w-full p-2 bg-gray-100 rounded hover:bg-gray-200"
          >
            <div className="flex items-center">
              {settings.showLabels ? <Eye size={16} className="mr-2" /> : <EyeOff size={16} className="mr-2" />}
              <span className="text-sm">Show Labels</span>
            </div>
            <div className={`w-4 h-4 rounded-full ${settings.showLabels ? 'bg-blue-600' : 'bg-gray-400'}`}></div>
          </button>
        </div>
      </div>
      
      {/* Tool-specific controls */}
      <div className="flex-1 overflow-y-auto">
        {tool === 'vector' && <VectorControls />}
        {tool === 'matrix' && <MatrixControls />}
        {tool === 'subspace' && <SubspaceControls />}
        {tool === 'eigenvalue' && <EigenvalueControls />}
        {tool === 'basis' && <BasisControls />}
      </div>
    </div>
  );
};

export default ControlPanel;