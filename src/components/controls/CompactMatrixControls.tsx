import React, { useState } from 'react';
import { Edit3, RotateCcw, Calculator } from 'lucide-react';
import { useVisualizer } from '../../context/VisualizerContext';
import { Matrix2D, Matrix3D } from '../../types';
import Modal from '../ui/Modal';

const CompactMatrixControls: React.FC = () => {
  const { 
    mode, 
    matrix2D, 
    setMatrix2D, 
    matrix3D, 
    setMatrix3D 
  } = useVisualizer();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPresetsModalOpen, setIsPresetsModalOpen] = useState(false);
  const [tempMatrix, setTempMatrix] = useState<Matrix2D | Matrix3D>(mode === '2d' ? matrix2D : matrix3D);

  const currentMatrix = mode === '2d' ? matrix2D : matrix3D;

  const presets2D = [
    { name: 'Identity', matrix: [[1, 0], [0, 1]] as Matrix2D },
    { name: 'Scale 2x', matrix: [[2, 0], [0, 2]] as Matrix2D },
    { name: 'Rotate 45°', matrix: [[0.707, -0.707], [0.707, 0.707]] as Matrix2D },
    { name: 'Shear X', matrix: [[1, 1], [0, 1]] as Matrix2D },
    { name: 'Reflect X', matrix: [[1, 0], [0, -1]] as Matrix2D },
    { name: 'Compress', matrix: [[0.5, 0], [0, 0.5]] as Matrix2D },
  ];

  const presets3D = [
    { name: 'Identity', matrix: [[1, 0, 0], [0, 1, 0], [0, 0, 1]] as Matrix3D },
    { name: 'Scale 2x', matrix: [[2, 0, 0], [0, 2, 0], [0, 0, 2]] as Matrix3D },
    { name: 'Rotate X', matrix: [[1, 0, 0], [0, 0.707, -0.707], [0, 0.707, 0.707]] as Matrix3D },
    { name: 'Rotate Y', matrix: [[0.707, 0, 0.707], [0, 1, 0], [-0.707, 0, 0.707]] as Matrix3D },
    { name: 'Rotate Z', matrix: [[0.707, -0.707, 0], [0.707, 0.707, 0], [0, 0, 1]] as Matrix3D },
    { name: 'Compress', matrix: [[0.5, 0, 0], [0, 0.5, 0], [0, 0, 0.5]] as Matrix3D },
  ];

  const presets = mode === '2d' ? presets2D : presets3D;

  const handleReset = () => {
    if (mode === '2d') {
      setMatrix2D([[1, 0], [0, 1]]);
    } else {
      setMatrix3D([[1, 0, 0], [0, 1, 0], [0, 0, 1]]);
    }
  };

  const handleMatrixEdit = () => {
    setTempMatrix(currentMatrix);
    setIsEditModalOpen(true);
  };

  const handleSaveMatrix = () => {
    if (mode === '2d') {
      setMatrix2D(tempMatrix as Matrix2D);
    } else {
      setMatrix3D(tempMatrix as Matrix3D);
    }
    setIsEditModalOpen(false);
  };

  const handleMatrixChange = (row: number, col: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    const newMatrix = [...tempMatrix];
    newMatrix[row][col] = numValue;
    setTempMatrix(newMatrix as Matrix2D | Matrix3D);
  };

  const handlePresetSelect = (preset: any) => {
    if (mode === '2d') {
      setMatrix2D(preset.matrix);
    } else {
      setMatrix3D(preset.matrix);
    }
    setIsPresetsModalOpen(false);
  };

  const matrixToString = (matrix: Matrix2D | Matrix3D) => {
    return matrix.map(row => 
      `[${row.map(val => val.toFixed(2)).join(', ')}]`
    ).join('\n');
  };

  return (
    <div className="space-y-4">
      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleMatrixEdit}
          className="flex items-center justify-center p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition-colors"
        >
          <Edit3 className="w-4 h-4 mr-2" />
          Edit Matrix
        </button>
        
        <button
          onClick={() => setIsPresetsModalOpen(true)}
          className="flex items-center justify-center p-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg border border-green-200 transition-colors"
        >
          <Calculator className="w-4 h-4 mr-2" />
          Presets
        </button>
      </div>

      <button
        onClick={handleReset}
        className="w-full flex items-center justify-center p-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg border border-gray-200 transition-colors text-sm"
      >
        <RotateCcw className="w-4 h-4 mr-2" />
        Reset to Identity
      </button>

      {/* Current Matrix Display */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Current Matrix</h4>
        <div className="bg-gray-50 p-3 rounded-lg border">
          <pre className="text-xs font-mono text-gray-700 leading-relaxed">
            {matrixToString(currentMatrix)}
          </pre>
        </div>
      </div>

      {/* Matrix Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit ${mode.toUpperCase()} Matrix`}
        size="sm"
      >
        <div className="space-y-4">
          <div className="grid gap-2">
            {tempMatrix.map((row, rowIndex) => (
              <div key={rowIndex} className="grid gap-2" style={{gridTemplateColumns: `repeat(${row.length}, 1fr)`}}>
                {row.map((value, colIndex) => (
                  <input
                    key={`${rowIndex}-${colIndex}`}
                    type="number"
                    value={value}
                    onChange={(e) => handleMatrixChange(rowIndex, colIndex, e.target.value)}
                    className="w-full px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    step="0.1"
                  />
                ))}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveMatrix}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      </Modal>

      {/* Presets Modal */}
      <Modal
        isOpen={isPresetsModalOpen}
        onClose={() => setIsPresetsModalOpen(false)}
        title="Matrix Presets"
        size="md"
      >
        <div className="grid grid-cols-2 gap-3">
          {presets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handlePresetSelect(preset)}
              className="p-4 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg transition-colors text-left"
            >
              <div className="font-medium text-gray-900 mb-2">{preset.name}</div>
              <pre className="text-xs font-mono text-gray-600 leading-tight">
                {matrixToString(preset.matrix)}
              </pre>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default CompactMatrixControls;
