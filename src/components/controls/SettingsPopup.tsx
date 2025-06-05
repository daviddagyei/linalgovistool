import React, { useState } from 'react';
import { Settings, Grid, Box, Eye, EyeOff } from 'lucide-react';
import { useVisualizer } from '../../context/VisualizerContext';
import Modal from '../ui/Modal';

const SettingsPopup: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { settings, updateSettings } = useVisualizer();

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
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
        title="Display Settings"
      >
        <Settings className="w-4 h-4" />
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Display Settings"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <Grid className="w-5 h-5 mr-3 text-gray-600" />
              <span className="text-sm font-medium">Show Grid</span>
            </div>
            <button
              onClick={toggleGrid}
              className={`w-12 h-6 rounded-full transition-colors duration-300 ${
                settings.showGrid ? 'bg-blue-600' : 'bg-gray-300'
              } relative`}
            >
              <div className={`absolute w-4 h-4 rounded-full bg-white top-1 transition-all duration-300 ${
                settings.showGrid ? 'right-1' : 'left-1'
              } shadow-md`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <Box className="w-5 h-5 mr-3 text-gray-600" />
              <span className="text-sm font-medium">Show Axes</span>
            </div>
            <button
              onClick={toggleAxes}
              className={`w-12 h-6 rounded-full transition-colors duration-300 ${
                settings.showAxes ? 'bg-blue-600' : 'bg-gray-300'
              } relative`}
            >
              <div className={`absolute w-4 h-4 rounded-full bg-white top-1 transition-all duration-300 ${
                settings.showAxes ? 'right-1' : 'left-1'
              } shadow-md`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
            <div className="flex items-center">
              {settings.showLabels ? (
                <Eye className="w-5 h-5 mr-3 text-gray-600" />
              ) : (
                <EyeOff className="w-5 h-5 mr-3 text-gray-600" />
              )}
              <span className="text-sm font-medium">Show Labels</span>
            </div>
            <button
              onClick={toggleLabels}
              className={`w-12 h-6 rounded-full transition-colors duration-300 ${
                settings.showLabels ? 'bg-blue-600' : 'bg-gray-300'
              } relative`}
            >
              <div className={`absolute w-4 h-4 rounded-full bg-white top-1 transition-all duration-300 ${
                settings.showLabels ? 'right-1' : 'left-1'
              } shadow-md`} />
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default SettingsPopup;
