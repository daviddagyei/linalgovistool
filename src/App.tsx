import React, { useState, useEffect, useCallback } from 'react';
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
import { Move, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

// Hook for responsive canvas dimensions
const useResponsiveCanvasSize = () => {
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const updateCanvasSize = () => {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
      // Calculate responsive dimensions
      // Leave space for header (64px) and control panel (80px)
      const maxHeight = screenHeight - 144;
      const maxWidth = screenWidth - (screenWidth < 768 ? 32 : 64);
      
      // Maintain aspect ratio
      const aspectRatio = 4/3;
      let width = maxWidth;
      let height = maxWidth / aspectRatio;
      
      if (height > maxHeight) {
        height = maxHeight;
        width = maxHeight * aspectRatio;
      }
      
      setCanvasSize({ width, height });
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  return canvasSize;
};

// Canvas Controls Component
const CanvasControls: React.FC<{
  onGrab: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  isGrabbing: boolean;
}> = ({ onGrab, onZoomIn, onZoomOut, onReset, isGrabbing }) => {
  return (
    <div className="absolute top-4 right-4 flex space-x-2 z-10">
      <button
        onClick={(e) => {
          console.log('Grab button clicked!');
          e.preventDefault();
          e.stopPropagation();
          onGrab();
        }}
        className={`p-2 rounded-lg transition-colors ${
          isGrabbing
            ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
            : 'bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-300'
        } shadow-lg`}
        title="Grab and move canvas"
      >
        <Move size={20} />
      </button>
      <button
        onClick={(e) => {
          console.log('Zoom in button clicked!');
          e.preventDefault();
          e.stopPropagation();
          onZoomIn();
        }}
        className="p-2 rounded-lg bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-300 shadow-lg"
        title="Zoom in"
      >
        <ZoomIn size={20} />
      </button>
      <button
        onClick={(e) => {
          console.log('Zoom out button clicked!');
          e.preventDefault();
          e.stopPropagation();
          onZoomOut();
        }}
        className="p-2 rounded-lg bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-300 shadow-lg"
        title="Zoom out"
      >
        <ZoomOut size={20} />
      </button>
      <button
        onClick={(e) => {
          console.log('Reset button clicked!');
          e.preventDefault();
          e.stopPropagation();
          onReset();
        }}
        className="p-2 rounded-lg bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-300 shadow-lg"
        title="Reset view"
      >
        <RotateCcw size={20} />
      </button>
    </div>
  );
};

// Main App Content
const AppContent: React.FC = () => {
  const { mode, tool } = useVisualizer();
  const { width, height } = useResponsiveCanvasSize();
  const [isGrabbing, setIsGrabbing] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
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

  const handleGrab = () => {
    console.log('Grab button clicked, current isGrabbing:', isGrabbing);
    setIsGrabbing(!isGrabbing);
  };

  const handleMouseDown = useCallback((e: MouseEvent) => {
    console.log('Mouse down on canvas, isGrabbing:', isGrabbing);
    if (!isGrabbing) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ 
      x: e.clientX - position.x * scale, 
      y: e.clientY - position.y * scale 
    });
  }, [isGrabbing, position, scale]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !isGrabbing) return;
    e.preventDefault();
    const newX = (e.clientX - dragStart.x) / scale;
    const newY = (e.clientY - dragStart.y) / scale;
    setPosition({ x: newX, y: newY });
  }, [isDragging, isGrabbing, dragStart, scale]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      console.log('Mouse up, stopping drag');
    }
    setIsDragging(false);
  }, [isDragging]);

  const handleZoomIn = () => {
    console.log('Zoom in clicked, current scale:', scale);
    setScale(prev => {
      const newScale = Math.min(prev * 1.2, 3);
      console.log('New scale:', newScale);
      return newScale;
    });
  };

  const handleZoomOut = () => {
    console.log('Zoom out clicked, current scale:', scale);
    setScale(prev => {
      const newScale = Math.max(prev / 1.2, 0.5);
      console.log('New scale:', newScale);
      return newScale;
    });
  };

  const handleReset = () => {
    console.log('Reset clicked');
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setIsDragging(false);
    
    // Only reset grabbing if currently active
    if (isGrabbing) {
      setIsGrabbing(false);
    }
    
    const canvas = document.querySelector('.visualization-area');
    if (canvas) {
      canvas.classList.remove('cursor-grab', 'cursor-grabbing');
    }
  };

  useEffect(() => {
    const canvas = document.querySelector('.visualization-area') as HTMLElement;
    if (!canvas) return;

    const mouseDownHandler = (e: MouseEvent) => {
      handleMouseDown(e);
    };

    const mouseMoveHandler = (e: MouseEvent) => {
      handleMouseMove(e);
    };

    const mouseUpHandler = () => {
      handleMouseUp();
    };

    // Add event listeners
    canvas.addEventListener('mousedown', mouseDownHandler as EventListener);
    document.addEventListener('mousemove', mouseMoveHandler as EventListener);
    document.addEventListener('mouseup', mouseUpHandler);
    document.addEventListener('mouseleave', mouseUpHandler);

    return () => {
      canvas.removeEventListener('mousedown', mouseDownHandler as EventListener);
      document.removeEventListener('mousemove', mouseMoveHandler as EventListener);
      document.removeEventListener('mouseup', mouseUpHandler);
      document.removeEventListener('mouseleave', mouseUpHandler);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp]);

  // Update cursor styles based on grabbing state
  useEffect(() => {
    const canvas = document.querySelector('.visualization-area');
    if (canvas) {
      canvas.classList.remove('cursor-grab', 'cursor-grabbing');
      if (isGrabbing) {
        if (isDragging) {
          canvas.classList.add('cursor-grabbing');
        } else {
          canvas.classList.add('cursor-grab');
        }
      }
    }
  }, [isGrabbing, isDragging]);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Header />
      
      <main className="flex-1 flex flex-col items-center justify-center p-4 relative">
        <div className="w-full max-w-[1600px] flex flex-col items-center relative">
          {/* Static Canvas Controls - positioned outside the transformed area */}
          <CanvasControls
            onGrab={handleGrab}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onReset={handleReset}
            isGrabbing={isGrabbing}
          />
          
          {/* Visualization area */}
          <div 
            className="relative w-full flex items-center justify-center visualization-area"
            style={{
              transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
              transition: isDragging ? 'none' : 'transform 0.2s ease-out'
            }}
          >
            {renderVisualization()}
          </div>
          
          {/* Fixed control panel at bottom */}
          <div className="fixed bottom-0 left-0 right-0 z-50">
            <ControlPanel />
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