import * as math from 'mathjs';
import { Vector2D, Vector3D, Matrix2D, Matrix3D, Eigenvalue } from '../types';

// Vector operations
export const addVectors2D = (v1: Vector2D, v2: Vector2D): Vector2D => {
  return {
    x: v1.x + v2.x,
    y: v1.y + v2.y
  };
};

export const addVectors3D = (v1: Vector3D, v2: Vector3D): Vector3D => {
  return {
    x: v1.x + v2.x,
    y: v1.y + v2.y,
    z: v1.z + v2.z
  };
};

export const scaleVector2D = (v: Vector2D, scalar: number): Vector2D => {
  return {
    x: v.x * scalar,
    y: v.y * scalar
  };
};

export const scaleVector3D = (v: Vector3D, scalar: number): Vector3D => {
  return {
    x: v.x * scalar,
    y: v.y * scalar,
    z: v.z * scalar
  };
};

export const dotProduct2D = (v1: Vector2D, v2: Vector2D): number => {
  return v1.x * v2.x + v1.y * v2.y;
};

export const dotProduct3D = (v1: Vector3D, v2: Vector3D): number => {
  return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
};

export const crossProduct = (v1: Vector3D, v2: Vector3D): Vector3D => {
  return {
    x: v1.y * v2.z - v1.z * v2.y,
    y: v1.z * v2.x - v1.x * v2.z,
    z: v1.x * v2.y - v1.y * v2.x
  };
};

export const magnitude2D = (v: Vector2D): number => {
  return Math.sqrt(v.x * v.x + v.y * v.y);
};

export const magnitude3D = (v: Vector3D): number => {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
};

export const normalize2D = (v: Vector2D): Vector2D => {
  const mag = magnitude2D(v);
  if (mag === 0) return { x: 0, y: 0 };
  return {
    x: v.x / mag,
    y: v.y / mag
  };
};

export const normalize3D = (v: Vector3D): Vector3D => {
  const mag = magnitude3D(v);
  if (mag === 0) return { x: 0, y: 0, z: 0 };
  return {
    x: v.x / mag,
    y: v.y / mag,
    z: v.z / mag
  };
};

// Matrix operations
export const applyMatrix2D = (matrix: Matrix2D, vector: Vector2D): Vector2D => {
  return {
    x: matrix[0][0] * vector.x + matrix[0][1] * vector.y,
    y: matrix[1][0] * vector.x + matrix[1][1] * vector.y
  };
};

export const applyMatrix3D = (matrix: Matrix3D, vector: Vector3D): Vector3D => {
  return {
    x: matrix[0][0] * vector.x + matrix[0][1] * vector.y + matrix[0][2] * vector.z,
    y: matrix[1][0] * vector.x + matrix[1][1] * vector.y + matrix[1][2] * vector.z,
    z: matrix[2][0] * vector.x + matrix[2][1] * vector.y + matrix[2][2] * vector.z
  };
};

export const multiplyMatrices2D = (m1: Matrix2D, m2: Matrix2D): Matrix2D => {
  const result: Matrix2D = [
    [0, 0],
    [0, 0]
  ];
  
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      for (let k = 0; k < 2; k++) {
        result[i][j] += m1[i][k] * m2[k][j];
      }
    }
  }
  
  return result;
};

export const multiplyMatrices3D = (m1: Matrix3D, m2: Matrix3D): Matrix3D => {
  const result: Matrix3D = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0]
  ];
  
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      for (let k = 0; k < 3; k++) {
        result[i][j] += m1[i][k] * m2[k][j];
      }
    }
  }
  
  return result;
};

// Eigenvalue calculations
export const calculateEigenvalues2D = (matrix: Matrix2D): Eigenvalue[] => {
  try {
    // Convert matrix to mathjs format
    const mathjsMatrix = math.matrix([
      [matrix[0][0], matrix[0][1]],
      [matrix[1][0], matrix[1][1]]
    ]);

    // Calculate eigenvalues and eigenvectors
    const { values, eigenvectors } = math.eigs(mathjsMatrix);

    // Convert complex eigenvalues to real numbers (if possible)
    const realValues = values.map((v: any) => math.re(v));
    const realVectors = eigenvectors.map((v: any) => [math.re(v[0]), math.re(v[1])]);

    // Create result array
    return realValues.map((value: number, i: number) => ({
      value,
      vector: {
        x: realVectors[i][0],
        y: realVectors[i][1]
      }
    }));
  } catch (error) {
    console.error('Error calculating eigenvalues:', error);
    return [];
  }
};

