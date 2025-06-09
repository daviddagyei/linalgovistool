import React, { useState } from 'react';
import { Plus, Calculator, RotateCcw, Minus, X } from 'lucide-react';
import { useVisualizer } from '../../context/VisualizerContext';
import { Vector2D, Vector3D } from '../../types';
import { addVectors2D, addVectors3D, scaleVector2D, scaleVector3D, subtractVectors2D, subtractVectors3D } from '../../utils/mathUtils';
import Modal from '../ui/Modal';
import Tooltip from '../ui/Tooltip';

type ExpressionToken = {
  type: 'vector' | 'operator' | 'scalar' | 'parenthesis';
  value: string;
  vectorIndex?: number;
  scalarValue?: number;
};

type ExpressionState = {
  tokens: ExpressionToken[];
  waitingForOperand: boolean;
  canAddOperator: boolean;
};

const CompactVectorControls: React.FC = () => {
  const { 
    mode, 
    vectors2D, 
    setVectors2D, 
    vectors3D, 
    setVectors3D 
  } = useVisualizer();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isOperationsModalOpen, setIsOperationsModalOpen] = useState(false);
  const [newVector, setNewVector] = useState({ x: '', y: '', z: '' });
  const [scalarValue, setScalarValue] = useState('1');
  
  // Expression builder state
  const [expression, setExpression] = useState<ExpressionState>({
    tokens: [],
    waitingForOperand: true,
    canAddOperator: false
  });

  const vectors = mode === '2d' ? vectors2D : vectors3D;

  // Expression builder functions
  const addVectorToExpression = (vectorIndex: number) => {
    if (!expression.waitingForOperand) return;
    
    const newToken: ExpressionToken = {
      type: 'vector',
      value: `v${vectorIndex + 1}`,
      vectorIndex
    };
    
    setExpression({
      tokens: [...expression.tokens, newToken],
      waitingForOperand: false,
      canAddOperator: true
    });
  };

  const addOperatorToExpression = (operator: '+' | '-' | '*') => {
    if (!expression.canAddOperator) return;
    
    const newToken: ExpressionToken = {
      type: 'operator',
      value: operator
    };
    
    setExpression({
      tokens: [...expression.tokens, newToken],
      waitingForOperand: true,
      canAddOperator: false
    });
  };

  const addScalarToExpression = (scalar: string) => {
    if (!expression.waitingForOperand) return;
    
    const scalarNum = parseFloat(scalar);
    if (isNaN(scalarNum)) return;
    
    const newToken: ExpressionToken = {
      type: 'scalar',
      value: scalar,
      scalarValue: scalarNum
    };
    
    setExpression({
      tokens: [...expression.tokens, newToken],
      waitingForOperand: false,
      canAddOperator: true
    });
  };

  const addParenthesisToExpression = (type: '(' | ')') => {
    const newToken: ExpressionToken = {
      type: 'parenthesis',
      value: type
    };
    
    if (type === '(') {
      setExpression({
        tokens: [...expression.tokens, newToken],
        waitingForOperand: true,
        canAddOperator: false
      });
    } else {
      setExpression({
        tokens: [...expression.tokens, newToken],
        waitingForOperand: false,
        canAddOperator: true
      });
    }
  };

  const clearExpression = () => {
    setExpression({
      tokens: [],
      waitingForOperand: true,
      canAddOperator: false
    });
  };

  const executeExpression = () => {
    if (expression.tokens.length === 0) return;
    
    try {
      const result = evaluateExpression(expression.tokens);
      if (result) {
        if (mode === '2d') {
          setVectors2D([...vectors2D, result as Vector2D]);
        } else {
          setVectors3D([...vectors3D, result as Vector3D]);
        }
        clearExpression();
        setIsOperationsModalOpen(false);
      }
    } catch (error) {
      console.error('Expression evaluation error:', error);
    }
  };

  const evaluateExpression = (tokens: ExpressionToken[]): Vector2D | Vector3D | null => {
    // Simple left-to-right evaluation for now
    // In a more sophisticated implementation, we'd handle operator precedence
    if (tokens.length === 0) return null;
    
    let result: Vector2D | Vector3D | null = null;
    let currentOperator: string | null = null;
    
    for (const token of tokens) {
      if (token.type === 'vector' && token.vectorIndex !== undefined) {
        const vector = vectors[token.vectorIndex];
        
        if (result === null) {
          result = { ...vector };
        } else if (currentOperator) {
          if (currentOperator === '+') {
            if (mode === '2d') {
              result = addVectors2D(result as Vector2D, vector as Vector2D);
            } else {
              result = addVectors3D(result as Vector3D, vector as Vector3D);
            }
          } else if (currentOperator === '-') {
            if (mode === '2d') {
              result = subtractVectors2D(result as Vector2D, vector as Vector2D);
            } else {
              result = subtractVectors3D(result as Vector3D, vector as Vector3D);
            }
          }
          currentOperator = null;
        }
      } else if (token.type === 'scalar' && token.scalarValue !== undefined) {
        if (currentOperator === '*') {
          if (result) {
            if (mode === '2d') {
              result = scaleVector2D(result as Vector2D, token.scalarValue);
            } else {
              result = scaleVector3D(result as Vector3D, token.scalarValue);
            }
          }
          currentOperator = null;
        }
      } else if (token.type === 'operator') {
        currentOperator = token.value;
      }
    }
    
    return result;
  };

  const renderExpression = () => {
    return expression.tokens.map((token, index) => (
      <span key={index} className={`mr-1 ${
        token.type === 'vector' ? 'text-blue-600 font-mono font-bold' :
        token.type === 'operator' ? 'text-purple-600 font-bold' :
        token.type === 'scalar' ? 'text-green-600 font-mono' :
        'text-gray-600'
      }`}>
        {token.value}
      </span>
    ));
  };

  const handleAddVector = () => {
    const x = parseFloat(newVector.x || '0');
    const y = parseFloat(newVector.y || '0');
    
    if (mode === '2d') {
      const newVec: Vector2D = { x, y };
      setVectors2D([...vectors2D, newVec]);
    } else {
      const z = parseFloat(newVector.z || '0');
      const newVec: Vector3D = { x, y, z };
      setVectors3D([...vectors3D, newVec]);
    }
    
    setNewVector({ x: '', y: '', z: '' });
    setIsAddModalOpen(false);
  };

  const handleReset = () => {
    if (mode === '2d') {
      setVectors2D([{ x: 1, y: 0 }, { x: 0, y: 1 }]);
    } else {
      setVectors3D([
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
        { x: 0, y: 0, z: 1 }
      ]);
    }
    clearExpression();
  };

  const removeVector = (index: number) => {
    if (mode === '2d') {
      setVectors2D(vectors2D.filter((_, i) => i !== index));
    } else {
      setVectors3D(vectors3D.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-4">
      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <Tooltip 
          content="Add Vector" 
          description="Create a new vector by specifying its components"
          position="top"
        >
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Vector
          </button>
        </Tooltip>
        
        <Tooltip 
          content="Expression Builder" 
          description="Create complex vector expressions using addition, subtraction, and scalar multiplication"
          position="top"
        >
          <button
            onClick={() => setIsOperationsModalOpen(true)}
            className="flex items-center justify-center p-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg border border-green-200 transition-colors"
          >
            <Calculator className="w-4 h-4 mr-2" />
            Expression Builder
          </button>
        </Tooltip>
      </div>

      <Tooltip 
        content="Reset Vectors" 
        description="Reset all vectors to the default standard basis vectors"
        position="top"
      >
        <button
          onClick={handleReset}
          className="w-full flex items-center justify-center p-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg border border-gray-200 transition-colors text-sm"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset to Default
        </button>
      </Tooltip>

      {/* Current Vectors List */}
      <div className="space-y-2">
        <div className="text-xs text-gray-500 italic">Use Expression Builder to create complex operations</div>
        <h4 className="text-sm font-medium text-gray-700">Current Vectors ({vectors.length})</h4>
        <div className="max-h-32 overflow-y-auto space-y-1">
          {vectors.map((vector, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 rounded-lg border text-sm bg-white border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <span className="font-mono text-xs">
                v{index + 1}{mode === '2d' 
                  ? `(${vector.x.toFixed(1)}, ${vector.y.toFixed(1)})`
                  : `(${vector.x.toFixed(1)}, ${vector.y.toFixed(1)}, ${(vector as Vector3D).z.toFixed(1)})`
                }
              </span>
              <button
                onClick={() => removeVector(index)}
                className="text-red-500 hover:text-red-700 text-xs px-1"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add Vector Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Vector"
        size="sm"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">X</label>
              <input
                type="number"
                name="x"
                value={newVector.x}
                onChange={(e) => setNewVector({...newVector, x: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Y</label>
              <input
                type="number"
                name="y"
                value={newVector.y}
                onChange={(e) => setNewVector({...newVector, y: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
                step="0.1"
              />
            </div>
          </div>
          
          {mode === '3d' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Z</label>
              <input
                type="number"
                name="z"
                value={newVector.z}
                onChange={(e) => setNewVector({...newVector, z: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
                step="0.1"
              />
            </div>
          )}

          <button
            onClick={handleAddVector}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Vector
          </button>
        </div>
      </Modal>

      {/* Operations Modal - Expression Builder */}
      <Modal
        isOpen={isOperationsModalOpen}
        onClose={() => setIsOperationsModalOpen(false)}
        title="Vector Expression Builder"
        size="md"
      >
        <div className="space-y-4">
          {/* Expression Display */}
          <div className="bg-gray-50 p-3 rounded-lg border min-h-[40px] flex items-center">
            <div className="text-sm">
              {expression.tokens.length === 0 ? (
                <span className="text-gray-500 italic">Build your expression...</span>
              ) : (
                renderExpression()
              )}
            </div>
          </div>

          {/* Vector Nodes */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Available Vectors</h4>
            <div className="flex flex-wrap gap-2">
              {vectors.map((vector, index) => (
                <button
                  key={index}
                  onClick={() => addVectorToExpression(index)}
                  disabled={!expression.waitingForOperand}
                  className={`px-3 py-2 rounded-full text-sm font-mono transition-colors ${
                    expression.waitingForOperand
                      ? 'bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-300'
                      : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                  }`}
                >
                  v{index + 1}
                  <span className="text-xs ml-1">
                    {mode === '2d' 
                      ? `(${vector.x.toFixed(1)}, ${vector.y.toFixed(1)})`
                      : `(${vector.x.toFixed(1)}, ${vector.y.toFixed(1)}, ${(vector as Vector3D).z.toFixed(1)})`
                    }
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Operation Buttons */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Operations</h4>
            
            {/* Vector Operations */}
            <div className="flex gap-2">
              <button
                onClick={() => addOperatorToExpression('+')}
                disabled={!expression.canAddOperator}
                className={`p-2 rounded-lg text-sm font-bold transition-colors ${
                  expression.canAddOperator
                    ? 'bg-green-100 hover:bg-green-200 text-green-700 border border-green-300'
                    : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                }`}
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={() => addOperatorToExpression('-')}
                disabled={!expression.canAddOperator}
                className={`p-2 rounded-lg text-sm font-bold transition-colors ${
                  expression.canAddOperator
                    ? 'bg-red-100 hover:bg-red-200 text-red-700 border border-red-300'
                    : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                }`}
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={() => addOperatorToExpression('*')}
                disabled={!expression.canAddOperator}
                className={`p-2 rounded-lg text-sm font-bold transition-colors ${
                  expression.canAddOperator
                    ? 'bg-purple-100 hover:bg-purple-200 text-purple-700 border border-purple-300'
                    : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scalar Input */}
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-xs text-gray-600 mb-1">Scalar</label>
                <input
                  type="number"
                  value={scalarValue}
                  onChange={(e) => setScalarValue(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="2"
                  step="0.1"
                />
              </div>
              <button
                onClick={() => addScalarToExpression(scalarValue)}
                disabled={!expression.waitingForOperand}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  expression.waitingForOperand
                    ? 'bg-green-100 hover:bg-green-200 text-green-700 border border-green-300'
                    : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                }`}
              >
                Add
              </button>
            </div>

            {/* Parentheses */}
            <div className="flex gap-2">
              <button
                onClick={() => addParenthesisToExpression('(')}
                className="px-3 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 border border-yellow-300 rounded text-sm transition-colors"
              >
                ( Open
              </button>
              <button
                onClick={() => addParenthesisToExpression(')')}
                className="px-3 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 border border-yellow-300 rounded text-sm transition-colors"
              >
                ) Close
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 border-t">
            <button
              onClick={clearExpression}
              className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm"
            >
              Clear
            </button>
            <button
              onClick={executeExpression}
              disabled={expression.tokens.length === 0 || expression.waitingForOperand}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white disabled:text-gray-500 rounded-lg transition-colors text-sm disabled:cursor-not-allowed"
            >
              Execute
            </button>
          </div>

          {/* Help Text */}
          <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
            <strong>How to use:</strong><br/>
            1. Click vector nodes (v1, v2, etc.) to add them<br/>
            2. Add operators (+, -, *) between vectors/scalars<br/>
            3. Use scalars for multiplication (e.g., 2 * v1)<br/>
            4. Use parentheses for grouping operations<br/>
            5. Click Execute to create the result vector
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CompactVectorControls;
