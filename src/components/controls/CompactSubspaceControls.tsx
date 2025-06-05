import React, { useState } from 'react';
import { Eye, EyeOff, Layers } from 'lucide-react';
import { useVisualizer } from '../../context/VisualizerContext';
import { isLinearlyIndependent2D, isLinearlyIndependent3D } from '../../utils/mathUtils';
import Modal from '../ui/Modal';

const CompactSubspaceControls: React.FC = () => {
  const { 
    mode,
    vectors2D,
    vectors3D,
    subspaceSettings,
    updateSubspaceSettings
  } = useVisualizer();

  const [isSpanModalOpen, setIsSpanModalOpen] = useState(false);

  const vectors = mode === '2d' ? vectors2D : vectors3D;
  const selectedVectors = vectors.filter((_, i) => subspaceSettings.showSpan[i]);
  const isIndependent = mode === '2d'
    ? isLinearlyIndependent2D(selectedVectors as any)
    : isLinearlyIndependent3D(selectedVectors as any);

  const toggleSpan = (index: number) => {
    const newShowSpan = [...subspaceSettings.showSpan];
    newShowSpan[index] = !newShowSpan[index];
    updateSubspaceSettings({ showSpan: newShowSpan });
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

  const activeSpans = subspaceSettings.showSpan.filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-2">
        <button
          onClick={() => setIsSpanModalOpen(true)}
          className="flex items-center justify-center p-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg border border-purple-200 transition-colors"
        >
          <Layers className="w-4 h-4 mr-2" />
          Vector Spans ({activeSpans})
        </button>
      </div>

      {/* Space Toggles */}
      <div className="space-y-2">
        <button
          onClick={togglePlane}
          className={`w-full flex items-center justify-between p-2 rounded-lg border transition-colors ${
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
          className={`w-full flex items-center justify-between p-2 rounded-lg border transition-colors ${
            subspaceSettings.showBasis
              ? 'bg-blue-50 border-blue-200 text-blue-700'
              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
          }`}
        >
          <span className="text-sm font-medium">Show Basis</span>
          {subspaceSettings.showBasis ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
      </div>

      {/* Analysis Summary */}
      <div className="p-3 bg-gray-50 rounded-lg border">
        <div className="text-xs text-gray-600 space-y-1">
          <div>Selected: {selectedVectors.length} vectors</div>
          <div className={`font-medium ${isIndependent ? 'text-green-600' : 'text-orange-600'}`}>
            {isIndependent ? 'Linearly Independent' : 'Linearly Dependent'}
          </div>
          {selectedVectors.length > 0 && (
            <div>Dimension: {isIndependent ? selectedVectors.length : '< ' + selectedVectors.length}</div>
          )}
        </div>
      </div>

      {/* Vector Spans Modal */}
      <Modal
        isOpen={isSpanModalOpen}
        onClose={() => setIsSpanModalOpen(false)}
        title="Vector Spans"
        size="sm"
      >
        <div className="space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            Toggle which vectors to include in the span visualization:
          </div>

          <div className="space-y-2">
            {vectors.map((vector, index) => (
              <button
                key={index}
                onClick={() => toggleSpan(index)}
                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  subspaceSettings.showSpan[index]
                    ? 'bg-purple-50 border-purple-200 text-purple-700'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center">
                  <span className="text-sm font-medium mr-2 font-mono">
                    v{index + 1}{mode === '2d' 
                      ? `(${vector.x.toFixed(1)}, ${vector.y.toFixed(1)})`
                      : `(${vector.x.toFixed(1)}, ${vector.y.toFixed(1)}, ${(vector as any).z.toFixed(1)})`
                    }
                  </span>
                </div>
                {subspaceSettings.showSpan[index] ? 
                  <Eye className="w-4 h-4" /> : 
                  <EyeOff className="w-4 h-4" />
                }
              </button>
            ))}
          </div>

          {selectedVectors.length > 0 && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-800">
                <div className="font-medium mb-1">Span Analysis:</div>
                <div className="text-xs space-y-1">
                  <div>Vectors selected: {selectedVectors.length}</div>
                  <div className={isIndependent ? 'text-green-700' : 'text-orange-700'}>
                    {isIndependent ? '✓ Linearly Independent' : '⚠ Linearly Dependent'}
                  </div>
                  <div>
                    Dimension: {isIndependent ? selectedVectors.length : `< ${selectedVectors.length}`}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default CompactSubspaceControls;
