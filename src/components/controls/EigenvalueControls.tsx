import React, { useState, useEffect } from 'react';
import { RotateCcw, RefreshCw, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useVisualizer } from '../../context/VisualizerContext';
import { linearAlgebraAPI } from '../../services/linearAlgebraAPI';
import { Matrix2D, Matrix3D, Vector2D, Vector3D, Eigenvalue, MatrixPreset } from '../../types';
import { loadingManager } from '../../utils/animationUtils';

const EigenvalueControls: React.FC = () => {
  const { 
    mode,
    matrix2D,
    setMatrix2D,
    matrix3D,
    setMatrix3D
  } = useVisualizer();

  const [eigenvalues, setEigenvalues] = useState<Eigenvalue[]>([]);
  const [matrixPresets, setMatrixPresets] = useState<MatrixPreset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guessVector, setGuessVector] = useState({ x: 1, y: 0, z: 0 });
  const [isEigenvectorGuess, setIsEigenvectorGuess] = useState(false);
  const [guessEigenvalue, setGuessEigenvalue] = useState<number | null>(null);
  const [showTransformation, setShowTransformation] = useState(true);
  const [animateTransformation, setAnimateTransformation] = useState(false);

  // Load matrix presets on component mount
  useEffect(() => {
    const loadPresets = async () => {
      try {
        const presets = await linearAlgebraAPI.getMatrixPresets();
        const relevantPresets = mode === '2d' ? presets['2d'] : presets['3d'];
        setMatrixPresets(relevantPresets);
      } catch (error) {
        console.error('Failed to load matrix presets:', error);
        setError('Failed to load matrix presets');
      }
    };
    loadPresets();
  }, [mode]);

  // Calculate eigenvalues whenever matrix changes
  useEffect(() => {
    const calculateEigenvalues = async () => {
      setIsCalculating(true);
      setError(null);
      
      // Register with loading manager
      loadingManager.setLoading('eigenvalue-calculation', true);
      
      try {
        const result = mode === '2d' 
          ? await linearAlgebraAPI.calculateEigenvalues2D(matrix2D)
          : await linearAlgebraAPI.calculateEigenvalues3D(matrix3D);
        
        // Convert backend eigenvalue format to frontend format
        const formattedEigenvalues: Eigenvalue[] = result.eigenvalues.map((eigenval, index) => {
          if (typeof eigenval === 'number') {
            return {
              value: eigenval,
              vector: result.eigenvectors[index] as Vector2D | Vector3D,
              isReal: true
            };
          } else {
            // Complex eigenvalue
            return {
              value: eigenval.real,
              vector: (result.eigenvectors[index] as any).real as Vector2D | Vector3D,
              isReal: false
            };
          }
        });
        
        setEigenvalues(formattedEigenvalues);
      } catch (error) {
        console.error('Error calculating eigenvalues:', error);
        setError('Failed to calculate eigenvalues');
        setEigenvalues([]);
      } finally {
        setIsCalculating(false);
        loadingManager.setLoading('eigenvalue-calculation', false);
      }
    };

    calculateEigenvalues();
  }, [matrix2D, matrix3D, mode]);

  // Check if guessed vector is an eigenvector
  useEffect(() => {
    const checkEigenvector = async () => {
      if (guessVector.x === 0 && guessVector.y === 0 && (mode === '2d' || guessVector.z === 0)) {
        setIsEigenvectorGuess(false);
        setGuessEigenvalue(null);
        return;
      }

      try {
        const vector = mode === '2d' 
          ? { x: guessVector.x, y: guessVector.y }
          : { x: guessVector.x, y: guessVector.y, z: guessVector.z };
        
        const result = await linearAlgebraAPI.checkEigenvector(
          mode === '2d' ? matrix2D : matrix3D,
          vector
        );
        
        setIsEigenvectorGuess(result.is_eigenvector);
        setGuessEigenvalue(result.eigenvalue);
      } catch (error) {
        console.error('Error checking eigenvector:', error);
        setIsEigenvectorGuess(false);
        setGuessEigenvalue(null);
      }
    };

    checkEigenvector();
  }, [guessVector, matrix2D, matrix3D, mode]);

  const handleMatrixChange2D = (row: number, col: number, value: string) => {
    const newMatrix = [...matrix2D] as Matrix2D;
    newMatrix[row][col] = parseFloat(value) || 0;
    setMatrix2D(newMatrix);
  };

  const handleMatrixChange3D = (row: number, col: number, value: string) => {
    const newMatrix = [...matrix3D] as Matrix3D;
    newMatrix[row][col] = parseFloat(value) || 0;
    setMatrix3D(newMatrix);
  };

  const handlePresetSelect = (preset: MatrixPreset) => {
    if (mode === '2d' && preset.matrix.length === 2) {
      setMatrix2D(preset.matrix as Matrix2D);
    } else if (mode === '3d' && preset.matrix.length === 3) {
      setMatrix3D(preset.matrix as Matrix3D);
    }
    setSelectedPreset(preset.name);
  };

  const handleReset = () => {
    if (mode === '2d') {
      setMatrix2D([[1, 0], [0, 1]]);
    } else {
      setMatrix3D([[1, 0, 0], [0, 1, 0], [0, 0, 1]]);
    }
    setSelectedPreset('');
    setGuessVector({ x: 1, y: 0, z: 0 });
  };

  const currentMatrix = mode === '2d' ? matrix2D : matrix3D;

  return (
    <div className="eigenvalue-controls p-4 bg-white rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4">Matrix & Eigenvalues</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center">
          <AlertCircle className="w-4 h-4 mr-2" />
          {error}
        </div>
      )}

      {/* Matrix Presets */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Matrix Presets:</h4>
        <div className="grid grid-cols-2 gap-2">
          {matrixPresets.map((preset, index) => (
            <button
              key={index}
              onClick={() => handlePresetSelect(preset)}
              className={`p-2 text-xs rounded transition-colors ${
                selectedPreset === preset.name
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Matrix Input */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Transformation Matrix:</h4>
        <div className="grid gap-2">
          {currentMatrix.map((row, i) => (
            <div key={i} className={`grid ${mode === '2d' ? 'grid-cols-2' : 'grid-cols-3'} gap-2`}>
              {row.map((value, j) => (
                <input
                  key={j}
                  type="number"
                  step="0.1"
                  value={value}
                  onChange={(e) => mode === '2d' 
                    ? handleMatrixChange2D(i, j, e.target.value)
                    : handleMatrixChange3D(i, j, e.target.value)
                  }
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Eigenvalues Display */}
      <div className="mb-4">
        <div className="flex items-center mb-2">
          <h4 className="text-sm font-medium text-gray-700">Eigenvalues & Eigenvectors:</h4>
          {isCalculating && <RefreshCw className="w-4 h-4 ml-2 animate-spin text-blue-500" />}
        </div>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {eigenvalues.length > 0 ? (
            eigenvalues.map((eigen, index) => (
              <div key={index} className="p-2 bg-gray-50 rounded border">
                <div className="text-sm font-medium text-blue-600">
                  λ{index + 1} = {eigen.value.toFixed(3)}
                </div>
                <div className="text-xs text-gray-600">
                  v = ({Object.values(eigen.vector).map((v: any) => v.toFixed(3)).join(', ')})
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500 italic">
              {isCalculating ? 'Calculating...' : 'No eigenvalues calculated'}
            </div>
          )}
        </div>
      </div>

      {/* Eigenvector Guessing */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Guess an Eigenvector:</h4>
        <div className="space-y-2">
          <div className={`grid ${mode === '2d' ? 'grid-cols-2' : 'grid-cols-3'} gap-2`}>
            <input
              type="number"
              step="0.1"
              value={guessVector.x}
              onChange={(e) => setGuessVector({...guessVector, x: parseFloat(e.target.value) || 0})}
              placeholder="x"
              className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <input
              type="number"
              step="0.1"
              value={guessVector.y}
              onChange={(e) => setGuessVector({...guessVector, y: parseFloat(e.target.value) || 0})}
              placeholder="y"
              className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
            />
            {mode === '3d' && (
              <input
                type="number"
                step="0.1"
                value={guessVector.z}
                onChange={(e) => setGuessVector({...guessVector, z: parseFloat(e.target.value) || 0})}
                placeholder="z"
                className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
              />
            )}
          </div>
          <div className="flex items-center p-2 rounded">
            {isEigenvectorGuess ? (
              <div className="flex items-center text-green-600">
                <CheckCircle className="w-4 h-4 mr-2" />
                <span className="text-sm">
                  Eigenvector! λ = {guessEigenvalue?.toFixed(3)}
                </span>
              </div>
            ) : (
              <div className="flex items-center text-gray-500">
                <AlertCircle className="w-4 h-4 mr-2" />
                <span className="text-sm">Not an eigenvector</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Visualization Options */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Visualization Options:</h4>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showTransformation}
              onChange={(e) => setShowTransformation(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">Show vector transformation</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={animateTransformation}
              onChange={(e) => setAnimateTransformation(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">Animate transformation</span>
          </label>
        </div>
      </div>

      {/* Reset Button */}
      <div className="flex gap-2">
        <button
          onClick={handleReset}
          className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm"
        >
          <RotateCcw className="w-4 h-4 mr-1" />
          Reset to Identity
        </button>
      </div>
    </div>
  );
};

export default EigenvalueControls;