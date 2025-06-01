import React from 'react';
import { RotateCcw, Eye, EyeOff } from 'lucide-react';
import { useVisualizer } from '../../context/VisualizerContext';
import { Vector2D, Vector3D } from '../../types';

const BasisControls: React.FC = () => {
  const { 
    mode,
    basisSettings,
    updateBasisSettings,
    vectors2D,
    changeBasis,
    basisSettings3D,
    updateBasisSettings3D,
    vectors3D,
    changeBasis3D
  } = useVisualizer();

  const handleBasisToggle = () => {
    if (mode === '2d') {
      updateBasisSettings({ 
        customBasis: !basisSettings.customBasis 
      });
    } else {
      updateBasisSettings3D({
        customBasis: !basisSettings3D.customBasis
      });
    }
  };

  const handleCoordinatesToggle = () => {
    if (mode === '2d') {
      updateBasisSettings({ 
        showCoordinates: !basisSettings.showCoordinates 
      });
    } else {
      updateBasisSettings3D({
        showCoordinates: !basisSettings3D.showCoordinates
      });
    }
  };

  const handleBasisVectorChange2D = (index: number, component: 'x' | 'y', value: string) => {
    const newValue = parseFloat(value) || 0;
    const newBasisVectors = [...basisSettings.basisVectors];
    newBasisVectors[index] = {
      ...newBasisVectors[index],
      [component]: newValue
    };
    updateBasisSettings({ basisVectors: newBasisVectors });
  };

  const handleBasisVectorChange3D = (index: number, component: 'x' | 'y' | 'z', value: string) => {
    const newValue = parseFloat(value) || 0;
    const newBasisVectors = [...basisSettings3D.basisVectors];
    newBasisVectors[index] = {
      ...newBasisVectors[index],
      [component]: newValue
    };
    updateBasisSettings3D({ basisVectors: newBasisVectors });
  };

  const handleReset = () => {
    if (mode === '2d') {
      updateBasisSettings({
        customBasis: false,
        basisVectors: [
          { x: 1, y: 0 },
          { x: 0, y: 1 }
        ]
      });
    } else {
      updateBasisSettings3D({
        customBasis: false,
        basisVectors: [
          { x: 1, y: 0, z: 0 },
          { x: 0, y: 1, z: 0 },
          { x: 0, y: 0, z: 1 }
        ]
      });
    }
  };

  return (
    <div className="basis-controls p-4 bg-white rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4">Basis Settings</h3>
      
      {/* Toggle custom basis */}
      <div className="mb-4">
        <button
          onClick={handleBasisToggle}
          className={`w-full flex items-center justify-between p-2 rounded transition-colors ${
            (mode === '2d' ? basisSettings.customBasis : basisSettings3D.customBasis)
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-700'
          } hover:bg-blue-50`}
        >
          <span>Use Custom Basis</span>
          {(mode === '2d' ? basisSettings.customBasis : basisSettings3D.customBasis) ? (
            <Eye size={16} />
          ) : (
            <EyeOff size={16} />
          )}
        </button>
      </div>

      {/* Basis vectors input */}
      {(mode === '2d' ? basisSettings.customBasis : basisSettings3D.customBasis) && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Basis Vectors:</h4>
          <div className="space-y-2">
            {mode === '2d' ? (
              // 2D Basis Vectors
              basisSettings.basisVectors.map((vector, index) => (
                <div key={index} className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-600">e{index + 1}.x</label>
                    <input
                      type="number"
                      value={vector.x}
                      onChange={(e) => handleBasisVectorChange2D(index, 'x', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">e{index + 1}.y</label>
                    <input
                      type="number"
                      value={vector.y}
                      onChange={(e) => handleBasisVectorChange2D(index, 'y', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ))
            ) : (
              // 3D Basis Vectors
              basisSettings3D.basisVectors.map((vector, index) => (
                <div key={index} className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-gray-600">e{index + 1}.x</label>
                    <input
                      type="number"
                      value={vector.x}
                      onChange={(e) => handleBasisVectorChange3D(index, 'x', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">e{index + 1}.y</label>
                    <input
                      type="number"
                      value={vector.y}
                      onChange={(e) => handleBasisVectorChange3D(index, 'y', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">e{index + 1}.z</label>
                    <input
                      type="number"
                      value={vector.z}
                      onChange={(e) => handleBasisVectorChange3D(index, 'z', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Show coordinates toggle */}
      <div className="mb-4">
        <button
          onClick={handleCoordinatesToggle}
          className={`w-full flex items-center justify-between p-2 rounded transition-colors ${
            (mode === '2d' ? basisSettings.showCoordinates : basisSettings3D.showCoordinates)
              ? 'bg-purple-100 text-purple-700'
              : 'bg-gray-100 text-gray-700'
          } hover:bg-purple-50`}
        >
          <span>Show Coordinates in New Basis</span>
          {(mode === '2d' ? basisSettings.showCoordinates : basisSettings3D.showCoordinates) ? (
            <Eye size={16} />
          ) : (
            <EyeOff size={16} />
          )}
        </button>
      </div>

      {/* Vector coordinates in new basis */}
      {((mode === '2d' ? basisSettings.customBasis : basisSettings3D.customBasis) && 
        (mode === '2d' ? basisSettings.showCoordinates : basisSettings3D.showCoordinates)) && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Coordinates in New Basis:</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {mode === '2d' ? (
              // 2D Coordinates
              vectors2D.map((vector, index) => {
                const newCoords = changeBasis(vector);
                return (
                  <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                    <span className="font-medium">v{index + 1}</span>: (
                    {newCoords.x.toFixed(2)}, {newCoords.y.toFixed(2)})
                  </div>
                );
              })
            ) : (
              // 3D Coordinates
              vectors3D.map((vector, index) => {
                const newCoords = changeBasis3D(vector);
                return (
                  <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                    <span className="font-medium">v{index + 1}</span>: (
                    {newCoords.x.toFixed(2)}, {newCoords.y.toFixed(2)}, {newCoords.z.toFixed(2)})
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Reset button */}
      <button
        onClick={handleReset}
        className="w-full flex items-center justify-center p-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
      >
        <RotateCcw size={16} className="mr-1" />
        Reset to Standard Basis
      </button>
    </div>
  );
};

export default BasisControls;