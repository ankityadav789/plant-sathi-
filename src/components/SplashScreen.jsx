import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, animate } from "framer-motion";
import { startupTasks } from "../config/startupTasks";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Uses requestAnimationFrame for buttery-smooth 60-144 FPS counting
function animateProgress(from, to, setProgress) {
  return new Promise((resolve) => {
    const start = performance.now();
    const duration = 500;

    function frame(now) {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const value = Math.round(from + (to - from) * t);
      setProgress(value);

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        resolve();
      }
    }

    requestAnimationFrame(frame);
  });
}

export default function SplashScreen({ onFinish }) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("🌱 Booting PlantSathi Core...");
  const barWidth = useMotionValue(0);

  // Sync barWidth MotionValue with progress state
  useEffect(() => {
    animate(barWidth, progress, { duration: 0.4 });
  }, [progress]);

  useEffect(() => {
    let cancelled = false;

    async function startLoader() {
      let current = 0;

      for (const step of startupTasks) {
        if (cancelled) return;
        setStatus(step.label);

        // Run the actual task but always wait at least 350ms so it never feels instant
        await Promise.all([step.run(), delay(350)]);

        // Smoothly animate from current to this step's target
        await animateProgress(current, step.progress, setProgress);
        current = step.progress;
      }

      // Show welcome message before finishing
      setStatus("Welcome 🌿");
      await delay(600);

      if (!cancelled) onFinish();
    }

    startLoader();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-[#060813] flex flex-col justify-center items-center z-[9999] overflow-hidden"
        exit={{
          opacity: 0,
          scale: 1.04,
          filter: "blur(10px)",
        }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Background Glow */}
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full bg-green-500/10 blur-[180px]"
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            repeat: Infinity,
            duration: 6,
          }}
        />

        <h1 className="text-5xl font-bold text-white relative">
          Plant
          <span className="text-green-400">Sathi</span>
          <span className="text-indigo-400"> AI</span>
        </h1>

        <p className="text-gray-400 mt-3">
          Your Intelligent Plant Health Companion
        </p>

        {/* Percentage with pop animation */}
        <motion.div
          key={progress}
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 0.2 }}
          className="mt-12 text-6xl font-black text-green-400"
        >
          {progress}%
        </motion.div>

        {/* Shimmering Progress Bar */}
        <div className="mt-8 w-[340px]">
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                width: barWidth.get() + "%",
                background:
                  "linear-gradient(90deg, #67ff44, #00d47d, #00d7ff, #67ff44)",
                backgroundSize: "200% 100%",
                animation: "shine 2s linear infinite",
              }}
              // Also keep it synced via animate for initial render
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        {/* Status */}
        <motion.div
          key={status}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 text-green-300"
        >
          {status}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}