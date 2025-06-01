import React, { useState } from 'react';
import { Plus, Trash2, RotateCcw, Calculator, Move } from 'lucide-react';
import { useVisualizer } from '../../context/VisualizerContext';
import { Vector2D, Vector3D } from '../../types';
import { addVectors2D, addVectors3D, scaleVector2D, scaleVector3D } from '../../utils/mathUtils';

const VectorControls: React.FC = () => {
  const { 
    mode, 
    vectors2D, 
    setVectors2D, 
    vectors3D, 
    setVectors3D 
  } = useVisualizer();

  const [newVector, setNewVector] = useState<{
    x: string;
    y: string;
    z: string;
  }>({
    x: '',
    y: '',
    z: ''
  });

  const [selectedVectors, setSelectedVectors] = useState<number[]>([]);
  const [scalarValue, setScalarValue] = useState<string>('1');
  const [showResult, setShowResult] = useState(false);
  const [activeTab, setActiveTab] = useState<'add' | 'transform'>('add');

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
    setSelectedVectors(prevSelected => 
      prevSelected
        .filter(i => i !== index)
        .map(i => i > index ? i - 1 : i)
    );
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
    setSelectedVectors([]);
    setShowResult(false);
  };

  const handleVectorSelect = (index: number) => {
    if (selectedVectors.includes(index)) {
      setSelectedVectors(selectedVectors.filter(i => i !== index));
    } else if (selectedVectors.length < 2) {
      setSelectedVectors([...selectedVectors, index]);
    }
  };

  const handleVectorOperation = (operation: 'add' | 'subtract' | 'scale') => {
    if (operation === 'scale' && selectedVectors.length !== 1) return;
    if ((operation === 'add' || operation === 'subtract') && selectedVectors.length !== 2) return;

    const scalar = parseFloat(scalarValue);

    if (mode === '2d') {
      let result: Vector2D;
      if (operation === 'scale') {
        result = scaleVector2D(vectors2D[selectedVectors[0]], scalar);
      } else {
        const v1 = vectors2D[selectedVectors[0]];
        const v2 = vectors2D[selectedVectors[1]];
        result = operation === 'add' 
          ? addVectors2D(v1, v2)
          : addVectors2D(v1, scaleVector2D(v2, -1));
      }
      setVectors2D([...vectors2D, result]);
    } else {
      let result: Vector3D;
      if (operation === 'scale') {
        result = scaleVector3D(vectors3D[selectedVectors[0]], scalar);
      } else {
        const v1 = vectors3D[selectedVectors[0]];
        const v2 = vectors3D[selectedVectors[1]];
        result = operation === 'add'
          ? addVectors3D(v1, v2)
          : addVectors3D(v1, scaleVector3D(v2, -1));
      }
      setVectors3D([...vectors3D, result]);
    }
    setShowResult(true);
  };

  const vectors = mode === '2d' ? vectors2D : vectors3D;

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-100">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
          <Move className="w-6 h-6 mr-2 text-blue-600" />
          Vector Operations
        </h2>
        
        {/* Tab Navigation */}
        <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('add')}
            className={`flex-1 px-4 py-2 rounded-md transition-all duration-200 ${
              activeTab === 'add'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Add Vector
          </button>
          <button
            onClick={() => setActiveTab('transform')}
            className={`flex-1 px-4 py-2 rounded-md transition-all duration-200 ${
              activeTab === 'transform'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Transform
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Vector List */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Current Vectors</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {vectors.map((vector, index) => (
              <div
                key={index}
                onClick={() => handleVectorSelect(index)}
                className={`group flex items-center justify-between p-3 rounded-lg transition-all duration-200 cursor-pointer ${
                  selectedVectors.includes(index)
                    ? 'bg-blue-50 border-2 border-blue-200'
                    : 'bg-white border border-gray-200 hover:border-blue-200 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    selectedVectors.includes(index) ? 'bg-blue-500' : 'bg-gray-300'
                  }`} />
                  <span className="font-medium text-gray-700">
                    v{index + 1} = ({vector.x.toFixed(2)}, {vector.y.toFixed(2)}
                    {mode === '3d' && `, ${(vector as Vector3D).z.toFixed(2)}`})
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveVector(index);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity duration-200"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {activeTab === 'add' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Add New Vector</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">X Component</label>
                <input
                  type="number"
                  name="x"
                  value={newVector.x}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="0"
                  />
                </div>
              )}
            </div>
            <button
              onClick={handleAddVector}
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <Plus size={18} className="mr-2" />
              Add Vector
            </button>
          </div>
        )}

        {activeTab === 'transform' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Vector Operations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => handleVectorOperation('add')}
                disabled={selectedVectors.length !== 2}
                className={`flex items-center justify-center px-4 py-2 rounded-lg transition-all duration-200 ${
                  selectedVectors.length === 2
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Plus size={18} className="mr-2" />
                Add Vectors
              </button>
              <button
                onClick={() => handleVectorOperation('subtract')}
                disabled={selectedVectors.length !== 2}
                className={`flex items-center justify-center px-4 py-2 rounded-lg transition-all duration-200 ${
                  selectedVectors.length === 2
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Calculator size={18} className="mr-2" />
                Subtract Vectors
              </button>
            </div>
            
            <div className="flex space-x-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">Scalar Value</label>
                <input
                  type="number"
                  value={scalarValue}
                  onChange={(e) => setScalarValue(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter scalar value"
                />
              </div>
              <button
                onClick={() => handleVectorOperation('scale')}
                disabled={selectedVectors.length !== 1}
                className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg transition-all duration-200 ${
                  selectedVectors.length === 1
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Calculator size={18} className="mr-2" />
                Scale Vector
              </button>
            </div>
          </div>
        )}

        {/* Reset Button */}
        <button
          onClick={handleReset}
          className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
        >
          <RotateCcw size={18} className="mr-2" />
          Reset to Default
        </button>
      </div>
    </div>
  );
};

export default VectorControls;