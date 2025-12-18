import * as React from "react";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

// Om Icon from uxwing - will use the downloaded SVG
export const OmIcon: React.FC<IconProps> = ({ className = "w-6 h-6", ...props }) => (
  <img 
    src="/src/assets/icons/om.svg" 
    className={className}
    alt="Om"
    {...props as any}
  />
);

// Hindu Shastra Icon
export const ShastraIcon: React.FC<IconProps> = ({ className = "w-6 h-6", ...props }) => (
  <img 
    src="/src/assets/icons/shastra.svg" 
    className={className}
    alt="Shastra"
    {...props as any}
  />
);

// Maps/Route Icon
export const MapsIcon: React.FC<IconProps> = ({ className = "w-6 h-6", ...props }) => (
  <img 
    src="/src/assets/icons/maps.svg" 
    className={className}
    alt="Maps"
    {...props as any}
  />
);

// Star Icon (simple SVG since download failed)
export const StarFullIcon: React.FC<IconProps> = ({ className = "w-6 h-6", ...props }) => (
  <svg 
    viewBox="0 0 122.88 117.19" 
    fill="currentColor" 
    className={className}
    {...props}
  >
    <path d="M64.42,2,80.13,38.7,120,42.26a3.2,3.2,0,0,1,1.82,5.62h0L91.64,74.18l8.9,39A3.19,3.19,0,0,1,96.25,117L61.44,97.11,26.63,117a3.19,3.19,0,0,1-4.29-3.82l8.9-39L1.09,47.88a3.2,3.2,0,0,1,1.82-5.62l39.86-3.56L58.46,2a3.2,3.2,0,0,1,5.96,0Z"/>
  </svg>
);

// Robot Icon (simple SVG since download failed)
export const RobotIcon: React.FC<IconProps> = ({ className = "w-6 h-6", ...props }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    {...props}
  >
    <path d="M12 2a2 2 0 0 1 2 2v1h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4V4a2 2 0 0 1 2-2zm0 2a.5.5 0 0 0-.5.5V5h1v-.5A.5.5 0 0 0 12 4zM6 7v12h12V7H6zm2.5 3a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm7 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM9 15h6a1 1 0 0 1 0 2H9a1 1 0 0 1 0-2z"/>
  </svg>
);

// Eye Icon (simple SVG since download failed)
export const EyeIcon: React.FC<IconProps> = ({ className = "w-6 h-6", ...props }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    {...props}
  >
    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
  </svg>
);

export default { OmIcon, ShastraIcon, MapsIcon, StarFullIcon, RobotIcon, EyeIcon };
