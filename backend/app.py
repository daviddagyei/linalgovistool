import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EigenCalculator:
    """Handles eigenvalue and eigenvector calculations using NumPy"""
    
    @staticmethod
    def calculate_eigenvalues_2d(matrix):
        """
        Calculate eigenvalues and eigenvectors for a 2x2 matrix
        Returns both real and complex eigenvalues/eigenvectors
        """
        try:
            matrix = np.array(matrix, dtype=float)
            if matrix.shape != (2, 2):
                raise ValueError("Matrix must be 2x2")
            
            eigenvalues, eigenvectors = np.linalg.eig(matrix)
            
            result = {
                'eigenvalues': [],
                'eigenvectors': [],
                'is_real': [],
                'determinant': float(np.linalg.det(matrix)),
                'trace': float(np.trace(matrix))
            }
            
            for i, (val, vec) in enumerate(zip(eigenvalues, eigenvectors.T)):
                # Check if eigenvalue is real (within numerical precision)
                is_real = abs(val.imag) < 1e-10
                
                if is_real:
                    # Real eigenvalue
                    real_val = float(val.real)
                    real_vec = [float(vec[0].real), float(vec[1].real)]
                    
                    # Normalize the eigenvector
                    norm = np.linalg.norm(real_vec)
                    if norm > 1e-10:
                        real_vec = [x / norm for x in real_vec]
                    
                    result['eigenvalues'].append(real_val)
                    result['eigenvectors'].append(real_vec)
                    result['is_real'].append(True)
                else:
                    # Complex eigenvalue
                    complex_val = {
                        'real': float(val.real),
                        'imag': float(val.imag)
                    }
                    complex_vec = {
                        'real': [float(vec[0].real), float(vec[1].real)],
                        'imag': [float(vec[0].imag), float(vec[1].imag)]
                    }
                    
                    result['eigenvalues'].append(complex_val)
                    result['eigenvectors'].append(complex_vec)
                    result['is_real'].append(False)
            
            return result
            
        except Exception as e:
            logger.error(f"Error calculating 2D eigenvalues: {str(e)}")
            raise
    
    @staticmethod
    def calculate_eigenvalues_3d(matrix):
        """
        Calculate eigenvalues and eigenvectors for a 3x3 matrix
        """
        try:
            matrix = np.array(matrix, dtype=float)
            if matrix.shape != (3, 3):
                raise ValueError("Matrix must be 3x3")
            
            eigenvalues, eigenvectors = np.linalg.eig(matrix)
            
            result = {
                'eigenvalues': [],
                'eigenvectors': [],
                'is_real': [],
                'determinant': float(np.linalg.det(matrix)),
                'trace': float(np.trace(matrix))
            }
            
            for i, (val, vec) in enumerate(zip(eigenvalues, eigenvectors.T)):
                is_real = abs(val.imag) < 1e-10
                
                if is_real:
                    real_val = float(val.real)
                    real_vec = [float(vec[0].real), float(vec[1].real), float(vec[2].real)]
                    
                    # Normalize the eigenvector
                    norm = np.linalg.norm(real_vec)
                    if norm > 1e-10:
                        real_vec = [x / norm for x in real_vec]
                    
                    result['eigenvalues'].append(real_val)
                    result['eigenvectors'].append(real_vec)
                    result['is_real'].append(True)
                else:
                    complex_val = {
                        'real': float(val.real),
                        'imag': float(val.imag)
                    }
                    complex_vec = {
                        'real': [float(vec[0].real), float(vec[1].real), float(vec[2].real)],
                        'imag': [float(vec[0].imag), float(vec[1].imag), float(vec[2].imag)]
                    }
                    
                    result['eigenvalues'].append(complex_val)
                    result['eigenvectors'].append(complex_vec)
                    result['is_real'].append(False)
            
            return result
            
        except Exception as e:
            logger.error(f"Error calculating 3D eigenvalues: {str(e)}")
            raise
    
    @staticmethod
    def transform_vector(matrix, vector):
        """
        Apply matrix transformation to a vector
        """
        try:
            matrix = np.array(matrix, dtype=float)
            vector = np.array(vector, dtype=float)
            
            if len(matrix.shape) != 2 or matrix.shape[0] != matrix.shape[1]:
                raise ValueError("Matrix must be square")
            
            if len(vector) != matrix.shape[1]:
                raise ValueError("Vector dimension must match matrix size")
            
            transformed = np.dot(matrix, vector)
            return transformed.tolist()
            
        except Exception as e:
            logger.error(f"Error transforming vector: {str(e)}")
            raise
    
    @staticmethod
    def check_eigenvector_alignment(matrix, vector, tolerance=1e-6):
        """
        Check if a vector is approximately an eigenvector of the matrix
        Returns eigenvalue if it is, None otherwise
        """
        try:
            matrix = np.array(matrix, dtype=float)
            vector = np.array(vector, dtype=float)
            
            # Normalize the vector
            norm = np.linalg.norm(vector)
            if norm < tolerance:
                return None
            
            normalized_vector = vector / norm
            transformed = np.dot(matrix, normalized_vector)
            
            # Check if transformed vector is parallel to original
            # This means Av = λv for some scalar λ
            cross_product_magnitude = np.linalg.norm(np.cross(normalized_vector, transformed))
            
            if cross_product_magnitude < tolerance:
                # Vectors are parallel, find the eigenvalue
                eigenvalue = np.dot(transformed, normalized_vector)
                return float(eigenvalue)
            
            return None
            
        except Exception as e:
            logger.error(f"Error checking eigenvector alignment: {str(e)}")
            return None

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'Linear Algebra Backend is running'})

