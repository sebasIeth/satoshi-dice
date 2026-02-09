import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [faceIndex, setFaceIndex] = useState(0);
  const [exiting, setExiting] = useState(false);

  // Cycle dice faces
  useEffect(() => {
    const interval = setInterval(() => {
      setFaceIndex(i => (i + 1) % DICE_FACES.length);
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // Start exit after 2.5s, call onFinish after fade
  useEffect(() => {
    const timer = setTimeout(() => setExiting(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence onExitComplete={onFinish}>
      {!exiting && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center gap-6"
        >
          {/* Glow background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-primary/5 blur-[100px]" />
            <div className="absolute top-1/3 left-1/3 w-[200px] h-[200px] rounded-full bg-secondary/5 blur-[80px]" />
          </div>

          {/* Dice animation */}
          <motion.div
            animate={{ rotateY: [0, 360] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
            className="relative"
          >
            <span className="text-7xl drop-shadow-[0_0_30px_rgba(247,147,26,0.6)]">
              {DICE_FACES[faceIndex]}
            </span>
          </motion.div>

          {/* Title */}
          <div className="flex flex-col items-center gap-2 relative">
            <h1 className="text-3xl font-extrabold tracking-widest font-mono text-white">
              SATOSHI<span className="text-primary drop-shadow-[0_0_12px_rgba(247,147,26,0.6)]">DICE</span>
            </h1>
            <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
              <span className="text-primary/60">₿</span>
              <span>Roll the chain</span>
              <span className="text-secondary/60">⬡</span>
            </div>
          </div>

          {/* Loading bar */}
          <div className="w-48 h-1 bg-surface rounded-full overflow-hidden mt-4">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 2.5, ease: 'easeInOut' }}
              className="h-full bg-gradient-to-r from-primary to-secondary rounded-full shadow-[0_0_10px_rgba(247,147,26,0.5)]"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
