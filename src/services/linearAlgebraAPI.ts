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

class LinearAlgebraAPI {
  private baseUrl: string;

  constructor() {
    // Default to localhost for development
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
   * Check if the backend is healthy
   */
  async healthCheck(): Promise<{ status: string; message: string }> {
    return this.request('/health');
  }

  /**
   * Calculate eigenvalues and eigenvectors for a 2D matrix
   */
  async calculateEigenvalues2D(matrix: Matrix2D): Promise<EigenResult2D> {
    return this.request('/eigenvalues/2d', {
      method: 'POST',
      body: JSON.stringify({ matrix }),
    });
  }

  /**
   * Calculate eigenvalues and eigenvectors for a 3D matrix
   */
  async calculateEigenvalues3D(matrix: Matrix3D): Promise<EigenResult3D> {
    return this.request('/eigenvalues/3d', {
      method: 'POST',
      body: JSON.stringify({ matrix }),
    });
  }

  /**
   * Transform a vector by a matrix
   */
  async transformVector(matrix: Matrix2D | Matrix3D, vector: Vector2D | Vector3D): Promise<Vector2D | Vector3D> {
    const result = await this.request<{ transformed_vector: number[] }>('/transform', {
      method: 'POST',
      body: JSON.stringify({ matrix, vector }),
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
    return this.request('/check-eigenvector', {
      method: 'POST',
      body: JSON.stringify({ matrix, vector, tolerance }),
    });
  }

  /**
   * Get predefined matrix presets for educational purposes
   */
  async getMatrixPresets(): Promise<MatrixPresets> {
    return this.request('/matrix-presets');
  }

  /**
   * Convert API eigenvalue result to application format
   */
  convertToEigenvalues(result: EigenResult2D | EigenResult3D): Eigenvalue[] {
    const eigenvalues: Eigenvalue[] = [];

    result.eigenvalues.forEach((val, index) => {
      const vec = result.eigenvectors[index];
      const isReal = result.is_real[index];

      if (isReal && typeof val === 'number') {
        // Real eigenvalue
        if ('z' in vec && typeof vec === 'object' && 'x' in vec) {
          // 3D vector
          eigenvalues.push({
            value: val,
            vector: vec as Vector3D,
          });
        } else {
          // 2D vector
          eigenvalues.push({
            value: val,
            vector: vec as Vector2D,
          });
        }
      }
      // Note: Complex eigenvalues could be handled here if needed
    });

    return eigenvalues;
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
