// Utility functions for sharing and state management

export interface ShareableState {
  mode: string;
  tool: string;
  vectors2D: any[];
  vectors3D: any[];
  matrix2D: number[][];
  matrix3D: number[][];
  settings: any;
  subspaceSettings: any;
  basisSettings: any;
  basisSettings3D: any;
  eigenvalueSettings: any;
}

/**
 * Serialize the current application state for sharing
 */
export const serializeState = (context: any): ShareableState => {
  return {
    mode: context.mode,
    tool: context.tool,
    vectors2D: context.vectors2D,
    vectors3D: context.vectors3D,
    matrix2D: context.matrix2D,
    matrix3D: context.matrix3D,
    settings: context.settings,
    subspaceSettings: context.subspaceSettings,
    basisSettings: context.basisSettings,
    basisSettings3D: context.basisSettings3D,
    eigenvalueSettings: context.eigenvalueSettings,
  };
};

/**
 * Deserialize state from shared data and apply it to the context
 */
export const deserializeState = (sharedState: ShareableState, context: any) => {
  try {
    if (sharedState.mode) context.setMode(sharedState.mode);
    if (sharedState.tool) context.setTool(sharedState.tool);
    if (sharedState.vectors2D) context.setVectors2D(sharedState.vectors2D);
    if (sharedState.vectors3D) context.setVectors3D(sharedState.vectors3D);
    if (sharedState.matrix2D) context.setMatrix2D(sharedState.matrix2D);
    if (sharedState.matrix3D) context.setMatrix3D(sharedState.matrix3D);
    if (sharedState.settings) context.updateSettings(sharedState.settings);
    if (sharedState.subspaceSettings) context.updateSubspaceSettings(sharedState.subspaceSettings);
    if (sharedState.basisSettings) context.updateBasisSettings(sharedState.basisSettings);
    if (sharedState.basisSettings3D) context.updateBasisSettings3D(sharedState.basisSettings3D);
    if (sharedState.eigenvalueSettings) context.updateEigenvalueSettings(sharedState.eigenvalueSettings);
    
    return true;
  } catch (error) {
    console.error('Error deserializing shared state:', error);
    return false;
  }
};

/**
 * Parse shared state from URL parameters
 */
export const parseSharedStateFromUrl = (): ShareableState | null => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const shareParam = urlParams.get('share');
    
    if (!shareParam) return null;
    
    const decodedData = decodeURIComponent(shareParam);
    const sharedState = JSON.parse(atob(decodedData));
    
    return sharedState;
  } catch (error) {
    console.error('Error parsing shared state from URL:', error);
    return null;
  }
};

/**
 * Remove share parameters from URL without reloading the page
 */
export const clearShareFromUrl = () => {
  const url = new URL(window.location.href);
  url.searchParams.delete('share');
  window.history.replaceState({}, document.title, url.toString());
};

/**
 * Generate a shareable URL with the current state
 */
export const generateShareUrl = (state: ShareableState): string => {
  try {
    const compressedData = btoa(JSON.stringify(state));
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?share=${encodeURIComponent(compressedData)}`;
  } catch (error) {
    console.error('Error generating share URL:', error);
    return '';
  }
};

/**
 * Validate if shared state has the required structure
 */
export const validateSharedState = (state: any): state is ShareableState => {
  return (
    state &&
    typeof state === 'object' &&
    typeof state.mode === 'string' &&
    typeof state.tool === 'string' &&
    Array.isArray(state.vectors2D) &&
    Array.isArray(state.vectors3D) &&
    Array.isArray(state.matrix2D) &&
    Array.isArray(state.matrix3D)
  );
};

/**
 * Create a simplified state object for easier sharing (removes complex objects)
 */
export const createMinimalShareState = (context: any): ShareableState => {
  const state = serializeState(context);
  
  // Remove any functions, complex objects, or unnecessary data
  const cleanState = JSON.parse(JSON.stringify(state));
  
  return cleanState;
};

/**
 * Import configuration from JSON file
 */
export const importConfigFromFile = (file: File): Promise<ShareableState | null> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        
        if (validateSharedState(parsed)) {
          resolve(parsed);
        } else {
          reject(new Error('Invalid configuration file format'));
        }
      } catch (error) {
        reject(new Error('Failed to parse configuration file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read configuration file'));
    };
    
    reader.readAsText(file);
  });
};
