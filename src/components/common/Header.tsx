import React, { useState } from 'react';
import { Github, BookOpen, Share2, Sigma, TestTube } from 'lucide-react';
import Tooltip from '../ui/Tooltip';
import DocumentationModal from '../ui/DocumentationModal';
import ShareModal from '../ui/ShareModal';
import { useVisualizer } from '../../context/VisualizerContext';
// Import test functions
import { testEigenCalculations, testLinearAlgebraAPI } from '../../tests/eigenCalculatorTests';

const Header: React.FC = () => {
  const [isDocumentationOpen, setIsDocumentationOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const { getShareableState, loadSharedState } = useVisualizer();

  const handleRunTests = async () => {
    try {
      console.log('🚀 Starting eigenvalue calculation tests...');
      testEigenCalculations();
      await testLinearAlgebraAPI();
      alert('✅ All tests passed! Check the console for detailed results.');
    } catch (error) {
      console.error('❌ Tests failed:', error);
      alert('❌ Tests failed! Check the console for error details.');
    }
  };

  return (
    <header className="bg-gradient-to-r from-blue-700 to-blue-900 text-white py-3 px-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Tooltip 
          content="Linalgovistool" 
          description="Interactive tool for visualizing vectors, matrices, transformations, and linear algebra concepts"
          position="bottom"
        >
          <div className="flex items-center space-x-2 cursor-pointer">
            <div className="flex items-center justify-center bg-white bg-opacity-20 rounded-lg w-8 h-8">
              <Sigma className="w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold">Linalgovistool</h1>
          </div>
        </Tooltip>
        
        <nav>
          <ul className="flex space-x-2">
            <li>
              <Tooltip 
                content="Documentation" 
                description="Access tutorials and guides for linear algebra concepts"
                position="bottom"
              >
                <button 
                  onClick={() => setIsDocumentationOpen(true)}
                  className="flex items-center p-1.5 rounded hover:bg-white hover:bg-opacity-10 transition-colors"
                >
                  <BookOpen size={16} className="mr-1" />
                  <span className="hidden sm:inline text-sm">Docs</span>
                </button>
              </Tooltip>
            </li>
            <li>
              <Tooltip 
                content="Share" 
                description="Share your current visualization with others"
                position="bottom"
              >
                <button 
                  onClick={() => setIsShareOpen(true)}
                  className="flex items-center p-1.5 rounded hover:bg-white hover:bg-opacity-10 transition-colors"
                >
                  <Share2 size={16} className="mr-1" />
                  <span className="hidden sm:inline text-sm">Share</span>
                </button>
              </Tooltip>
            </li>
            <li>
              <Tooltip 
                content="Source Code" 
                description="View the project source code on GitHub"
                position="bottom"
              >
                <a 
                  href="https://github.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center p-1.5 rounded hover:bg-white hover:bg-opacity-10 transition-colors"
                >
                  <Github size={16} className="mr-1" />
                  <span className="hidden sm:inline text-sm">GitHub</span>
                </a>
              </Tooltip>
            </li>
            <li>
              <Tooltip 
                content="Run Tests" 
                description="Execute predefined tests for eigenvalue calculations"
                position="bottom"
              >
                <button 
                  onClick={handleRunTests}
                  className="flex items-center p-1.5 rounded hover:bg-white hover:bg-opacity-10 transition-colors"
                >
                  <TestTube size={16} className="mr-1" />
                  <span className="hidden sm:inline text-sm">Test</span>
                </button>
              </Tooltip>
            </li>
          </ul>
        </nav>
      </div>
      
      <DocumentationModal 
        isOpen={isDocumentationOpen}
        onClose={() => setIsDocumentationOpen(false)}
      />
      
      <ShareModal 
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        shareData={getShareableState()}
        onImportState={loadSharedState}
      />
    </header>
  );
};

export default Header;