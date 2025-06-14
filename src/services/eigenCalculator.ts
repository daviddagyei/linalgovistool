import { 
  matrix, 
  eigs, 
  multiply, 
  norm, 
  cross,
  det,
  trace,
  Complex,
  MathType,
  Matrix as MathMatrix
} from 'mathjs';

import { Matrix2D, Matrix3D, Vector2D, Vector3D, Eigenvalue } from '../types';

interface EigenResult2D {
  eigenvalues: (number | { real: number; imag: number })[];
  eigenvectors: (Vector2D | { real: Vector2D; imag: Vector2D })[];
  is_real: boolean[];
  determinant: number;
  trace: number;
}

interface EigenResult3D {
  eigenvalues: (number | { real: number; imag: number })[];
  eigenvectors: (Vector3D | { real: Vector3D; imag: Vector3D })[];
  is_real: boolean[];
  determinant: number;
  trace: number;
}

interface MatrixPresets {
  '2d': Array<{
    name: string;
    matrix: Matrix2D;
    description: string;
  }>;
  '3d': Array<{
    name: string;
    matrix: Matrix3D;
    description: string;
  }>;
}

interface EigenvectorCheck {
  is_eigenvector: boolean;
  eigenvalue: number | null;
}

export class EigenCalculator {
  private static readonly NUMERICAL_TOLERANCE = 1e-10;

  /**
   * Calculate eigenvalues and eigenvectors for a 2x2 matrix
   */
  static calculateEigenvalues2D(inputMatrix: Matrix2D): EigenResult2D {
    try {
      // Convert to mathjs matrix format
      const mathMatrix = matrix(inputMatrix);
      
      // Calculate eigenvalues and eigenvectors
      const eigenData = eigs(mathMatrix);
      
      const result: EigenResult2D = {
        eigenvalues: [],
        eigenvectors: [],
        is_real: [],
        determinant: this.safeNumberExtract(det(mathMatrix)),
        trace: this.safeNumberExtract(trace(mathMatrix))
      };

      // Process eigenvectors array
      const eigenvectors = eigenData.eigenvectors;
      
      for (let i = 0; i < eigenvectors.length; i++) {
        const eigenItem = eigenvectors[i];
        const eigenvalue = eigenItem.value;
        const eigenvectorData = eigenItem.vector;
        
        const isReal = this.isRealNumber(eigenvalue);
        
        if (isReal) {
          // Real eigenvalue
          const realVal = this.safeNumberExtract(eigenvalue);
          const realVec = this.extractRealVector2D(eigenvectorData);
          
          // Normalize the eigenvector
          const normalizedVec = this.normalizeVector2D(realVec);
          
          result.eigenvalues.push(realVal);
          result.eigenvectors.push(normalizedVec);
          result.is_real.push(true);
        } else {
          // Complex eigenvalue
          const complexVal = this.extractComplexNumber(eigenvalue);
          const complexVec = this.extractComplexVector2D(eigenvectorData);
          
          result.eigenvalues.push(complexVal);
          result.eigenvectors.push(complexVec);
          result.is_real.push(false);
        }
      }

      return result;
    } catch (error) {
      console.error('Error calculating 2D eigenvalues:', error);
      throw new Error(`Failed to calculate 2D eigenvalues: ${error}`);
    }
  }

  /**
   * Calculate eigenvalues and eigenvectors for a 3x3 matrix
   */
  static calculateEigenvalues3D(inputMatrix: Matrix3D): EigenResult3D {
    try {
      // Convert to mathjs matrix format
      const mathMatrix = matrix(inputMatrix);
      
      // Calculate eigenvalues and eigenvectors
      const eigenData = eigs(mathMatrix);
      
      const result: EigenResult3D = {
        eigenvalues: [],
        eigenvectors: [],
        is_real: [],
        determinant: this.safeNumberExtract(det(mathMatrix)),
        trace: this.safeNumberExtract(trace(mathMatrix))
      };

      // Process eigenvectors array
      const eigenvectors = eigenData.eigenvectors;
      
      for (let i = 0; i < eigenvectors.length; i++) {
        const eigenItem = eigenvectors[i];
        const eigenvalue = eigenItem.value;
        const eigenvectorData = eigenItem.vector;
        
        const isReal = this.isRealNumber(eigenvalue);
        
        if (isReal) {
          // Real eigenvalue
          const realVal = this.safeNumberExtract(eigenvalue);
          const realVec = this.extractRealVector3D(eigenvectorData);
          
          // Normalize the eigenvector
          const normalizedVec = this.normalizeVector3D(realVec);
          
          result.eigenvalues.push(realVal);
          result.eigenvectors.push(normalizedVec);
          result.is_real.push(true);
        } else {
          // Complex eigenvalue
          const complexVal = this.extractComplexNumber(eigenvalue);
          const complexVec = this.extractComplexVector3D(eigenvectorData);
          
          result.eigenvalues.push(complexVal);
          result.eigenvectors.push(complexVec);
          result.is_real.push(false);
        }
      }

      return result;
    } catch (error) {
      console.error('Error calculating 3D eigenvalues:', error);
      throw new Error(`Failed to calculate 3D eigenvalues: ${error}`);
    }
  }

