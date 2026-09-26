import React from 'react';

export type DiceColorTheme = 'ruby' | 'emerald' | 'onyx' | 'sapphire';

interface Real3DDiceProps {
  value: number; // 1 to 6
  size?: number; // Size in pixels (e.g. 56)
  rotX?: number; // 3D rotation around X
  rotY?: number; // 3D rotation around Y
  rotZ?: number; // 3D rotation around Z
  isRolling?: boolean;
  color?: DiceColorTheme;
  showShadow?: boolean;
  elevation?: number; // Height in px for shadow calculation
  className?: string;
}

// Standard Opposite-Faces-Sum-to-7 Dice Layout:
// Front = 1, Back = 6, Right = 2, Left = 5, Top = 3, Bottom = 4
export const getFaceRotationsForValue = (val: number, tiltZ: number = 0): { rotX: number; rotY: number; rotZ: number } => {
  switch (val) {
    case 1:
      return { rotX: 0, rotY: 0, rotZ: tiltZ };
    case 6:
      return { rotX: 0, rotY: 180, rotZ: tiltZ };
    case 2:
      return { rotX: 0, rotY: -90, rotZ: tiltZ };
    case 5:
      return { rotX: 0, rotY: 90, rotZ: tiltZ };
    case 3:
      return { rotX: -90, rotY: 0, rotZ: tiltZ };
    case 4:
      return { rotX: 90, rotY: 0, rotZ: tiltZ };
    default:
      return { rotX: 0, rotY: 0, rotZ: tiltZ };
  }
};

