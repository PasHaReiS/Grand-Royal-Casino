import React, { useState, useRef, useEffect, useCallback } from 'react';
import { sound } from '../utils/audio';
import { Sparkles, Hand, ArrowUp, RefreshCw, Zap, Palette } from 'lucide-react';
import { Real3DDice, getFaceRotationsForValue, DiceColorTheme } from './Real3DDice';

interface ManualDiceThrowerProps {
  onRollComplete: (die1: number, die2: number) => void;
  isRolling: boolean;
  setIsRolling: (val: boolean) => void;
  disabled?: boolean;
  currentPoint: number | null;
}

interface DiePhysics {
  x: number; // percentage in container (0 - 100)
  y: number; // percentage in container (0 - 100)
  z: number; // elevation off felt in pixels (0 - 80)
  vx: number;
  vy: number;
  vz: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  vRotX: number;
  vRotY: number;
  vRotZ: number;
  value: number;
  settled: boolean;
}

export const ManualDiceThrower: React.FC<ManualDiceThrowerProps> = ({
  onRollComplete,
  isRolling,
  setIsRolling,
  disabled = false,
  currentPoint,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Active dice values
  const [dieValues, setDieValues] = useState<[number, number]>([3, 4]);

  // Dice appearance theme (Ruby Red, Onyx, Emerald, Sapphire)
  const [diceTheme, setDiceTheme] = useState<DiceColorTheme>(() => {
    return (localStorage.getItem('casino_dice_theme') as DiceColorTheme) || 'ruby';
  });

  const handleSelectTheme = (theme: DiceColorTheme) => {
    setDiceTheme(theme);
    localStorage.setItem('casino_dice_theme', theme);
  };

  // Dragging state for manual throw
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [shakeCount, setShakeCount] = useState<number>(0);
  const lastShakeTime = useRef<number>(0);

  // Initial 3D rest rotations (clean square face orientation)
  const initRot1 = getFaceRotationsForValue(3);
  const initRot2 = getFaceRotationsForValue(4);

  // Physics animation state
  const [dice1, setDice1] = useState<DiePhysics>({
    x: 43,
    y: 74,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    rotX: initRot1.rotX,
    rotY: initRot1.rotY,
    rotZ: initRot1.rotZ,
    vRotX: 0,
    vRotY: 0,
    vRotZ: 0,
    value: 3,
    settled: true,
  });

  const [dice2, setDice2] = useState<DiePhysics>({
    x: 57,
    y: 74,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    rotX: initRot2.rotX,
    rotY: initRot2.rotY,
    rotZ: initRot2.rotZ,
    vRotX: 0,
    vRotY: 0,
    vRotZ: 0,
    value: 4,
    settled: true,
  });

  const animFrameRef = useRef<number | null>(null);

  // Trigger realistic 3D manual throw with smooth easing physics
  const executeThrow = useCallback(
    (powerX: number, powerY: number) => {
      if (disabled || isRolling) return;

      setIsRolling(true);
      sound.playDiceThrow();

      // Final random target dice outcomes
      const finalD1 = Math.floor(Math.random() * 6) + 1;
      const finalD2 = Math.floor(Math.random() * 6) + 1;

      // Bound initial velocities
      const initialVy = Math.max(-28, Math.min(-15, powerY * 0.16));
      const initialVx1 = powerX * 0.12 - 2.5 + (Math.random() * 3 - 1.5);
      const initialVx2 = powerX * 0.12 + 2.5 + (Math.random() * 3 - 1.5);

      // Target resting rotations in 3D (completely square, flat, and legible)
      const targetRot1 = getFaceRotationsForValue(finalD1);
      const targetRot2 = getFaceRotationsForValue(finalD2);

      const startRotX1 = dice1.rotX;
      const startRotY1 = dice1.rotY;
      const startRotZ1 = dice1.rotZ;

      const startRotX2 = dice2.rotX;
      const startRotY2 = dice2.rotY;
      const startRotZ2 = dice2.rotZ;

      // Full 360 degree tumbling flips
      const numFlipsX1 = 3;
      const numFlipsY1 = 2;
      const numFlipsZ1 = 1;

      const numFlipsX2 = 2;
      const numFlipsY2 = 3;
      const numFlipsZ2 = 1;

      const endRotX1 = startRotX1 + numFlipsX1 * 360 + (((targetRot1.rotX - (startRotX1 % 360)) % 360 + 360) % 360);
      const endRotY1 = startRotY1 + numFlipsY1 * 360 + (((targetRot1.rotY - (startRotY1 % 360)) % 360 + 360) % 360);
      const endRotZ1 = startRotZ1 + numFlipsZ1 * 360 + (((0 - (startRotZ1 % 360)) % 360 + 360) % 360);

      const endRotX2 = startRotX2 + numFlipsX2 * 360 + (((targetRot2.rotX - (startRotX2 % 360)) % 360 + 360) % 360);
      const endRotY2 = startRotY2 + numFlipsY2 * 360 + (((targetRot2.rotY - (startRotY2 % 360)) % 360 + 360) % 360);
      const endRotZ2 = startRotZ2 + numFlipsZ2 * 360 + (((0 - (startRotZ2 % 360)) % 360 + 360) % 360);

      let d1State: DiePhysics = {
        x: 43,
        y: 74,
        z: 22,
        vx: initialVx1,
        vy: initialVy,
        vz: 13 + Math.random() * 4,
        rotX: startRotX1,
        rotY: startRotY1,
        rotZ: startRotZ1,
        vRotX: 0,
        vRotY: 0,
        vRotZ: 0,
        value: finalD1,
        settled: false,
      };

      let d2State: DiePhysics = {
        x: 57,
        y: 74,
        z: 24,
        vx: initialVx2,
        vy: initialVy * 0.95,
        vz: 14 + Math.random() * 4,
        rotX: startRotX2,
        rotY: startRotY2,
        rotZ: startRotZ2,
        vRotX: 0,
        vRotY: 0,
        vRotZ: 0,
        value: finalD2,
        settled: false,
      };

      const gravity = 0.52;
      const gravityZ = 0.72;
      const friction = 0.965;
      let frame = 0;
      const totalFrames = 68;

      const updatePhysics = () => {
        frame++;
        const progress = Math.min(1, frame / totalFrames);
        // Quartic smooth ease-out (fast roll deceleration to gentle halt)
        const ease = 1 - Math.pow(1 - progress, 3.2);

        // Die 1 Position & Bounds
        d1State.vy += gravity;
        d1State.vx *= friction;
        d1State.vy *= friction;
        d1State.x += d1State.vx * 0.18;
        d1State.y += d1State.vy * 0.18;

        d1State.vz -= gravityZ;
        d1State.z += d1State.vz;
        if (d1State.z < 0) {
          d1State.z = 0;
          if (Math.abs(d1State.vz) > 2) {
            d1State.vz = -d1State.vz * 0.5;
            sound.playDiceBounce();
          } else {
            d1State.vz = 0;
          }
        }

        if (d1State.y < 16) {
          d1State.y = 16;
          d1State.vy = -d1State.vy * 0.65;
          d1State.vz = Math.max(d1State.vz, 6);
          sound.playDiceBounce();
        }
        if (d1State.y > 80 && frame > 15) {
          d1State.y = 80;
          d1State.vy = -d1State.vy * 0.45;
          sound.playDiceBounce();
        }
        if (d1State.x < 12) {
          d1State.x = 12;
          d1State.vx = -d1State.vx * 0.65;
          sound.playDiceBounce();
        }
        if (d1State.x > 88) {
          d1State.x = 88;
          d1State.vx = -d1State.vx * 0.65;
          sound.playDiceBounce();
        }

        // Smooth mathematical 3D rotation for Die 1
        d1State.rotX = startRotX1 + (endRotX1 - startRotX1) * ease;
        d1State.rotY = startRotY1 + (endRotY1 - startRotY1) * ease;
        d1State.rotZ = startRotZ1 + (endRotZ1 - startRotZ1) * ease;

        // Die 2 Position & Bounds
        d2State.vy += gravity;
        d2State.vx *= friction;
        d2State.vy *= friction;
        d2State.x += d2State.vx * 0.18;
        d2State.y += d2State.vy * 0.18;

        d2State.vz -= gravityZ;
        d2State.z += d2State.vz;
        if (d2State.z < 0) {
          d2State.z = 0;
          if (Math.abs(d2State.vz) > 2) {
            d2State.vz = -d2State.vz * 0.5;
            sound.playDiceBounce();
          } else {
            d2State.vz = 0;
          }
        }

        if (d2State.y < 16) {
          d2State.y = 16;
          d2State.vy = -d2State.vy * 0.65;
          d2State.vz = Math.max(d2State.vz, 6);
          sound.playDiceBounce();
        }
        if (d2State.y > 80 && frame > 15) {
          d2State.y = 80;
          d2State.vy = -d2State.vy * 0.45;
          sound.playDiceBounce();
        }
        if (d2State.x < 12) {
          d2State.x = 12;
          d2State.vx = -d2State.vx * 0.65;
          sound.playDiceBounce();
        }
        if (d2State.x > 88) {
          d2State.x = 88;
          d2State.vx = -d2State.vx * 0.65;
          sound.playDiceBounce();
        }

        // Smooth mathematical 3D rotation for Die 2
        d2State.rotX = startRotX2 + (endRotX2 - startRotX2) * ease;
        d2State.rotY = startRotY2 + (endRotY2 - startRotY2) * ease;
        d2State.rotZ = startRotZ2 + (endRotZ2 - startRotZ2) * ease;

        // Settle roll cleanly
        if (frame >= totalFrames) {
          d1State.settled = true;
          d2State.settled = true;
          d1State.z = 0;
          d2State.z = 0;
          d1State.rotX = targetRot1.rotX;
          d1State.rotY = targetRot1.rotY;
          d1State.rotZ = 0;
          d2State.rotX = targetRot2.rotX;
          d2State.rotY = targetRot2.rotY;
          d2State.rotZ = 0;

          setDice1({ ...d1State });
          setDice2({ ...d2State });
          setDieValues([finalD1, finalD2]);
          setIsRolling(false);
          onRollComplete(finalD1, finalD2);
          return;
        }

        setDice1({ ...d1State });
        setDice2({ ...d2State });
        animFrameRef.current = requestAnimationFrame(updatePhysics);
      };

      animFrameRef.current = requestAnimationFrame(updatePhysics);
    },
    [disabled, isRolling, setIsRolling, onRollComplete, dice1.rotX, dice1.rotY, dice1.rotZ, dice2.rotX, dice2.rotY, dice2.rotZ]
  );

  // Mouse / Touch handlers for manual drag & throw
  const handleStart = (clientX: number, clientY: number) => {
    if (disabled || isRolling) return;
    setIsDragging(true);
    setDragStart({ x: clientX, y: clientY });
    setDragCurrent({ x: clientX, y: clientY });
    sound.playDiceShake();

    // Lift dice slightly off felt when grabbed (no weird skewing)
    setDice1((p) => ({ ...p, z: 12 }));
    setDice2((p) => ({ ...p, z: 14 }));
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging || disabled || isRolling) return;
    setDragCurrent({ x: clientX, y: clientY });

    const dx = clientX - dragStart.x;
    const dy = clientY - dragStart.y;

    // Interactive 3D tilt while holding
    setDice1((p) => ({
      ...p,
      rotZ: p.rotZ + dx * 0.05,
      rotX: 25 + Math.min(30, Math.abs(dy) * 0.2),
    }));
    setDice2((p) => ({
      ...p,
      rotZ: p.rotZ + dx * 0.05,
      rotX: 25 + Math.min(30, Math.abs(dy) * 0.2),
    }));

    // Detect shaking motion
    const now = Date.now();
    if (now - lastShakeTime.current > 180) {
      const dist = Math.hypot(dx, dy);
      if (dist > 25) {
        sound.playDiceShake();
        lastShakeTime.current = now;
        setShakeCount((prev) => prev + 1);
      }
    }
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const deltaX = dragCurrent.x - dragStart.x;
    const deltaY = dragCurrent.y - dragStart.y;
    const distance = Math.hypot(deltaX, deltaY);

    if (distance > 20) {
      // Directed throw based on swipe vector
      const powerY = deltaY < 0 ? deltaY : -Math.max(60, distance);
      executeThrow(deltaX, powerY);
    } else {
      // Casual click/tap triggers natural manual launch
      executeThrow(0, -110);
    }
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Calculate pull vector for visual trajectory arrow
  const deltaX = dragCurrent.x - dragStart.x;
  const deltaY = dragCurrent.y - dragStart.y;
  const dragDistance = Math.min(120, Math.hypot(deltaX, deltaY));
  const dragAngle = Math.atan2(deltaY, deltaX);

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border-2 border-amber-500/40 bg-gradient-to-b from-[#06331a] via-[#042613] to-[#021309] shadow-2xl select-none">
      {/* Top Diamond Pyramid Bumper Rail (Authentic Casino Craps Wall) */}
      <div className="relative h-12 w-full bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 border-b-2 border-amber-500/50 flex items-center justify-between px-4 overflow-hidden shadow-inner">
        {/* Pyramid foam pattern */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, #1c1006 0, #1c1006 8px, #3d230b 8px, #3d230b 16px)`,
          }}
        />

        {/* Current Point Puck indicator */}
        <div className="relative z-10 flex items-center gap-2">
          <div
            className={`px-3 py-1 rounded-full text-xs font-serif-luxury font-black tracking-widest uppercase shadow-md flex items-center gap-1.5 ${
              currentPoint !== null
                ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-200 animate-pulse'
                : 'bg-slate-900/90 text-slate-300 border border-slate-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-current" />
            <span>{currentPoint !== null ? `SAYI (POINT): ${currentPoint}` : 'COME OUT (OFF)'}</span>
          </div>
        </div>

        {/* Dice Material / Color Selector */}
        <div className="relative z-10 flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 bg-slate-950/80 px-2 py-1 rounded-xl border border-amber-500/30">
            <Palette className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] text-slate-400 mr-1">3D Zar:</span>
            {(
              [
                { id: 'ruby', label: 'Yakut', dot: 'bg-red-500' },
                { id: 'onyx', label: 'Oniks', dot: 'bg-slate-800 ring-1 ring-amber-400' },
                { id: 'emerald', label: 'Zümrüt', dot: 'bg-emerald-500' },
                { id: 'sapphire', label: 'Safir', dot: 'bg-blue-500' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectTheme(item.id)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                  diceTheme === item.id
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${item.dot}`} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <span className="text-[11px] font-bold text-amber-300/90 flex items-center gap-1">
            <Hand className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xs:inline">Manuel 3D Zar Masası</span>
          </span>
        </div>
      </div>

      {/* Main Felt Rolling Arena with 3D Perspective */}
      <div
        ref={containerRef}
        onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
        onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={(e) => {
          if (e.touches[0]) handleStart(e.touches[0].clientX, e.touches[0].clientY);
        }}
        onTouchMove={(e) => {
          if (e.touches[0]) handleMove(e.touches[0].clientX, e.touches[0].clientY);
        }}
        onTouchEnd={handleEnd}
        className={`relative w-full h-[250px] sm:h-[290px] cursor-grab active:cursor-grabbing overflow-hidden ${
          disabled ? 'opacity-70 pointer-events-none' : ''
        }`}
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, #0e562c 0%, #083c1d 60%, #041f0f 100%)',
          boxShadow: 'inset 0 0 50px rgba(0,0,0,0.9)',
        }}
      >
        {/* Felt Watermark / Diamond Guidelines */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-15">
          <div className="border-2 border-amber-400/60 w-3/4 h-3/4 rounded-3xl flex flex-col items-center justify-center">
            <span className="font-serif-luxury font-black text-4xl sm:text-6xl text-amber-300 uppercase tracking-widest">
              CASINO ROYALE
            </span>
            <span className="text-xs font-serif-luxury font-bold text-amber-400 tracking-widest mt-1">
              VIP CRAPS & BACCARAT FELT
            </span>
          </div>
        </div>

        {/* Aim Trajectory Arrow during Drag */}
        {isDragging && dragDistance > 10 && (
          <div
            className="absolute z-30 pointer-events-none origin-left flex items-center"
            style={{
              left: `${dice1.x}%`,
              top: `${dice1.y}%`,
              transform: `rotate(${dragAngle + Math.PI}deg)`,
            }}
          >
            <div
              className="h-1.5 bg-gradient-to-r from-amber-400 to-yellow-200 rounded-full shadow-[0_0_12px_rgba(251,191,36,0.8)]"
              style={{ width: `${dragDistance * 1.5}px` }}
            />
            <div className="w-0 h-0 border-y-[6px] border-y-transparent border-l-[10px] border-l-amber-300 ml-[-2px]" />
          </div>
        )}

        {/* 3D DIE 1 */}
        <div
          className="absolute z-20 pointer-events-none"
          style={{
            left: `${dice1.x}%`,
            top: `${dice1.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <Real3DDice
            value={dice1.value}
            size={40}
            rotX={dice1.rotX}
            rotY={dice1.rotY}
            rotZ={dice1.rotZ}
            isRolling={isRolling}
            color={diceTheme}
            elevation={dice1.z}
            showShadow={true}
          />
        </div>

        {/* 3D DIE 2 */}
        <div
          className="absolute z-20 pointer-events-none"
          style={{
            left: `${dice2.x}%`,
            top: `${dice2.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <Real3DDice
            value={dice2.value}
            size={40}
            rotX={dice2.rotX}
            rotY={dice2.rotY}
            rotZ={dice2.rotZ}
            isRolling={isRolling}
            color={diceTheme}
            elevation={dice2.z}
            showShadow={true}
          />
        </div>

        {/* Throw Launchpad Helper Hint at Bottom */}
        {!isRolling && (
          <div className="absolute bottom-3 inset-x-0 flex justify-center pointer-events-none">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-950/85 border border-amber-500/40 text-amber-200 text-xs font-semibold backdrop-blur-sm shadow-xl animate-bounce">
              <Hand className="w-4 h-4 text-amber-400" />
              <span>3D Zarları fare veya parmağınızla tutup masaya fırlatın</span>
              <ArrowUp className="w-3.5 h-3.5 text-amber-400" />
            </div>
          </div>
        )}
      </div>

      {/* Control Bar: Outcome Display & Quick Throw Buttons */}
      <div className="bg-slate-950/95 border-t border-amber-500/30 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
        {/* Dice Outcome Display with 3D Mini Cubes */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-amber-500/30 px-3 py-1.5 rounded-2xl shadow-inner">
            <div className="flex items-center gap-1.5">
              <Real3DDice
                value={dieValues[0]}
                size={24}
                rotX={getFaceRotationsForValue(dieValues[0]).rotX}
                rotY={getFaceRotationsForValue(dieValues[0]).rotY}
                rotZ={getFaceRotationsForValue(dieValues[0]).rotZ}
                color={diceTheme}
                showShadow={false}
              />
              <span className="text-slate-400 font-black text-xs">+</span>
              <Real3DDice
                value={dieValues[1]}
                size={24}
                rotX={getFaceRotationsForValue(dieValues[1]).rotX}
                rotY={getFaceRotationsForValue(dieValues[1]).rotY}
                rotZ={getFaceRotationsForValue(dieValues[1]).rotZ}
                color={diceTheme}
                showShadow={false}
              />
            </div>
            <span className="text-amber-400 font-bold ml-1 text-sm">=</span>
            <span className="font-serif-luxury font-black text-amber-300 text-lg ml-0.5">
              {dieValues[0] + dieValues[1]}
            </span>
          </div>

          <span className="text-xs text-slate-300 hidden sm:inline font-medium">
            {dieValues[0] === dieValues[1]
              ? '🎲 Çift Zar (Hardway)!'
              : dieValues[0] + dieValues[1] === 7
              ? '🔥 Kırmızı Yedi (Natural / Seven Out)!'
              : dieValues[0] + dieValues[1] === 11
              ? '✨ Yo Eleven (Kazanç)!'
              : 'Gerçek 3D Zarlar Masada'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Shake Button */}
          <button
            type="button"
            onClick={() => {
              sound.playDiceShake();
              setShakeCount((p) => p + 1);
              setDice1((p) => ({
                ...p,
                z: 16,
              }));
              setDice2((p) => ({
                ...p,
                z: 18,
              }));
              setTimeout(() => {
                setDice1((p) => ({ ...p, z: 0 }));
                setDice2((p) => ({ ...p, z: 0 }));
              }, 250);
            }}
            disabled={disabled || isRolling}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-bold transition active:scale-95 flex items-center gap-1.5 shadow"
            title="Zarları elde çalkala"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Elde Çalkala</span>
          </button>

          {/* Direct Manual Throw Trigger */}
          <button
            type="button"
            onClick={() => executeThrow(0, -110)}
            disabled={disabled || isRolling}
            className={`px-5 sm:px-7 py-2.5 rounded-xl font-serif-luxury font-black text-xs sm:text-sm uppercase tracking-wider transition active:scale-95 shadow-xl flex items-center gap-2 ${
              isRolling || disabled
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
            }`}
          >
            <Hand className="w-4 h-4 text-slate-950" />
            <span>{isRolling ? '3D Zarlar Yuvarlanıyor...' : '3D Zarları Masaya Fırlat (Zar At)'}</span>
            <Zap className="w-4 h-4 text-slate-950" />
          </button>
        </div>
      </div>
    </div>
  );
};
