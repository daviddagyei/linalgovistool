export type Vector2D = {
  x: number;
  y: number;
};

export type Vector3D = {
  x: number;
  y: number;
  z: number;
};

export type Matrix2D = [
  [number, number],
  [number, number]
];

export type Matrix3D = [
  [number, number, number],
  [number, number, number],
  [number, number, number]
];

export type Eigenvalue = {
  value: number;
  vector: Vector2D | Vector3D;
  isReal?: boolean;
};

export type ComplexEigenvalue = {
  real: number;
  imag: number;
  vector: {
    real: Vector2D | Vector3D;
    imag: Vector2D | Vector3D;
  };
};

export type EigenvalueSettings = {
  showEigenvectors: boolean;
  showEigenvalues: boolean;
  showTransformation: boolean;
  animateTransformation: boolean;
  highlightAlignment: boolean;
  tolerance: number;
};

export type MatrixPreset = {
  name: string;
  matrix: Matrix2D | Matrix3D;
  description: string;
  matrix2D?: Matrix2D;
  matrix3D?: Matrix3D;
  vectors2D?: Vector2D[];
  vectors3D?: Vector3D[];
  settings?: VisualizationSettings;
  subspaceSettings?: SubspaceSettings;
  basisSettings?: BasisSettings;
  basisSettings3D?: BasisSettings3D;
  eigenvalues2D?: Eigenvalue[];
  eigenvalues3D?: Eigenvalue[];
  eigenvalueSettings?: EigenvalueSettings;
};

export type VisualizationMode = '2d' | '3d';

export type VisualizationTool = 
  | 'vector'
  | 'matrix'
  | 'subspace'
  | 'eigenvalue'
  | 'basis';

export type VisualizationSettings = {
  showGrid: boolean;
  showAxes: boolean;
  showLabels: boolean;
  showVectorTails: boolean;
  animationSpeed: number;
  colorScheme: 'default' | 'colorblind' | 'monochrome';
};

export type SubspaceSettings = {
  showSpan: boolean[];
  showPlane: boolean;
  showBasis: boolean;
};

export type BasisSettings = {
  customBasis: boolean;
  basisVectors: Vector2D[];
  showCoordinates: boolean;
};

export type BasisSettings3D = {
  customBasis: boolean;
  basisVectors: Vector3D[];
  showCoordinates: boolean;
};