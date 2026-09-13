import { motion } from 'framer-motion';

export default function FloatingParticles() {
  const leaves = ['🍃', '🌱', '🌿', '☘️', '🍀', '🪴'];

  return (
    <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-lg opacity-[0.07]"
          initial={{
            x: `${Math.random() * 100}vw`,
            y: `${-10 - Math.random() * 20}vh`,
            rotate: Math.random() * 360,
          }}
          animate={{
            y: '110vh',
            x: `${Math.random() * 100}vw`,
            rotate: Math.random() * 720,
          }}
          transition={{
            duration: 15 + Math.random() * 15,
            repeat: Infinity,
            delay: Math.random() * 10,
            ease: 'linear',
          }}
        >
          {leaves[i % leaves.length]}
        </motion.div>
      ))}

      {/* Ambient glowing orbs */}
      {Array.from({ length: 4 }).map((_, i) => (
        <motion.div
          key={`orb-${i}`}
          className="absolute rounded-full"
          style={{
            width: 200 + i * 100,
            height: 200 + i * 100,
            background: `radial-gradient(circle, ${
              ['rgba(0,230,118,0.03)', 'rgba(0,212,170,0.02)', 'rgba(124,58,237,0.02)', 'rgba(59,130,246,0.02)'][i]
            }, transparent 70%)`,
            left: `${[10, 70, 30, 80][i]}%`,
            top: `${[20, 60, 80, 30][i]}%`,
          }}
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -20, 30, 0],
            scale: [1, 1.2, 0.9, 1],
          }}
          transition={{
            duration: 15 + i * 5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
