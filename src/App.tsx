import React, { useState, useEffect } from 'react';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import ControlPanel from './components/controls/ControlPanel';
import VectorCanvas2D from './components/visualizations/twoDimensional/VectorCanvas2D';
import VectorCanvas3D from './components/visualizations/threeDimensional/VectorCanvas3D';
import MatrixTransformationCanvas2D from './components/visualizations/twoDimensional/MatrixTransformationCanvas2D';
import MatrixTransformationCanvas3D from './components/visualizations/threeDimensional/MatrixTransformationCanvas3D';
import SubspaceCanvas2D from './components/visualizations/twoDimensional/SubspaceCanvas2D';
import SubspaceCanvas3D from './components/visualizations/threeDimensional/SubspaceCanvas3D';
import EigenvalueCanvas2D from './components/visualizations/twoDimensional/EigenvalueCanvas2D';
import EigenvalueCanvas3D from './components/visualizations/threeDimensional/EigenvalueCanvas3D';
import { VisualizerProvider, useVisualizer } from './context/VisualizerContext';

// Hook for responsive canvas dimensions
const useResponsiveCanvasSize = () => {
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const updateCanvasSize = () => {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
      // Calculate responsive dimensions
      if (screenWidth < 640) { // Mobile
        setCanvasSize({ 
          width: Math.min(screenWidth - 32, 400), 
          height: Math.min(screenHeight - 200, 300) 
        });
      } else if (screenWidth < 1024) { // Tablet
        setCanvasSize({ 
          width: Math.min(screenWidth - 64, 600), 
          height: Math.min(screenHeight - 250, 450) 
        });
      } else { // Desktop
        setCanvasSize({ width: 800, height: 600 });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  return canvasSize;
};

// Main App Content
const AppContent: React.FC = () => {
  const { mode, tool } = useVisualizer();
  const { width, height } = useResponsiveCanvasSize();
  
  // Determine which visualization component to render based on mode and tool
  const renderVisualization = () => {
    if (mode === '2d') {
      if (tool === 'vector' || tool === 'basis') {
        return <VectorCanvas2D width={width} height={height} />;
      }
      if (tool === 'matrix') {
        return <MatrixTransformationCanvas2D width={width} height={height} />;
      }
      if (tool === 'subspace') {
        return <SubspaceCanvas2D width={width} height={height} />;
      }
      if (tool === 'eigenvalue') {
        return <EigenvalueCanvas2D width={width} height={height} />;
      }
    } else {
      if (tool === 'vector' || tool === 'basis') {
        return <VectorCanvas3D width={width} height={height} />;
      }
      if (tool === 'matrix') {
        return <MatrixTransformationCanvas3D width={width} height={height} />;
      }
      if (tool === 'subspace') {
        return <SubspaceCanvas3D width={width} height={height} />;
      }
      if (tool === 'eigenvalue') {
        return <EigenvalueCanvas3D width={width} height={height} />;
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      
      <main className="flex-1 p-4 md:p-6">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[calc(100vh-12rem)]">
            {/* Control panel - 1/4 width on large screens */}
            <div className="lg:col-span-1">
              <ControlPanel />
            </div>
            
            {/* Visualization area - 3/4 width on large screens */}
            <div className="lg:col-span-3 flex items-center justify-center">
              {renderVisualization()}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

// Wrapper App with Provider
const App: React.FC = () => {
  return (
    <VisualizerProvider>
      <AppContent />
    </VisualizerProvider>
  );
};

export default App;