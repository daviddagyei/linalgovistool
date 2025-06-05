import React, { useState } from 'react';
import { Compass, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { useVisualizer } from '../../context/VisualizerContext';
import Modal from '../ui/Modal';

const CompactBasisControls: React.FC = () => {
  const { 
    mode,
    basisSettings,
    updateBasisSettings
  } = useVisualizer();

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const toggleCustomBasis = () => {
    updateBasisSettings({ 
      customBasis: !basisSettings.customBasis 
    });
  };

  const toggleCoordinates = () => {
    updateBasisSettings({ 
      showCoordinates: !basisSettings.showCoordinates 
    });
  };

  const resetToStandard = () => {
    updateBasisSettings({
      customBasis: false,
      showCoordinates: true,
      basisVectors: mode === '2d' 
        ? [{ x: 1, y: 0 }, { x: 0, y: 1 }]
        : [{ x: 1, y: 0 }, { x: 0, y: 1 }] // Will be properly typed
    });
  };

  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setIsSettingsModalOpen(true)}
          className="flex items-center justify-center p-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-200 transition-colors"
        >
          <Compass className="w-4 h-4 mr-2" />
          Settings
        </button>
        
        <button
          onClick={resetToStandard}
          className="flex items-center justify-center p-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg border border-gray-200 transition-colors"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </button>
      </div>

      {/* Quick Toggles */}
      <div className="space-y-2">
        <button
          onClick={toggleCustomBasis}
          className={`w-full flex items-center justify-between p-2 rounded-lg border transition-colors ${
            basisSettings.customBasis
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
          }`}
        >
          <span className="text-sm font-medium">Custom Basis</span>
          {basisSettings.customBasis ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>

        <button
          onClick={toggleCoordinates}
          className={`w-full flex items-center justify-between p-2 rounded-lg border transition-colors ${
            basisSettings.showCoordinates
              ? 'bg-purple-50 border-purple-200 text-purple-700'
              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
          }`}
        >
          <span className="text-sm font-medium">Show Coordinates</span>
          {basisSettings.showCoordinates ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
      </div>

      {/* Summary Info */}
      <div className="p-3 bg-gray-50 rounded-lg border">
        <div className="text-xs text-gray-600 space-y-1">
          <div className="font-medium">Current Settings:</div>
          <div>Custom Basis: {basisSettings.customBasis ? '✓ Active' : '✗ Standard'}</div>
          <div>Coordinates: {basisSettings.showCoordinates ? '✓ Visible' : '✗ Hidden'}</div>
          <div>Mode: {mode.toUpperCase()}</div>
        </div>
      </div>

      {/* Settings Modal */}
      <Modal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        title="Basis Visualization Settings"
        size="sm"
      >
        <div className="space-y-6">
          {/* Display Options */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-800">Basis Display</h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-gray-700">Custom Basis</div>
                  <div className="text-xs text-gray-500">Use alternative basis vectors</div>
                </div>
                <button
                  onClick={toggleCustomBasis}
                  className={`w-10 h-6 rounded-full transition-colors duration-300 ${
                    basisSettings.customBasis ? 'bg-green-600' : 'bg-gray-300'
                  } relative`}
                >
                  <div className={`absolute w-4 h-4 rounded-full bg-white top-1 transition-all duration-300 ${
                    basisSettings.customBasis ? 'right-1' : 'left-1'
                  } shadow-md`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-gray-700">Show Coordinates</div>
                  <div className="text-xs text-gray-500">Display coordinate representations</div>
                </div>
                <button
                  onClick={toggleCoordinates}
                  className={`w-10 h-6 rounded-full transition-colors duration-300 ${
                    basisSettings.showCoordinates ? 'bg-purple-600' : 'bg-gray-300'
                  } relative`}
                >
                  <div className={`absolute w-4 h-4 rounded-full bg-white top-1 transition-all duration-300 ${
                    basisSettings.showCoordinates ? 'right-1' : 'left-1'
                  } shadow-md`} />
                </button>
              </div>
            </div>
          </div>

          {/* Current Basis Vectors */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-800">Current Basis Vectors</h4>
            <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
              <div className="text-sm text-indigo-800 space-y-2">
                {basisSettings.basisVectors.map((vector, index) => (
                  <div key={index} className="font-mono text-xs">
                    e{index + 1}: ({vector.x.toFixed(2)}, {vector.y.toFixed(2)})
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Information */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-800">
              <div className="font-medium mb-2">About Basis Vectors</div>
              <div className="text-xs space-y-1">
                <div>• Basis vectors span the entire space</div>
                <div>• Any vector can be written as their combination</div>
                <div>• Different bases show different perspectives</div>
              </div>
            </div>
          </div>

          <button
            onClick={resetToStandard}
            className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Reset to Standard Settings
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default CompactBasisControls;
