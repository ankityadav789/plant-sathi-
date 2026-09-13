import { useState, useRef } from 'react';
import { motion } from 'framer-motion';

export default function RippleButton({ children, onClick, className = '', variant = 'primary' }) {
  const [ripples, setRipples] = useState([]);
  const btnRef = useRef(null);

  const handleClick = (e) => {
    const rect = btnRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples((prev) => [...prev, { x, y, id }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 600);

    if (onClick) onClick(e);
  };

  const baseStyles = variant === 'primary'
    ? 'bg-gradient-to-r from-plant-500 to-aurora-teal text-surface-900 font-semibold'
    : variant === 'secondary'
    ? 'bg-white/5 text-white/90 border border-white/10 hover:border-plant-500/30'
    : 'bg-transparent text-white/70 hover:text-white';

  return (
    <motion.button
      ref={btnRef}
      onClick={handleClick}
      className={`relative overflow-hidden rounded-2xl px-6 py-3 font-display text-sm tracking-wide transition-all duration-300 ${baseStyles} ${className}`}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
    >
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/30 animate-ripple pointer-events-none"
          style={{
            left: ripple.x - 5,
            top: ripple.y - 5,
            width: 10,
            height: 10,
          }}
        />
      ))}
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
    </motion.button>
  );
}