export const calculateEigenvalues3D = (matrix: Matrix3D): Eigenvalue[] => {
  try {
    // Convert matrix to mathjs format
    const mathjsMatrix = math.matrix([
      [matrix[0][0], matrix[0][1], matrix[0][2]],
      [matrix[1][0], matrix[1][1], matrix[1][2]],
      [matrix[2][0], matrix[2][1], matrix[2][2]]
    ]);

    // Calculate eigenvalues and eigenvectors
    const { values, eigenvectors } = math.eigs(mathjsMatrix);

    // Convert complex eigenvalues to real numbers (if possible)
    const realValues = values.map((v: any) => math.re(v));
    const realVectors = eigenvectors.map((v: any) => [math.re(v[0]), math.re(v[1]), math.re(v[2])]);

    // Create result array
    return realValues.map((value: number, i: number) => ({
      value,
      vector: {
        x: realVectors[i][0],
        y: realVectors[i][1],
        z: realVectors[i][2]
      }
    }));
  } catch (error) {
    console.error('Error calculating eigenvalues:', error);
    return [];
  }
};

// Useful transformation matrices
export const rotationMatrix2D = (angle: number): Matrix2D => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [
    [cos, -sin],
    [sin, cos]
  ];
};

export const scaleMatrix2D = (sx: number, sy: number): Matrix2D => {
  return [
    [sx, 0],
    [0, sy]
  ];
};

export const shearMatrix2D = (kx: number, ky: number): Matrix2D => {
  return [
    [1, kx],
    [ky, 1]
  ];
};

// Subspace and span calculations
export const isLinearlyIndependent2D = (vectors: Vector2D[]): boolean => {
  if (vectors.length === 0) return true;
  if (vectors.length > 2) return false;
  if (vectors.length === 1) return magnitude2D(vectors[0]) > 0;
  
  const det = vectors[0].x * vectors[1].y - vectors[0].y * vectors[1].x;
  return Math.abs(det) > 1e-10;
};

export const isLinearlyIndependent3D = (vectors: Vector3D[]): boolean => {
  if (vectors.length === 0) return true;
  if (vectors.length > 3) return false;
  if (vectors.length === 1) return magnitude3D(vectors[0]) > 0;
  if (vectors.length === 2) {
    const cross = crossProduct(vectors[0], vectors[1]);
    return magnitude3D(cross) > 1e-10;
  }
  
  const det = 
    vectors[0].x * (vectors[1].y * vectors[2].z - vectors[1].z * vectors[2].y) -
    vectors[0].y * (vectors[1].x * vectors[2].z - vectors[1].z * vectors[2].x) +
    vectors[0].z * (vectors[1].x * vectors[2].y - vectors[1].y * vectors[2].x);
  
  return Math.abs(det) > 1e-10;
};

export const calculateSpanPoints2D = (vector: Vector2D, range: number, steps: number): Vector2D[] => {
  const points: Vector2D[] = [];
  const step = (2 * range) / (steps - 1);
  
  for (let t = -range; t <= range; t += step) {
    points.push(scaleVector2D(vector, t));
  }
  
  return points;
};

export const calculateSpanPoints3D = (vectors: Vector3D[], range: number, steps: number): Vector3D[] => {
  const points: Vector3D[] = [];
  const step = (2 * range) / (steps - 1);
  
  if (vectors.length === 1) {
    // Line span
    for (let t = -range; t <= range; t += step) {
      points.push(scaleVector3D(vectors[0], t));
    }
  } else if (vectors.length === 2 && isLinearlyIndependent3D(vectors)) {
    // Plane span
    for (let s = -range; s <= range; s += step) {
      for (let t = -range; t <= range; t += step) {
        points.push(addVectors3D(
          scaleVector3D(vectors[0], s),
          scaleVector3D(vectors[1], t)
        ));
      }
    }
  }
  
  return points;
};

export const projectVector2D = (v: Vector2D, onto: Vector2D): Vector2D => {
  const dot = dotProduct2D(v, onto);
  const mag = magnitude2D(onto);
  if (mag === 0) return { x: 0, y: 0 };
  const scalar = dot / (mag * mag);
  return scaleVector2D(onto, scalar);
};

export const projectVector3D = (v: Vector3D, onto: Vector3D): Vector3D => {
  const dot = dotProduct3D(v, onto);
  const mag = magnitude3D(onto);
  if (mag === 0) return { x: 0, y: 0, z: 0 };
  const scalar = dot / (mag * mag);
  return scaleVector3D(onto, scalar);
};