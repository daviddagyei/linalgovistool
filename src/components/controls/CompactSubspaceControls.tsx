import React, { useState } from 'react';
import { Eye, EyeOff, Layers, Info, Zap, RotateCcw } from 'lucide-react';
import { useVisualizer } from '../../context/VisualizerContext';
import { isLinearlyIndependent2D, isLinearlyIndependent3D, magnitude2D, magnitude3D } from '../../utils/mathUtils';
import Modal from '../ui/Modal';
import Tooltip from '../ui/Tooltip';

const CompactSubspaceControls: React.FC = () => {
  const { 
    mode,
    vectors2D,
    vectors3D,
    subspaceSettings,
    updateSubspaceSettings
  } = useVisualizer();

  const [isSpanModalOpen, setIsSpanModalOpen] = useState(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [animateConstruction, setAnimateConstruction] = useState(false);

  const vectors = mode === '2d' ? vectors2D : vectors3D;
  const selectedVectors = vectors.filter((_, i) => subspaceSettings.showSpan[i]);
  const isIndependent = mode === '2d'
    ? isLinearlyIndependent2D(selectedVectors as any)
    : isLinearlyIndependent3D(selectedVectors as any);

  const toggleSpan = (index: number) => {
    const newShowSpan = [...subspaceSettings.showSpan];
    newShowSpan[index] = !newShowSpan[index];
    updateSubspaceSettings({ showSpan: newShowSpan });
    
    // Trigger construction animation
    if (newShowSpan[index]) {
      setAnimateConstruction(true);
      setTimeout(() => setAnimateConstruction(false), 1500);
    }
  };

  const togglePlane = () => {
    updateSubspaceSettings({ 
      showPlane: !subspaceSettings.showPlane 
    });
  };

  const toggleBasis = () => {
    updateSubspaceSettings({ 
      showBasis: !subspaceSettings.showBasis 
    });
  };

  const resetSpans = () => {
    updateSubspaceSettings({ 
      showSpan: vectors.map(() => false),
      showPlane: false,
      showBasis: false
    });
  };

  const showAllSpans = () => {
    updateSubspaceSettings({ 
      showSpan: vectors.map(() => true),
      showPlane: true,
      showBasis: true
    });
  };

  const activeSpans = subspaceSettings.showSpan.filter(Boolean).length;
  
  // Calculate dimension
  const dimension = selectedVectors.length === 0 ? 0 :
                   selectedVectors.length === 1 ? (mode === '2d' ? (magnitude2D(selectedVectors[0] as any) > 1e-10 ? 1 : 0) : (magnitude3D(selectedVectors[0] as any) > 1e-10 ? 1 : 0)) :
                   selectedVectors.length === 2 && isIndependent ? 2 :
                   selectedVectors.length === 3 && isIndependent && mode === '3d' ? 3 :
                   selectedVectors.length === 2 ? 1 : 
                   selectedVectors.length === 3 ? 2 : 0;

  // Enhanced color scheme
  const colorScheme = [
    { primary: '#3B82F6', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
    { primary: '#EF4444', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
    { primary: '#10B981', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
    { primary: '#8B5CF6', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
    { primary: '#F59E0B', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' }
  ];

  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2">
        <Tooltip 
          content="Vector Spans" 
          description="View and toggle individual vector spans to visualize subspaces"
        >
          <button
            onClick={() => setIsSpanModalOpen(true)}
            className={`flex items-center justify-center p-3 rounded-lg border transition-all duration-200 ${
              activeSpans > 0 
                ? 'bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 text-purple-700 shadow-sm'
                : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
            }`}
          >
            <Layers className="w-4 h-4 mr-2" />
            Spans ({activeSpans})
          </button>
        </Tooltip>
        
        <Tooltip 
          content="Subspace Analysis" 
          description="View detailed analysis of linear independence, dimension, and geometric interpretation"
        >
          <button
            onClick={() => setIsAnalysisModalOpen(true)}
            className="flex items-center justify-center p-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-200 transition-colors"
          >
            <Info className="w-4 h-4 mr-2" />
            Analysis
          </button>
        </Tooltip>
      </div>

      {/* Quick Controls */}
      <div className="grid grid-cols-2 gap-2">
        <Tooltip 
          content="Show All Spans" 
          description="Display all vector spans, plane, and basis vectors at once"
        >
          <button
            onClick={showAllSpans}
            className="flex items-center justify-center p-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg border border-green-200 transition-colors text-sm"
          >
            <Zap className="w-4 h-4 mr-1" />
            Show All
          </button>
        </Tooltip>
        
        <Tooltip 
          content="Reset All" 
          description="Hide all spans, planes, and basis vectors"
        >
          <button
            onClick={resetSpans}
            className="flex items-center justify-center p-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg border border-gray-200 transition-colors text-sm"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </button>
        </Tooltip>
      </div>

      {/* Space Toggles */}
      <div className="space-y-2">
        <button
          onClick={togglePlane}
          className={`w-full flex items-center justify-between p-2 rounded-lg border transition-all duration-200 ${
            subspaceSettings.showPlane
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
          }`}
        >
          <span className="text-sm font-medium">Show Plane</span>
          {subspaceSettings.showPlane ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>

        <button
          onClick={toggleBasis}
          className={`w-full flex items-center justify-between p-2 rounded-lg border transition-all duration-200 ${
            subspaceSettings.showBasis
              ? 'bg-blue-50 border-blue-200 text-blue-700'
              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
          }`}
        >
          <span className="text-sm font-medium">Show Basis</span>
          {subspaceSettings.showBasis ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
      </div>

      {/* Enhanced Analysis Summary */}
      <div className={`p-3 rounded-lg border-l-4 ${
        isIndependent ? 'bg-green-50 border-green-400' : 'bg-orange-50 border-orange-400'
      }`}>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Linear Independence</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              isIndependent ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
            }`}>
              {isIndependent ? 'Independent' : 'Dependent'}
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <div className="font-medium text-gray-700">{selectedVectors.length}</div>
              <div className="text-gray-500">Vectors</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-gray-700">{dimension}</div>
              <div className="text-gray-500">Dimension</div>
            </div>
            <div className="text-center">
              <div className={`font-medium ${animateConstruction ? 'animate-pulse text-blue-600' : 'text-gray-700'}`}>
                {mode.toUpperCase()}
              </div>
              <div className="text-gray-500">Mode</div>
            </div>
          </div>
          
          {selectedVectors.length > 0 && (
            <div className="text-xs text-gray-600 mt-2 p-2 bg-white/50 rounded">
              {selectedVectors.length === 1 && 'Span: Line through origin'}
              {selectedVectors.length === 2 && isIndependent && 'Span: Plane through origin'}
              {selectedVectors.length === 2 && !isIndependent && 'Span: Line through origin (dependent)'}
              {selectedVectors.length === 3 && isIndependent && mode === '3d' && 'Span: All of 3D space (ℝ³)'}
              {selectedVectors.length === 3 && !isIndependent && 'Span: Plane or line through origin'}
            </div>
          )}
        </div>
      </div>

      {/* Vector Spans Modal */}
      <Modal
        isOpen={isSpanModalOpen}
        onClose={() => setIsSpanModalOpen(false)}
        title="Vector Span Controls"
        size="md"
      >
        <div className="space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            Toggle which vectors to include in the span visualization. Each vector creates a line through the origin, and combinations create planes or higher-dimensional spaces.
          </div>

          <div className="space-y-3">
            {vectors.map((vector, index) => {
              const color = colorScheme[index % colorScheme.length];
              return (
                <button
                  key={index}
                  onClick={() => toggleSpan(index)}
                  className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all duration-200 ${
                    subspaceSettings.showSpan[index]
                      ? `${color.bg} ${color.border} ${color.text} shadow-sm`
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                      style={{
                        backgroundColor: subspaceSettings.showSpan[index] ? color.primary : 'transparent',
                        borderColor: color.primary
                      }}
                    >
                      {subspaceSettings.showSpan[index] && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <div className="text-left">
                      <div className="font-medium">
                        Vector v<sub>{index + 1}</sub>
                      </div>
                      <div className="text-xs font-mono opacity-75">
                        {mode === '2d' 
                          ? `(${vector.x.toFixed(1)}, ${vector.y.toFixed(1)})`
                          : `(${vector.x.toFixed(1)}, ${vector.y.toFixed(1)}, ${(vector as any).z.toFixed(1)})`
                        }
                      </div>
                    </div>
                  </div>
                  {subspaceSettings.showSpan[index] ? 
                    <Eye className="w-5 h-5" /> : 
                    <EyeOff className="w-5 h-5" />
                  }
                </button>
              );
            })}
          </div>

          {selectedVectors.length > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-800">
                <div className="font-medium mb-2">Current Span Analysis:</div>
                <div className="space-y-1 text-xs">
                  <div>Selected vectors: {selectedVectors.length}</div>
                  <div className={isIndependent ? 'text-green-700' : 'text-orange-700'}>
                    {isIndependent ? '✓ Linearly Independent' : '⚠ Linearly Dependent'}
                  </div>
                  <div>Span dimension: {dimension}</div>
                  <div>Geometric interpretation: {
                    dimension === 0 ? 'Origin point' :
                    dimension === 1 ? 'Line through origin' :
                    dimension === 2 ? 'Plane through origin' :
                    'All of 3D space'
                  }</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Analysis Modal */}
      <Modal
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
        title="Subspace Analysis"
        size="lg"
      >
        <div className="space-y-6">
          {/* Current State */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-3">Current Configuration</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Mode:</span>
                  <span className="font-medium">{mode.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total vectors:</span>
                  <span className="font-medium">{vectors.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Selected vectors:</span>
                  <span className="font-medium">{selectedVectors.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Span dimension:</span>
                  <span className="font-medium">{dimension}</span>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-lg ${
              isIndependent ? 'bg-green-50' : 'bg-orange-50'
            }`}>
              <h4 className="font-semibold text-gray-800 mb-3">Linear Independence</h4>
              <div className="space-y-2 text-sm">
                <div className={`font-medium ${
                  isIndependent ? 'text-green-700' : 'text-orange-700'
                }`}>
                  {isIndependent ? 'Vectors are linearly independent' : 'Vectors are linearly dependent'}
                </div>
                <div className="text-gray-600">
                  {isIndependent 
                    ? 'No vector can be written as a combination of the others'
                    : 'At least one vector can be written as a combination of the others'
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Vector Details */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Vector Details</h4>
            <div className="space-y-2">
              {vectors.map((vector, index) => {
                const color = colorScheme[index % colorScheme.length];
                const magnitude = mode === '2d' ? magnitude2D(vector as any) : magnitude3D(vector as any);
                return (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      subspaceSettings.showSpan[index] 
                        ? `${color.bg} ${color.border}` 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: color.primary }}
                        />
                        <span className="font-medium">
                          v<sub>{index + 1}</sub>
                        </span>
                        <span className="font-mono text-sm">
                          {mode === '2d' 
                            ? `(${vector.x.toFixed(2)}, ${vector.y.toFixed(2)})`
                            : `(${vector.x.toFixed(2)}, ${vector.y.toFixed(2)}, ${(vector as any).z.toFixed(2)})`
                          }
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        |v| = {magnitude.toFixed(3)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Educational Information */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-3">Understanding Subspaces</h4>
            <div className="text-sm text-blue-700 space-y-2">
              <div><strong>Subspace:</strong> A subset of a vector space that is closed under addition and scalar multiplication.</div>
              <div><strong>Span:</strong> The set of all possible linear combinations of a given set of vectors.</div>
              <div><strong>Linear Independence:</strong> Vectors are independent if no vector can be written as a combination of the others.</div>
              <div><strong>Dimension:</strong> The number of vectors in a basis for the subspace.</div>
            </div>
          </div>

          {/* Geometric Interpretation */}
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-purple-800 mb-3">Geometric Interpretation</h4>
            <div className="text-sm text-purple-700 space-y-2">
              {dimension === 0 && <div>The span contains only the zero vector (origin point).</div>}
              {dimension === 1 && <div>The span forms a line passing through the origin.</div>}
              {dimension === 2 && <div>The span forms a plane passing through the origin.</div>}
              {dimension === 3 && mode === '3d' && <div>The span fills all of 3D space (ℝ³).</div>}
              {!isIndependent && selectedVectors.length > 1 && (
                <div>Since the vectors are dependent, the actual dimension is less than the number of vectors.</div>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CompactSubspaceControls;