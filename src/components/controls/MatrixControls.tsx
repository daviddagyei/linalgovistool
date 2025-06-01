import React, { useState, useCallback } from 'react';
import { Grid, Calculator, RotateCcw, Sliders, Eye, EyeOff } from 'lucide-react';
import { useVisualizer } from '../../context/VisualizerContext';
import { Matrix2D, Matrix3D } from '../../types';

// Matrix input component with visual feedback
const MatrixInput: React.FC<{
  value: number;
  onChange: (value: number) => void;
  label?: string;
  className?: string;
}> = ({ value, onChange, label, className = '' }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="absolute -top-2 left-2 px-1 text-xs font-medium text-gray-600 bg-white">
          {label}
        </label>
      )}
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`w-full p-2 text-center border rounded-lg transition-all duration-200 ${
          isFocused
            ? 'border-blue-500 ring-2 ring-blue-100'
            : 'border-gray-200 hover:border-gray-300'
        }`}
        step="0.1"
      />
    </div>
  );
};

// Matrix preset button with animation
const PresetButton: React.FC<{
  name: string;
  icon: string;
  onClick: () => void;
  isLoading?: boolean;
}> = ({ name, icon, onClick, isLoading }) => (
  <button
    onClick={onClick}
    disabled={isLoading}
    className={`group relative p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 transition-all duration-200 ${
      isLoading
        ? 'opacity-75 cursor-wait'
        : 'hover:border-blue-300 hover:from-blue-50 hover:to-blue-100 hover:scale-105'
    }`}
  >
    <div className="flex flex-col items-center space-y-1">
      <span className={`text-xl font-mono ${isLoading ? 'animate-spin' : ''}`}>
        {icon}
      </span>
      <span className="text-xs font-medium text-gray-700 group-hover:text-blue-700">
        {name}
      </span>
    </div>
    {isLoading && (
      <div className="absolute inset-0 bg-white bg-opacity-50 rounded-lg flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )}
  </button>
);

const MatrixControls: React.FC = () => {
  const { 
    mode, 
    matrix2D, 
    setMatrix2D, 
    matrix3D, 
    setMatrix3D 
  } = useVisualizer();

  const [activeView, setActiveView] = useState<'grid' | 'sliders'>('grid');
  const [loadingPreset, setLoadingPreset] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);

  // Matrix presets
  const presets2D = [
    { name: 'Identity', matrix: [[1, 0], [0, 1]] as Matrix2D, icon: '𝐈' },
    { name: 'Scale 2×', matrix: [[2, 0], [0, 2]] as Matrix2D, icon: '2×' },
    { name: 'Rotate 45°', matrix: [[0.707, -0.707], [0.707, 0.707]] as Matrix2D, icon: '↻' },
    { name: 'Shear', matrix: [[1, 1], [0, 1]] as Matrix2D, icon: '⧨' },
    { name: 'Reflect', matrix: [[1, 0], [0, -1]] as Matrix2D, icon: '⮁' },
    { name: 'Compress', matrix: [[0.5, 0], [0, 0.5]] as Matrix2D, icon: '↓' }
  ];

  const presets3D = [
    { name: 'Identity', matrix: [[1, 0, 0], [0, 1, 0], [0, 0, 1]] as Matrix3D, icon: '𝐈' },
    { name: 'Scale 2×', matrix: [[2, 0, 0], [0, 2, 0], [0, 0, 2]] as Matrix3D, icon: '2×' },
    { name: 'Rotate X', matrix: [[1, 0, 0], [0, 0.707, -0.707], [0, 0.707, 0.707]] as Matrix3D, icon: '↻ₓ' },
    { name: 'Rotate Y', matrix: [[0.707, 0, 0.707], [0, 1, 0], [-0.707, 0, 0.707]] as Matrix3D, icon: '↻ᵧ' },
    { name: 'Rotate Z', matrix: [[0.707, -0.707, 0], [0.707, 0.707, 0], [0, 0, 1]] as Matrix3D, icon: '↻ᵤ' },
    { name: 'Compress', matrix: [[0.5, 0, 0], [0, 0.5, 0], [0, 0, 0.5]] as Matrix3D, icon: '↓' }
  ];

  const handlePresetClick = async (preset: any) => {
    setLoadingPreset(preset.name);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (mode === '2d') {
      setMatrix2D(preset.matrix as Matrix2D);
    } else {
      setMatrix3D(preset.matrix as Matrix3D);
    }
    
    setLoadingPreset(null);
  };

  const handleMatrixChange = (row: number, col: number, value: number) => {
    if (mode === '2d') {
      const newMatrix = [...matrix2D] as Matrix2D;
      newMatrix[row][col] = value;
      setMatrix2D(newMatrix);
    } else {
      const newMatrix = [...matrix3D] as Matrix3D;
      newMatrix[row][col] = value;
      setMatrix3D(newMatrix);
    }
  };

  const handleReset = () => {
    if (mode === '2d') {
      setMatrix2D([[1, 0], [0, 1]]);
    } else {
      setMatrix3D([[1, 0, 0], [0, 1, 0], [0, 0, 1]]);
    }
  };

  const currentMatrix = mode === '2d' ? matrix2D : matrix3D;
  const matrixSize = mode === '2d' ? 2 : 3;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <Grid className="w-6 h-6 mr-2 text-blue-600" />
            Matrix Transformation
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveView(activeView === 'grid' ? 'sliders' : 'grid')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title={`Switch to ${activeView === 'grid' ? 'sliders' : 'grid'} view`}
            >
              {activeView === 'grid' ? (
                <Sliders className="w-5 h-5 text-gray-600" />
              ) : (
                <Grid className="w-5 h-5 text-gray-600" />
              )}
            </button>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title={showPreview ? 'Hide preview' : 'Show preview'}
            >
              {showPreview ? (
                <Eye className="w-5 h-5 text-gray-600" />
              ) : (
                <EyeOff className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        <div className="text-sm text-gray-600 flex items-center">
          <Calculator className="w-4 h-4 mr-1" />
          {mode === '2d' ? '2×2' : '3×3'} transformation matrix
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Matrix Input */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Matrix Values</h3>
          <div className="grid gap-4">
            {Array.from({ length: matrixSize }).map((_, row) => (
              <div key={row} className={`grid grid-cols-${matrixSize} gap-4`}>
                {Array.from({ length: matrixSize }).map((_, col) => (
                  <MatrixInput
                    key={`${row}-${col}`}
                    value={currentMatrix[row][col]}
                    onChange={(value) => handleMatrixChange(row, col, value)}
                    label={`a${row + 1}${col + 1}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Matrix Preview */}
        {showPreview && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Preview</h3>
            <div className="p-4 bg-gray-50 rounded-lg font-mono text-sm">
              {currentMatrix.map((row, i) => (
                <div key={i} className="flex justify-center">
                  [{row.map(val => val.toFixed(2)).join(' ')}]
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Presets */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Presets</h3>
          <div className="grid grid-cols-3 gap-2">
            {(mode === '2d' ? presets2D : presets3D).map((preset) => (
              <PresetButton
                key={preset.name}
                name={preset.name}
                icon={preset.icon}
                onClick={() => handlePresetClick(preset)}
                isLoading={loadingPreset === preset.name}
              />
            ))}
          </div>
        </div>

        {/* Reset Button */}
        <button
          onClick={handleReset}
          className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
        >
          <RotateCcw size={18} className="mr-2" />
          Reset to Identity
        </button>
      </div>
    </div>
  );
};

export default MatrixControls;