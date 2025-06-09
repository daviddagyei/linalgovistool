import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import { 
  Vector2D, 
  Vector3D, 
  Matrix2D, 
  Matrix3D, 
  VisualizationMode, 
  VisualizationTool,
  VisualizationSettings,
  SubspaceSettings,
  BasisSettings,
  BasisSettings3D,
  Eigenvalue,
  EigenvalueSettings,
  MatrixPreset
} from '../types';
import { 
  transitionManager 
} from '../utils/animationUtils';
import { 
  serializeState, 
  deserializeState, 
  validateSharedState 
} from '../utils/shareUtils';

interface VisualizerContextType {
  mode: VisualizationMode;
  setMode: (mode: VisualizationMode) => void;
  
  tool: VisualizationTool;
  setTool: (tool: VisualizationTool) => void;
  
  vectors2D: Vector2D[];
  setVectors2D: (vectors: Vector2D[]) => void;
  addVector2D: (vector: Vector2D) => void;
  
  vectors3D: Vector3D[];
  setVectors3D: (vectors: Vector3D[]) => void;
  addVector3D: (vector: Vector3D) => void;
  
  matrix2D: Matrix2D;
  setMatrix2D: (matrix: Matrix2D) => void;
  
  matrix3D: Matrix3D;
  setMatrix3D: (matrix: Matrix3D) => void;
  
  settings: VisualizationSettings;
  updateSettings: (settings: Partial<VisualizationSettings>) => void;
  
  subspaceSettings: SubspaceSettings;
  updateSubspaceSettings: (settings: Partial<SubspaceSettings>) => void;

  basisSettings: BasisSettings;
  updateBasisSettings: (settings: Partial<BasisSettings>) => void;
  changeBasis: (vector: Vector2D) => Vector2D;
  changeBasisInverse: (vector: Vector2D) => Vector2D;

  basisSettings3D: BasisSettings3D;
  updateBasisSettings3D: (settings: Partial<BasisSettings3D>) => void;
  changeBasis3D: (vector: Vector3D) => Vector3D;
  changeBasisInverse3D: (vector: Vector3D) => Vector3D;

  // Eigenvalue-related state and functions
  eigenvalues2D: Eigenvalue[];
  setEigenvalues2D: (eigenvalues: Eigenvalue[]) => void;
  
  eigenvalues3D: Eigenvalue[];
  setEigenvalues3D: (eigenvalues: Eigenvalue[]) => void;
  
  eigenvalueSettings: EigenvalueSettings;
  updateEigenvalueSettings: (settings: Partial<EigenvalueSettings>) => void;
  
  matrixPresets: MatrixPreset[];
  setMatrixPresets: (presets: MatrixPreset[]) => void;
  setMatrixPreset: (preset: MatrixPreset) => void;
  addMatrixPreset: (preset: MatrixPreset) => void;
  removeMatrixPreset: (preset: MatrixPreset) => void;
  
  selectedPreset: MatrixPreset | null;
  setSelectedPreset: (preset: MatrixPreset | null) => void;
  
  guessVector: Vector2D | Vector3D | null;
  setGuessVector: (vector: Vector2D | Vector3D | null) => void;
  
  transformedGuessVector: Vector2D | Vector3D | null;
  setTransformedGuessVector: (vector: Vector2D | Vector3D | null) => void;
  
  isEigenvectorGuess: boolean;
  setIsEigenvectorGuess: (isEigen: boolean) => void;
  
  guessEigenvalue: number | null;
  setGuessEigenvalue: (value: number | null) => void;
  
  // Share functionality
  getShareableState: () => any;
  loadSharedState: (sharedState: any) => boolean;
}

const defaultMatrix2D: Matrix2D = [
  [1, 0],
  [0, 1]
];

const defaultMatrix3D: Matrix3D = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1]
];

const defaultSettings: VisualizationSettings = {
  showGrid: true,
  showAxes: true,
  showLabels: true,
  showVectorTails: false,
  animationSpeed: 1,
  colorScheme: 'default'
};

const defaultSubspaceSettings: SubspaceSettings = {
  showSpan: [true, false, false],
  showPlane: true,
  showBasis: true
};

const defaultBasisSettings: BasisSettings = {
  customBasis: false,
  basisVectors: [
    { x: 1, y: 0 },
    { x: 0, y: 1 }
  ],
  showCoordinates: true
};

const defaultBasisSettings3D: BasisSettings3D = {
  customBasis: false,
  basisVectors: [
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
    { x: 0, y: 0, z: 1 }
  ],
  showCoordinates: true
};

