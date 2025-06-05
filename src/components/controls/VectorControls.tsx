import React, { useState } from 'react';
import { Plus, Trash2, RotateCcw, Calculator, Move, ArrowRight } from 'lucide-react';
import { useVisualizer } from '../../context/VisualizerContext';
import { Vector2D, Vector3D } from '../../types';
import { addVectors2D, addVectors3D, scaleVector2D, scaleVector3D } from '../../utils/mathUtils';
import VectorExpressionCalculator from './VectorExpressionCalculator';

const VectorControls: React.FC = () => {
  const { 
    mode,
    vectors2D,
    setVectors2D,
    vectors3D,
    setVectors3D
  } = useVisualizer();

  const [activeTab, setActiveTab] = useState<'basic' | 'expression'>('basic');
  const [newVector, setNewVector] = useState<{
    x: string;
    y: string;
    z: string;
  }>({
    x: '',
    y: '',
    z: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewVector({
      ...newVector,
      [name]: value
    });
  };

  const handleAddVector = () => {
    const x = parseFloat(newVector.x || '0');
    const y = parseFloat(newVector.y || '0');
    
    if (mode === '2d') {
      const newVec: Vector2D = { x, y };
      setVectors2D([...vectors2D, newVec]);
    } else {
      const z = parseFloat(newVector.z || '0');
      const newVec: Vector3D = { x, y, z };
      setVectors3D([...vectors3D, newVec]);
    }
    
    setNewVector({ x: '', y: '', z: '' });
  };

  const handleRemoveVector = (index: number) => {
    if (mode === '2d') {
      setVectors2D(vectors2D.filter((_, i) => i !== index));
    } else {
      setVectors3D(vectors3D.filter((_, i) => i !== index));
    }
  };

  const handleReset = () => {
    if (mode === '2d') {
      setVectors2D([{ x: 1, y: 0 }, { x: 0, y: 1 }]);
    } else {
      setVectors3D([
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
        { x: 0, y: 0, z: 1 }
      ]);
    }
  };

  const vectors = mode === '2d' ? vectors2D : vectors3D;
  const vectorColors = ['#3366FF', '#FF6633', '#33CC99', '#9966FF', '#FF9933'];

  return (
    <div className="bg-white rounded-lg">
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('basic')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'basic'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Basic Controls
        </button>
        <button
          onClick={() => setActiveTab('expression')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'expression'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Expression Calculator
        </button>
      </div>

      <div className="p-4">
        {activeTab === 'basic' ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Current Vectors</h3>
              <div className="space-y-2">
                {vectors.map((vector, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center">
                      <div 
                        className="w-2 h-2 rounded-full mr-2"
                        style={{ backgroundColor: vectorColors[index % vectorColors.length] }}
                      />
                      <span className="font-medium text-gray-700">
                        v{index + 1} ({vector.x.toFixed(1)}, {vector.y.toFixed(1)}
                        {mode === '3d' && `, ${(vector as Vector3D).z.toFixed(1)}`})
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveVector(index)}
                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Add New Vector</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">X Component</label>
                  <input
                    type="number"
                    name="x"
                    value={newVector.x}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Y Component</label>
                  <input
                    type="number"
                    name="y"
                    value={newVector.y}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
                {mode === '3d' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Z Component</label>
                    <input
                      type="number"
                      name="z"
                      value={newVector.z}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                )}
              </div>
              <button
                onClick={handleAddVector}
                className="w-full mt-3 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={18} className="mr-2" />
                Add Vector
              </button>
            </div>

            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RotateCcw size={18} className="mr-2" />
              Reset to Default
            </button>
          </div>
        ) : (
          <VectorExpressionCalculator onClose={() => setActiveTab('basic')} />
        )}
      </div>
    </div>
  );
};

export default VectorControls;