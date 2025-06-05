import React, { useState } from 'react';
import { Activity, Eye, EyeOff } from 'lucide-react';
import { useVisualizer } from '../../context/VisualizerContext';
import Modal from '../ui/Modal';

const CompactEigenvalueControls: React.FC = () => {
  const { 
    mode,
    eigenvalueSettings,
    updateEigenvalueSettings
  } = useVisualizer();

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const toggleEigenvectors = () => {
    updateEigenvalueSettings({ 
      showEigenvectors: !eigenvalueSettings.showEigenvectors 
    });
  };

  const toggleEigenvalues = () => {
    updateEigenvalueSettings({ 
      showEigenvalues: !eigenvalueSettings.showEigenvalues 
    });
  };

  const toggleAnimation = () => {
    updateEigenvalueSettings({ 
      animateTransformation: !eigenvalueSettings.animateTransformation 
    });
  };

  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-2">
        <button
          onClick={() => setIsSettingsModalOpen(true)}
          className="flex items-center justify-center p-3 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg border border-orange-200 transition-colors"
        >
          <Activity className="w-4 h-4 mr-2" />
          Eigenvalue Settings
        </button>
      </div>

      {/* Quick Toggles */}
      <div className="space-y-2">
        <button
          onClick={toggleEigenvectors}
          className={`w-full flex items-center justify-between p-2 rounded-lg border transition-colors ${
            eigenvalueSettings.showEigenvectors
              ? 'bg-blue-50 border-blue-200 text-blue-700'
              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
          }`}
        >
          <span className="text-sm font-medium">Show Eigenvectors</span>
          {eigenvalueSettings.showEigenvectors ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>

        <button
          onClick={toggleEigenvalues}
          className={`w-full flex items-center justify-between p-2 rounded-lg border transition-colors ${
            eigenvalueSettings.showEigenvalues
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
          }`}
        >
          <span className="text-sm font-medium">Show Eigenvalues</span>
          {eigenvalueSettings.showEigenvalues ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>

        <button
          onClick={toggleAnimation}
          className={`w-full flex items-center justify-between p-2 rounded-lg border transition-colors ${
            eigenvalueSettings.animateTransformation
              ? 'bg-purple-50 border-purple-200 text-purple-700'
              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
          }`}
        >
          <span className="text-sm font-medium">Animate Transformation</span>
          <div className={`w-8 h-4 rounded-full transition-colors duration-300 ${
            eigenvalueSettings.animateTransformation ? 'bg-purple-600' : 'bg-gray-300'
          } relative`}>
            <div className={`absolute w-3 h-3 rounded-full bg-white top-0.5 transition-all duration-300 ${
              eigenvalueSettings.animateTransformation ? 'right-0.5' : 'left-0.5'
            } shadow-sm`} />
          </div>
        </button>
      </div>

      {/* Summary Info */}
      <div className="p-3 bg-gray-50 rounded-lg border">
        <div className="text-xs text-gray-600 space-y-1">
          <div className="font-medium">Current Mode: {mode.toUpperCase()}</div>
          <div>Visualizing eigenvalues and eigenvectors</div>
        </div>
      </div>

      {/* Settings Modal */}
      <Modal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        title="Eigenvalue Visualization Settings"
        size="sm"
      >
        <div className="space-y-6">
          {/* Display Options */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-800">Display Options</h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-gray-700">Show Eigenvectors</div>
                  <div className="text-xs text-gray-500">Display the eigenvector directions</div>
                </div>
                <button
                  onClick={toggleEigenvectors}
                  className={`w-10 h-6 rounded-full transition-colors duration-300 ${
                    eigenvalueSettings.showEigenvectors ? 'bg-blue-600' : 'bg-gray-300'
                  } relative`}
                >
                  <div className={`absolute w-4 h-4 rounded-full bg-white top-1 transition-all duration-300 ${
                    eigenvalueSettings.showEigenvectors ? 'right-1' : 'left-1'
                  } shadow-md`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-gray-700">Show Eigenvalues</div>
                  <div className="text-xs text-gray-500">Display eigenvalue information</div>
                </div>
                <button
                  onClick={toggleEigenvalues}
                  className={`w-10 h-6 rounded-full transition-colors duration-300 ${
                    eigenvalueSettings.showEigenvalues ? 'bg-green-600' : 'bg-gray-300'
                  } relative`}
                >
                  <div className={`absolute w-4 h-4 rounded-full bg-white top-1 transition-all duration-300 ${
                    eigenvalueSettings.showEigenvalues ? 'right-1' : 'left-1'
                  } shadow-md`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-gray-700">Animate Transformation</div>
                  <div className="text-xs text-gray-500">Show transformation animation</div>
                </div>
                <button
                  onClick={toggleAnimation}
                  className={`w-10 h-6 rounded-full transition-colors duration-300 ${
                    eigenvalueSettings.animateTransformation ? 'bg-purple-600' : 'bg-gray-300'
                  } relative`}
                >
                  <div className={`absolute w-4 h-4 rounded-full bg-white top-1 transition-all duration-300 ${
                    eigenvalueSettings.animateTransformation ? 'right-1' : 'left-1'
                  } shadow-md`} />
                </button>
              </div>
            </div>
          </div>

          {/* Information */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-800">
              <div className="font-medium mb-2">About Eigenvalues</div>
              <div className="text-xs space-y-1">
                <div>• Eigenvalues represent scaling factors</div>
                <div>• Eigenvectors show direction of transformation</div>
                <div>• Eigenspace contains all eigenvectors</div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CompactEigenvalueControls;
