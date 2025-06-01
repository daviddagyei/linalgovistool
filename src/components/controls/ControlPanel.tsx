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

  const toggleMode = () => {
    setMode(mode === '2d' ? '3d' : '2d');
  };

  const handleToolSelection = (selectedTool: string) => {
    setTool(selectedTool as any);
  };

  const toggleGrid = () => {
    updateSettings({ showGrid: !settings.showGrid });
  };

  const toggleAxes = () => {
    updateSettings({ showAxes: !settings.showAxes });
  };

  const toggleLabels = () => {
    updateSettings({ showLabels: !settings.showLabels });
  };

  return (
    <div className="control-panel bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg flex flex-col h-full border border-gray-100">
      {/* Header with mode toggle */}
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
          <Grid className="w-6 h-6 mr-2 text-blue-600" />
          Linear Algebra Visualizer
        </h2>
        <div className="flex items-center justify-between bg-gray-50 p-1 rounded-lg">
          <span className="text-sm font-medium text-gray-600 ml-3">Mode:</span>
          <button
            onClick={toggleMode}
            className={`px-4 py-2 rounded-md transition-all duration-300 font-medium ${
              mode === '2d'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-orange-500 text-white shadow-md'
            } hover:shadow-lg transform hover:-translate-y-0.5`}
          >
            {mode === '2d' ? '2D Mode' : '3D Mode'}
          </button>
        </div>
      </div>
      
      {/* Tool selection */}
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Visualization Tools</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleToolSelection('vector')}
            className={`flex flex-col items-center justify-center p-4 rounded-lg transition-all duration-300 ${
              tool === 'vector'
                ? 'bg-blue-50 text-blue-700 border-2 border-blue-200 shadow-md'
                : 'bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 hover:border-blue-200'
            }`}
          >
            <Box className={`w-6 h-6 mb-2 ${tool === 'vector' ? 'text-blue-600' : 'text-gray-500'}`} />
            <span className="text-sm font-medium">Vectors</span>
          </button>
          <button
            onClick={() => handleToolSelection('matrix')}
            className={`flex flex-col items-center justify-center p-4 rounded-lg transition-all duration-300 ${
              tool === 'matrix'
                ? 'bg-blue-50 text-blue-700 border-2 border-blue-200 shadow-md'
                : 'bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 hover:border-blue-200'
            }`}
          >
            <Layers className={`w-6 h-6 mb-2 ${tool === 'matrix' ? 'text-blue-600' : 'text-gray-500'}`} />
            <span className="text-sm font-medium">Transformations</span>
          </button>
          <button
            onClick={() => handleToolSelection('subspace')}
            className={`flex flex-col items-center justify-center p-4 rounded-lg transition-all duration-300 ${
              tool === 'subspace'
                ? 'bg-blue-50 text-blue-700 border-2 border-blue-200 shadow-md'
                : 'bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 hover:border-blue-200'
            }`}
          >
            <Workflow className={`w-6 h-6 mb-2 ${tool === 'subspace' ? 'text-blue-600' : 'text-gray-500'}`} />
            <span className="text-sm font-medium">Subspaces</span>
          </button>
          <button
            onClick={() => handleToolSelection('eigenvalue')}
            className={`flex flex-col items-center justify-center p-4 rounded-lg transition-all duration-300 ${
              tool === 'eigenvalue'
                ? 'bg-blue-50 text-blue-700 border-2 border-blue-200 shadow-md'
                : 'bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 hover:border-blue-200'
            }`}
          >
            <Activity className={`w-6 h-6 mb-2 ${tool === 'eigenvalue' ? 'text-blue-600' : 'text-gray-500'}`} />
            <span className="text-sm font-medium">Eigenvalues</span>
          </button>
          <button
            onClick={() => handleToolSelection('basis')}
            className={`flex flex-col items-center justify-center p-4 rounded-lg transition-all duration-300 ${
              tool === 'basis'
                ? 'bg-blue-50 text-blue-700 border-2 border-blue-200 shadow-md'
                : 'bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 hover:border-blue-200'
            }`}
          >
            <Compass className={`w-6 h-6 mb-2 ${tool === 'basis' ? 'text-blue-600' : 'text-gray-500'}`} />
            <span className="text-sm font-medium">Basis</span>
          </button>
        </div>
      </div>
      
      {/* Display settings */}
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Display Settings</h3>
        <div className="space-y-3">
          <button
            onClick={toggleGrid}
            className={`flex items-center justify-between w-full p-3 rounded-lg transition-all duration-300 ${
              settings.showGrid
                ? 'bg-blue-50 text-blue-700'
                : 'bg-white hover:bg-gray-50 text-gray-600'
            } border border-gray-200`}
          >
            <div className="flex items-center">
              <Grid className="w-5 h-5 mr-3" />
              <span className="text-sm font-medium">Show Grid</span>
            </div>
            <div className={`w-10 h-6 rounded-full transition-colors duration-300 ${
              settings.showGrid ? 'bg-blue-600' : 'bg-gray-300'
            } relative`}>
              <div className={`absolute w-4 h-4 rounded-full bg-white top-1 transition-all duration-300 ${
                settings.showGrid ? 'right-1' : 'left-1'
              } shadow-md`} />
            </div>
          </button>
          <button
            onClick={toggleAxes}
            className={`flex items-center justify-between w-full p-3 rounded-lg transition-all duration-300 ${
              settings.showAxes
                ? 'bg-blue-50 text-blue-700'
                : 'bg-white hover:bg-gray-50 text-gray-600'
            } border border-gray-200`}
          >
            <div className="flex items-center">
              <Box className="w-5 h-5 mr-3" />
              <span className="text-sm font-medium">Show Axes</span>
            </div>
            <div className={`w-10 h-6 rounded-full transition-colors duration-300 ${
              settings.showAxes ? 'bg-blue-600' : 'bg-gray-300'
            } relative`}>
              <div className={`absolute w-4 h-4 rounded-full bg-white top-1 transition-all duration-300 ${
                settings.showAxes ? 'right-1' : 'left-1'
              } shadow-md`} />
            </div>
          </button>
          <button
            onClick={toggleLabels}
            className={`flex items-center justify-between w-full p-3 rounded-lg transition-all duration-300 ${
              settings.showLabels
                ? 'bg-blue-50 text-blue-700'
                : 'bg-white hover:bg-gray-50 text-gray-600'
            } border border-gray-200`}
          >
            <div className="flex items-center">
              {settings.showLabels ? (
                <Eye className="w-5 h-5 mr-3" />
              ) : (
                <EyeOff className="w-5 h-5 mr-3" />
              )}
              <span className="text-sm font-medium">Show Labels</span>
            </div>
            <div className={`w-10 h-6 rounded-full transition-colors duration-300 ${
              settings.showLabels ? 'bg-blue-600' : 'bg-gray-300'
            } relative`}>
              <div className={`absolute w-4 h-4 rounded-full bg-white top-1 transition-all duration-300 ${
                settings.showLabels ? 'right-1' : 'left-1'
              } shadow-md`} />
            </div>
          </button>
        </div>
      </div>
      
      {/* Tool-specific controls */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {tool === 'vector' && <VectorControls />}
          {tool === 'matrix' && <MatrixControls />}
          {tool === 'subspace' && <SubspaceControls />}
          {tool === 'eigenvalue' && <EigenvalueControls />}
          {tool === 'basis' && <BasisControls />}
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;