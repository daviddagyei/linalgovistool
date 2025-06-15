import React from 'react';

interface ModernCanvasHeaderProps {
  title: string;
  description?: string;
  variant?: 'eigenvalue' | 'vector' | 'matrix' | 'basis' | 'subspace';
  children?: React.ReactNode;
  compact?: boolean;
}

const ModernCanvasHeader: React.FC<ModernCanvasHeaderProps> = ({ 
  title, 
  description, 
  variant = 'vector',
  children,
  compact = false
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'eigenvalue':
        return {
          background: 'bg-gradient-to-r from-blue-50 via-purple-50 to-indigo-50',
          border: 'border-blue-200',
          accent: 'text-blue-600',
          shadow: 'shadow-blue-100/50'
        };
      case 'vector':
        return {
          background: 'bg-gradient-to-r from-blue-50 via-cyan-50 to-teal-50',
          border: 'border-cyan-200',
          accent: 'text-cyan-600',
          shadow: 'shadow-cyan-100/50'
        };
      case 'matrix':
        return {
          background: 'bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50',
          border: 'border-orange-200',
          accent: 'text-orange-600',
          shadow: 'shadow-orange-100/50'
        };
      case 'basis':
        return {
          background: 'bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50',
          border: 'border-green-200',
          accent: 'text-green-600',
          shadow: 'shadow-green-100/50'
        };
      case 'subspace':
        return {
          background: 'bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50',
          border: 'border-purple-200',
          accent: 'text-purple-600',
          shadow: 'shadow-purple-100/50'
        };
      default:
        return {
          background: 'bg-gradient-to-r from-gray-50 via-slate-50 to-gray-50',
          border: 'border-gray-200',
          accent: 'text-gray-600',
          shadow: 'shadow-gray-100/50'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className={`${styles.background} ${styles.border} border-b relative overflow-hidden ${compact ? 'p-3' : 'p-4'}`}>
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
          backgroundSize: '20px 20px'
        }} />
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className={`text-lg font-bold text-gray-800 mb-1 flex items-center ${compact ? 'text-base' : ''}`}>
              <div className={`w-1 h-6 ${styles.background.replace('from-', 'bg-').split(' ')[0].replace('bg-gradient-to-r', 'bg-gradient-to-b')} rounded-full mr-3 shadow-sm`} />
              {title}
            </h3>
            {description && (
              <p className={`text-gray-600 leading-relaxed ${compact ? 'text-xs' : 'text-sm'}`}>
                {description}
              </p>
            )}
          </div>
          
          {/* Optional status indicator */}
          <div className={`ml-4 flex items-center space-x-2 ${compact ? 'scale-90' : ''}`}>
            <div className={`w-2 h-2 ${styles.accent.replace('text-', 'bg-')} rounded-full animate-pulse`} />
            <span className={`text-xs font-medium ${styles.accent} uppercase tracking-wide`}>
              Active
            </span>
          </div>
        </div>
        
        {/* Additional content */}
        {children && (
          <div className={`${compact ? 'mt-2' : 'mt-3'} space-y-2`}>
            {children}
          </div>
        )}
      </div>
      
      {/* Bottom highlight */}
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${styles.background}`} />
    </div>
  );
};

export default ModernCanvasHeader;
