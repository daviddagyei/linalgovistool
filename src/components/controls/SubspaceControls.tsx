import React from 'react';
import { Eye, EyeOff, Info } from 'lucide-react';
import { useVisualizer } from '../../context/VisualizerContext';
import { isLinearlyIndependent2D, isLinearlyIndependent3D } from '../../utils/mathUtils';

const SubspaceControls: React.FC = () => {
  const { 
    mode,
    vectors2D,
    vectors3D,
    subspaceSettings,
    updateSubspaceSettings
  } = useVisualizer();

  const toggleSpan = (index: number) => {
    const newShowSpan = [...subspaceSettings.showSpan];
    newShowSpan[index] = !newShowSpan[index];
    updateSubspaceSettings({ showSpan: newShowSpan });
  };

  // Get selected vectors
  const selectedVectors = mode === '2d' 
    ? vectors2D.filter((_, i) => subspaceSettings.showSpan[i])
    : vectors3D.filter((_, i) => subspaceSettings.showSpan[i]);

  // Check linear independence
  const isIndependent = mode === '2d'
    ? isLinearlyIndependent2D(selectedVectors)
    : isLinearlyIndependent3D(selectedVectors);

  return (
    <div className="subspace-controls p-4 bg-white rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4">Subspace Visualization</h3>
      
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Toggle Vector Spans:</h4>
        <div className="space-y-2">
          {(mode === '2d' ? vectors2D : vectors3D).map((vector, index) => (
            <button
              key={index}
              onClick={() => toggleSpan(index)}
              className={`w-full flex items-center justify-between p-2 rounded transition-colors ${
                subspaceSettings.showSpan[index]
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-700'
              } hover:bg-purple-50`}
            >
              <div className="flex items-center">
                {subspaceSettings.showSpan[index] ? (
                  <Eye size={16} className="mr-2" />
                ) : (
                  <EyeOff size={16} className="mr-2" />
                )}
                <span>
                  Vector {index + 1} Span
                </span>
              </div>
              <div className="text-sm">
                {mode === '2d' ? (
                  `(${vector.x.toFixed(1)}, ${vector.y.toFixed(1)})`
                ) : (
                  `(${vector.x.toFixed(1)}, ${vector.y.toFixed(1)}, ${(vector as any).z.toFixed(1)})`
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Linear Independence Status */}
      {selectedVectors.length > 1 && (
        <div className={`p-3 rounded-lg mb-4 ${
          isIndependent ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          <div className="flex items-center">
            <Info size={16} className="mr-2" />
            <span className="font-medium">
              {isIndependent 
                ? 'Selected vectors are linearly independent' 
                : 'Selected vectors are linearly dependent'}
            </span>
          </div>
        </div>
      )}
      
      <div className="p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">About Subspaces:</h4>
        <p className="text-sm text-gray-600">
          A subspace is a subset of a vector space that is closed under addition and scalar multiplication. 
          The span of a vector is the set of all its scalar multiples, forming a line through the origin.
          {mode === '3d' && ' In 3D, two linearly independent vectors span a plane.'}
        </p>
      </div>
    </div>
  );
};

export default SubspaceControls;