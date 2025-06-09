import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';

interface TooltipProps {
  content: string;
  description?: string;
  delay?: number;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  description,
  delay = 300,
  position = 'top',
  children,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [actualPosition, setActualPosition] = useState(position);
  const timeoutRef = useRef<number>();
  const triggerRef = useRef<HTMLDivElement>(null);

  const calculatePosition = () => {
    if (!triggerRef.current) {
      console.log('No trigger ref for tooltip:', content);
      return;
    }

    console.log('Calculating position for tooltip:', content);
    const triggerRect = triggerRef.current.getBoundingClientRect();
    console.log('Trigger rect:', triggerRect);
    
    const tooltipWidth = 300; // Max width
    const tooltipHeight = description ? 80 : 50; // Estimated height
    const gap = 8;

    let top = 0;
    let left = 0;
    let newPosition = position;

    // Calculate position based on preference
    switch (position) {
      case 'top':
        top = triggerRect.top - tooltipHeight - gap;
        left = triggerRect.left + triggerRect.width / 2 - tooltipWidth / 2;
        
        // Check if it fits above
        if (top < 10) {
          newPosition = 'bottom';
          top = triggerRect.bottom + gap;
        }
        break;

      case 'bottom':
        top = triggerRect.bottom + gap;
        left = triggerRect.left + triggerRect.width / 2 - tooltipWidth / 2;
        
        // Check if it fits below
        if (top + tooltipHeight > window.innerHeight - 10) {
          newPosition = 'top';
          top = triggerRect.top - tooltipHeight - gap;
        }
        break;

      case 'left':
        top = triggerRect.top + triggerRect.height / 2 - tooltipHeight / 2;
        left = triggerRect.left - tooltipWidth - gap;
        
        // Check if it fits to the left
        if (left < 10) {
          newPosition = 'right';
          left = triggerRect.right + gap;
        }
        break;

      case 'right':
        top = triggerRect.top + triggerRect.height / 2 - tooltipHeight / 2;
        left = triggerRect.right + gap;
        
        // Check if it fits to the right
        if (left + tooltipWidth > window.innerWidth - 10) {
          newPosition = 'left';
          left = triggerRect.left - tooltipWidth - gap;
        }
        break;
    }

    // Ensure tooltip stays within viewport bounds
    left = Math.max(10, Math.min(left, window.innerWidth - tooltipWidth - 10));
    top = Math.max(10, Math.min(top, window.innerHeight - tooltipHeight - 10));

    console.log('Final tooltip position:', { top, left, newPosition });
    setTooltipPosition({ top, left });
    setActualPosition(newPosition);
  };

  const showTooltip = () => {
    console.log('Tooltip showTooltip called for:', content);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = window.setTimeout(() => {
      console.log('Tooltip showing:', content);
      calculatePosition();
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    console.log('Tooltip hideTooltip called for:', content);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    const handleResize = () => {
      if (isVisible) {
        calculatePosition();
      }
    };

    const handleScroll = () => {
      if (isVisible) {
        calculatePosition();
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isVisible]);

  const getArrowStyle = () => {
    const arrowSize = 6;
    let arrowStyle: React.CSSProperties = {
      position: 'absolute',
      width: 0,
      height: 0,
      border: `${arrowSize}px solid transparent`,
    };

    switch (actualPosition) {
      case 'top':
        arrowStyle = {
          ...arrowStyle,
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          borderTopColor: 'rgba(17, 24, 39, 0.9)',
          borderBottomWidth: 0,
        };
        break;
      case 'bottom':
        arrowStyle = {
          ...arrowStyle,
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          borderBottomColor: 'rgba(17, 24, 39, 0.9)',
          borderTopWidth: 0,
        };
        break;
      case 'left':
        arrowStyle = {
          ...arrowStyle,
          left: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          borderLeftColor: 'rgba(17, 24, 39, 0.9)',
          borderRightWidth: 0,
        };
        break;
      case 'right':
        arrowStyle = {
          ...arrowStyle,
          right: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          borderRightColor: 'rgba(17, 24, 39, 0.9)',
          borderLeftWidth: 0,
        };
        break;
    }

    return arrowStyle;
  };

  const tooltipElement = isVisible ? (
    <div
      style={{
        position: 'fixed',
        top: tooltipPosition.top,
        left: tooltipPosition.left,
        zIndex: 9999,
        maxWidth: '300px',
        padding: '12px 16px',
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        backdropFilter: 'blur(12px)',
        color: 'white',
        fontSize: '14px',
        fontWeight: '500',
        borderRadius: '12px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        border: '1px solid rgba(75, 85, 99, 0.5)',
        pointerEvents: 'none',
        opacity: isVisible ? 1 : 0,
        transform: `scale(${isVisible ? 1 : 0.95})`,
        transition: 'opacity 300ms ease-out, transform 300ms ease-out',
      }}
      role="tooltip"
    >
      <div style={getArrowStyle()} />
      <div style={{ fontWeight: '600', color: 'white' }}>{content}</div>
      {description && (
        <div style={{ 
          fontSize: '12px', 
          color: 'rgba(229, 231, 235, 0.9)', 
          marginTop: '6px', 
          lineHeight: '1.4' 
        }}>
          {description}
        </div>
      )}
    </div>
  ) : null;

  return (
    <div 
      ref={triggerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {typeof window !== 'undefined' && ReactDOM.createPortal(
        tooltipElement,
        document.body
      )}
    </div>
  );
};

export default Tooltip;
