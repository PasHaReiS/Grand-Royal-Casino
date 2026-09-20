import React, { useEffect, useRef, useState } from 'react';
import { ROULETTE_SEQUENCE, getNumberColor } from '../utils/rouletteRules';
import { sound } from '../utils/audio';

interface RouletteWheelProps {
  isSpinning: boolean;
  winningNumber: number | null;
  onSpinComplete?: () => void;
  spinDuration?: number; // in milliseconds, defaults to 5200
}

const TOTAL_POCKETS = 37;
const SLICE_ANGLE = 360 / TOTAL_POCKETS; // ~9.7297°

// Geometric constants for 400x400 SVG wheel
const CX = 200;
const CY = 200;
const OUTER_WOOD_R = 196;
const BALL_TRACK_R = 173;
const POCKET_OUTER_R = 168;
const NUMBER_R = 153;
const POCKET_WELL_R = 135;
const POCKET_INNER_R = 118;
const INNER_BOWL_R = 116;
const DEFLECTOR_R = 92;
const TURRET_R = 46;

export const RouletteWheel: React.FC<RouletteWheelProps> = ({
  isSpinning,
  winningNumber,
  onSpinComplete,
  spinDuration = 5200,
}) => {
  const [wheelAngle, setWheelAngle] = useState<number>(0);
  const [ballAngle, setBallAngle] = useState<number>(270);
  const [ballRadius, setBallRadius] = useState<number>(POCKET_WELL_R);
  const [ballSpeed, setBallSpeed] = useState<number>(0);
  const [showWinHighlight, setShowWinHighlight] = useState<boolean>(false);

  // Animation and physics state references
  const animRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const wheelAngleRef = useRef<number>(0);
  const onSpinCompleteRef = useRef(onSpinComplete);
  onSpinCompleteRef.current = onSpinComplete;

  const startWheelAngleRef = useRef<number>(0);
  const endWheelAngleRef = useRef<number>(0);
  const targetMidDegRef = useRef<number>(0);
  const lastBounceTickRef = useRef<number>(0);
  const deflectorHitPlayedRef = useRef<boolean>(false);
  const pocketLandedPlayedRef = useRef<boolean>(false);

  // Handle spin trigger and physics loop
  useEffect(() => {
    if (!isSpinning) {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
      return;
    }

    setShowWinHighlight(false);
    deflectorHitPlayedRef.current = false;
    pocketLandedPlayedRef.current = false;
    lastBounceTickRef.current = 0;

    sound.playRouletteSpin();

    // Find target winning pocket index in European sequence
    const targetNum = winningNumber !== null ? winningNumber : 0;
    let targetIndex = ROULETTE_SEQUENCE.indexOf(targetNum);
    if (targetIndex < 0) targetIndex = 0;

    // Center angle of this pocket inside the wheel's local frame
    const targetMidDeg = targetIndex * SLICE_ANGLE + SLICE_ANGLE / 2;
    targetMidDegRef.current = targetMidDeg;

    // We want this pocket to stop exactly at 12 o'clock (270° in SVG coordinates)!
    // In SVG: globalAngle = wheelAngle + targetMidDeg = 270° (mod 360)
    // Therefore: endWheelAngle ≡ 270° - targetMidDeg (mod 360)
    const currentWheel = wheelAngleRef.current;
    startWheelAngleRef.current = currentWheel;

    const targetMod = ((270 - targetMidDeg) % 360 + 360) % 360;
    const currentMod = ((currentWheel % 360) + 360) % 360;
    let forwardDelta = (targetMod - currentMod + 360) % 360;
    if (forwardDelta < 180) {
      forwardDelta += 360; // Guarantee smooth, substantial coasting
    }

    // Wheel makes 3 to 4 full clockwise rotations + forwardDelta
    const wheelTotalRotation = 3 * 360 + forwardDelta;
    const endWheelAngle = currentWheel + wheelTotalRotation;
    endWheelAngleRef.current = endWheelAngle;

    startTimeRef.current = performance.now();

    const animate = (now: number) => {
      const elapsed = now - (startTimeRef.current || now);
      const p = Math.min(1, elapsed / spinDuration);

      // 1. Wheel deceleration: smooth aerodynamic friction (quartic ease-out)
      const wheelEase = 1 - Math.pow(1 - p, 3.4);
      const curWheelAngle = startWheelAngleRef.current + wheelTotalRotation * wheelEase;
      wheelAngleRef.current = curWheelAngle;
      setWheelAngle(curWheelAngle);

      // Position of the target pocket at this exact frame
      const currentTargetPocketAngle = curWheelAngle + targetMidDeg;

      // 2. Ball Physics:
      // Total counter-clockwise turns during spin (negative direction, opposite to wheel)
      const ballTotalRevolutions = 8 * 360;

      let curBallAngle: number;
      let curBallRadius: number;
      let speedMetric = 0;

      if (p < 0.88) {
        // --- FLIGHT & BOUNCE PHASES ---
        // Normalize progress up to pocket catch (p from 0 to 0.88)
        const prog = p / 0.88;

        // Counter-clockwise deceleration curve
        const decelEase = 1 - Math.pow(1 - prog, 2.2);

        // The ball angle converges to currentTargetPocketAngle at prog = 1 (p = 0.88)
        const baseAngle = currentTargetPocketAngle + (1 - decelEase) * ballTotalRevolutions;

        speedMetric = (1 - decelEase);

        if (prog < 0.60) {
          // Stage 1: High-speed centrifugal orbit on outer stator ball track
          curBallAngle = baseAngle;
          // Subtle centrifugal wobble
          curBallRadius = BALL_TRACK_R + Math.sin(prog * 50) * 0.7;

          // Occasional fast ball track whir clicks
          if (now - lastBounceTickRef.current > 120 + prog * 150) {
            sound.playClick();
            lastBounceTickRef.current = now;
          }
        } else if (prog < 0.78) {
          // Stage 2: Gravity overcomes centrifugal force; ball falls into bowl and hits deflectors
          const dropProg = (prog - 0.60) / 0.18;
          curBallAngle = baseAngle;

          // Deflector collision around dropProg ≈ 0.4
          if (!deflectorHitPlayedRef.current && dropProg > 0.35) {
            deflectorHitPlayedRef.current = true;
            sound.playDeflectorHit();
          }

          // Fall from BALL_TRACK_R (173) to POCKET_OUTER_R (150) with deflector bump
          const bump = Math.sin(dropProg * Math.PI) * 4.5;
          curBallRadius = BALL_TRACK_R - dropProg * (BALL_TRACK_R - 150) + bump;
        } else {
          // Stage 3: Pocket frets chatter & bouncing across dividers
          const fretProg = (prog - 0.78) / 0.22;
          // Angular hops over adjacent frets (bouncing over 2-3 dividers before target)
          const fretHop = Math.sin(fretProg * Math.PI * 4) * (1 - fretProg) * (SLICE_ANGLE * 1.6);
          curBallAngle = baseAngle + fretHop;

          // Radial bounce as ball hops over brass frets
          const radialBounce = Math.abs(Math.sin(fretProg * Math.PI * 5)) * (1 - fretProg) * 8.5;
          curBallRadius = 144 - fretProg * (144 - POCKET_WELL_R) + radialBounce;

          // Rapid fret clicking sounds
          if (now - lastBounceTickRef.current > 75 + fretProg * 100) {
            sound.playBallBounce();
            lastBounceTickRef.current = now;
          }
        }
      } else {
        // --- CAPTURED IN WINNING POCKET & CO-ROTATION (p from 0.88 to 1.0) ---
        if (!pocketLandedPlayedRef.current) {
          pocketLandedPlayedRef.current = true;
          sound.playBallPocket();
        }

        // Ball is now nestled directly inside the winning pocket!
        // Micro settling wobble inside the pocket fret
        const settleTime = (p - 0.88) / 0.12;
        const microWobble = Math.sin(settleTime * Math.PI * 6) * Math.exp(-settleTime * 5) * 1.2;

        curBallAngle = currentTargetPocketAngle + microWobble;
        curBallRadius = POCKET_WELL_R;
        speedMetric = 0;
      }

      setBallAngle(curBallAngle);
      setBallRadius(curBallRadius);
      setBallSpeed(speedMetric);

      if (p < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        // Spin completely finished: lock ball exactly in pocket at 12 o'clock
        animRef.current = null;
        wheelAngleRef.current = endWheelAngleRef.current;
        setWheelAngle(endWheelAngleRef.current);
        setBallAngle(endWheelAngleRef.current + targetMidDegRef.current);
        setBallRadius(POCKET_WELL_R);
        setBallSpeed(0);
        setShowWinHighlight(true);

        if (onSpinCompleteRef.current) {
          onSpinCompleteRef.current();
        }
      }
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
    };
  }, [isSpinning, winningNumber, spinDuration]);

  // Convert ball polar coordinates to SVG Cartesian coordinates
  const ballRad = (ballAngle * Math.PI) / 180;
  const ballX = CX + ballRadius * Math.cos(ballRad);
  const ballY = CY + ballRadius * Math.sin(ballRad);

  // Motion blur trails when ball speed is high (for realistic visual fidelity)
  const trailPoints: Array<{ x: number; y: number; opacity: number; r: number }> = [];
  if (isSpinning && ballSpeed > 0.25) {
    const trailSteps = [
      { offsetDeg: 7, opacity: 0.55, r: 4.8 },
      { offsetDeg: 15, opacity: 0.35, r: 4.2 },
      { offsetDeg: 24, opacity: 0.18, r: 3.6 },
    ];
    trailSteps.forEach((t) => {
      const tRad = ((ballAngle + t.offsetDeg) * Math.PI) / 180;
      trailPoints.push({
        x: CX + ballRadius * Math.cos(tRad),
        y: CY + ballRadius * Math.sin(tRad),
        opacity: t.opacity * ballSpeed,
        r: t.r,
      });
    });
  }

  // Helper to construct circular ring sector path
  const describeSector = (startDeg: number, endDeg: number, rIn: number, rOut: number) => {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const sRad = toRad(startDeg);
    const eRad = toRad(endDeg);

    const x1Out = CX + rOut * Math.cos(sRad);
    const y1Out = CY + rOut * Math.sin(sRad);
    const x2Out = CX + rOut * Math.cos(eRad);
    const y2Out = CY + rOut * Math.sin(eRad);

    const x1In = CX + rIn * Math.cos(sRad);
    const y1In = CY + rIn * Math.sin(sRad);
    const x2In = CX + rIn * Math.cos(eRad);
    const y2In = CY + rIn * Math.sin(eRad);

    return `M ${x1Out} ${y1Out} A ${rOut} ${rOut} 0 0 1 ${x2Out} ${y2Out} L ${x2In} ${y2In} A ${rIn} ${rIn} 0 0 0 ${x1In} ${y1In} Z`;
  };

  const winningIndex = winningNumber !== null ? ROULETTE_SEQUENCE.indexOf(winningNumber) : -1;

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      {/* Outer Glow & Shadow Container */}
      <div className="relative w-[310px] h-[310px] sm:w-[390px] sm:h-[390px] md:w-[420px] md:h-[420px] rounded-full p-2 shadow-[0_20px_60px_rgba(0,0,0,0.95),0_0_35px_rgba(245,158,11,0.28)] border-4 border-[#854d0e]/70 bg-gradient-to-br from-[#3e1f13] via-[#1f0e08] to-[#0d0503]">
        {/* Subtle decorative outer wood texture ring */}
        <div className="absolute inset-1 rounded-full border border-amber-500/30 opacity-70 pointer-events-none" />

        {/* Top Centered Gold Casino Indicator Arrow & Reading Window */}
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-none">
          <div
            className="w-5 h-6 bg-gradient-to-b from-amber-100 via-amber-400 to-amber-600 shadow-[0_0_15px_rgba(245,158,11,1)]"
            style={{ clipPath: 'polygon(50% 100%, 0% 0%, 100% 0%)' }}
          />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-300 -mt-6 border border-slate-950 shadow-md" />
        </div>

        {/* Main SVG Wheel Graphics */}
        <svg
          viewBox="0 0 400 400"
          className="w-full h-full drop-shadow-2xl overflow-visible"
        >
          <defs>
            {/* Rich Wood Grain Gradient */}
            <radialGradient id="woodGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1a0b06" />
              <stop offset="85%" stopColor="#2e140b" />
              <stop offset="96%" stopColor="#4a2213" />
              <stop offset="100%" stopColor="#1f0e08" />
            </radialGradient>

            {/* Brass / Gold Rim Gradient */}
            <linearGradient id="brassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="25%" stopColor="#d97706" />
              <stop offset="50%" stopColor="#fef3c7" />
              <stop offset="75%" stopColor="#b45309" />
              <stop offset="100%" stopColor="#ca8a04" />
            </linearGradient>

            {/* Stator Track Metallic Finish */}
            <radialGradient id="statorTrack" cx="50%" cy="50%" r="50%">
              <stop offset="70%" stopColor="#09090b" />
              <stop offset="90%" stopColor="#1c1917" />
              <stop offset="100%" stopColor="#292524" />
            </radialGradient>

            {/* Inner Bowl Metallic Cone */}
            <radialGradient id="innerBowlGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#2d1205" />
              <stop offset="45%" stopColor="#5c260a" />
              <stop offset="85%" stopColor="#92400e" />
              <stop offset="100%" stopColor="#1c1917" />
            </radialGradient>

            {/* Center Spindle Gold Turret */}
            <linearGradient id="turretGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fffbeb" />
              <stop offset="35%" stopColor="#f59e0b" />
              <stop offset="70%" stopColor="#b45309" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>

            {/* Ball Chrome / Pearl Ivory Gradient */}
            <radialGradient id="ballShine" cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#f8fafc" />
              <stop offset="75%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#64748b" />
            </radialGradient>

            {/* Ball Drop Shadow onto Wheel Surface */}
            <filter id="ballShadow" x="-60%" y="-60%" width="220%" height="220%">
              <feDropShadow dx="2" dy="3.5" stdDeviation="3" floodColor="#000000" floodOpacity="0.85" />
            </filter>

            {/* Winning Pocket Glow Filter */}
            <filter id="pocketGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Static Outer Mahogany Wooden Bowl */}
          <circle cx={CX} cy={CY} r={OUTER_WOOD_R} fill="url(#woodGradient)" />
          <circle cx={CX} cy={CY} r={OUTER_WOOD_R - 5} fill="none" stroke="url(#brassGradient)" strokeWidth="3" />

          {/* Stator Outer Ball Track (elevated runway where the ball speeds at start) */}
          <circle cx={CX} cy={CY} r={BALL_TRACK_R + 6} fill="url(#statorTrack)" stroke="#78350f" strokeWidth="2" />
          <circle cx={CX} cy={CY} r={BALL_TRACK_R + 4} fill="none" stroke="#ca8a04" strokeWidth="0.8" opacity="0.6" />
          <circle cx={CX} cy={CY} r={BALL_TRACK_R - 5} fill="none" stroke="#44403c" strokeWidth="1.5" />

          {/* ROTATING WHEEL GROUP */}
          <g transform={`rotate(${wheelAngle}, ${CX}, ${CY})`}>
            {/* 37 Colored Number Pockets */}
            {ROULETTE_SEQUENCE.map((num, idx) => {
              const startDeg = idx * SLICE_ANGLE;
              const endDeg = (idx + 1) * SLICE_ANGLE;
              const midDeg = startDeg + SLICE_ANGLE / 2;
              const color = getNumberColor(num);

              let fillColor = '#18181b'; // Black
              if (color === 'red') fillColor = '#b91c1c'; // European Deep Red
              if (color === 'green') fillColor = '#047857'; // European Emerald 0

              const isWinningPocket = showWinHighlight && idx === winningIndex;

              // Number label position: placed on outer rim of pocket (r = 153)
              // Ball rests at r = 135 in pocket well, so both number and ball are clearly visible!
              const midRad = (midDeg * Math.PI) / 180;
              const textX = CX + NUMBER_R * Math.cos(midRad);
              const textY = CY + NUMBER_R * Math.sin(midRad);

              // Brass divider fret line endpoints
              const sRad = (startDeg * Math.PI) / 180;
              const fretX1 = CX + POCKET_INNER_R * Math.cos(sRad);
              const fretY1 = CY + POCKET_INNER_R * Math.sin(sRad);
              const fretX2 = CX + POCKET_OUTER_R * Math.cos(sRad);
              const fretY2 = CY + POCKET_OUTER_R * Math.sin(sRad);

              return (
                <g key={`pocket-${num}-${idx}`}>
                  {/* Pocket Slice Background */}
                  <path
                    d={describeSector(startDeg, endDeg, POCKET_INNER_R, POCKET_OUTER_R)}
                    fill={isWinningPocket ? '#d97706' : fillColor}
                    stroke={isWinningPocket ? '#fef08a' : '#92400e'}
                    strokeWidth={isWinningPocket ? '2.5' : '0.8'}
                    filter={isWinningPocket ? 'url(#pocketGlow)' : undefined}
                  />

                  {/* Inner pocket well depression shading (where the ball sits) */}
                  <path
                    d={describeSector(startDeg, endDeg, POCKET_INNER_R, POCKET_WELL_R + 6)}
                    fill="rgba(0,0,0,0.25)"
                    pointerEvents="none"
                  />

                  {/* Brass fret divider pin */}
                  <line
                    x1={fretX1}
                    y1={fretY1}
                    x2={fretX2}
                    y2={fretY2}
                    stroke="url(#brassGradient)"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />

                  {/* Number label oriented towards center */}
                  <text
                    x={textX}
                    y={textY}
                    fill={isWinningPocket ? '#fef9c3' : '#ffffff'}
                    fontSize="9.8"
                    fontWeight="900"
                    fontFamily="serif"
                    textAnchor="middle"
                    dominantBaseline="central"
                    transform={`rotate(${midDeg + 90}, ${textX}, ${textY})`}
                    style={{
                      textShadow: isWinningPocket
                        ? '0 0 4px #ca8a04'
                        : '0 1px 2px rgba(0,0,0,0.9)',
                    }}
                  >
                    {num}
                  </text>
                </g>
              );
            })}

            {/* Inner Brass Ring bordering pockets */}
            <circle cx={CX} cy={CY} r={POCKET_INNER_R} fill="none" stroke="url(#brassGradient)" strokeWidth="2.8" />

            {/* Inner Metallic Sloped Bowl Cone */}
            <circle cx={CX} cy={CY} r={INNER_BOWL_R} fill="url(#innerBowlGrad)" />

            {/* 8 Brass Diamond Ball Deflectors (Losanges) */}
            {Array.from({ length: 8 }).map((_, dIdx) => {
              const dDeg = dIdx * 45;
              const dRad = (dDeg * Math.PI) / 180;
              const dx = CX + DEFLECTOR_R * Math.cos(dRad);
              const dy = CY + DEFLECTOR_R * Math.sin(dRad);
              return (
                <polygon
                  key={`deflector-${dIdx}`}
                  points={`${dx},${dy - 5} ${dx + 6},${dy} ${dx},${dy + 5} ${dx - 6},${dy}`}
                  fill="url(#brassGradient)"
                  stroke="#78350f"
                  strokeWidth="0.8"
                  transform={`rotate(${dDeg}, ${dx}, ${dy})`}
                />
              );
            })}

            {/* Center Spindle Turret Base */}
            <circle cx={CX} cy={CY} r={TURRET_R} fill="url(#turretGold)" stroke="#b45309" strokeWidth="2" />
            <circle cx={CX} cy={CY} r={TURRET_R - 10} fill="#3b1505" stroke="#fef08a" strokeWidth="1.2" />
            <circle cx={CX} cy={CY} r={TURRET_R - 22} fill="url(#turretGold)" />

            {/* 4-Prong Brass Handle Spinner Arms */}
            {Array.from({ length: 4 }).map((_, armIdx) => {
              const armDeg = armIdx * 90;
              const aRad = (armDeg * Math.PI) / 180;
              const armEndX = CX + 38 * Math.cos(aRad);
              const armEndY = CY + 38 * Math.sin(aRad);
              return (
                <g key={`arm-${armIdx}`}>
                  <line
                    x1={CX}
                    y1={CY}
                    x2={armEndX}
                    y2={armEndY}
                    stroke="url(#brassGradient)"
                    strokeWidth="4.2"
                    strokeLinecap="round"
                  />
                  <circle
                    cx={armEndX}
                    cy={armEndY}
                    r="4.5"
                    fill="url(#brassGradient)"
                    stroke="#451a03"
                    strokeWidth="1.2"
                  />
                </g>
              );
            })}

            {/* Top Center Spindle Acorn Finial */}
            <circle cx={CX} cy={CY} r="8" fill="#ffffff" opacity="0.35" />
            <circle cx={CX} cy={CY} r="5.5" fill="url(#brassGradient)" stroke="#78350f" strokeWidth="1.2" />
          </g>

          {/* MOTION BLUR GHOST TRAILS DURING FAST REVOLUTIONS */}
          {trailPoints.map((tp, idx) => (
            <circle
              key={`trail-${idx}`}
              cx={tp.x}
              cy={tp.y}
              r={tp.r}
              fill="#ffffff"
              opacity={tp.opacity}
              pointerEvents="none"
            />
          ))}

          {/* THE ROLLING IVORY BALL */}
          <g filter="url(#ballShadow)">
            <circle
              cx={ballX}
              cy={ballY}
              r={ballRadius > POCKET_OUTER_R - 5 ? '5.6' : '5.0'}
              fill="url(#ballShine)"
              stroke="#cbd5e1"
              strokeWidth="0.8"
            />
            {/* Top specular glint on ball */}
            <circle
              cx={ballX - 1.4}
              cy={ballY - 1.4}
              r="1.5"
              fill="#ffffff"
              opacity="0.85"
            />
          </g>
        </svg>

        {/* Sleek Winning Callout Loupe when wheel stops */}
        {!isSpinning && winningNumber !== null && showWinHighlight && (
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-in fade-in zoom-in-90 duration-300">
            <div
              className={`px-4 py-1.5 rounded-full flex items-center gap-2 font-bold text-xs text-white shadow-[0_0_20px_rgba(245,158,11,0.8)] border-2 border-amber-300 ${
                getNumberColor(winningNumber) === 'red'
                  ? 'bg-gradient-to-r from-red-700 to-red-900'
                  : getNumberColor(winningNumber) === 'green'
                  ? 'bg-gradient-to-r from-emerald-700 to-emerald-950'
                  : 'bg-gradient-to-r from-slate-900 to-slate-950'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <span>
                Top Durdu: <strong>{winningNumber}</strong>{' '}
                {getNumberColor(winningNumber) === 'red'
                  ? 'KIRMIZI'
                  : getNumberColor(winningNumber) === 'green'
                  ? 'YEŞİL (0)'
                  : 'SİYAH'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Winning Indicator Banner Below Wheel */}
      <div className="mt-5 flex items-center gap-2">
        {winningNumber !== null ? (
          <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/90 border border-amber-500/50 shadow-lg">
            <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">Kazanan Sayı:</span>
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white shadow ${
                getNumberColor(winningNumber) === 'red'
                  ? 'bg-red-600'
                  : getNumberColor(winningNumber) === 'green'
                  ? 'bg-emerald-600'
                  : 'bg-slate-900 border border-slate-700'
              }`}
            >
              {winningNumber}
            </span>
            <span className="text-xs font-bold text-slate-200 uppercase">
              {getNumberColor(winningNumber) === 'red'
                ? 'Kırmızı'
                : getNumberColor(winningNumber) === 'green'
                ? 'Yeşil (0)'
                : 'Siyah'}
              {winningNumber !== 0 && (winningNumber % 2 === 0 ? ' • Çift' : ' • Tek')}
              {winningNumber !== 0 && (winningNumber <= 18 ? ' • 1-18 (Düşük)' : ' • 19-36 (Yüksek)')}
            </span>
          </div>
        ) : (
          <div className="text-xs text-amber-400/80 italic">Bahsinizi yerleştirin ve çarkı çevirin.</div>
        )}
      </div>
    </div>
  );
};