const defaultEigenvalueSettings: EigenvalueSettings = {
  showEigenvectors: true,
  showEigenvalues: true,
  showTransformation: true,
  animateTransformation: false,
  highlightAlignment: true,
  tolerance: 1e-6
};

const VisualizerContext = createContext<VisualizerContextType | undefined>(undefined);

export const VisualizerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mode, setModeInternal] = useState<VisualizationMode>('2d');
  const [tool, setToolInternal] = useState<VisualizationTool>('vector');
  const [vectors2D, setVectors2D] = useState<Vector2D[]>([{ x: 1, y: 0 }, { x: 0, y: 1 }]);
  const [vectors3D, setVectors3D] = useState<Vector3D[]>([
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
    { x: 0, y: 0, z: 1 }
  ]);
  const [matrix2D, setMatrix2DInternal] = useState<Matrix2D>(defaultMatrix2D);
  const [matrix3D, setMatrix3DInternal] = useState<Matrix3D>(defaultMatrix3D);
  const [settings, setSettings] = useState<VisualizationSettings>(defaultSettings);
  const [subspaceSettings, setSubspaceSettings] = useState<SubspaceSettings>(defaultSubspaceSettings);
  const [basisSettings, setBasisSettings] = useState<BasisSettings>(defaultBasisSettings);
  const [basisSettings3D, setBasisSettings3D] = useState<BasisSettings3D>(defaultBasisSettings3D);
  const [eigenvalues2D, setEigenvalues2D] = useState<Eigenvalue[]>([]);
  const [eigenvalues3D, setEigenvalues3D] = useState<Eigenvalue[]>([]);
  const [eigenvalueSettings, setEigenvalueSettings] = useState<EigenvalueSettings>(defaultEigenvalueSettings);
  const [matrixPresets, setMatrixPresets] = useState<MatrixPreset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<MatrixPreset | null>(null);
  const [guessVector, setGuessVector] = useState<Vector2D | Vector3D | null>(null);
  const [transformedGuessVector, setTransformedGuessVector] = useState<Vector2D | Vector3D | null>(null);
  const [isEigenvectorGuess, setIsEigenvectorGuess] = useState<boolean>(false);
  const [guessEigenvalue, setGuessEigenvalue] = useState<number | null>(null);

  // Enhanced setters with animation support
  const setMode = useCallback((newMode: VisualizationMode) => {
    if (newMode !== mode) {
      transitionManager.setState('mode', newMode);
      setModeInternal(newMode);
    }
  }, [mode]);

  const setTool = useCallback((newTool: VisualizationTool) => {
    if (newTool !== tool) {
      transitionManager.setState('tool', newTool);
      setToolInternal(newTool);
    }
  }, [tool]);

  const setMatrix2D = useCallback((newMatrix: Matrix2D) => {
    transitionManager.setState('matrix2D', newMatrix);
    setMatrix2DInternal(newMatrix);
  }, []);

  const setMatrix3D = useCallback((newMatrix: Matrix3D) => {
    transitionManager.setState('matrix3D', newMatrix);
    setMatrix3DInternal(newMatrix);
  }, []);

  const addVector2D = useCallback((vector: Vector2D) => {
    setVectors2D(prev => [...prev, vector]);
    setSubspaceSettings((prev: SubspaceSettings) => ({
      ...prev,
      showSpan: [...prev.showSpan, false]
    }));
  }, []);

  const addVector3D = useCallback((vector: Vector3D) => {
    setVectors3D(prev => [...prev, vector]);
    setSubspaceSettings((prev: SubspaceSettings) => ({
      ...prev,
      showSpan: [...prev.showSpan, false]
    }));
  }, []);

  const updateSettings = useCallback((newSettings: Partial<VisualizationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const updateSubspaceSettings = useCallback((newSettings: Partial<SubspaceSettings>) => {
    setSubspaceSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const updateBasisSettings = useCallback((newSettings: Partial<BasisSettings>) => {
    setBasisSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const updateBasisSettings3D = useCallback((newSettings: Partial<BasisSettings3D>) => {
    setBasisSettings3D(prev => ({ ...prev, ...newSettings }));
  }, []);

  const updateEigenvalueSettings = useCallback((newSettings: Partial<EigenvalueSettings>) => {
    setEigenvalueSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const setMatrixPreset = (preset: MatrixPreset) => {
    setSelectedPreset(preset);
    if (preset.matrix2D) setMatrix2D(preset.matrix2D);
    if (preset.matrix3D) setMatrix3D(preset.matrix3D);
    if (preset.vectors2D) setVectors2D(preset.vectors2D);
    if (preset.vectors3D) setVectors3D(preset.vectors3D);
    if (preset.settings) setSettings(preset.settings);
    if (preset.subspaceSettings) setSubspaceSettings(preset.subspaceSettings);
    if (preset.basisSettings) setBasisSettings(preset.basisSettings);
    if (preset.basisSettings3D) setBasisSettings3D(preset.basisSettings3D);
    if (preset.eigenvalues2D) setEigenvalues2D(preset.eigenvalues2D);
    if (preset.eigenvalues3D) setEigenvalues3D(preset.eigenvalues3D);
    if (preset.eigenvalueSettings) setEigenvalueSettings(preset.eigenvalueSettings);
  };

  const addMatrixPreset = (preset: MatrixPreset) => {
    setMatrixPresets([...matrixPresets, preset]);
  };

  const removeMatrixPreset = (preset: MatrixPreset) => {
    setMatrixPresets(matrixPresets.filter((p: MatrixPreset) => p !== preset));
  };

  // Change coordinates from standard basis to custom basis (2D) - memoized for performance
  const changeBasis = useCallback((vector: Vector2D): Vector2D => {
    if (!basisSettings.customBasis) return vector;

    const { basisVectors } = basisSettings;
    const det = basisVectors[0].x * basisVectors[1].y - basisVectors[0].y * basisVectors[1].x;
    
    if (Math.abs(det) < 1e-10) return vector; // Avoid division by zero for linearly dependent basis

    // Solve the system of equations to find coordinates in new basis
    const x = (vector.x * basisVectors[1].y - vector.y * basisVectors[1].x) / det;
    const y = (-vector.x * basisVectors[0].y + vector.y * basisVectors[0].x) / det;

    return { x, y };
  }, [basisSettings]);

  // Change coordinates from custom basis back to standard basis (2D) - memoized for performance
  const changeBasisInverse = useCallback((vector: Vector2D): Vector2D => {
    if (!basisSettings.customBasis) return vector;

    const { basisVectors } = basisSettings;
    return {
      x: vector.x * basisVectors[0].x + vector.y * basisVectors[1].x,
      y: vector.x * basisVectors[0].y + vector.y * basisVectors[1].y
    };
  }, [basisSettings]);

  // Change coordinates from standard basis to custom basis (3D) - memoized for performance
  const changeBasis3D = useCallback((vector: Vector3D): Vector3D => {
    if (!basisSettings3D.customBasis) return vector;

    const { basisVectors } = basisSettings3D;
    const matrix = [
      [basisVectors[0].x, basisVectors[1].x, basisVectors[2].x],
      [basisVectors[0].y, basisVectors[1].y, basisVectors[2].y],
      [basisVectors[0].z, basisVectors[1].z, basisVectors[2].z]
    ];

    // Calculate determinant
    const det = 
      matrix[0][0] * (matrix[1][1] * matrix[2][2] - matrix[1][2] * matrix[2][1]) -
      matrix[0][1] * (matrix[1][0] * matrix[2][2] - matrix[1][2] * matrix[2][0]) +
      matrix[0][2] * (matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0]);

    if (Math.abs(det) < 1e-10) return vector; // Avoid division by zero for linearly dependent basis

    // Calculate inverse matrix
    const invDet = 1 / det;
    const inverse = [
      [
        (matrix[1][1] * matrix[2][2] - matrix[1][2] * matrix[2][1]) * invDet,
        (matrix[0][2] * matrix[2][1] - matrix[0][1] * matrix[2][2]) * invDet,
        (matrix[0][1] * matrix[1][2] - matrix[0][2] * matrix[1][1]) * invDet
      ],
      [
        (matrix[1][2] * matrix[2][0] - matrix[1][0] * matrix[2][2]) * invDet,
        (matrix[0][0] * matrix[2][2] - matrix[0][2] * matrix[2][0]) * invDet,
        (matrix[0][2] * matrix[1][0] - matrix[0][0] * matrix[1][2]) * invDet
      ],
      [
        (matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0]) * invDet,
        (matrix[0][1] * matrix[2][0] - matrix[0][0] * matrix[2][1]) * invDet,
        (matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0]) * invDet
      ]
    ];

    return {
      x: inverse[0][0] * vector.x + inverse[0][1] * vector.y + inverse[0][2] * vector.z,
      y: inverse[1][0] * vector.x + inverse[1][1] * vector.y + inverse[1][2] * vector.z,
      z: inverse[2][0] * vector.x + inverse[2][1] * vector.y + inverse[2][2] * vector.z
    };
  }, [basisSettings3D]);

  // Change coordinates from custom basis back to standard basis (3D) - memoized for performance
  const changeBasisInverse3D = useCallback((vector: Vector3D): Vector3D => {
        if (!basisSettings3D.customBasis) return vector;

    const { basisVectors } = basisSettings3D;
    return {
      x: vector.x * basisVectors[0].x + vector.y * basisVectors[1].x + vector.z * basisVectors[2].x,
      y: vector.x * basisVectors[0].y + vector.y * basisVectors[1].y + vector.z * basisVectors[2].y,
      z: vector.x * basisVectors[0].z + vector.y * basisVectors[1].z + vector.z * basisVectors[2].z
    };
  }, [basisSettings3D]);

  // Share functionality
  const getShareableState = useCallback(() => {
    return serializeState({
      mode,
      tool,
      vectors2D,
      vectors3D,
      matrix2D,
      matrix3D,
      settings,
      subspaceSettings,
      basisSettings,
      basisSettings3D,
      eigenvalueSettings
    });
  }, [mode, tool, vectors2D, vectors3D, matrix2D, matrix3D, settings, subspaceSettings, basisSettings, basisSettings3D, eigenvalueSettings]);

  const loadSharedState = useCallback((sharedState: any) => {
    if (!validateSharedState(sharedState)) {
      return false;
    }

    try {
      return deserializeState(sharedState, {
        setMode,
        setTool,
        setVectors2D,
        setVectors3D,
        setMatrix2D,
        setMatrix3D,
        updateSettings,
        updateSubspaceSettings,
        updateBasisSettings,
        updateBasisSettings3D,
        updateEigenvalueSettings
      });
    } catch (error) {
      console.error('Error loading shared state:', error);
      return false;
    }
  }, [setMode, setTool, setVectors2D, setVectors3D, setMatrix2D, setMatrix3D, updateSettings, updateSubspaceSettings, updateBasisSettings, updateBasisSettings3D, updateEigenvalueSettings]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    mode,
    setMode,
    tool,
    setTool,
    vectors2D,
    setVectors2D,
    addVector2D,
    vectors3D,
    setVectors3D,
    addVector3D,
    matrix2D,
    setMatrix2D,
    matrix3D,
    setMatrix3D,
    settings,
    updateSettings,
    subspaceSettings,
    updateSubspaceSettings,
    basisSettings,
    updateBasisSettings,
    changeBasis,
    changeBasisInverse,
    basisSettings3D,
    updateBasisSettings3D,
    changeBasis3D,
    changeBasisInverse3D,
    eigenvalues2D,
    setEigenvalues2D,
    eigenvalues3D,
    setEigenvalues3D,
    eigenvalueSettings,
    updateEigenvalueSettings,
    matrixPresets,
    setMatrixPresets,
    setMatrixPreset,
    addMatrixPreset,
    removeMatrixPreset,
    selectedPreset,
    setSelectedPreset,
    guessVector,
    setGuessVector,
    transformedGuessVector,
    setTransformedGuessVector,
    isEigenvectorGuess,
    setIsEigenvectorGuess,
    guessEigenvalue,
    setGuessEigenvalue,
    getShareableState,
    loadSharedState
  }), [
    mode, tool, vectors2D, vectors3D, matrix2D, matrix3D, settings, 
    subspaceSettings, basisSettings, basisSettings3D, eigenvalues2D, eigenvalues3D,
    eigenvalueSettings, matrixPresets, selectedPreset, guessVector, transformedGuessVector,
    isEigenvectorGuess, guessEigenvalue, addVector2D, addVector3D, updateSettings,
    updateSubspaceSettings, updateBasisSettings, updateBasisSettings3D, updateEigenvalueSettings,
    changeBasis, changeBasisInverse, changeBasis3D, changeBasisInverse3D, getShareableState, loadSharedState
  ]);

  return (
    <VisualizerContext.Provider value={contextValue}>
      {children}
    </VisualizerContext.Provider>
  );
};

export const useVisualizer = (): VisualizerContextType => {
  const context = useContext(VisualizerContext);
  if (context === undefined) {
    throw new Error('useVisualizer must be used within a VisualizerProvider');
  }
  return context;
};