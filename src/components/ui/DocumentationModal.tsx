import React, { useState } from 'react';
import { X, BookOpen, Play, Grid, Layers, Activity, Box, Compass, Calculator, Plus } from 'lucide-react';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DocSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

const DocumentationModal: React.FC<DocumentationModalProps> = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState('overview');

  if (!isOpen) return null;

  const docSections: DocSection[] = [
    {
      id: 'overview',
      title: 'Overview',
      icon: <BookOpen className="w-4 h-4" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Welcome to Linalgovistool</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Linalgovistool is an interactive visualization tool designed to help students and educators explore 
              linear algebra concepts through dynamic 2D and 3D visualizations. Our tool makes abstract mathematical 
              concepts tangible and intuitive.
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">Key Features</h4>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Interactive vector manipulation and visualization</li>
              <li>• Matrix transformations with real-time feedback</li>
              <li>• Eigenvalue and eigenvector analysis</li>
              <li>• Subspace exploration (spans, planes, lines)</li>
              <li>• Custom basis vector systems</li>
              <li>• 2D and 3D visualization modes</li>
            </ul>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">Getting Started</h4>
            <ol className="text-green-700 text-sm space-y-1">
              <li>1. Select a tool from the bottom toolbar (Vector, Matrix, etc.)</li>
              <li>2. Choose between 2D or 3D mode</li>
              <li>3. Use the control panel to modify parameters</li>
              <li>4. Interact with the visualization canvas</li>
              <li>5. Toggle display settings for better understanding</li>
            </ol>
          </div>
        </div>
      )
    },
    {
      id: 'vectors',
      title: 'Vector Tool',
      icon: <Box className="w-4 h-4" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Vector Visualization</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Vectors are fundamental mathematical objects that represent both magnitude and direction. 
              Use this tool to create, manipulate, and perform operations on vectors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                Adding Vectors
              </h4>
              <p className="text-sm text-gray-600">
                Click "Add Vector" to create new vectors by specifying their x, y (and z) components. 
                Vectors appear as arrows from the origin.
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                <Calculator className="w-4 h-4 mr-2" />
                Vector Operations
              </h4>
              <p className="text-sm text-gray-600">
                Use the Expression Builder to perform vector addition, subtraction, and scalar 
                multiplication with an intuitive interface.
              </p>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h4 className="font-semibold text-yellow-800 mb-2">Tips</h4>
            <ul className="text-yellow-700 text-sm space-y-1">
              <li>• Drag vector endpoints to modify them interactively</li>
              <li>• Right-click vectors to access quick options</li>
              <li>• Use the grid for precise positioning</li>
              <li>• Toggle labels to see vector coordinates</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'matrices',
      title: 'Matrix Transformations',
      icon: <Layers className="w-4 h-4" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Linear Transformations</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Matrices represent linear transformations that can rotate, scale, shear, and reflect 
              vectors and geometric shapes. Observe how different matrix values affect the transformation.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-black mb-2">Matrix Controls</h4>
              <div className="grid grid-cols-2 gap-4 text-sm text-black">
                <div>
                  <strong>Edit Matrix:</strong> Manually input matrix values
                </div>
                <div>
                  <strong>Presets:</strong> Try common transformations (rotation, scaling, shear)
                </div>
                <div>
                  <strong>Sliders:</strong> Adjust values with interactive controls
                </div>
                <div>
                  <strong>Reset:</strong> Return to identity matrix (no transformation)
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">Understanding Transformations</h4>
              <div className="text-blue-700 text-sm space-y-2">
                <p><strong>Determinant:</strong> Shows how the transformation affects area/volume</p>
                <p><strong>Basis Vectors:</strong> See how î, ĵ (and k̂) transform</p>
                <p><strong>Unit Objects:</strong> Observe how squares/cubes are transformed</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'eigenvalues',
      title: 'Eigenvalues & Eigenvectors',
      icon: <Activity className="w-4 h-4" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Eigenvalue Analysis</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Eigenvalues and eigenvectors reveal special directions in a transformation where 
              vectors only get scaled (not rotated). These are fundamental in many applications.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">Key Concepts</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Eigenvalue (λ):</strong> The scaling factor along the eigenvector direction</p>
                <p><strong>Eigenvector:</strong> The special direction that only gets scaled</p>
                <p><strong>Eigenspace:</strong> All vectors that get scaled by the same eigenvalue</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">Real Eigenvalues</h4>
                <p className="text-green-700 text-sm">
                  When eigenvalues are real numbers, they represent actual scaling along 
                  visible directions in space.
                </p>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <h4 className="font-semibold text-orange-800 mb-2">Complex Eigenvalues</h4>
                <p className="text-orange-700 text-sm">
                  Complex eigenvalues indicate rotation combined with scaling, 
                  showing up in transformations that don't have fixed directions.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'subspaces',
      title: 'Subspaces & Spans',
      icon: <Layers className="w-4 h-4" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Vector Subspaces</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Subspaces are subsets of vector spaces that are closed under addition and scalar 
              multiplication. The span of vectors creates these subspaces.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-black mb-2">Types of Spans</h4>
              <div className="space-y-2 text-sm text-black">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
                  <span><strong>1 Vector:</strong> Creates a line through the origin</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-400 rounded-full mr-2"></div>
                  <span><strong>2 Independent Vectors:</strong> Creates a plane through the origin</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                  <span><strong>3 Independent Vectors (3D):</strong> Spans all of 3D space</span>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-800 mb-2">Linear Independence</h4>
              <p className="text-purple-700 text-sm mb-2">
                Vectors are linearly independent if none can be written as a combination of the others.
              </p>
              <div className="text-purple-600 text-xs space-y-1">
                <div>• Independent vectors create higher-dimensional spans</div>
                <div>• Dependent vectors reduce the effective dimension</div>
                <div>• The tool automatically detects independence</div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'basis',
      title: 'Basis Vectors',
      icon: <Compass className="w-4 h-4" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Coordinate Systems</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Basis vectors define coordinate systems. Different bases provide different 
              perspectives on the same mathematical objects and relationships.
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Standard Basis</h4>
                <p className="text-sm text-gray-600 mb-2">
                  The default coordinate system with perpendicular unit vectors.
                </p>
                <div className="text-xs font-mono text-gray-500">
                  2D: î = (1,0), ĵ = (0,1)<br/>
                  3D: î = (1,0,0), ĵ = (0,1,0), k̂ = (0,0,1)
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Custom Basis</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Define your own coordinate system with different basis vectors.
                </p>
                <div className="text-xs text-gray-500">
                  Change how vectors are measured and represented in space.
                </div>
              </div>
            </div>

            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
              <h4 className="font-semibold text-indigo-800 mb-2">Basis Properties</h4>
              <ul className="text-indigo-700 text-sm space-y-1">
                <li>• Basis vectors must be linearly independent</li>
                <li>• Any vector can be written as a combination of basis vectors</li>
                <li>• Coordinates depend on the chosen basis</li>
                <li>• Change of basis reveals different perspectives</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'controls',
      title: 'Interface Guide',
      icon: <Grid className="w-4 h-4" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Interface Overview</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Linalgovistool's interface is designed for easy exploration and learning. 
              Here's how to navigate and use all the available controls.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">Main Navigation</h4>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <strong>Mode Toggle:</strong> Switch between 2D and 3D visualization
                </div>
                <div>
                  <strong>Tool Selection:</strong> Choose the active mathematical tool
                </div>
                <div>
                  <strong>Display Settings:</strong> Toggle grid, labels, and axes
                </div>
                <div>
                  <strong>Canvas Controls:</strong> Zoom, pan, and reset the view
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">Interaction Tips</h4>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• Hover over any button for helpful tooltips</li>
                <li>• Drag vectors to modify them interactively</li>
                <li>• Use scroll wheel to zoom in 2D mode</li>
                <li>• Right-click for context menus (where available)</li>
                <li>• Press Escape to close modals and panels</li>
              </ul>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 mb-2">Keyboard Shortcuts</h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-green-700">
                <div><kbd className="px-1 py-0.5 bg-green-200 rounded text-xs">Esc</kbd> Close modals</div>
                <div><kbd className="px-1 py-0.5 bg-green-200 rounded text-xs">Space</kbd> Toggle controls</div>
                <div><kbd className="px-1 py-0.5 bg-green-200 rounded text-xs">G</kbd> Toggle grid</div>
                <div><kbd className="px-1 py-0.5 bg-green-200 rounded text-xs">L</kbd> Toggle labels</div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'examples',
      title: 'Examples & Tutorials',
      icon: <Play className="w-4 h-4" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Learning Examples</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Try these guided examples to understand key linear algebra concepts 
              through interactive visualization.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">Beginner Examples</h4>
              <div className="space-y-2 text-sm text-blue-700">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                  <span>Vector Addition: Create two vectors and see their sum</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                  <span>Scaling: Multiply a vector by different scalar values</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                  <span>Linear Combinations: Mix multiple vectors with scalars</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-teal-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 mb-2">Intermediate Examples</h4>
              <div className="space-y-2 text-sm text-green-700">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  <span>Matrix Transformations: Apply rotation and scaling matrices</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  <span>Linear Independence: Check if vectors are independent</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  <span>Subspaces: Visualize spans of different vector sets</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg border border-orange-200">
              <h4 className="font-semibold text-orange-800 mb-2">Advanced Examples</h4>
              <div className="space-y-2 text-sm text-orange-700">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mr-2"></div>
                  <span>Eigenvalue Analysis: Find special transformation directions</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mr-2"></div>
                  <span>Change of Basis: Switch between coordinate systems</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mr-2"></div>
                  <span>3D Visualizations: Explore complex 3D transformations</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-800 mb-2">Quick Start Guide</h4>
              <ol className="text-sm text-gray-600 space-y-1">
                <li>1. Start with the Vector tool to understand basic vector operations</li>
                <li>2. Try the Matrix tool to see how transformations work</li>
                <li>3. Explore Subspaces to understand spans and linear independence</li>
                <li>4. Use Eigenvalue analysis for advanced transformation properties</li>
                <li>5. Experiment with custom Basis vectors for different perspectives</li>
              </ol>
            </div>
          </div>
        </div>
      )
    }
  ];

  const activeDoc = docSections.find(section => section.id === activeSection) || docSections[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-hidden max-w-5xl w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center">
            <BookOpen className="w-6 h-6 mr-3 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">Linalgovistool Documentation</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex h-[calc(90vh-5rem)]">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Documentation
              </h3>
              <nav className="space-y-1">
                {docSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center px-3 py-2 text-left rounded-lg transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                    }`}
                  >
                    {section.icon}
                    <span className="ml-3 text-sm font-medium">{section.title}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {activeDoc.content}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentationModal;