  /**
   * Apply matrix transformation to a vector
   */
  static transformVector(inputMatrix: Matrix2D | Matrix3D, inputVector: Vector2D | Vector3D): Vector2D | Vector3D {
    try {
      let vectorArray: number[];

      // Check if it's a 2D or 3D operation
      if ('z' in inputVector) {
        // 3D case
        const vector3D = inputVector as Vector3D;
        vectorArray = [vector3D.x, vector3D.y, vector3D.z];
      } else {
        // 2D case
        const vector2D = inputVector as Vector2D;
        vectorArray = [vector2D.x, vector2D.y];
      }

      const mathMatrix = matrix(inputMatrix);
      const mathVector = matrix(vectorArray);
      
      const transformed = multiply(mathMatrix, mathVector) as MathMatrix;
      const resultArray = transformed.toArray() as number[];

      if (resultArray.length === 2) {
        return { x: resultArray[0], y: resultArray[1] } as Vector2D;
      } else {
        return { x: resultArray[0], y: resultArray[1], z: resultArray[2] } as Vector3D;
      }
    } catch (error) {
      console.error('Error transforming vector:', error);
      throw new Error(`Failed to transform vector: ${error}`);
    }
  }

  /**
   * Check if a vector is approximately an eigenvector of the matrix
   */
  static checkEigenvectorAlignment(
    inputMatrix: Matrix2D | Matrix3D, 
    inputVector: Vector2D | Vector3D, 
    tolerance: number = 1e-6
  ): EigenvectorCheck {
    try {
      // Transform the vector
      const transformed = this.transformVector(inputMatrix, inputVector);
      
      // Convert to arrays for calculations
      let originalArray: number[];
      let transformedArray: number[];

      if ('z' in inputVector) {
        // 3D case
        const original3D = inputVector as Vector3D;
        const transformed3D = transformed as Vector3D;
        originalArray = [original3D.x, original3D.y, original3D.z];
        transformedArray = [transformed3D.x, transformed3D.y, transformed3D.z];
      } else {
        // 2D case
        const original2D = inputVector as Vector2D;
        const transformed2D = transformed as Vector2D;
        originalArray = [original2D.x, original2D.y];
        transformedArray = [transformed2D.x, transformed2D.y];
      }

      // Check if vector is approximately zero
      const originalNorm = this.safeNumberExtract(norm(originalArray));
      if (originalNorm < tolerance) {
        return { is_eigenvector: false, eigenvalue: null };
      }

      // Normalize the original vector
      const normalizedOriginal = originalArray.map(x => x / originalNorm);
      
      // Check if transformed vector is parallel to original (for 2D case)
      if (originalArray.length === 2) {
        // For 2D, check if cross product magnitude is small
        const crossProductMag = Math.abs(
          normalizedOriginal[0] * transformedArray[1] - 
          normalizedOriginal[1] * transformedArray[0]
        );
        
        if (crossProductMag < tolerance) {
          // Vectors are parallel, calculate eigenvalue
          const eigenvalue = this.calculateScalarMultiple(normalizedOriginal, transformedArray);
          return { is_eigenvector: true, eigenvalue };
        }
      } else {
        // For 3D, use cross product
        const crossProduct = this.safeNumberExtract(norm(cross(normalizedOriginal, transformedArray)));
        
        if (crossProduct < tolerance) {
          // Vectors are parallel, calculate eigenvalue
          const eigenvalue = this.calculateScalarMultiple(normalizedOriginal, transformedArray);
          return { is_eigenvector: true, eigenvalue };
        }
      }

      return { is_eigenvector: false, eigenvalue: null };
    } catch (error) {
      console.error('Error checking eigenvector alignment:', error);
      return { is_eigenvector: false, eigenvalue: null };
    }
  }

  /**
   * Get predefined matrix presets for educational purposes
   */
  static getMatrixPresets(): MatrixPresets {
    return {
      '2d': [
        {
          name: 'Identity Matrix',
          matrix: [[1, 0], [0, 1]],
          description: 'All vectors are eigenvectors with eigenvalue 1'
        },
        {
          name: 'Scaling Matrix',
          matrix: [[2, 0], [0, 3]],
          description: 'Diagonal matrix with eigenvalues 2 and 3'
        },
        {
          name: 'Reflection Matrix',
          matrix: [[1, 0], [0, -1]],
          description: 'Reflects across x-axis, eigenvalues 1 and -1'
        },
        {
          name: 'Rotation Matrix (90°)',
          matrix: [[0, -1], [1, 0]],
          description: 'Pure rotation, complex eigenvalues'
        },
        {
          name: 'Shear Matrix',
          matrix: [[1, 1], [0, 1]],
          description: 'Shear transformation, repeated eigenvalue 1'
        },
        {
          name: 'Symmetric Matrix',
          matrix: [[3, 1], [1, 3]],
          description: 'Real eigenvalues 2 and 4'
        }
      ],
      '3d': [
        {
          name: '3D Identity',
          matrix: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
          description: 'All vectors are eigenvectors'
        },
        {
          name: '3D Scaling',
          matrix: [[2, 0, 0], [0, 3, 0], [0, 0, 4]],
          description: 'Eigenvalues 2, 3, 4'
        },
        {
          name: 'Rotation about Z-axis',
          matrix: [[0, -1, 0], [1, 0, 0], [0, 0, 1]],
          description: 'Real eigenvalue 1, complex pair'
        }
      ]
    };
  }

