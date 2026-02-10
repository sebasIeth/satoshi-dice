import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { clsx } from 'clsx';

interface GameDialProps {
    value: number;
    onChange: (value: number) => void;
    result?: number | null;
    isRolling: boolean;
    isWin?: boolean | null;
}

const RADIUS = 115;
const STROKE_WIDTH = 10;
const CENTER = 128;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const GameDial: React.FC<GameDialProps> = ({ value, onChange, result, isRolling, isWin }) => {
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const controls = useAnimation();
    const [displayNumber, setDisplayNumber] = useState<number | null>(null);

    const angle = (value / 100) * 360;

    const handleInteraction = (clientX: number, clientY: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const deltaX = clientX - centerX;
        const deltaY = clientY - centerY;
        let radians = Math.atan2(deltaY, deltaX);
        let degrees = radians * (180 / Math.PI);
        degrees = degrees + 90;
        if (degrees < 0) degrees += 360;
        const newValue = Math.min(Math.max(Math.round((degrees / 360) * 100), 1), 99);
        onChange(newValue);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        handleInteraction(e.clientX, e.clientY);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        setIsDragging(true);
        handleInteraction(e.touches[0].clientX, e.touches[0].clientY);
    };

    useEffect(() => {
        const handleMove = (e: MouseEvent) => {
            if (isDragging) handleInteraction(e.clientX, e.clientY);
        };
        const handleUp = () => setIsDragging(false);
        const handleTouchMove = (e: TouchEvent) => {
            if (isDragging) {
                e.preventDefault();
                handleInteraction(e.touches[0].clientX, e.touches[0].clientY);
            }
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleUp);

        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleUp);
        };
    }, [isDragging]);

    // Rolling animation - cycle through random numbers
    useEffect(() => {
        if (isRolling) {
            const interval = setInterval(() => {
                setDisplayNumber(Math.floor(Math.random() * 100));
            }, 60);
            return () => clearInterval(interval);
        } else {
            setDisplayNumber(null);
        }
    }, [isRolling]);

    // Result reveal animation
    useEffect(() => {
        if (result !== null && result !== undefined && !isRolling) {
            controls.start({
                scale: [1, 1.15, 1],
                transition: { duration: 0.4, ease: 'easeOut' }
            });
        }
    }, [result, isRolling, controls]);

    // Generate tick marks every 10 units
    const ticks = Array.from({ length: 10 }, (_, i) => {
        const tickValue = i * 10;
        const tickAngle = (tickValue / 100) * 360 - 90; // -90 to start from top
        const outerR = RADIUS + 16;
        const innerR = RADIUS + 8;
        const labelR = RADIUS + 28;
        const rad = (tickAngle * Math.PI) / 180;
        return {
            x1: CENTER + innerR * Math.cos(rad),
            y1: CENTER + innerR * Math.sin(rad),
            x2: CENTER + outerR * Math.cos(rad),
            y2: CENTER + outerR * Math.sin(rad),
            lx: CENTER + labelR * Math.cos(rad),
            ly: CENTER + labelR * Math.sin(rad),
            label: tickValue.toString(),
        };
    });

    // Arc calculation for under (green) and over (red) zones
    const underDash = (value / 100) * CIRCUMFERENCE;
    const overDash = ((100 - value) / 100) * CIRCUMFERENCE;

    const hasResult = result !== null && result !== undefined;

    return (
        <div
            className={clsx(
                "relative w-[270px] h-[270px] flex items-center justify-center mt-1 mb-4 touch-none select-none",
                isDragging ? "cursor-grabbing" : "cursor-grab"
            )}
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
        >
            <svg viewBox="0 0 256 256" className="absolute w-full h-full">
                {/* Background track */}
                <circle
                    cx={CENTER}
                    cy={CENTER}
                    r={RADIUS}
                    fill="none"
                    stroke="#1a1a1a"
                    strokeWidth={STROKE_WIDTH + 2}
                />

                {/* Over zone (red) - full circle first */}
                <circle
                    cx={CENTER}
                    cy={CENTER}
                    r={RADIUS}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth={STROKE_WIDTH}
                    strokeDasharray={`${overDash} ${CIRCUMFERENCE}`}
                    strokeDashoffset={-underDash}
                    strokeLinecap="round"
                    opacity={0.25}
                    transform={`rotate(-90 ${CENTER} ${CENTER})`}
                    className="transition-all duration-100 ease-out"
                />

                {/* Under zone (green) */}
                <circle
                    cx={CENTER}
                    cy={CENTER}
                    r={RADIUS}
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth={STROKE_WIDTH}
                    strokeDasharray={`${underDash} ${CIRCUMFERENCE}`}
                    strokeLinecap="round"
                    opacity={0.35}
                    transform={`rotate(-90 ${CENTER} ${CENTER})`}
                    className="transition-all duration-100 ease-out"
                />

                {/* Glow overlay on green arc */}
                <circle
                    cx={CENTER}
                    cy={CENTER}
                    r={RADIUS}
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth={STROKE_WIDTH - 4}
                    strokeDasharray={`${underDash} ${CIRCUMFERENCE}`}
                    strokeLinecap="round"
                    opacity={0.15}
                    transform={`rotate(-90 ${CENTER} ${CENTER})`}
                    filter="url(#glow)"
                    className="transition-all duration-100 ease-out"
                />

                {/* Tick marks */}
                {ticks.map((tick, i) => (
                    <g key={i}>
                        <line
                            x1={tick.x1}
                            y1={tick.y1}
                            x2={tick.x2}
                            y2={tick.y2}
                            stroke="#444"
                            strokeWidth={1.5}
                        />
                        <text
                            x={tick.lx}
                            y={tick.ly}
                            fill="#555"
                            fontSize="9"
                            fontFamily="Fira Code, monospace"
                            textAnchor="middle"
                            dominantBaseline="central"
                        >
                            {tick.label}
                        </text>
                    </g>
                ))}

                {/* Glow filter */}
                <defs>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
            </svg>

            {/* Knob/Handle - 44px touch target */}
            <div
                className="absolute w-full h-full pointer-events-none"
                style={{ transform: `rotate(${angle}deg)` }}
            >
                <div
                    className={clsx(
                        "absolute -top-[3px] left-1/2 -translate-x-1/2 w-[44px] h-[44px] flex items-center justify-center pointer-events-auto",
                    )}
                >
                    <div className={clsx(
                        "w-7 h-7 rounded-full bg-gradient-to-br from-white to-gray-200 border-[3px] border-primary shadow-[0_0_16px_rgba(247,147,26,0.6)]",
                        "transition-transform duration-150",
                        isDragging && "scale-110"
                    )} />
                </div>
            </div>

            {/* Center Display */}
            <div className="absolute w-[150px] h-[150px] rounded-full bg-surface shadow-2xl flex flex-col items-center justify-center border border-white/5 z-0">
                <motion.div animate={controls} className="text-center">
                    {isRolling ? (
                        <motion.span
                            className="text-5xl font-bold font-mono text-secondary/70 blur-[2px]"
                            animate={{ opacity: [0.4, 0.8, 0.4] }}
                            transition={{ repeat: Infinity, duration: 0.15 }}
                        >
                            {displayNumber ?? '??'}
                        </motion.span>
                    ) : (
                        <span className={clsx(
                            "text-5xl font-bold font-mono drop-shadow-md transition-colors duration-300",
                            hasResult
                                ? isWin
                                    ? "text-green-400 drop-shadow-[0_0_12px_rgba(34,197,94,0.5)]"
                                    : "text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.5)]"
                                : "text-white"
                        )}>
                            {hasResult ? result : value}
                        </span>
                    )}
                    <div className={clsx(
                        "mt-1.5 font-mono uppercase tracking-[0.15em] font-bold",
                        isRolling
                            ? "text-[10px] text-secondary/60"
                            : hasResult
                                ? isWin
                                    ? "text-sm text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                                    : "text-sm text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                                : "text-[10px] text-primary/60"
                    )}>
                        {isRolling ? "ROLLING..." : hasResult ? (isWin ? "WIN!" : "LOSE") : "TARGET"}
                    </div>
                </motion.div>
            </div>

            {/* Drag hint */}
            {!hasResult && !isRolling && (
                <div className="absolute -bottom-5 w-full flex justify-center pointer-events-none">
                    <span className="text-[10px] font-mono text-gray-500 tracking-wider">DRAG TO ADJUST</span>
                </div>
            )}
        </div>
    );
};

export default GameDial;