@app.route('/api/eigenvalues/2d', methods=['POST'])
def calculate_eigenvalues_2d():
    """Calculate eigenvalues and eigenvectors for 2D matrix"""
    try:
        data = request.get_json()
        matrix = data.get('matrix')
        
        if not matrix:
            return jsonify({'error': 'Matrix is required'}), 400
        
        result = EigenCalculator.calculate_eigenvalues_2d(matrix)
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in 2D eigenvalue calculation: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/eigenvalues/3d', methods=['POST'])
def calculate_eigenvalues_3d():
    """Calculate eigenvalues and eigenvectors for 3D matrix"""
    try:
        data = request.get_json()
        matrix = data.get('matrix')
        
        if not matrix:
            return jsonify({'error': 'Matrix is required'}), 400
        
        result = EigenCalculator.calculate_eigenvalues_3d(matrix)
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in 3D eigenvalue calculation: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/transform', methods=['POST'])
def transform_vector():
    """Apply matrix transformation to a vector"""
    try:
        data = request.get_json()
        matrix = data.get('matrix')
        vector = data.get('vector')
        
        if not matrix or not vector:
            return jsonify({'error': 'Matrix and vector are required'}), 400
        
        result = EigenCalculator.transform_vector(matrix, vector)
        return jsonify({'transformed_vector': result})
        
    except Exception as e:
        logger.error(f"Error in vector transformation: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/check-eigenvector', methods=['POST'])
def check_eigenvector():
    """Check if a vector is an eigenvector of the given matrix"""
    try:
        data = request.get_json()
        matrix = data.get('matrix')
        vector = data.get('vector')
        tolerance = data.get('tolerance', 1e-6)
        
        if not matrix or not vector:
            return jsonify({'error': 'Matrix and vector are required'}), 400
        
        eigenvalue = EigenCalculator.check_eigenvector_alignment(matrix, vector, tolerance)
        
        result = {
            'is_eigenvector': eigenvalue is not None,
            'eigenvalue': eigenvalue
        }
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error checking eigenvector: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/matrix-presets', methods=['GET'])
def get_matrix_presets():
    """Get predefined matrices with known eigenvalues for educational purposes"""
    presets = {
        '2d': [
            {
                'name': 'Identity Matrix',
                'matrix': [[1, 0], [0, 1]],
                'description': 'All vectors are eigenvectors with eigenvalue 1'
            },
            {
                'name': 'Scaling Matrix',
                'matrix': [[2, 0], [0, 3]],
                'description': 'Diagonal matrix with eigenvalues 2 and 3'
            },
            {
                'name': 'Reflection Matrix',
                'matrix': [[1, 0], [0, -1]],
                'description': 'Reflects across x-axis, eigenvalues 1 and -1'
            },
            {
                'name': 'Rotation Matrix (90°)',
                'matrix': [[0, -1], [1, 0]],
                'description': 'Pure rotation, complex eigenvalues'
            },
            {
                'name': 'Shear Matrix',
                'matrix': [[1, 1], [0, 1]],
                'description': 'Shear transformation, repeated eigenvalue 1'
            },
            {
                'name': 'Symmetric Matrix',
                'matrix': [[3, 1], [1, 3]],
                'description': 'Real eigenvalues 2 and 4'
            }
        ],
        '3d': [
            {
                'name': '3D Identity',
                'matrix': [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
                'description': 'All vectors are eigenvectors'
            },
            {
                'name': '3D Scaling',
                'matrix': [[2, 0, 0], [0, 3, 0], [0, 0, 4]],
                'description': 'Eigenvalues 2, 3, 4'
            },
            {
                'name': 'Rotation about Z-axis',
                'matrix': [[0, -1, 0], [1, 0, 0], [0, 0, 1]],
                'description': 'Real eigenvalue 1, complex pair'
            }
        ]
    }
    return jsonify(presets)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
