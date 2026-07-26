import React from 'react';

interface SafeFlowLogoProps {
  size?: number;
  className?: string;
  color?: string; // Hexagon color
  accentColor?: string; // Shield/Arrow color
}

export const SafeFlowLogo: React.FC<SafeFlowLogoProps> = ({ 
  size = 32, 
  className = '', 
  color = 'var(--text-primary)', 
  accentColor = 'var(--primary)'
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* 1. Hexagon with bottom-left gap */}
      <path 
        d="M 50 10 L 85 30 L 85 70 L 50 90 L 15 70 L 15 58 M 15 42 L 15 30 L 50 10" 
        stroke={color} 
        strokeWidth="6.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      {/* 2. Shield */}
      <path 
        d="M 36 34 C 44 34 47 30 50 27 C 53 30 56 34 64 34 C 64 48 64 61 50 69 C 36 61 36 48 36 34 Z" 
        stroke={accentColor} 
        strokeWidth="5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      {/* 3. Arrow slicing through */}
      <path 
        d="M 10 65 L 43 43 L 53 49 L 78 24" 
        stroke={accentColor} 
        strokeWidth="6" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      <path 
        d="M 82 20 L 70 23 L 79 32 Z" 
        fill={accentColor} 
        stroke={accentColor} 
        strokeWidth="1.5" 
        strokeLinejoin="round" 
      />
    </svg>
  );
};
