import React, { useState, useEffect } from 'react';
import { RotateCcw, RefreshCw, AlertCircle, CheckCircle, Loader2, Move, Eye, EyeOff } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'matrix' | 'eigen' | 'visual'>('matrix');

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

  useEffect(() => {
    const calculateEigenvalues = async () => {
      setIsCalculating(true);
      setError(null);
      
      loadingManager.setLoading('eigenvalue-calculation', true);
      
      try {
        const result = mode === '2d' 
          ? await linearAlgebraAPI.calculateEigenvalues2D(matrix2D)
          : await linearAlgebraAPI.calculateEigenvalues3D(matrix3D);
        
        const formattedEigenvalues: Eigenvalue[] = result.eigenvalues.map((eigenval, index) => {
          if (typeof eigenval === 'number') {
            return {
              value: eigenval,
              vector: result.eigenvectors[index] as Vector2D | Vector3D,
              isReal: true
            };
          } else {
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
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-100">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
          <Move className="w-6 h-6 mr-2 text-blue-600" />
          Eigenvalue Analysis
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({mode === '2d' ? '2×2' : '3×3'})
          </span>
        </h2>

        {/* Tab Navigation */}
        <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex-1 px-4 py-2 rounded-md transition-all duration-200 ${
              activeTab === 'matrix'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Matrix
          </button>
          <button
            onClick={() => setActiveTab('eigen')}
            className={`flex-1 px-4 py-2 rounded-md transition-all duration-200 ${
              activeTab === 'eigen'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Eigenvalues
          </button>
          <button
            onClick={() => setActiveTab('visual')}
            className={`flex-1 px-4 py-2 rounded-md transition-all duration-200 ${
              activeTab === 'visual'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Visualization
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
            <div>
              <h4 className="text-red-800 font-medium">Error</h4>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {activeTab === 'matrix' && (
          <>
            {/* Matrix Input */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Matrix Input</h3>
              <div className={`grid ${mode === '2d' ? 'grid-cols-2' : 'grid-cols-3'} gap-3`}>
                {currentMatrix.map((row, i) => (
                  row.map((value, j) => (
                    <div key={`${i}-${j}`} className="relative group">
                      <input
                        type="number"
                        value={value}
                        onChange={(e) => mode === '2d' 
                          ? handleMatrixChange2D(i, j, e.target.value)
                          : handleMatrixChange3D(i, j, e.target.value)
                        }
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        step="0.1"
                      />
                      <span className="absolute -top-2 -left-2 text-xs font-medium text-gray-500 bg-white px-1">
                        a{i + 1}{j + 1}
                      </span>
                    </div>
                  ))
                ))}
              </div>
            </div>

            {/* Matrix Presets */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Quick Presets</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {matrixPresets.map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => handlePresetSelect(preset)}
                    className={`p-3 rounded-lg border transition-all duration-200 ${
                      selectedPreset === preset.name
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50'
                    }`}
                  >
                    <div className="text-sm font-medium">{preset.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{preset.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'eigen' && (
          <>
            {/* Eigenvalues Display */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">Eigenvalues & Eigenvectors</h3>
                {isCalculating && (
                  <div className="flex items-center text-blue-600">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span className="text-sm">Calculating...</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                {eigenvalues.map((eigen, index) => (
                  <div key={index} className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-blue-600">
                        λ{index + 1} = {eigen.value.toFixed(3)}
                      </span>
                      {eigen.isReal ? (
                        <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                          Real
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-full">
                          Complex
                        </span>
                      )}
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      v{index + 1} = ({Object.values(eigen.vector).map(v => v.toFixed(3)).join(', ')})
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Eigenvector Guess */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Eigenvector Check</h3>
              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <div className={`grid ${mode === '2d' ? 'grid-cols-2' : 'grid-cols-3'} gap-3 mb-4`}>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">X Component</label>
                    <input
                      type="number"
                      value={guessVector.x}
                      onChange={(e) => setGuessVector({...guessVector, x: parseFloat(e.target.value) || 0})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Y Component</label>
                    <input
                      type="number"
                      value={guessVector.y}
                      onChange={(e) => setGuessVector({...guessVector, y: parseFloat(e.target.value) || 0})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      step="0.1"
                    />
                  </div>
                  {mode === '3d' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Z Component</label>
                      <input
                        type="number"
                        value={guessVector.z}
                        onChange={(e) => setGuessVector({...guessVector, z: parseFloat(e.target.value) || 0})}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        step="0.1"
                      />
                    </div>
                  )}
                </div>

                <div className={`p-3 rounded-lg ${
                  isEigenvectorGuess ? 'bg-green-50' : 'bg-gray-50'
                }`}>
                  {isEigenvectorGuess ? (
                    <div className="flex items-center text-green-700">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      <span className="font-medium">
                        Eigenvector! λ = {guessEigenvalue?.toFixed(3)}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center text-gray-600">
                      <AlertCircle className="w-5 h-5 mr-2" />
                      <span>Not an eigenvector</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'visual' && (
          <>
            {/* Visualization Options */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Display Options</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setShowTransformation(!showTransformation)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
                    showTransformation
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'border-gray-200 hover:border-blue-200'
                  }`}
                >
                  <span className="font-medium">Show Transformation</span>
                  {showTransformation ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>

                <button
                  onClick={() => setAnimateTransformation(!animateTransformation)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
                    animateTransformation
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'border-gray-200 hover:border-blue-200'
                  }`}
                >
                  <span className="font-medium">Animate Transformation</span>
                  {animateTransformation ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Visualization Guide</h4>
              <ul className="space-y-2 text-sm text-blue-600">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                  Original vectors are shown in solid lines
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                  Transformed vectors are shown in dashed lines
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                  Eigenvectors are highlighted in distinct colors
                </li>
              </ul>
            </div>
          </>
        )}

        {/* Reset Button */}
        <button
          onClick={handleReset}
          className="w-full flex items-center justify-center p-3 mt-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200"
        >
          <RotateCcw size={18} className="mr-2" />
          Reset to Identity
        </button>
      </div>
    </div>
  );
};

export default EigenvalueControls;