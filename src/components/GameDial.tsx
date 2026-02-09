import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { clsx } from 'clsx';

interface GameDialProps {
    value: number;
    onChange: (value: number) => void;
    result?: number | null;
    isRolling: boolean;
}

const GameDial: React.FC<GameDialProps> = ({ value, onChange, result, isRolling }) => {
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const controls = useAnimation();

    // Calculate angle from value (0-100 maps to 0-360 degrees, or maybe a partial arc)
    // Let's use a full 360 for 0-100 to make it simple and maximize space
    const angle = (value / 100) * 360;

    const handleInteraction = (clientX: number, clientY: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Calculate angle relative to center, starting from top (12 o'clock)
        // atan2 returns angle in radians from -PI to PI
        // We want 0 at top, increasing clockwise
        const deltaX = clientX - centerX;
        const deltaY = clientY - centerY;

        // Standard atan2 is 0 at positive X (3 o'clock), increasing counter-clockwise
        // We want 0 at top (12 o'clock), increasing clockwise.
        // So we rotate coordinates.
        let radians = Math.atan2(deltaY, deltaX);
        let degrees = radians * (180 / Math.PI);

        // Convert to 0 at top, clockwise
        degrees = degrees + 90;
        if (degrees < 0) degrees += 360;

        const newValue = Math.min(Math.max(Math.round((degrees / 360) * 100), 0), 99); // Cap at 99 for gameplay reasons usually
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
                e.preventDefault(); // Prevent scrolling while dragging dial
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

    // Rolling animation logic
    useEffect(() => {
        if (result !== null && !isRolling) {
            controls.start({
                scale: [1, 1.1, 1],
                transition: { duration: 0.3 }
            });
        }
    }, [result, isRolling, controls]);

    return (
        <div
            className="relative w-64 h-64 flex items-center justify-center my-6 touch-none cursor-pointer"
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
        >
            {/* Background Track */}
            <div className="absolute w-full h-full rounded-full border-4 border-surface shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] bg-background"></div>

            {/* Active Track (SVG for dynamic arc) */}
            <svg className="absolute w-full h-full -rotate-90 pointer-events-none">
                <circle
                    cx="50%"
                    cy="50%"
                    r="48%" // Slightly smaller than container
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeDasharray={`${2 * Math.PI * 48}%`} // Circumference assuming r=48% roughly 120px nominal if w=250
                    strokeDashoffset={`calc(${2 * Math.PI * 48}% * ${(100 - value) / 100})`}
                    strokeLinecap="round"
                    className="text-primary transition-all duration-75 ease-out drop-shadow-[0_0_8px_rgba(247,147,26,0.6)]"
                />
            </svg>

            {/* Knob/Handle */}
            <div
                className="absolute w-full h-full pointer-events-none"
                style={{ transform: `rotate(${angle}deg)` }}
            >
                <div
                    className="absolute -top-[2%] left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)] border-4 border-primary z-10"
                />
            </div>

            {/* Center Display */}
            <div
                className="absolute w-40 h-40 rounded-full bg-surface shadow-2xl flex flex-col items-center justify-center border border-white/5 z-0"
            >
                <motion.div animate={controls} className="text-center">
                    {isRolling ? (
                        <motion.span
                            className="text-5xl font-bold font-mono text-secondary blur-sm"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ repeat: Infinity, duration: 0.1 }}
                        >
                            {Math.floor(Math.random() * 100)}
                        </motion.span>
                    ) : (
                        <span className={clsx("text-6xl font-bold font-mono drop-shadow-md", result !== null && result !== undefined ? (result < value ? "text-green-400" : "text-red-500") : "text-white")}>
                            {result !== null && result !== undefined ? result : value}
                        </span>
                    )}
                    <div className="text-xs text-gray-500 mt-2 font-mono uppercase tracking-widest">
                        {isRolling ? "ROLLING..." : "ROLL RESULT"}
                    </div>
                </motion.div>
            </div>

            {/* Hotspots / Decor */}
            <div className="absolute bottom-0 w-full flex justify-center pb-8 pointer-events-none">
                <span className="text-xs font-mono text-primary/50">DRAG TO ADJUST</span>
            </div>
        </div>
    );
};

export default GameDial;
