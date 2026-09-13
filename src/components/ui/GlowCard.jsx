import { motion } from 'framer-motion';
import { useRef, useState } from 'react';

export default function GlowCard({ children, className = '', glowColor = 'rgba(0, 230, 118, 0.15)', onClick }) {
  const cardRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  return (
    <motion.div
      ref={cardRef}
      className={`relative overflow-hidden rounded-3xl ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      {/* Dynamic glow that follows cursor */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}% ${mousePos.y}%, ${glowColor}, transparent 40%)`,
          opacity: isHovered ? 1 : 0,
        }}
      />

      {/* Top edge highlight */}
      <div
        className="absolute top-0 left-[10%] right-[10%] h-[1px] pointer-events-none transition-opacity duration-500"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(0, 230, 118, 0.3), transparent)',
          opacity: isHovered ? 1 : 0,
        }}
      />

      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
