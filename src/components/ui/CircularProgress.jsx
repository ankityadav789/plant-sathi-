import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function CircularProgress({
  value = 0,
  size = 140,
  strokeWidth = 10,
  color = '#00e676',
  bgColor = 'rgba(255,255,255,0.05)',
  label = '',
  sublabel = '',
}) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedValue / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(value), 300);
    return () => clearTimeout(timer);
  }, [value]);

  const getColor = (val) => {
    if (val >= 80) return '#00e676';
    if (val >= 60) return '#fbbf24';
    if (val >= 40) return '#f97316';
    return '#ef4444';
  };

  const activeColor = color === 'auto' ? getColor(value) : color;

  return (
    <div className="relative flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={bgColor}
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={activeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1], delay: 0.5 }}
            style={{
              filter: `drop-shadow(0 0 8px ${activeColor}50)`,
            }}
          />
        </svg>

        {/* Center value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-3xl font-bold font-display"
            style={{ color: activeColor }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            {animatedValue}
          </motion.span>
          {sublabel && (
            <span className="text-xs text-white/40 mt-0.5">{sublabel}</span>
          )}
        </div>
      </div>
      {label && (
        <span className="text-sm text-white/60 font-medium">{label}</span>
      )}
    </div>
  );
}
