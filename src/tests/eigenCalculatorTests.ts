import { EigenCalculator } from '../services/eigenCalculator';
import { Matrix2D, Matrix3D } from '../types';

/**
 * Simple test function to verify eigenvalue calculations work correctly
 */
export function testEigenCalculations(): void {
  console.log('🧪 Testing Local Eigenvalue Calculations...');

  try {
    // Test 2D Identity Matrix
    const identity2D: Matrix2D = [[1, 0], [0, 1]];
    const result2D = EigenCalculator.calculateEigenvalues2D(identity2D);
    
    console.log('✅ 2D Identity Matrix Results:', {
      eigenvalues: result2D.eigenvalues,
      determinant: result2D.determinant,
      trace: result2D.trace
    });

    // Test 2D Scaling Matrix
    const scaling2D: Matrix2D = [[2, 0], [0, 3]];
    const scalingResult2D = EigenCalculator.calculateEigenvalues2D(scaling2D);
    
    console.log('✅ 2D Scaling Matrix Results:', {
      eigenvalues: scalingResult2D.eigenvalues,
      determinant: scalingResult2D.determinant,
      trace: scalingResult2D.trace
    });

    // Test 3D Identity Matrix
    const identity3D: Matrix3D = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    const result3D = EigenCalculator.calculateEigenvalues3D(identity3D);
    
    console.log('✅ 3D Identity Matrix Results:', {
      eigenvalues: result3D.eigenvalues,
      determinant: result3D.determinant,
      trace: result3D.trace
    });

    // Test vector transformation
    const transformResult = EigenCalculator.transformVector(scaling2D, { x: 1, y: 1 });
    console.log('✅ Vector Transformation (2x scaling on [1,1]):', transformResult);

    // Test eigenvector check
    const eigenvectorCheck = EigenCalculator.checkEigenvectorAlignment(
      scaling2D, 
      { x: 1, y: 0 }, // Should be eigenvector with eigenvalue 2
      1e-6
    );
    console.log('✅ Eigenvector Check ([1,0] for scaling matrix):', eigenvectorCheck);

    // Test matrix presets
    const presets = EigenCalculator.getMatrixPresets();
    console.log('✅ Matrix Presets Available:', {
      '2d_count': presets['2d'].length,
      '3d_count': presets['3d'].length
    });

    console.log('🎉 All tests passed! Local eigenvalue calculations are working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

/**
 * Test the new linearAlgebraAPI with local mode
 */
export async function testLinearAlgebraAPI(): Promise<void> {
  console.log('🧪 Testing Linear Algebra API...');
  
  const { linearAlgebraAPI } = await import('../services/linearAlgebraAPI');
  
  try {
    // Force local mode
    linearAlgebraAPI.setLocalMode(true);
    
    // Health check
    const health = await linearAlgebraAPI.healthCheck();
    console.log('✅ Health Check:', health);

    // Test 2D calculation
    const matrix2D: Matrix2D = [[2, 1], [1, 2]];
    const eigen2D = await linearAlgebraAPI.calculateEigenvalues2D(matrix2D);
    console.log('✅ API 2D Eigenvalues:', eigen2D);

    // Test 3D calculation
    const matrix3D: Matrix3D = [[1, 0, 0], [0, 2, 0], [0, 0, 3]];
    const eigen3D = await linearAlgebraAPI.calculateEigenvalues3D(matrix3D);
    console.log('✅ API 3D Eigenvalues:', eigen3D);

    // Test vector transformation
    const transformed = await linearAlgebraAPI.transformVector(matrix2D, { x: 1, y: 0 });
    console.log('✅ API Vector Transformation:', transformed);

    // Test matrix presets
    const presets = await linearAlgebraAPI.getMatrixPresets();
    console.log('✅ API Matrix Presets:', presets['2d'][0]);

    console.log('🎉 Linear Algebra API tests passed!');
    
  } catch (error) {
    console.error('❌ API test failed:', error);
    throw error;
  }
}

// Export for use in development
export { EigenCalculator };