export const Real3DDice: React.FC<Real3DDiceProps> = ({
  value,
  size = 40,
  rotX,
  rotY,
  rotZ,
  isRolling = false,
  color = 'ruby',
  showShadow = true,
  elevation = 0,
  className = '',
}) => {
  const half = size / 2;

  // Resolve rotations: if props are supplied, use them; otherwise use standard square face orientation
  const defaultRot = getFaceRotationsForValue(value);
  const effectiveRotX = rotX !== undefined ? rotX : defaultRot.rotX;
  const effectiveRotY = rotY !== undefined ? rotY : defaultRot.rotY;
  const effectiveRotZ = rotZ !== undefined ? rotZ : defaultRot.rotZ;

  // Theme palettes for high-roller casino dice
  const themeStyles = {
    ruby: {
      faceBg: 'linear-gradient(135deg, rgba(239,68,68,0.96) 0%, rgba(185,28,28,0.98) 55%, rgba(127,29,29,1) 100%)',
      borderColor: 'rgba(254, 202, 202, 0.45)',
      pipColor: '#ffffff',
      pipShadow: 'inset 0 1px 1px rgba(0,0,0,0.7), 0 1px 1px rgba(255,255,255,0.4)',
      accentPip: '#fef08a', // Gold center pip for Ace
      glow: 'rgba(239, 68, 68, 0.4)',
    },
    emerald: {
      faceBg: 'linear-gradient(135deg, rgba(16,185,129,0.96) 0%, rgba(5,150,105,0.98) 55%, rgba(6,78,59,1) 100%)',
      borderColor: 'rgba(167, 243, 208, 0.45)',
      pipColor: '#ffffff',
      pipShadow: 'inset 0 1px 1px rgba(0,0,0,0.7), 0 1px 1px rgba(255,255,255,0.4)',
      accentPip: '#fef08a',
      glow: 'rgba(16, 185, 129, 0.4)',
    },
    onyx: {
      faceBg: 'linear-gradient(135deg, rgba(30,41,59,0.98) 0%, rgba(15,23,42,1) 60%, rgba(2,6,23,1) 100%)',
      borderColor: 'rgba(245, 158, 11, 0.5)',
      pipColor: '#f59e0b',
      pipShadow: 'inset 0 1px 1px rgba(0,0,0,0.9), 0 1px 1px rgba(251,191,36,0.5)',
      accentPip: '#ffffff',
      glow: 'rgba(245, 158, 11, 0.35)',
    },
    sapphire: {
      faceBg: 'linear-gradient(135deg, rgba(59,130,246,0.96) 0%, rgba(29,78,216,0.98) 55%, rgba(30,58,138,1) 100%)',
      borderColor: 'rgba(191, 219, 254, 0.45)',
      pipColor: '#ffffff',
      pipShadow: 'inset 0 1px 1px rgba(0,0,0,0.7), 0 1px 1px rgba(255,255,255,0.4)',
      accentPip: '#fef08a',
      glow: 'rgba(59, 130, 246, 0.4)',
    },
  }[color];

  // Pip coordinates generator
  const renderPips = (faceNum: number) => {
    const pipSize = Math.max(5, Math.round(size * 0.16));
    const isAce = faceNum === 1;

    // Relative % positions
    let positions: Array<{ top: string; left: string }> = [];

    switch (faceNum) {
      case 1:
        positions = [{ top: '50%', left: '50%' }];
        break;
      case 2:
        positions = [
          { top: '26%', left: '26%' },
          { top: '74%', left: '74%' },
        ];
        break;
      case 3:
        positions = [
          { top: '24%', left: '24%' },
          { top: '50%', left: '50%' },
          { top: '76%', left: '76%' },
        ];
        break;
      case 4:
        positions = [
          { top: '26%', left: '26%' },
          { top: '26%', left: '74%' },
          { top: '74%', left: '26%' },
          { top: '74%', left: '74%' },
        ];
        break;
      case 5:
        positions = [
          { top: '24%', left: '24%' },
          { top: '24%', left: '76%' },
          { top: '50%', left: '50%' },
          { top: '76%', left: '24%' },
          { top: '76%', left: '76%' },
        ];
        break;
      case 6:
        positions = [
          { top: '24%', left: '26%' },
          { top: '50%', left: '26%' },
          { top: '76%', left: '26%' },
          { top: '24%', left: '74%' },
          { top: '50%', left: '74%' },
          { top: '76%', left: '74%' },
        ];
        break;
    }

    return (
      <>
        {/* Subtle Vegas Casino Logo on Face 1 */}
        {isAce && size >= 36 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <span className="text-[7px] font-serif-luxury font-black text-white uppercase tracking-widest">
              ROYALE
            </span>
          </div>
        )}

        {positions.map((pos, i) => (
          <div
            key={i}
            className="absolute rounded-full transform -translate-x-1/2 -translate-y-1/2"
            style={{
              width: `${isAce ? pipSize * 1.25 : pipSize}px`,
              height: `${isAce ? pipSize * 1.25 : pipSize}px`,
              top: pos.top,
              left: pos.left,
              backgroundColor: isAce ? themeStyles.accentPip : themeStyles.pipColor,
              boxShadow: themeStyles.pipShadow,
            }}
          />
        ))}
      </>
    );
  };

  // Face config with 3D transforms
  const faces = [
    { num: 1, name: 'front', transform: `rotateY(0deg) translateZ(${half}px)` },
    { num: 6, name: 'back', transform: `rotateY(180deg) translateZ(${half}px)` },
    { num: 2, name: 'right', transform: `rotateY(90deg) translateZ(${half}px)` },
    { num: 5, name: 'left', transform: `rotateY(-90deg) translateZ(${half}px)` },
    { num: 3, name: 'top', transform: `rotateX(90deg) translateZ(${half}px)` },
    { num: 4, name: 'bottom', transform: `rotateX(-90deg) translateZ(${half}px)` },
  ];

  // Dynamic ground shadow scale & blur based on elevation
  const shadowScale = Math.max(0.6, 1 - elevation * 0.008);
  const shadowBlur = Math.min(18, 5 + elevation * 0.3);
  const shadowOpacity = Math.max(0.2, 0.65 - elevation * 0.008);

  return (
    <div
      className={`relative inline-block select-none ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        perspective: '600px',
      }}
    >
      {/* 3D Realistic Ground Cast Shadow */}
      {showShadow && (
        <div
          className="absolute left-1/2 top-1/2 rounded-full pointer-events-none"
          style={{
            width: `${size * 1.05}px`,
            height: `${size * 0.55}px`,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            transform: `translate(-50%, ${half * 0.8 + elevation * 0.4}px) scale(${shadowScale})`,
            filter: `blur(${shadowBlur}px)`,
            opacity: shadowOpacity,
            zIndex: 0,
          }}
        />
      )}

      {/* 3D CUBE CONTAINER */}
      <div
        className="relative w-full h-full"
        style={{
          transformStyle: 'preserve-3d',
          transform: `translateZ(${elevation}px) rotateX(${effectiveRotX}deg) rotateY(${effectiveRotY}deg) rotateZ(${effectiveRotZ}deg)`,
          transition: 'none',
        }}
      >
        {faces.map((face) => (
          <div
            key={face.num}
            className="absolute inset-0 rounded-[5px] overflow-hidden pointer-events-none"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              background: themeStyles.faceBg,
              border: `1px solid ${themeStyles.borderColor}`,
              boxShadow: `
                inset 0 1px 1px rgba(255, 255, 255, 0.4),
                inset 0 -1px 2px rgba(0, 0, 0, 0.6),
                0 0 8px ${themeStyles.glow}
              `,
              transform: face.transform,
              backfaceVisibility: 'hidden',
            }}
          >
            {/* Top-Left Specular Corner Sheen */}
            <div className="absolute top-0.5 left-0.5 w-1/3 h-1/3 bg-gradient-to-br from-white/30 to-transparent rounded-tl pointer-events-none" />

            {/* Bottom-Right Dark Edge Shader */}
            <div className="absolute bottom-0 right-0 w-full h-full bg-gradient-to-tl from-black/25 via-transparent to-transparent pointer-events-none" />

            {/* Render recessed pips */}
            {renderPips(face.num)}
          </div>
        ))}
      </div>
    </div>
  );
};
