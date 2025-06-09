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
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

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
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}> = ({ onZoomIn, onZoomOut, onReset }) => {
  return (
    <div className="absolute top-4 right-4 flex space-x-2 z-10">
      <button
        onClick={(e) => {
          console.log('Zoom in button clicked!');
          e.preventDefault();
          e.stopPropagation();
          onZoomIn();
        }}
        className="p-2 rounded-lg bg-white/20 backdrop-blur-sm text-gray-700 hover:bg-white/30 border-2 border-gray-300/50 shadow-lg"
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
        className="p-2 rounded-lg bg-white/20 backdrop-blur-sm text-gray-700 hover:bg-white/30 border-2 border-gray-300/50 shadow-lg"
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
        className="p-2 rounded-lg bg-white/2 backdrop-blur-sm text-gray-700 hover:bg-white/5 border-2 border-gray-300/50 shadow-lg"
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
  // For all 2D tools that support zoom/pan:
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // --- Pinch, wheel+ctrl zoom, and pan logic ---
  const visAreaRef = React.useRef<HTMLDivElement>(null);
  const pinchState = React.useRef<{ initialDist: number | null; initialScale: number }>({ initialDist: null, initialScale: 1 });
  const panState = React.useRef<{ startX: number; startY: number; startOffset: { x: number; y: number }; isPanning: boolean }>({ startX: 0, startY: 0, startOffset: { x: 0, y: 0 }, isPanning: false });

  useEffect(() => {
    const visArea = visAreaRef.current;
    if (!visArea) return;
    // --- Pinch zoom ---
    function getTouchDist(e: TouchEvent) {
      if (e.touches.length < 2) return 0;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    }
    function onTouchStart(e: TouchEvent) {
      if (e.touches.length === 2) {
        pinchState.current.initialDist = getTouchDist(e);
        pinchState.current.initialScale = scale;
        e.preventDefault();
      } else if (e.touches.length === 1) {
        // Start pan
        panState.current.isPanning = true;
        panState.current.startX = e.touches[0].clientX;
        panState.current.startY = e.touches[0].clientY;
        panState.current.startOffset = { ...offset };
        e.preventDefault();
      }
    }
    function onTouchMove(e: TouchEvent) {
      if (e.touches.length === 2 && pinchState.current.initialDist) {
        const newDist = getTouchDist(e);
        const scaleFactor = newDist / pinchState.current.initialDist;
        setScale(Math.max(0.1, Math.min(10, pinchState.current.initialScale * scaleFactor)));
        e.preventDefault();
      } else if (e.touches.length === 1 && panState.current.isPanning) {
        // Pan
        const dx = e.touches[0].clientX - panState.current.startX;
        const dy = e.touches[0].clientY - panState.current.startY;
        // Convert px to world units
        const baseRange = 10;
        const visibleRange = baseRange / scale;
        const worldPerPx = (visibleRange * 2) / width;
        setOffset({
          x: panState.current.startOffset.x - dx * worldPerPx,
          y: panState.current.startOffset.y + dy * worldPerPx
        });
        e.preventDefault();
      }
    }
    function onTouchEnd(e: TouchEvent) {
      if (e.touches.length < 2) {
        pinchState.current.initialDist = null;
      }
      if (e.touches.length === 0) {
        panState.current.isPanning = false;
      }
    }
    visArea.addEventListener('touchstart', onTouchStart, { passive: false });
    visArea.addEventListener('touchmove', onTouchMove, { passive: false });
    visArea.addEventListener('touchend', onTouchEnd, { passive: false });
    // --- Mouse pan ---
    function onMouseDown(e: MouseEvent) {
      if (e.button !== 0) return;
      panState.current.isPanning = true;
      panState.current.startX = e.clientX;
      panState.current.startY = e.clientY;
      panState.current.startOffset = { ...offset };
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      e.preventDefault();
    }
    function onMouseMove(e: MouseEvent) {
      if (!panState.current.isPanning) return;
      const dx = e.clientX - panState.current.startX;
      const dy = e.clientY - panState.current.startY;
      const baseRange = 10;
      const visibleRange = baseRange / scale;
      const worldPerPx = (visibleRange * 2) / width;
      setOffset({
        x: panState.current.startOffset.x - dx * worldPerPx,
        y: panState.current.startOffset.y + dy * worldPerPx
      });
    }
    function onMouseUp() {
      panState.current.isPanning = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    }
    visArea.addEventListener('mousedown', onMouseDown);
    // --- Wheel+ctrl zoom (desktop) ---
    function onWheel(e: WheelEvent) {
      if (e.ctrlKey) {
        e.preventDefault();
        setScale(s => {
          let next = s * (e.deltaY < 0 ? 1.1 : 0.9);
          next = Math.max(0.1, Math.min(10, next));
          return next;
        });
      }
    }
    visArea.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      visArea.removeEventListener('touchstart', onTouchStart);
      visArea.removeEventListener('touchmove', onTouchMove);
      visArea.removeEventListener('touchend', onTouchEnd);
      visArea.removeEventListener('mousedown', onMouseDown);
      visArea.removeEventListener('wheel', onWheel);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [scale, offset, width]);
  // --- End gesture logic ---

  // Determine which visualization component to render based on mode and tool
  const renderVisualization = () => {
    if (mode === '2d') {
      if (tool === 'vector' || tool === 'basis') {
        return (
          <VectorCanvas2D
            width={width}
            height={height}
            scale={scale}
            offset={offset}
            onPanChange={setOffset}
            onScaleChange={setScale}
          />
        );
      }
      if (tool === 'matrix') {
        return (
          <MatrixTransformationCanvas2D
            width={width}
            height={height}
            scale={scale}
            offset={offset}
            onPanChange={setOffset}
            onScaleChange={setScale}
          />
        );
      }
      if (tool === 'subspace') {
        return <SubspaceCanvas2D width={width} height={height} scale={scale} offset={offset} onPanChange={setOffset} onScaleChange={setScale} />;
      }
      if (tool === 'eigenvalue') {
        return <EigenvalueCanvas2D width={width} height={height} scale={scale} offset={offset} onPanChange={setOffset} onScaleChange={setScale} />;
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

  // Zoom/pan controls only affect 2D tools that support zoom
  const showCanvasControls = mode === '2d' && (tool === 'vector' || tool === 'basis' || tool === 'matrix' || tool === 'subspace' || tool === 'eigenvalue');
  const handleZoomIn = () => setScale(s => Math.min(10, s * 1.1));
  const handleZoomOut = () => setScale(s => Math.max(0.1, s * 0.9));
  const handleReset = () => { setScale(1); setOffset({ x: 0, y: 0 }); };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center p-4 relative">
        <div className="w-full max-w-[1600px] flex flex-col items-center relative">
          {showCanvasControls && (
            <CanvasControls
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onReset={handleReset}
            />
          )}
          {/* Visualization area (no transform here) */}
          <div
            ref={visAreaRef}
            className="relative w-full flex items-center justify-center visualization-area"
            style={{ touchAction: 'none' }}
          >
            {renderVisualization()}
          </div>
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