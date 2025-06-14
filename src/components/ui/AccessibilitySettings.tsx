import React, { useState } from 'react';
import { useResponsiveViewport, useAccessibility, getResponsiveSpacing, getResponsiveFontSizes } from '../../hooks/useResponsiveUI';

interface AccessibilitySettingsProps {
  className?: string;
}

export const AccessibilitySettings: React.FC<AccessibilitySettingsProps> = ({
  className = ''
}) => {
  const viewport = useResponsiveViewport();
  const { preferences, togglePreference } = useAccessibility();
  const spacing = getResponsiveSpacing(viewport);
  const fonts = getResponsiveFontSizes(viewport);
  
  const [isOpen, setIsOpen] = useState(false);

  const containerClasses = preferences.highContrast 
    ? 'bg-black text-white border-white' 
    : 'bg-white/95 text-gray-800 border-gray-200/50';

  const buttonClasses = preferences.highContrast
    ? 'bg-white text-black hover:bg-gray-200'
    : 'bg-purple-500 text-white hover:bg-purple-600';

  const toggleClasses = (enabled: boolean) => 
    `relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
      enabled 
        ? (preferences.highContrast ? 'bg-white' : 'bg-blue-500')
        : (preferences.highContrast ? 'bg-gray-600' : 'bg-gray-300')
    }`;

  const toggleIndicatorClasses = (enabled: boolean) =>
    `inline-block h-4 w-4 transform rounded-full transition-transform ${
      enabled 
        ? 'translate-x-6 bg-black' 
        : 'translate-x-1 bg-white'
    }`;

  return (
    <div
      className={`fixed top-4 left-4 z-40 ${className}`}
      style={{ maxWidth: viewport.isMobile ? '90vw' : '300px' }}
    >
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`transition-colors font-medium rounded-full p-3 shadow-lg ${buttonClasses}`}
        style={{ fontSize: `${fonts.sm}px` }}
        aria-label="Accessibility Settings"
        title="Open accessibility settings"
      >
        ♿
      </button>

      {/* Settings panel */}
      {isOpen && (
        <div
          className={`mt-2 backdrop-blur-sm rounded-lg border shadow-lg ${containerClasses}`}
          style={{ padding: spacing.padding }}
          role="dialog"
          aria-label="Accessibility Settings"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold" style={{ fontSize: `${fonts.lg}px` }}>
              Accessibility
            </h4>
            <button
              onClick={() => setIsOpen(false)}
              className={`p-1 rounded transition-colors ${preferences.highContrast ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
              aria-label="Close accessibility settings"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            {/* High Contrast Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium" style={{ fontSize: `${fonts.sm}px` }}>
                  High Contrast
                </label>
                <p className="text-gray-500" style={{ fontSize: `${fonts.xs}px` }}>
                  Increase color contrast for better visibility
                </p>
              </div>
              <button
                onClick={() => togglePreference('highContrast')}
                className={toggleClasses(preferences.highContrast)}
                role="switch"
                aria-checked={preferences.highContrast}
                aria-label="Toggle high contrast mode"
              >
                <span className={toggleIndicatorClasses(preferences.highContrast)} />
              </button>
            </div>

            {/* Reduced Motion Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium" style={{ fontSize: `${fonts.sm}px` }}>
                  Reduce Motion
                </label>
                <p className="text-gray-500" style={{ fontSize: `${fonts.xs}px` }}>
                  Minimize animations and transitions
                </p>
              </div>
              <button
                onClick={() => togglePreference('reducedMotion')}
                className={toggleClasses(preferences.reducedMotion)}
                role="switch"
                aria-checked={preferences.reducedMotion}
                aria-label="Toggle reduced motion"
              >
                <span className={toggleIndicatorClasses(preferences.reducedMotion)} />
              </button>
            </div>

            {/* Increased Text Size Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium" style={{ fontSize: `${fonts.sm}px` }}>
                  Larger Text
                </label>
                <p className="text-gray-500" style={{ fontSize: `${fonts.xs}px` }}>
                  Increase text size for better readability
                </p>
              </div>
              <button
                onClick={() => togglePreference('increaseTextSize')}
                className={toggleClasses(preferences.increaseTextSize)}
                role="switch"
                aria-checked={preferences.increaseTextSize}
                aria-label="Toggle larger text size"
              >
                <span className={toggleIndicatorClasses(preferences.increaseTextSize)} />
              </button>
            </div>

            {/* Keyboard Navigation Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium" style={{ fontSize: `${fonts.sm}px` }}>
                  Keyboard Navigation
                </label>
                <p className="text-gray-500" style={{ fontSize: `${fonts.xs}px` }}>
                  Enable keyboard shortcuts and focus indicators
                </p>
              </div>
              <button
                onClick={() => togglePreference('keyboardNavigation')}
                className={toggleClasses(preferences.keyboardNavigation)}
                role="switch"
                aria-checked={preferences.keyboardNavigation}
                aria-label="Toggle keyboard navigation"
              >
                <span className={toggleIndicatorClasses(preferences.keyboardNavigation)} />
              </button>
            </div>
          </div>

          {/* Keyboard shortcuts help */}
          {preferences.keyboardNavigation && (
            <div className={`mt-4 pt-4 border-t ${preferences.highContrast ? 'border-white' : 'border-gray-200/50'}`}>
              <h5 className="font-semibold mb-2" style={{ fontSize: `${fonts.sm}px` }}>
                Keyboard Shortcuts
              </h5>
              <div className="space-y-1" style={{ fontSize: `${fonts.xs}px` }}>
                <div className="flex justify-between">
                  <span>Tab</span>
                  <span>Navigate elements</span>
                </div>
                <div className="flex justify-between">
                  <span>Space</span>
                  <span>Activate button</span>
                </div>
                <div className="flex justify-between">
                  <span>Escape</span>
                  <span>Close dialogs</span>
                </div>
                <div className="flex justify-between">
                  <span>Enter</span>
                  <span>Confirm action</span>
                </div>
              </div>
            </div>
          )}

          {/* Device info */}
          <div className={`mt-4 pt-4 border-t ${preferences.highContrast ? 'border-white' : 'border-gray-200/50'}`}>
            <div style={{ fontSize: `${fonts.xs}px` }} className="text-gray-500 space-y-1">
              <div>Device: {viewport.isMobile ? 'Mobile' : viewport.isTablet ? 'Tablet' : 'Desktop'}</div>
              <div>Screen: {viewport.width} × {viewport.height}</div>
              <div>Orientation: {viewport.orientation}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessibilitySettings;