  /**
   * Convert calculation results to application eigenvalue format
   */
  static convertToEigenvalues(result: EigenResult2D | EigenResult3D): Eigenvalue[] {
    const eigenvalues: Eigenvalue[] = [];

    result.eigenvalues.forEach((val, index) => {
      const vec = result.eigenvectors[index];
      const isReal = result.is_real[index];

      if (isReal && typeof val === 'number') {
        // Real eigenvalue
        eigenvalues.push({
          value: val,
          vector: vec as Vector2D | Vector3D,
        });
      }
      // Note: Complex eigenvalues could be handled here if needed
    });

    return eigenvalues;
  }

  // Helper methods

  private static isRealNumber(value: MathType): boolean {
    if (typeof value === 'number') {
      return true;
    }
    if (value && typeof value === 'object' && 'im' in value) {
      const complex = value as Complex;
      return Math.abs(complex.im) < this.NUMERICAL_TOLERANCE;
    }
    return false;
  }

  private static safeNumberExtract(value: MathType): number {
    if (typeof value === 'number') {
      return value;
    }
    if (value && typeof value === 'object' && 're' in value) {
      const complex = value as Complex;
      return complex.re;
    }
    return 0;
  }

  private static extractComplexNumber(value: MathType): { real: number; imag: number } {
    if (typeof value === 'number') {
      return { real: value, imag: 0 };
    }
    if (value && typeof value === 'object' && 're' in value && 'im' in value) {
      const complex = value as Complex;
      return { real: complex.re, imag: complex.im };
    }
    return { real: 0, imag: 0 };
  }

  private static extractRealVector2D(vector: any): Vector2D {
    const array = Array.isArray(vector) ? vector : vector.toArray();
    return {
      x: this.safeNumberExtract(array[0]),
      y: this.safeNumberExtract(array[1])
    };
  }

  private static extractRealVector3D(vector: any): Vector3D {
    const array = Array.isArray(vector) ? vector : vector.toArray();
    return {
      x: this.safeNumberExtract(array[0]),
      y: this.safeNumberExtract(array[1]),
      z: this.safeNumberExtract(array[2])
    };
  }

  private static extractComplexVector2D(vector: any): { real: Vector2D; imag: Vector2D } {
    const array = Array.isArray(vector) ? vector : vector.toArray();
    return {
      real: {
        x: this.safeNumberExtract(array[0]),
        y: this.safeNumberExtract(array[1])
      },
      imag: {
        x: this.extractComplexNumber(array[0]).imag,
        y: this.extractComplexNumber(array[1]).imag
      }
    };
  }

  private static extractComplexVector3D(vector: any): { real: Vector3D; imag: Vector3D } {
    const array = Array.isArray(vector) ? vector : vector.toArray();
    return {
      real: {
        x: this.safeNumberExtract(array[0]),
        y: this.safeNumberExtract(array[1]),
        z: this.safeNumberExtract(array[2])
      },
      imag: {
        x: this.extractComplexNumber(array[0]).imag,
        y: this.extractComplexNumber(array[1]).imag,
        z: this.extractComplexNumber(array[2]).imag
      }
    };
  }

  private static normalizeVector2D(vector: Vector2D): Vector2D {
    const magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    if (magnitude < this.NUMERICAL_TOLERANCE) {
      return vector;
    }
    return {
      x: vector.x / magnitude,
      y: vector.y / magnitude
    };
  }

  private static normalizeVector3D(vector: Vector3D): Vector3D {
    const magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z);
    if (magnitude < this.NUMERICAL_TOLERANCE) {
      return vector;
    }
    return {
      x: vector.x / magnitude,
      y: vector.y / magnitude,
      z: vector.z / magnitude
    };
  }

  private static calculateScalarMultiple(normalizedOriginal: number[], transformed: number[]): number {
    // Calculate the scalar multiple λ such that transformed ≈ λ * original
    // Use the component with the largest absolute value for numerical stability
    let maxIndex = 0;
    let maxAbs = 0;
    
    for (let i = 0; i < normalizedOriginal.length; i++) {
      const absVal = Math.abs(normalizedOriginal[i]);
      if (absVal > maxAbs) {
        maxAbs = absVal;
        maxIndex = i;
      }
    }
    
    if (maxAbs < this.NUMERICAL_TOLERANCE) {
      return 0;
    }
    
    return transformed[maxIndex] / normalizedOriginal[maxIndex];
  }
}

// Export types for external use
export type {
  EigenResult2D,
  EigenResult3D,
  MatrixPresets,
  EigenvectorCheck
};
