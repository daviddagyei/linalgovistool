import React, { useState, useCallback, useEffect, useRef } from 'react';
import { RotateCcw, Calculator, Sliders, Grid, Edit3, Move } from 'lucide-react';
import { useVisualizer } from '../../context/VisualizerContext';
import { Matrix2D, Matrix3D } from '../../types';
import { SpringAnimator } from '../../utils/animationUtils';

// Matrix slider component for individual entries with smooth updates
const MatrixSlider: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}> = ({ label, value, onChange, min = -3, max = 3, step = 0.1, className = '' }) => {
  const [localValue, setLocalValue] = useState(value.toString());
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const springAnimator = useRef(new SpringAnimator(value, 0.3, 0.8));
  const animationFrame = useRef<number>();

  useEffect(() => {
    springAnimator.current.setTarget(value);
    
    const animate = () => {
      springAnimator.current.update();
      if (!springAnimator.current.isAtRest()) {
        animationFrame.current = requestAnimationFrame(animate);
      }
    };
    
    if (!isDragging) {
      animate();
    }
    
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [value, isDragging]);

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    setIsDragging(true);
    springAnimator.current.reset(newValue);
    onChange(newValue);
  }, [onChange]);

  const handleSliderMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setLocalValue(inputValue);
    
    const parsedValue = parseFloat(inputValue);
    if (!isNaN(parsedValue)) {
      onChange(parsedValue);
    }
  }, [onChange]);

  const handleInputBlur = useCallback(() => {
    const parsedValue = parseFloat(localValue);
    if (isNaN(parsedValue)) {
      setLocalValue(value.toFixed(1));
    }
  }, [localValue, value]);

  useEffect(() => {
    if (!isDragging) {
      setLocalValue(value.toFixed(1));
    }
  }, [value, isDragging]);

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-700">{label}</label>
        <input
          type="number"
          value={localValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={() => setIsHovered(true)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
            isHovered ? 'shadow-sm scale-105' : ''
          }`}
          step={step}
        />
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleSliderChange}
          onMouseUp={handleSliderMouseUp}
          onTouchEnd={handleSliderMouseUp}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer transition-all duration-200 transform ${
            isDragging 
              ? 'scale-105 shadow-md' 
              : isHovered 
                ? 'hover:bg-gray-300 hover:scale-102 shadow-sm' 
                : 'hover:bg-gray-300'
          }`}
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((value - min) / (max - min)) * 100}%, #e5e7eb ${((value - min) / (max - min)) * 100}%, #e5e7eb 100%)`,
            filter: isDragging ? 'brightness(1.1)' : isHovered ? 'brightness(1.05)' : 'none'
          }}
        />
        <div className="flex justify-between text-xs text-gray-400 mt-0.5">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>
    </div>
  );
};

