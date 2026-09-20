import React from 'react';
import { motion } from 'motion/react';

interface FistBumpIconProps {
  size?: number;
  leftColor?: string;
  rightColor?: string;
  sparkColor?: string;
  animated?: boolean;
  className?: string;
}

/**
 * Animated Fighting Game Community (FGC) Fist Bump Icon
 * Represents mutual respect, hype, and "ready to battle"
 */
export function FistBumpIcon({
  size = 32,
  leftColor = '#00E5FF',
  rightColor = '#FF006E',
  sparkColor = '#FFD600',
  animated = true,
  className = '',
}: FistBumpIconProps) {
  const halfSize = size / 2;

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size * 1.8, height: size }}
      title="Fist Bump — Ready to Fight!"
    >
      {/* Left Fist */}
      <motion.div
        className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center"
        animate={
          animated
            ? {
                x: [-4, 3, -1, 0],
                rotate: [-6, 0, -2, 0],
              }
            : undefined
        }
        transition={{
          repeat: Infinity,
          repeatDelay: 1.8,
          duration: 0.5,
          ease: 'easeInOut',
        }}
      >
        <svg
          width={size * 0.9}
          height={size * 0.9}
          viewBox="0 0 24 24"
          fill="none"
          stroke={leftColor}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: `drop-shadow(0 0 4px ${leftColor}80)` }}
        >
          {/* Fist facing right (Left Player's Fist) */}
          <path d="M4 11V15C4 16.1046 4.89543 17 6 17H11C12.1046 17 13 16.1046 13 15V13" />
          <path d="M13 10V8.5C13 7.67157 12.3284 7 11.5 7H7" />
          <path d="M13 10C13 9.44772 13.4477 9 14 9H15.5C16.3284 9 17 9.67157 17 10.5V11" />
          <path d="M14 11H17.5C18.3284 11 19 11.6716 19 12.5C19 13.3284 18.3284 14 17.5 14H15" />
          <path d="M13 14H16.5C17.3284 14 18 14.6716 18 15.5C18 16.3284 17.3284 17 16.5 17H13" />
          {/* Wrist band */}
          <path d="M4 10V16" strokeWidth="2.5" strokeOpacity="0.8" />
        </svg>
      </motion.div>

      {/* Central Collision Sparks & Energy Shockwave */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 flex items-center justify-center"
        animate={
          animated
            ? {
                scale: [0.3, 1.4, 0.8, 0],
                opacity: [0, 1, 0.8, 0],
              }
            : { opacity: 0.9, scale: 1 }
        }
        transition={{
          repeat: Infinity,
          repeatDelay: 1.8,
          duration: 0.5,
          delay: 0.15,
          ease: 'easeOut',
        }}
      >
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
          {/* Impact Spark Flash */}
          <circle cx="16" cy="16" r="3" fill={sparkColor} style={{ filter: `drop-shadow(0 0 6px ${sparkColor})` }} />
          {/* Radiating impact rays */}
          <line x1="16" y1="6" x2="16" y2="10" stroke={sparkColor} strokeWidth="2" strokeLinecap="round" />
          <line x1="16" y1="22" x2="16" y2="26" stroke={sparkColor} strokeWidth="2" strokeLinecap="round" />
          <line x1="6" y1="16" x2="10" y2="16" stroke={sparkColor} strokeWidth="2" strokeLinecap="round" />
          <line x1="22" y1="16" x2="26" y2="16" stroke={sparkColor} strokeWidth="2" strokeLinecap="round" />
          <line x1="9" y1="9" x2="12" y2="12" stroke={sparkColor} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="20" y1="20" x2="23" y2="23" stroke={sparkColor} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="23" y1="9" x2="20" y2="12" stroke={sparkColor} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="9" y1="23" x2="12" y2="20" stroke={sparkColor} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </motion.div>

      {/* Right Fist */}
      <motion.div
        className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-center"
        animate={
          animated
            ? {
                x: [4, -3, 1, 0],
                rotate: [6, 0, 2, 0],
              }
            : undefined
        }
        transition={{
          repeat: Infinity,
          repeatDelay: 1.8,
          duration: 0.5,
          ease: 'easeInOut',
        }}
      >
        <svg
          width={size * 0.9}
          height={size * 0.9}
          viewBox="0 0 24 24"
          fill="none"
          stroke={rightColor}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transform: 'scaleX(-1)', filter: `drop-shadow(0 0 4px ${rightColor}80)` }}
        >
          {/* Fist facing left (Right Player's Fist, mirrored) */}
          <path d="M4 11V15C4 16.1046 4.89543 17 6 17H11C12.1046 17 13 16.1046 13 15V13" />
          <path d="M13 10V8.5C13 7.67157 12.3284 7 11.5 7H7" />
          <path d="M13 10C13 9.44772 13.4477 9 14 9H15.5C16.3284 9 17 9.67157 17 10.5V11" />
          <path d="M14 11H17.5C18.3284 11 19 11.6716 19 12.5C19 13.3284 18.3284 14 17.5 14H15" />
          <path d="M13 14H16.5C17.3284 14 18 14.6716 18 15.5C18 16.3284 17.3284 17 16.5 17H13" />
          {/* Wrist band */}
          <path d="M4 10V16" strokeWidth="2.5" strokeOpacity="0.8" />
        </svg>
      </motion.div>
    </div>
  );
}
