/**
 * SVG Icons for Cell Diagrams
 * Minimalist Excalidraw-style icons
 */

import { memo } from 'react';

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

const defaultSize = 24;
const defaultColor = '#1e1e1e';

// Component/Microservice - 3D Cube
export const CubeIcon = memo(({ size = defaultSize, color = defaultColor, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M12 2L3 7v10l9 5 9-5V7l-9-5z"
      stroke={color}
      strokeWidth="1.5"
      fill="none"
    />
    <path d="M3 7l9 5 9-5" stroke={color} strokeWidth="1.5" />
    <path d="M12 12v10" stroke={color} strokeWidth="1.5" />
  </svg>
));
CubeIcon.displayName = 'CubeIcon';

// Database - Cylinder with lines
export const DatabaseIcon = memo(({ size = defaultSize, color = defaultColor, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <ellipse cx="12" cy="6" rx="8" ry="3" stroke={color} strokeWidth="1.5" fill="none" />
    <path d="M4 6v12c0 1.66 3.58 3 8 3s8-1.34 8-3V6" stroke={color} strokeWidth="1.5" />
    <path d="M4 10c0 1.66 3.58 3 8 3s8-1.34 8-3" stroke={color} strokeWidth="1.5" />
    <path d="M4 14c0 1.66 3.58 3 8 3s8-1.34 8-3" stroke={color} strokeWidth="1.5" />
  </svg>
));
DatabaseIcon.displayName = 'DatabaseIcon';

// Gateway - Bidirectional arrows
export const GatewayIcon = memo(({ size = defaultSize, color = defaultColor, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 4v16" stroke={color} strokeWidth="1.5" />
    <path d="M8 8l4-4 4 4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 16l4 4 4-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
));
GatewayIcon.displayName = 'GatewayIcon';

// User - Person silhouette
export const UserIcon = memo(({ size = defaultSize, color = defaultColor, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.5" fill="none" />
    <path
      d="M4 20c0-4 4-6 8-6s8 2 8 6"
      stroke={color}
      strokeWidth="1.5"
      fill="none"
    />
  </svg>
));
UserIcon.displayName = 'UserIcon';

// Cloud - External service
export const CloudIcon = memo(({ size = defaultSize, color = defaultColor, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M6.5 19a4.5 4.5 0 01-.42-8.98A6 6 0 0118 10a4 4 0 01.88 7.9"
      stroke={color}
      strokeWidth="1.5"
      fill="none"
    />
    <path d="M6 19h13" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
));
CloudIcon.displayName = 'CloudIcon';

// Function - Lambda symbol
export const FunctionIcon = memo(({ size = defaultSize, color = defaultColor, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <text
      x="12"
      y="17"
      textAnchor="middle"
      fontSize="16"
      fontFamily="serif"
      fontStyle="italic"
      fill={color}
    >
      λ
    </text>
  </svg>
));
FunctionIcon.displayName = 'FunctionIcon';

// Cache - Lightning bolt
export const CacheIcon = memo(({ size = defaultSize, color = defaultColor, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"
      stroke={color}
      strokeWidth="1.5"
      fill="none"
      strokeLinejoin="round"
    />
  </svg>
));
CacheIcon.displayName = 'CacheIcon';

// Broker - Message queue
export const BrokerIcon = memo(({ size = defaultSize, color = defaultColor, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="3" y="6" width="18" height="12" rx="2" stroke={color} strokeWidth="1.5" fill="none" />
    <path d="M3 10h18" stroke={color} strokeWidth="1.5" />
    <path d="M7 14h4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M7 17h6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
));
BrokerIcon.displayName = 'BrokerIcon';

// IDP - Key/Shield
export const IdpIcon = memo(({ size = defaultSize, color = defaultColor, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M12 2L4 6v6c0 5.5 3.4 10.3 8 12 4.6-1.7 8-6.5 8-12V6l-8-4z"
      stroke={color}
      strokeWidth="1.5"
      fill="none"
    />
    <circle cx="12" cy="10" r="2" stroke={color} strokeWidth="1.5" fill="none" />
    <path d="M12 12v4" stroke={color} strokeWidth="1.5" />
  </svg>
));
IdpIcon.displayName = 'IdpIcon';

// STS - Token/Ticket
export const StsIcon = memo(({ size = defaultSize, color = defaultColor, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="4" y="4" width="16" height="16" rx="2" stroke={color} strokeWidth="1.5" fill="none" />
    <path d="M4 9h16" stroke={color} strokeWidth="1.5" />
    <path d="M8 14h8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M8 17h4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
));
StsIcon.displayName = 'StsIcon';

// Userstore - People group
export const UserstoreIcon = memo(({ size = defaultSize, color = defaultColor, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="8" cy="8" r="3" stroke={color} strokeWidth="1.5" fill="none" />
    <circle cx="16" cy="8" r="3" stroke={color} strokeWidth="1.5" fill="none" />
    <path d="M2 20c0-3 2.5-5 6-5s6 2 6 5" stroke={color} strokeWidth="1.5" fill="none" />
    <path d="M14 15c1-.5 2.5-1 4-1 3.5 0 6 2 6 5h-6" stroke={color} strokeWidth="1.5" fill="none" />
  </svg>
));
UserstoreIcon.displayName = 'UserstoreIcon';

// ESB - Integration bus
export const EsbIcon = memo(({ size = defaultSize, color = defaultColor, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="8" y="3" width="8" height="18" rx="1" stroke={color} strokeWidth="1.5" fill="none" />
    <path d="M3 8h5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M3 12h5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M3 16h5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M16 8h5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M16 12h5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M16 16h5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
));
EsbIcon.displayName = 'EsbIcon';

// Adapter - Plug
export const AdapterIcon = memo(({ size = defaultSize, color = defaultColor, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M8 6v4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M16 6v4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <rect x="5" y="10" width="14" height="6" rx="1" stroke={color} strokeWidth="1.5" fill="none" />
    <path d="M9 16v4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M15 16v4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
));
AdapterIcon.displayName = 'AdapterIcon';

// Webapp - Browser window
export const WebappIcon = memo(({ size = defaultSize, color = defaultColor, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="3" y="4" width="18" height="16" rx="2" stroke={color} strokeWidth="1.5" fill="none" />
    <path d="M3 9h18" stroke={color} strokeWidth="1.5" />
    <circle cx="6" cy="6.5" r="0.5" fill={color} />
    <circle cx="8.5" cy="6.5" r="0.5" fill={color} />
    <circle cx="11" cy="6.5" r="0.5" fill={color} />
  </svg>
));
WebappIcon.displayName = 'WebappIcon';

// Mobile - Phone
export const MobileIcon = memo(({ size = defaultSize, color = defaultColor, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="6" y="2" width="12" height="20" rx="2" stroke={color} strokeWidth="1.5" fill="none" />
    <path d="M10 18h4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
));
MobileIcon.displayName = 'MobileIcon';

// IoT - Circuit chip
export const IotIcon = memo(({ size = defaultSize, color = defaultColor, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="6" y="6" width="12" height="12" rx="1" stroke={color} strokeWidth="1.5" fill="none" />
    <path d="M9 6V3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M15 6V3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M9 21v-3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M15 21v-3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M6 9H3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M6 15H3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M21 9h-3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M21 15h-3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
));
IotIcon.displayName = 'IotIcon';

// Legacy - Gear with question mark
export const LegacyIcon = memo(({ size = defaultSize, color = defaultColor, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.5" fill="none" />
    <path
      d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
));
LegacyIcon.displayName = 'LegacyIcon';

// Map component type to icon
export const componentIconMap: Record<string, React.FC<IconProps>> = {
  microservice: CubeIcon,
  function: FunctionIcon,
  database: DatabaseIcon,
  broker: BrokerIcon,
  cache: CacheIcon,
  gateway: GatewayIcon,
  idp: IdpIcon,
  sts: StsIcon,
  userstore: UserstoreIcon,
  esb: EsbIcon,
  adapter: AdapterIcon,
  transformer: AdapterIcon, // Reuse adapter
  webapp: WebappIcon,
  mobile: MobileIcon,
  iot: IotIcon,
  legacy: LegacyIcon,
};

export const getComponentIcon = (type: string): React.FC<IconProps> => {
  return componentIconMap[type] || CubeIcon;
};
