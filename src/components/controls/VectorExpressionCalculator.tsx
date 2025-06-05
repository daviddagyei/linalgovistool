import React, { useState, useEffect } from 'react';
import { Calculator, Plus, Minus, X as MultiplyIcon, Divide, Brackets as BracketsCurly, RotateCcw, ArrowRight, Info, AlertCircle } from 'lucide-react';
import { useVisualizer } from '../../context/VisualizerContext';
import { Vector2D, Vector3D } from '../../types';
import * as math from 'mathjs';

interface ExpressionHistory {
  expression: string;
  result: Vector2D | Vector3D;
  timestamp: Date;
}

interface ValidationError {
  message: string;
  type: 'error' | 'warning';
  hint?: string;
}

const VectorExpressionCalculator: React.FC<{
  onClose?: () => void;
}> = ({ onClose }) => {
  const { 
    mode, 
    vectors2D, 
    vectors3D,
    setVectors2D,
    setVectors3D
  } = useVisualizer();

  const [expression, setExpression] = useState('');
  const [error, setError] = useState<ValidationError | null>(null);
  const [preview, setPreview] = useState<Vector2D | Vector3D | null>(null);
  const [history, setHistory] = useState<ExpressionHistory[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);

  const vectors = mode === '2d' ? vectors2D : vectors3D;
  const vectorColors = ['#3366FF', '#FF6633', '#33CC99', '#9966FF', '#FF9933'];

  const getVectorByRef = (ref: string): Vector2D | Vector3D | null => {
    const match = ref.match(/^v(\d+)$/);
    if (!match) return null;
    
    const index = parseInt(match[1]) - 1;
    if (index < 0 || index >= vectors.length) return null;
    
    return vectors[index];
  };

  const validateExpression = (expr: string): ValidationError | null => {
    if (!expr.trim()) return null;

    const vectorRefs = expr.match(/v\d+/g) || [];
    for (const ref of vectorRefs) {
      const index = parseInt(ref.slice(1)) - 1;
      if (index < 0 || index >= vectors.length) {
        return {
          type: 'error',
          message: `Vector ${ref} doesn't exist`,
          hint: `Available vectors are: ${vectors.map((_, i) => `v${i + 1}`).join(', ')}`
        };
      }
    }

    const openCount = (expr.match(/\(/g) || []).length;
    const closeCount = (expr.match(/\)/g) || []).length;
    if (openCount !== closeCount) {
      return {
        type: 'error',
        message: 'Unmatched parentheses',
        hint: openCount > closeCount ? 'Add closing parenthesis ")"' : 'Add opening parenthesis "("'
      };
    }

    const validOperators = ['+', '-', '*', '/', '(', ')'];
    const tokens = expr.split(/([+\-*/()])/g).map(t => t.trim()).filter(Boolean);
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (!token.match(/^v\d+$/) && !validOperators.includes(token) && !token.match(/^-?\d*\.?\d+$/)) {
        return {
          type: 'error',
          message: `Invalid token: "${token}"`,
          hint: 'Use vector references (v1, v2, etc.), numbers, and operators (+, -, *, /)'
        };
      }
    }

    const operators = expr.match(/[+\-*/]{2,}/g);
    if (operators) {
      return {
        type: 'error',
        message: 'Invalid operator sequence',
        hint: 'Operators cannot be used consecutively'
      };
    }

    return null;
  };

  const evaluateExpression = (expr: string): Vector2D | Vector3D | null => {
    try {
      const cleanExpr = expr.trim();
      if (!cleanExpr) return null;

      const validationError = validateExpression(cleanExpr);
      if (validationError) {
        setError(validationError);
        return null;
      }

      const scope: { [key: string]: any } = {};
      vectors.forEach((vector, index) => {
        const varName = `v${index + 1}`;
        scope[varName] = mode === '2d' 
          ? math.matrix([vector.x, vector.y])
          : math.matrix([vector.x, vector.y, (vector as Vector3D).z]);
      });

      const compiled = math.compile(cleanExpr);
      const result = compiled.evaluate(scope);

      const resultArray = Array.isArray(result) ? result : result.toArray();

      if (!Array.isArray(resultArray) || 
          (mode === '2d' && resultArray.length !== 2) || 
          (mode === '3d' && resultArray.length !== 3)) {
        setError({
          type: 'error',
          message: 'Invalid result dimensions',
          hint: `Result must be a ${mode === '2d' ? '2D' : '3D'} vector`
        });
        return null;
      }

      return mode === '2d'
        ? { x: resultArray[0], y: resultArray[1] }
        : { x: resultArray[0], y: resultArray[1], z: resultArray[2] };

    } catch (err) {
      setError({
        type: 'error',
        message: 'Invalid expression',
        hint: err instanceof Error ? err.message : 'Check your expression syntax'
      });
      return null;
    }
  };

  useEffect(() => {
    if (expression.trim()) {
      const result = evaluateExpression(expression);
      if (result) {
        setPreview(result);
        setError(null);
      }
    } else {
      setPreview(null);
      setError(null);
    }
  }, [expression]);

  const insertAtCursor = (text: string) => {
    const newExpression = 
      expression.slice(0, cursorPosition) + 
      text + 
      expression.slice(cursorPosition);
    setExpression(newExpression);
    setCursorPosition(cursorPosition + text.length);
  };

  const handleVectorClick = (index: number) => {
    insertAtCursor(`v${index + 1}`);
  };

  const handleOperatorClick = (operator: string) => {
    insertAtCursor(` ${operator} `);
  };

  const handleAddVector = () => {
    const result = evaluateExpression(expression);
    if (result) {
      if (mode === '2d') {
        setVectors2D([...vectors2D, result as Vector2D]);
      } else {
        setVectors3D([...vectors3D, result as Vector3D]);
      }

      setHistory([
        {
          expression,
          result,
          timestamp: new Date()
        },
        ...history
      ]);

      setExpression('');
      setPreview(null);

      // Close the modal after adding the vector
      if (onClose) {
        onClose();
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-3 bg-blue-50 rounded-lg flex items-start">
        <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-2 shrink-0" />
        <div className="text-sm text-blue-700">
          <p className="font-medium mb-1">Expression Guide:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Use vector references (v1, v2, etc.)</li>
            <li>Supported operators: +, -, *, /</li>
            <li>Use parentheses for grouping</li>
            <li>Example: <code className="bg-blue-100 px-1 rounded">2 * (v1 + v2)</code></li>
          </ul>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Available Vectors</h3>
        <div className="flex flex-wrap gap-2">
          {vectors.map((vector, index) => (
            <button
              key={index}
              onClick={() => handleVectorClick(index)}
              className="flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors hover:bg-opacity-80"
              style={{ 
                backgroundColor: `${vectorColors[index % vectorColors.length]}15`,
                color: vectorColors[index % vectorColors.length]
              }}
            >
              <span className="mr-1">v{index + 1}</span>
              <span className="text-xs opacity-75">
                ({vector.x.toFixed(1)}, {vector.y.toFixed(1)}
                {mode === '3d' && `, ${(vector as Vector3D).z.toFixed(1)}`})
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Vector Expression
        </label>
        <div className="relative">
          <input
            type="text"
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            onKeyUp={(e) => setCursorPosition(e.currentTarget.selectionStart || 0)}
            onClick={(e) => setCursorPosition(e.currentTarget.selectionStart || 0)}
            className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:outline-none ${
              error?.type === 'error'
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : error?.type === 'warning'
                ? 'border-yellow-300 focus:ring-yellow-500 focus:border-yellow-500'
                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            }`}
            placeholder="e.g., v1 - v2"
          />
          {error && (
            <div className="absolute right-0 top-0 h-full px-3 flex items-center">
              <AlertCircle className={`w-5 h-5 ${
                error.type === 'error' ? 'text-red-500' : 'text-yellow-500'
              }`} />
            </div>
          )}
        </div>
        {error && (
          <div className={`mt-1.5 p-2 rounded text-sm ${
            error.type === 'error' 
              ? 'bg-red-50 text-red-700' 
              : 'bg-yellow-50 text-yellow-700'
          }`}>
            <p className="font-medium">{error.message}</p>
            {error.hint && (
              <p className="mt-0.5 text-sm opacity-90">{error.hint}</p>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleOperatorClick('+')}
          className="p-2 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <Plus size={16} />
        </button>
        <button
          onClick={() => handleOperatorClick('-')}
          className="p-2 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <Minus size={16} />
        </button>
        <button
          onClick={() => handleOperatorClick('*')}
          className="p-2 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <MultiplyIcon size={16} />
        </button>
        <button
          onClick={() => handleOperatorClick('/')}
          className="p-2 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <Divide size={16} />
        </button>
        <button
          onClick={() => insertAtCursor('(')}
          className="p-2 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          (
        </button>
        <button
          onClick={() => insertAtCursor(')')}
          className="p-2 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          )
        </button>
      </div>

      {preview && !error && (
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="text-sm font-medium text-blue-700">Preview:</div>
          <div className="text-blue-600">
            ({preview.x.toFixed(2)}, {preview.y.toFixed(2)}
            {mode === '3d' && `, ${(preview as Vector3D).z.toFixed(2)}`})
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setExpression('')}
          className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <RotateCcw size={16} className="mr-2" />
          Clear
        </button>
        <button
          onClick={handleAddVector}
          disabled={!preview || !!error}
          className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg text-white transition-colors ${
            preview && !error
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          <ArrowRight size={16} className="mr-2" />
          View New Vector
        </button>
      </div>

      {history.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">History</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {history.map((entry, index) => (
              <div
                key={index}
                className="p-2 bg-gray-50 rounded-lg text-sm"
              >
                <div className="font-medium text-gray-700">{entry.expression}</div>
                <div className="text-gray-500">
                  = ({entry.result.x.toFixed(2)}, {entry.result.y.toFixed(2)}
                  {mode === '3d' && `, ${(entry.result as Vector3D).z.toFixed(2)}`})
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {entry.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VectorExpressionCalculator;