// Matrix preset buttons with animations
const MatrixPresets: React.FC<{
  mode: '2d' | '3d';
  onPresetSelect: (matrix: Matrix2D | Matrix3D) => void;
}> = ({ mode, onPresetSelect }) => {
  const [loadingPreset, setLoadingPreset] = useState<string | null>(null);
  
  const presets2D = [
    { name: 'Identity', matrix: [[1, 0], [0, 1]] as Matrix2D, icon: '𝐈' },
    { name: 'Scale 2x', matrix: [[2, 0], [0, 2]] as Matrix2D, icon: '2×' },
    { name: 'Rotate 45°', matrix: [[0.707, -0.707], [0.707, 0.707]] as Matrix2D, icon: '↻' },
    { name: 'Shear X', matrix: [[1, 1], [0, 1]] as Matrix2D, icon: '⧨' },
    { name: 'Reflect X', matrix: [[1, 0], [0, -1]] as Matrix2D, icon: '⮁' },
    { name: 'Compress', matrix: [[0.5, 0], [0, 0.5]] as Matrix2D, icon: '↓' },
  ];

  const presets3D = [
    { name: 'Identity', matrix: [[1, 0, 0], [0, 1, 0], [0, 0, 1]] as Matrix3D, icon: '𝐈' },
    { name: 'Scale 2x', matrix: [[2, 0, 0], [0, 2, 0], [0, 0, 2]] as Matrix3D, icon: '2×' },
    { name: 'Rotate X', matrix: [[1, 0, 0], [0, 0.707, -0.707], [0, 0.707, 0.707]] as Matrix3D, icon: '↻ₓ' },
    { name: 'Rotate Y', matrix: [[0.707, 0, 0.707], [0, 1, 0], [-0.707, 0, 0.707]] as Matrix3D, icon: '↻ᵧ' },
    { name: 'Rotate Z', matrix: [[0.707, -0.707, 0], [0.707, 0.707, 0], [0, 0, 1]] as Matrix3D, icon: '↻ᵤ' },
    { name: 'Compress', matrix: [[0.5, 0, 0], [0, 0.5, 0], [0, 0, 0.5]] as Matrix3D, icon: '↓' },
  ];

  const presets = mode === '2d' ? presets2D : presets3D;

  const handlePresetClick = useCallback(async (preset: any) => {
    setLoadingPreset(preset.name);
    await new Promise(resolve => setTimeout(resolve, 150));
    onPresetSelect(preset.matrix);
    setLoadingPreset(null);
  }, [onPresetSelect]);

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-700 flex items-center">
        <Calculator className="w-4 h-4 mr-1" />
        Quick Presets
      </h4>
      <div className="grid grid-cols-2 gap-1.5">
        {presets.map((preset) => (
          <button
            key={preset.name}
            onClick={() => handlePresetClick(preset)}
            disabled={loadingPreset === preset.name}
            className={`group relative px-2 py-2 text-xs bg-gradient-to-br from-gray-50 to-gray-100 hover:from-blue-50 hover:to-blue-100 border border-gray-200 hover:border-blue-300 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${
              loadingPreset === preset.name ? 'animate-pulse scale-105' : ''
            }`}
            title={preset.name}
          >
            <div className="flex flex-col items-center space-y-0.5">
              <span className={`text-sm font-mono text-gray-600 group-hover:text-blue-600 transition-all duration-200 ${
                loadingPreset === preset.name ? 'animate-spin' : ''
              }`}>
                {preset.icon}
              </span>
              <span className="text-xs text-gray-600 group-hover:text-blue-600 truncate w-full text-center transition-colors duration-200">
                {preset.name}
              </span>
            </div>
            {loadingPreset === preset.name && (
              <div className="absolute inset-0 bg-blue-100 bg-opacity-50 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

// Main Matrix Controls Component
const MatrixControls: React.FC = () => {
  const { 
    mode, 
    matrix2D, 
    setMatrix2D, 
    matrix3D, 
    setMatrix3D 
  } = useVisualizer();

  const [controlMode, setControlMode] = useState<'sliders' | 'inputs'>('sliders');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleMatrix2DChange = useCallback((row: number, col: number, value: number) => {
    const newMatrix: Matrix2D = [
      [matrix2D[0][0], matrix2D[0][1]],
      [matrix2D[1][0], matrix2D[1][1]]
    ];
    newMatrix[row][col] = value;
    setMatrix2D(newMatrix);
  }, [matrix2D, setMatrix2D]);

  const handleMatrix3DChange = useCallback((row: number, col: number, value: number) => {
    const newMatrix: Matrix3D = [
      [matrix3D[0][0], matrix3D[0][1], matrix3D[0][2]],
      [matrix3D[1][0], matrix3D[1][1], matrix3D[1][2]],
      [matrix3D[2][0], matrix3D[2][1], matrix3D[2][2]]
    ];
    newMatrix[row][col] = value;
    setMatrix3D(newMatrix);
  }, [matrix3D, setMatrix3D]);

  const handlePresetSelect = useCallback((matrix: Matrix2D | Matrix3D) => {
    if (mode === '2d') {
      setMatrix2D(matrix as Matrix2D);
    } else {
      setMatrix3D(matrix as Matrix3D);
    }
  }, [mode, setMatrix2D, setMatrix3D]);

  const handleReset = useCallback(() => {
    if (mode === '2d') {
      setMatrix2D([[1, 0], [0, 1]]);
    } else {
      setMatrix3D([[1, 0, 0], [0, 1, 0], [0, 0, 1]]);
    }
  }, [mode, setMatrix2D, setMatrix3D]);

  // Calculate determinant
  const calculateDeterminant = () => {
    if (mode === '2d') {
      return matrix2D[0][0] * matrix2D[1][1] - matrix2D[0][1] * matrix2D[1][0];
    } else {
      return (
        matrix3D[0][0] * (matrix3D[1][1] * matrix3D[2][2] - matrix3D[1][2] * matrix3D[2][1]) -
        matrix3D[0][1] * (matrix3D[1][0] * matrix3D[2][2] - matrix3D[1][2] * matrix3D[2][0]) +
        matrix3D[0][2] * (matrix3D[1][0] * matrix3D[2][1] - matrix3D[1][1] * matrix3D[2][0])
      );
    }
  };

  const determinant = calculateDeterminant();

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-100">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Move className="w-6 h-6 mr-2 text-blue-600" />
            Matrix Controls
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({mode === '2d' ? '2×2' : '3×3'})
            </span>
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setControlMode(controlMode === 'sliders' ? 'inputs' : 'sliders')}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
              title={`Switch to ${controlMode === 'sliders' ? 'inputs' : 'sliders'}`}
            >
              {controlMode === 'sliders' ? <Edit3 className="w-4 h-4" /> : <Sliders className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors duration-200 md:hidden"
              title={isCollapsed ? 'Expand' : 'Collapse'}
            >
              <Grid className={`w-4 h-4 transition-transform duration-200 ${isCollapsed ? 'rotate-45' : ''}`} />
            </button>
          </div>
        </div>

        {/* Control Mode Toggle */}
        <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setControlMode('sliders')}
            className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md transition-all duration-200 ${
              controlMode === 'sliders'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Sliders className="w-4 h-4 mr-2" />
            Sliders
          </button>
          <button
            onClick={() => setControlMode('inputs')}
            className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md transition-all duration-200 ${
              controlMode === 'inputs'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Direct Input
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={`p-6 space-y-6 transition-all duration-300 ${isCollapsed ? 'max-h-0 overflow-hidden md:max-h-none md:overflow-visible' : 'max-h-none'}`}>
        {/* Matrix Controls */}
        {controlMode === 'sliders' ? (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700 flex items-center">
              <Sliders className="w-4 h-4 mr-1" />
              Matrix Entries
            </h4>
            
            {mode === '2d' ? (
              <div className="grid grid-cols-2 gap-4">
                <MatrixSlider
                  label="a₁₁"
                  value={matrix2D[0][0]}
                  onChange={(value) => handleMatrix2DChange(0, 0, value)}
                />
                <MatrixSlider
                  label="a₁₂"
                  value={matrix2D[0][1]}
                  onChange={(value) => handleMatrix2DChange(0, 1, value)}
                />
                <MatrixSlider
                  label="a₂₁"
                  value={matrix2D[1][0]}
                  onChange={(value) => handleMatrix2DChange(1, 0, value)}
                />
                <MatrixSlider
                  label="a₂₂"
                  value={matrix2D[1][1]}
                  onChange={(value) => handleMatrix2DChange(1, 1, value)}
                />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: 9 }, (_, index) => {
                  const row = Math.floor(index / 3);
                  const col = index % 3;
                  return (
                    <MatrixSlider
                      key={`${row}-${col}`}
                      label={`a${row + 1}${col + 1}`}
                      value={matrix3D[row][col]}
                      onChange={(value) => handleMatrix3DChange(row, col, value)}
                      className="text-xs"
                    />
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700 flex items-center">
              <Edit3 className="w-4 h-4 mr-1" />
              Matrix Grid
            </h4>
            
            {mode === '2d' ? (
              <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 rounded-lg">
                {matrix2D.map((row, rowIndex) =>
                  row.map((value, colIndex) => (
                    <div key={`${rowIndex}-${colIndex}`} className="relative group">
                      <input
                        type="number"
                        value={value.toFixed(2)}
                        onChange={(e) => handleMatrix2DChange(rowIndex, colIndex, parseFloat(e.target.value) || 0)}
                        className="w-full p-2 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 group-hover:border-blue-300"
                        step="0.1"
                      />
                      <span className="absolute -top-2 -left-2 text-xs font-medium text-gray-500 bg-white px-1">
                        a{rowIndex + 1}{colIndex + 1}
                      </span>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 p-4 bg-gray-50 rounded-lg">
                {matrix3D.map((row, rowIndex) =>
                  row.map((value, colIndex) => (
                    <div key={`${rowIndex}-${colIndex}`} className="relative group">
                      <input
                        type="number"
                        value={value.toFixed(2)}
                        onChange={(e) => handleMatrix3DChange(rowIndex, colIndex, parseFloat(e.target.value) || 0)}
                        className="w-full p-2 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 group-hover:border-blue-300"
                        step="0.1"
                      />
                      <span className="absolute -top-2 -left-2 text-xs font-medium text-gray-500 bg-white px-1">
                        a{rowIndex + 1}{colIndex + 1}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Matrix Preview */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Matrix Preview</h4>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium text-gray-700">Current Matrix</div>
              <div className="text-sm">
                <span className="text-gray-500">det = </span>
                <span className={determinant >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {determinant.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -left-3 top-1/2 transform -translate-y-1/2 text-2xl text-gray-400">[</div>
              <div className="absolute -right-3 top-1/2 transform -translate-y-1/2 text-2xl text-gray-400">]</div>
              <div className="px-4">
                {mode === '2d' ? (
                  <div className="grid grid-cols-2 gap-2 font-mono">
                    {matrix2D.map((row, i) => (
                      <div key={i} className="flex justify-around">
                        {row.map((value, j) => (
                          <div
                            key={j}
                            className="w-16 text-center py-1 font-medium text-gray-700"
                          >
                            {value.toFixed(2)}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 font-mono">
                    {matrix3D.map((row, i) => (
                      <div key={i} className="flex justify-around">
                        {row.map((value, j) => (
                          <div
                            key={j}
                            className="w-16 text-center py-1 font-medium text-gray-700"
                          >
                            {value.toFixed(2)}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500 text-center">
              {determinant > 1 ? 'Expansion' : determinant < 1 && determinant > 0 ? 'Compression' : determinant < 0 ? 'Reflection' : 'Singular'}
            </div>
          </div>
        </div>

        {/* Matrix Presets */}
        <MatrixPresets mode={mode} onPresetSelect={handlePresetSelect} />

        {/* Reset Button */}
        <button
          onClick={handleReset}
          className="w-full flex items-center justify-center p-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
        >
          <RotateCcw size={16} className="mr-2" />
          Reset to Identity
        </button>
      </div>
    </div>
  );
};

export default MatrixControls;