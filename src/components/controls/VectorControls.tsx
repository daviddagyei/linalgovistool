import React, { useState } from 'react';
import { Plus, Trash2, RotateCcw, Calculator } from 'lucide-react';
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

  // State for new vector input
  const [newVector, setNewVector] = useState<{
    x: string;
    y: string;
    z: string;
  }>({
    x: '',
    y: '',
    z: ''
  });

  // State for vector operations
  const [selectedVectors, setSelectedVectors] = useState<number[]>([]);
  const [scalarValue, setScalarValue] = useState<string>('1');
  const [showResult, setShowResult] = useState(false);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewVector({
      ...newVector,
      [name]: value
    });
  };

  // Add a new vector
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

  // Remove a vector and update selected indices
  const handleRemoveVector = (index: number) => {
    if (mode === '2d') {
      setVectors2D(vectors2D.filter((_, i) => i !== index));
    } else {
      setVectors3D(vectors3D.filter((_, i) => i !== index));
    }

    // Update selected vectors indices
    setSelectedVectors(prevSelected => 
      prevSelected
        .filter(i => i !== index) // Remove the deleted index
        .map(i => i > index ? i - 1 : i) // Adjust remaining indices
    );
  };

  // Reset to default vectors
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

  // Handle vector selection for operations
  const handleVectorSelect = (index: number) => {
    if (selectedVectors.includes(index)) {
      setSelectedVectors(selectedVectors.filter(i => i !== index));
    } else if (selectedVectors.length < 2) {
      setSelectedVectors([...selectedVectors, index]);
    }
  };

  // Perform vector addition
  const handleVectorAddition = () => {
    if (selectedVectors.length !== 2) return;

    if (mode === '2d') {
      const result = addVectors2D(
        vectors2D[selectedVectors[0]],
        vectors2D[selectedVectors[1]]
      );
      setVectors2D([...vectors2D, result]);
    } else {
      const result = addVectors3D(
        vectors3D[selectedVectors[0]],
        vectors3D[selectedVectors[1]]
      );
      setVectors3D([...vectors3D, result]);
    }
    setShowResult(true);
  };

  // Perform vector subtraction
  const handleVectorSubtraction = () => {
    if (selectedVectors.length !== 2) return;

    if (mode === '2d') {
      const result: Vector2D = {
        x: vectors2D[selectedVectors[0]].x - vectors2D[selectedVectors[1]].x,
        y: vectors2D[selectedVectors[0]].y - vectors2D[selectedVectors[1]].y
      };
      setVectors2D([...vectors2D, result]);
    } else {
      const result: Vector3D = {
        x: vectors3D[selectedVectors[0]].x - vectors3D[selectedVectors[1]].x,
        y: vectors3D[selectedVectors[0]].y - vectors3D[selectedVectors[1]].y,
        z: vectors3D[selectedVectors[0]].z - vectors3D[selectedVectors[1]].z
      };
      setVectors3D([...vectors3D, result]);
    }
    setShowResult(true);
  };

  // Perform scalar multiplication
  const handleScalarMultiplication = () => {
    if (selectedVectors.length !== 1) return;
    const scalar = parseFloat(scalarValue);

    if (mode === '2d') {
      const result = scaleVector2D(vectors2D[selectedVectors[0]], scalar);
      setVectors2D([...vectors2D, result]);
    } else {
      const result = scaleVector3D(vectors3D[selectedVectors[0]], scalar);
      setVectors3D([...vectors3D, result]);
    }
    setShowResult(true);
  };

  return (
    <div className="vector-controls p-4 bg-white rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4">Vectors</h3>
      
      {/* Current vectors list */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Current Vectors:</h4>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {mode === '2d' ? (
            vectors2D.map((vector, index) => (
              <div 
                key={index} 
                className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                  selectedVectors.includes(index)
                    ? 'bg-blue-100 border-2 border-blue-500'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
                onClick={() => handleVectorSelect(index)}
              >
                <span className="text-sm">
                  v<sub>{index+1}</sub> = ({vector.x.toFixed(2)}, {vector.y.toFixed(2)})
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveVector(index);
                  }}
                  className="text-red-500 hover:text-red-700 focus:outline-none"
                  aria-label="Remove vector"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          ) : (
            vectors3D.map((vector, index) => (
              <div 
                key={index}
                className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                  selectedVectors.includes(index)
                    ? 'bg-blue-100 border-2 border-blue-500'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
                onClick={() => handleVectorSelect(index)}
              >
                <span className="text-sm">
                  v<sub>{index+1}</sub> = ({vector.x.toFixed(2)}, {vector.y.toFixed(2)}, {vector.z.toFixed(2)})
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveVector(index);
                  }}
                  className="text-red-500 hover:text-red-700 focus:outline-none"
                  aria-label="Remove vector"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Vector operations */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Vector Operations:</h4>
        <div className="space-y-2">
          <button
            onClick={handleVectorAddition}
            disabled={selectedVectors.length !== 2}
            className={`w-full flex items-center justify-center p-2 rounded ${
              selectedVectors.length === 2
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Plus size={16} className="mr-1" />
            Add Selected Vectors
          </button>
          <button
            onClick={handleVectorSubtraction}
            disabled={selectedVectors.length !== 2}
            className={`w-full flex items-center justify-center p-2 rounded ${
              selectedVectors.length === 2
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Calculator size={16} className="mr-1" />
            Subtract Selected Vectors
          </button>
          <div className="flex space-x-2">
            <input
              type="number"
              value={scalarValue}
              onChange={(e) => setScalarValue(e.target.value)}
              className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Scalar value"
            />
            <button
              onClick={handleScalarMultiplication}
              disabled={selectedVectors.length !== 1}
              className={`flex-1 flex items-center justify-center p-2 rounded ${
                selectedVectors.length === 1
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Calculator size={16} className="mr-1" />
              Scale Vector
            </button>
          </div>
        </div>
      </div>
      
      {/* Add new vector form */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Add New Vector:</h4>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label htmlFor="x-input" className="sr-only">X</label>
            <input
              id="x-input"
              type="number"
              name="x"
              value={newVector.x}
              onChange={handleInputChange}
              placeholder="X"
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="y-input" className="sr-only">Y</label>
            <input
              id="y-input"
              type="number"
              name="y"
              value={newVector.y}
              onChange={handleInputChange}
              placeholder="Y"
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {mode === '3d' && (
            <div>
              <label htmlFor="z-input" className="sr-only">Z</label>
              <input
                id="z-input"
                type="number"
                name="z"
                value={newVector.z}
                onChange={handleInputChange}
                placeholder="Z"
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
        <button
          onClick={handleAddVector}
          className="mt-2 w-full flex items-center justify-center p-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus size={16} className="mr-1" />
          Add Vector
        </button>
      </div>
      
      {/* Reset button */}
      <button
        onClick={handleReset}
        className="w-full flex items-center justify-center p-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
      >
        <RotateCcw size={16} className="mr-1" />
        Reset to Default
      </button>
    </div>
  );
};

export default VectorControls;