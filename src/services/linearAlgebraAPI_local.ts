import { Matrix2D, Matrix3D, Vector2D, Vector3D, Eigenvalue } from '../types';
import { 
  EigenCalculator,
  type EigenResult2D,
  type EigenResult3D,
  type MatrixPresets,
  type EigenvectorCheck 
} from './eigenCalculator';

/**
 * Linear Algebra API that uses local TypeScript calculations instead of a Python backend
 * This class maintains the same interface as the original API for easy drop-in replacement
 */
class LinearAlgebraAPI {
  private isLocalMode: boolean = true;
  private baseUrl: string;

  constructor() {
    // Check if we should use local calculations or backend
    this.isLocalMode = import.meta.env.VITE_USE_LOCAL_CALCULATIONS !== 'false';
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    
    if (this.isLocalMode) {
      console.log('🚀 Using local TypeScript eigenvalue calculations');
    } else {
      console.log('🌐 Using Python backend for calculations');
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (this.isLocalMode) {
      throw new Error('Local mode enabled - HTTP requests should not be made');
    }

    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Check if the service is healthy
   */
  async healthCheck(): Promise<{ status: string; message: string }> {
    if (this.isLocalMode) {
      return {
        status: 'healthy',
        message: 'Local TypeScript Linear Algebra Calculator is running'
      };
    }
    
    return this.request('/health');
  }

  /**
   * Calculate eigenvalues and eigenvectors for a 2D matrix
   */
  async calculateEigenvalues2D(matrix: Matrix2D): Promise<EigenResult2D> {
    if (this.isLocalMode) {
      try {
        return EigenCalculator.calculateEigenvalues2D(matrix);
      } catch (error) {
        console.error('Local 2D eigenvalue calculation failed:', error);
        throw error;
      }
    }
    
    return this.request('/eigenvalues/2d', {
      method: 'POST',
      body: JSON.stringify({ matrix: this.matrix2DToArray(matrix) }),
    });
  }

  /**
   * Calculate eigenvalues and eigenvectors for a 3D matrix
   */
  async calculateEigenvalues3D(matrix: Matrix3D): Promise<EigenResult3D> {
    if (this.isLocalMode) {
      try {
        return EigenCalculator.calculateEigenvalues3D(matrix);
      } catch (error) {
        console.error('Local 3D eigenvalue calculation failed:', error);
        throw error;
      }
    }
    
    return this.request('/eigenvalues/3d', {
      method: 'POST',
      body: JSON.stringify({ matrix: this.matrix3DToArray(matrix) }),
    });
  }

  /**
   * Transform a vector by a matrix
   */
  async transformVector(matrix: Matrix2D | Matrix3D, vector: Vector2D | Vector3D): Promise<Vector2D | Vector3D> {
    if (this.isLocalMode) {
      try {
        return EigenCalculator.transformVector(matrix, vector);
      } catch (error) {
        console.error('Local vector transformation failed:', error);
        throw error;
      }
    }

    const matrixArray = 'z' in vector 
      ? this.matrix3DToArray(matrix as Matrix3D)
      : this.matrix2DToArray(matrix as Matrix2D);
    
    const vectorArray = 'z' in vector 
      ? [vector.x, vector.y, vector.z]
      : [vector.x, vector.y];

    const result = await this.request<{ transformed_vector: number[] }>('/transform', {
      method: 'POST',
      body: JSON.stringify({ matrix: matrixArray, vector: vectorArray }),
    });

    if (result.transformed_vector.length === 2) {
      return {
        x: result.transformed_vector[0],
        y: result.transformed_vector[1],
      } as Vector2D;
    } else {
      return {
        x: result.transformed_vector[0],
        y: result.transformed_vector[1],
        z: result.transformed_vector[2],
      } as Vector3D;
    }
  }

  /**
   * Check if a vector is an eigenvector of the given matrix
   */
  async checkEigenvector(
    matrix: Matrix2D | Matrix3D, 
    vector: Vector2D | Vector3D, 
    tolerance: number = 1e-6
  ): Promise<EigenvectorCheck> {
    if (this.isLocalMode) {
      try {
        return EigenCalculator.checkEigenvectorAlignment(matrix, vector, tolerance);
      } catch (error) {
        console.error('Local eigenvector check failed:', error);
        throw error;
      }
    }

    const matrixArray = 'z' in vector 
      ? this.matrix3DToArray(matrix as Matrix3D)
      : this.matrix2DToArray(matrix as Matrix2D);
    
    const vectorArray = 'z' in vector 
      ? [vector.x, vector.y, vector.z]
      : [vector.x, vector.y];

    return this.request('/check-eigenvector', {
      method: 'POST',
      body: JSON.stringify({ matrix: matrixArray, vector: vectorArray, tolerance }),
    });
  }

  /**
   * Get predefined matrix presets for educational purposes
   */
  async getMatrixPresets(): Promise<MatrixPresets> {
    if (this.isLocalMode) {
      return EigenCalculator.getMatrixPresets();
    }
    
    return this.request('/matrix-presets');
  }

  /**
   * Convert API eigenvalue result to application format
   */
  convertToEigenvalues(result: EigenResult2D | EigenResult3D): Eigenvalue[] {
    return EigenCalculator.convertToEigenvalues(result);
  }

  /**
   * Enable or disable local mode
   */
  setLocalMode(enabled: boolean): void {
    this.isLocalMode = enabled;
    console.log(`${enabled ? '🚀 Enabled' : '🌐 Disabled'} local TypeScript calculations`);
  }

  /**
   * Check if currently using local calculations
   */
  isUsingLocalCalculations(): boolean {
    return this.isLocalMode;
  }

  // Helper methods for backend compatibility

  private matrix2DToArray(matrix: Matrix2D): number[][] {
    return matrix;
  }

  private matrix3DToArray(matrix: Matrix3D): number[][] {
    return matrix;
  }
}

// Create a singleton instance
export const linearAlgebraAPI = new LinearAlgebraAPI();

// Named exports for specific use cases
export {
  LinearAlgebraAPI,
  type EigenResult2D,
  type EigenResult3D,
  type MatrixPresets,
  type EigenvectorCheck,
};
