import React, { useState, useEffect } from 'react';
import { useVisualizer } from '../context/VisualizerContext';
import { Matrix2D, Matrix3D, Vector2D, Vector3D } from '../types';
import { calculateEigenvalues2D, calculateEigenvalues3D, applyMatrix2D, applyMatrix3D } from '../utils/mathUtils';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  details: string;
  timestamp: Date;
}

interface PerformanceMetric {
  operation: string;
  duration: number;
  memoryUsage?: number;
}

/**
 * Comprehensive Feature Combination Testing Component
 * Tests all major feature interactions and cross-component synchronization
 */
const FeatureCombinationTests: React.FC = () => {
  const {
    mode,
    setMode,
    tool,
    setTool,
    vectors2D,
    setVectors2D,
    vectors3D,
    setVectors3D,
    matrix2D,
    setMatrix2D,
    matrix3D,
    setMatrix3D,
    settings,
    updateSettings,
    basisSettings,
    updateBasisSettings,
    basisSettings3D,
    updateBasisSettings3D,
    eigenvalueSettings,
    updateEigenvalueSettings
  } = useVisualizer();

  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  // Test configuration constants
  const TEST_MATRICES_2D: Matrix2D[] = [
    [[1, 0], [0, 1]], // Identity
    [[2, 0], [0, 3]], // Diagonal
    [[1, 1], [0, 1]], // Shear
    [[0, -1], [1, 0]], // Rotation 90°
    [[2, 1], [1, 2]], // Symmetric
    [[-1, 0], [0, -1]], // Reflection
  ];

  const TEST_MATRICES_3D: Matrix3D[] = [
    [[1, 0, 0], [0, 1, 0], [0, 0, 1]], // Identity
    [[2, 0, 0], [0, 3, 0], [0, 0, 4]], // Diagonal
    [[1, 1, 0], [0, 1, 1], [0, 0, 1]], // Upper triangular
    [[0, 0, 1], [1, 0, 0], [0, 1, 0]], // Permutation
  ];

  const TEST_VECTORS_2D: Vector2D[] = [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: -1, y: 1 },
    { x: 2, y: -1 }
  ];

  const TEST_VECTORS_3D: Vector3D[] = [
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
    { x: 0, y: 0, z: 1 },
    { x: 1, y: 1, z: 1 },
    { x: 1, y: -1, z: 0 }
  ];

  const addTestResult = (name: string, status: 'pass' | 'fail' | 'warning', details: string) => {
    const result: TestResult = {
      name,
      status,
      details,
      timestamp: new Date()
    };
    setTestResults(prev => [...prev, result]);
  };

  const measurePerformance = async <T,>(operation: string, fn: () => Promise<T> | T): Promise<T> => {
    const startTime = performance.now();
    const startMemory = (performance as any).memory?.usedJSHeapSize;

    try {
      const result = await fn();
      const endTime = performance.now();
      const endMemory = (performance as any).memory?.usedJSHeapSize;
      
      const metric: PerformanceMetric = {
        operation,
        duration: endTime - startTime,
        memoryUsage: endMemory && startMemory ? endMemory - startMemory : undefined
      };
      setPerformanceMetrics(prev => [...prev, metric]);
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const metric: PerformanceMetric = {
        operation: `${operation} (failed)`,
        duration: endTime - startTime
      };
      setPerformanceMetrics(prev => [...prev, metric]);
      throw error;
    }
  };

  // Test 1: Mode switching and state preservation
  const testModeSwitching = async () => {
    const originalMode = mode;
    const originalMatrix2D = matrix2D;
    const originalMatrix3D = matrix3D;

    try {
      await measurePerformance('Mode Switch 2D→3D', async () => {
        setMode('3d');
        await new Promise(resolve => setTimeout(resolve, 100)); // Allow state updates
      });

      if (mode === '3d') {
        addTestResult('Mode Switch to 3D', 'pass', 'Successfully switched to 3D mode');
      } else {
        addTestResult('Mode Switch to 3D', 'fail', 'Failed to switch to 3D mode');
      }

      await measurePerformance('Mode Switch 3D→2D', async () => {
        setMode('2d');
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      if (mode === '2d') {
        addTestResult('Mode Switch to 2D', 'pass', 'Successfully switched back to 2D mode');
      } else {
        addTestResult('Mode Switch to 2D', 'fail', 'Failed to switch back to 2D mode');
      }

      // Check state preservation
      const matrixPreserved = JSON.stringify(matrix2D) === JSON.stringify(originalMatrix2D);
      addTestResult(
        'State Preservation',
        matrixPreserved ? 'pass' : 'warning',
        matrixPreserved ? 'Matrix state preserved during mode switch' : 'Matrix state changed during mode switch'
      );

    } catch (error) {
      addTestResult('Mode Switching', 'fail', `Error during mode switching: ${error}`);
    } finally {
      setMode(originalMode);
    }
  };

  // Test 2: Tool switching and context consistency
  const testToolSwitching = async () => {
    const originalTool = tool;
    const tools = ['vector', 'matrix', 'subspace', 'eigenvalue'] as const;

    try {
      for (const testTool of tools) {
        await measurePerformance(`Tool Switch to ${testTool}`, async () => {
          setTool(testTool);
          await new Promise(resolve => setTimeout(resolve, 100));
        });

        if (tool === testTool) {
          addTestResult(`Tool Switch to ${testTool}`, 'pass', `Successfully switched to ${testTool} tool`);
        } else {
          addTestResult(`Tool Switch to ${testTool}`, 'fail', `Failed to switch to ${testTool} tool`);
        }
      }
    } catch (error) {
      addTestResult('Tool Switching', 'fail', `Error during tool switching: ${error}`);
    } finally {
      setTool(originalTool);
    }
  };

  // Test 3: Matrix transformations and eigenvalue calculations
  const testMatrixTransformations = async () => {
    const matrices = mode === '2d' ? TEST_MATRICES_2D : TEST_MATRICES_3D;
    const vectors = mode === '2d' ? TEST_VECTORS_2D : TEST_VECTORS_3D;

    for (let i = 0; i < matrices.length; i++) {
      const matrix = matrices[i];
      const matrixName = `Matrix ${i + 1}`;

      try {
        // Test matrix setting
        await measurePerformance(`Set ${matrixName}`, async () => {
          if (mode === '2d') {
            setMatrix2D(matrix as Matrix2D);
          } else {
            setMatrix3D(matrix as Matrix3D);
          }
          await new Promise(resolve => setTimeout(resolve, 50));
        });

        // Test vector transformations
        for (const vector of vectors) {
          const transformed = await measurePerformance(`Transform vector with ${matrixName}`, () => {
            return mode === '2d' 
              ? applyMatrix2D(matrix as Matrix2D, vector as Vector2D)
              : applyMatrix3D(matrix as Matrix3D, vector as Vector3D);
          });

          if (transformed) {
            addTestResult(
              `Vector Transformation ${matrixName}`,
              'pass',
              `Successfully transformed vector (${Object.values(vector).join(', ')}) → (${Object.values(transformed).map(v => v.toFixed(3)).join(', ')})`
            );
          } else {
            addTestResult(`Vector Transformation ${matrixName}`, 'fail', 'Failed to transform vector');
          }
        }

        // Test eigenvalue calculations
        try {
          const eigenvalues = await measurePerformance(`Eigenvalues ${matrixName}`, () => {
            return mode === '2d' 
              ? calculateEigenvalues2D(matrix as Matrix2D)
              : calculateEigenvalues3D(matrix as Matrix3D);
          });

          if (eigenvalues && eigenvalues.length > 0) {
            addTestResult(
              `Eigenvalue Calculation ${matrixName}`,
              'pass',
              `Found ${eigenvalues.length} eigenvalue(s): ${eigenvalues.map(e => e.value.toFixed(3)).join(', ')}`
            );
          } else {
            addTestResult(
              `Eigenvalue Calculation ${matrixName}`,
              'warning',
              'No eigenvalues found or calculation returned empty result'
            );
          }
        } catch (eigenError) {
          addTestResult(
            `Eigenvalue Calculation ${matrixName}`,
            'fail',
            `Eigenvalue calculation failed: ${eigenError}`
          );
        }

      } catch (error) {
        addTestResult(`Matrix Transformation ${matrixName}`, 'fail', `Error: ${error}`);
      }
    }
  };

  // Test 4: Settings synchronization
  const testSettingsSynchronization = async () => {
    const testSettings = [
      { showGrid: !settings.showGrid },
      { showAxes: !settings.showAxes },
      { showLabels: !settings.showLabels },
      { showVectorTails: !settings.showVectorTails }
    ];

    for (const testSetting of testSettings) {
      const settingName = Object.keys(testSetting)[0];
      const originalValue = settings[settingName as keyof typeof settings];

      try {
        await measurePerformance(`Update ${settingName}`, async () => {
          updateSettings(testSetting);
          await new Promise(resolve => setTimeout(resolve, 50));
        });

        const newValue = settings[settingName as keyof typeof settings];
        if (newValue !== originalValue) {
          addTestResult(`Settings Update ${settingName}`, 'pass', `Successfully updated ${settingName}`);
        } else {
          addTestResult(`Settings Update ${settingName}`, 'fail', `Failed to update ${settingName}`);
        }

        // Restore original value
        updateSettings({ [settingName]: originalValue });
      } catch (error) {
        addTestResult(`Settings Update ${settingName}`, 'fail', `Error updating ${settingName}: ${error}`);
      }
    }
  };

  // Test 5: Cross-component synchronization
  const testCrossComponentSync = async () => {
    const originalVectors2D = [...vectors2D];
    const originalVectors3D = [...vectors3D];

    try {
      // Test vector addition and synchronization
      const newVector = mode === '2d' ? { x: 3, y: 2 } : { x: 3, y: 2, z: 1 };
      
      await measurePerformance('Add Vector', async () => {
        if (mode === '2d') {
          setVectors2D([...vectors2D, newVector as Vector2D]);
        } else {
          setVectors3D([...vectors3D, newVector as Vector3D]);
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const currentVectors = mode === '2d' ? vectors2D : vectors3D;
      if (currentVectors.length > originalVectors2D.length || currentVectors.length > originalVectors3D.length) {
        addTestResult('Vector Addition Sync', 'pass', 'Vector addition synchronized across components');
      } else {
        addTestResult('Vector Addition Sync', 'fail', 'Vector addition not synchronized');
      }

      // Test basis settings synchronization
      const originalBasisSettings = mode === '2d' ? basisSettings : basisSettings3D;
      const newBasisSetting = { showCoordinates: !originalBasisSettings.showCoordinates };

      await measurePerformance('Update Basis Settings', async () => {
        if (mode === '2d') {
          updateBasisSettings(newBasisSetting);
        } else {
          updateBasisSettings3D(newBasisSetting);
        }
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      const currentBasisSettings = mode === '2d' ? basisSettings : basisSettings3D;
      if (currentBasisSettings.showCoordinates !== originalBasisSettings.showCoordinates) {
        addTestResult('Basis Settings Sync', 'pass', 'Basis settings synchronized across components');
      } else {
        addTestResult('Basis Settings Sync', 'fail', 'Basis settings not synchronized');
      }

    } catch (error) {
      addTestResult('Cross-Component Sync', 'fail', `Error in cross-component synchronization: ${error}`);
    } finally {
      // Restore original state
      setVectors2D(originalVectors2D);
      setVectors3D(originalVectors3D);
    }
  };

  // Test 6: Animation and transition states
  const testAnimationStates = async () => {
    try {
      // Test eigenvalue animation toggle
      const originalAnimateTransformation = eigenvalueSettings.animateTransformation;
      
      await measurePerformance('Toggle Animation', async () => {
        updateEigenvalueSettings({ animateTransformation: !originalAnimateTransformation });
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      if (eigenvalueSettings.animateTransformation !== originalAnimateTransformation) {
        addTestResult('Animation Toggle', 'pass', 'Animation state successfully toggled');
      } else {
        addTestResult('Animation Toggle', 'fail', 'Animation state not changed');
      }

      // Restore original setting
      updateEigenvalueSettings({ animateTransformation: originalAnimateTransformation });

    } catch (error) {
      addTestResult('Animation States', 'fail', `Error testing animation states: ${error}`);
    }
  };

  // Test 7: Performance under load
  const testPerformanceUnderLoad = async () => {
    const iterations = 50;
    const startTime = performance.now();

    try {
      for (let i = 0; i < iterations; i++) {
        // Rapidly switch matrices
        const matrix = mode === '2d' 
          ? TEST_MATRICES_2D[i % TEST_MATRICES_2D.length]
          : TEST_MATRICES_3D[i % TEST_MATRICES_3D.length];

        if (mode === '2d') {
          setMatrix2D(matrix as Matrix2D);
        } else {
          setMatrix3D(matrix as Matrix3D);
        }

        if (i % 10 === 0) {
          setProgress((i / iterations) * 100);
        }
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / iterations;

      if (avgTime < 10) { // Less than 10ms per operation
        addTestResult('Performance Under Load', 'pass', `Average operation time: ${avgTime.toFixed(2)}ms`);
      } else if (avgTime < 50) {
        addTestResult('Performance Under Load', 'warning', `Average operation time: ${avgTime.toFixed(2)}ms (acceptable)`);
      } else {
        addTestResult('Performance Under Load', 'fail', `Average operation time: ${avgTime.toFixed(2)}ms (too slow)`);
      }

    } catch (error) {
      addTestResult('Performance Under Load', 'fail', `Error during load testing: ${error}`);
    }
  };

  // Main test runner
  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    setPerformanceMetrics([]);
    setProgress(0);

    const tests = [
      { name: 'Mode Switching', fn: testModeSwitching, weight: 10 },
      { name: 'Tool Switching', fn: testToolSwitching, weight: 15 },
      { name: 'Matrix Transformations', fn: testMatrixTransformations, weight: 30 },
      { name: 'Settings Synchronization', fn: testSettingsSynchronization, weight: 15 },
      { name: 'Cross-Component Sync', fn: testCrossComponentSync, weight: 20 },
      { name: 'Animation States', fn: testAnimationStates, weight: 5 },
      { name: 'Performance Under Load', fn: testPerformanceUnderLoad, weight: 5 }
    ];

    let totalWeight = 0;
    let completedWeight = 0;

    totalWeight = tests.reduce((sum, test) => sum + test.weight, 0);

    for (const test of tests) {
      try {
        addTestResult(test.name, 'pass', `Starting ${test.name}...`);
        await test.fn();
        completedWeight += test.weight;
        setProgress((completedWeight / totalWeight) * 100);
      } catch (error) {
        addTestResult(test.name, 'fail', `Test suite failed: ${error}`);
      }
    }

    setIsRunning(false);
    setProgress(100);
  };

  // Calculate test summary
  const testSummary = {
    total: testResults.length,
    passed: testResults.filter(r => r.status === 'pass').length,
    failed: testResults.filter(r => r.status === 'fail').length,
    warnings: testResults.filter(r => r.status === 'warning').length
  };

  const avgPerformance = performanceMetrics.length > 0 
    ? performanceMetrics.reduce((sum, m) => sum + m.duration, 0) / performanceMetrics.length
    : 0;

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Feature Combination Testing Suite
        </h2>
        <p className="text-gray-600">
          Comprehensive testing of feature interactions and cross-component synchronization
        </p>
      </div>

      {/* Test Controls */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={runAllTests}
            disabled={isRunning}
            className={`px-6 py-2 rounded font-medium transition-colors ${
              isRunning
                ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </button>
          
          <div className="text-sm text-gray-600">
            Current Mode: <span className="font-medium">{mode.toUpperCase()}</span> | 
            Current Tool: <span className="font-medium">{tool}</span>
          </div>
        </div>

        {/* Progress Bar */}
        {isRunning && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Test Summary */}
      {testResults.length > 0 && (
        <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{testSummary.passed}</div>
            <div className="text-sm text-green-700">Passed</div>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{testSummary.failed}</div>
            <div className="text-sm text-red-700">Failed</div>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{testSummary.warnings}</div>
            <div className="text-sm text-yellow-700">Warnings</div>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{avgPerformance.toFixed(1)}ms</div>
            <div className="text-sm text-blue-700">Avg. Time</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Results */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Test Results</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded border-l-4 ${
                  result.status === 'pass'
                    ? 'bg-green-50 border-green-400'
                    : result.status === 'fail'
                    ? 'bg-red-50 border-red-400'
                    : 'bg-yellow-50 border-yellow-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{result.name}</span>
                  <span className="text-xs text-gray-500">
                    {result.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mt-1">{result.details}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Metrics */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {performanceMetrics.map((metric, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{metric.operation}</span>
                  <span className="text-sm text-blue-600">{metric.duration.toFixed(2)}ms</span>
                </div>
                {metric.memoryUsage && (
                  <div className="text-xs text-gray-500 mt-1">
                    Memory: {(metric.memoryUsage / 1024).toFixed(1)}KB
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureCombinationTests;
