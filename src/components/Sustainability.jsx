import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Globe2, Leaf, Droplets, Wind, Zap, Award } from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Float, Environment, Stars } from '@react-three/drei';
import { useTranslation } from 'react-i18next';
import GlowCard from './ui/GlowCard.jsx';
import { useAppContext } from '../context/AppContext.jsx';

function EarthOcio() {
  const mesh = useRef();
  useFrame((state) => {
    if(mesh.current) {
      mesh.current.rotation.y = state.clock.elapsedTime * 0.1;
      mesh.current.rotation.x = state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1}>
      <group ref={mesh}>
        <Sphere args={[2, 64, 64]}>
          <meshStandardMaterial 
            color="#0ea5e9"
            wireframe={true}
            transparent
            opacity={0.3}
          />
        </Sphere>
        <Sphere args={[1.9, 64, 64]}>
          <MeshDistortMaterial
            color="#00e676"
            attach="material"
            distort={0.3}
            speed={1.5}
            roughness={0.4}
            metalness={0.8}
            emissive="#00e676"
            emissiveIntensity={0.2}
          />
        </Sphere>
      </group>
    </Float>
  );
}

function AnimatedCounter({ value, duration = 2, suffix = '' }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseInt(value.toString().replace(/,/g, ''));
    if (start === end) return;

    let totalMilSecDur = parseInt(duration);
    let incrementTime = (totalMilSecDur / end) * 1000;

    let timer = setInterval(() => {
      start += 1;
      setCount(String(start));
      if (start === end) clearInterval(timer);
    }, Math.abs(incrementTime));

    return () => clearInterval(timer);
  }, [value, duration]);

  const displayVal = parseInt(count).toLocaleString();

  return <>{displayVal}{suffix}</>;
}

export default function Sustainability() {
  const { t } = useTranslation();
  const { gardenPlants } = useAppContext();
  
  const plantsCount = gardenPlants.length;
  // Derive fake realistic metrics based on their actual garden tracking
  const waterSaved = plantsCount * 12; // 12L per plant
  const energyOptimized = plantsCount * 5; // 5kWh per plant
  const o2Produced = plantsCount * 1.5; // 1.5kg per plant

  return (
    <div className="max-w-6xl mx-auto space-y-8 relative">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-aurora-teal/10 flex items-center justify-center">
          <Globe2 className="w-7 h-7 text-aurora-teal" />
        </div>
        <div>
          <h2 className="text-3xl font-display font-bold text-white/95">{t('sustainability.title')}</h2>
          <p className="text-white/40">{t('sustainability.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 3D Earth Vis */}
        <div className="h-[400px] lg:h-auto rounded-3xl overflow-hidden relative bg-black border border-white/5 shadow-2xl">
           <Canvas camera={{ position: [0, 0, 6] }}>
             <ambientLight intensity={0.5} />
             <directionalLight position={[10, 10, 5]} intensity={1} />
             <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
             <EarthOcio />
             <Environment preset="city" />
           </Canvas>
                      <div className="absolute bottom-6 left-6 right-6">
               <div className="glass-card p-4 flex justify-between items-center bg-white/5 backdrop-blur-md">
                 <div>
                   <div className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-1">{t('sustainability.globalRank')}</div>
                   <div className="text-white/90 font-display font-bold text-lg">Top 5%</div>
                 </div>
                 <div className="text-right">
                   <div className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-1">{t('sustainability.co2Reduced')}</div>
                   <div className="text-aurora-teal font-display font-bold text-lg">{(plantsCount * 2.5).toFixed(1)} kg</div>
                 </div>
               </div>
             </div>
        </div>

        {/* Counters & Stats */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-3xl glass-card glow-border bg-gradient-to-br from-plant-500/10 to-transparent"
          >
            <Leaf className="w-6 h-6 text-plant-500 mb-4" />
            <div className="text-3xl font-display font-bold text-white/90 mb-1"><AnimatedCounter value={plantsCount} /></div>
            <div className="text-sm font-medium text-white/50">{t('sustainability.plantsScanned')}</div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-3xl glass-card glow-border bg-gradient-to-br from-aurora-blue/10 to-transparent"
          >
            <Droplets className="w-6 h-6 text-aurora-blue mb-4" />
            <div className="text-3xl font-display font-bold text-white/90 mb-1"><AnimatedCounter value={waterSaved} suffix="L" /></div>
            <div className="text-sm font-medium text-white/50">{t('sustainability.waterSaved')}</div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-3xl glass-card glow-border bg-gradient-to-br from-yellow-500/10 to-transparent"
          >
            <Zap className="w-6 h-6 text-yellow-500 mb-4" />
            <div className="text-3xl font-display font-bold text-white/90 mb-1"><AnimatedCounter value={energyOptimized} suffix="kWh" /></div>
            <div className="text-sm font-medium text-white/50">{t('sustainability.energyOptimized')}</div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-3xl glass-card glow-border bg-gradient-to-br from-aurora-purple/10 to-transparent"
          >
            <Wind className="w-6 h-6 text-aurora-purple mb-4" />
            <div className="text-3xl font-display font-bold text-white/90 mb-1"><AnimatedCounter value={Math.floor(o2Produced)} suffix="kg" /></div>
            <div className="text-sm font-medium text-white/50">{t('sustainability.o2Produced')}</div>
          </motion.div>
        </div>

      </div>

      <h3 className="text-xl font-display font-bold text-white/90 mt-8">{t('sustainability.achievements')}</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: Leaf, title: t('sustainability.seedling'), desc: t('sustainability.seedlingDesc'), p: Math.min(100, plantsCount * 10) },
          { icon: Droplets, title: t('sustainability.waterSaver'), desc: t('sustainability.waterSaverDesc'), p: Math.min(100, plantsCount * 8) },
          { icon: Award, title: t('sustainability.masterBotanist'), desc: t('sustainability.masterBotanistDesc'), p: Math.min(100, plantsCount * 5) },
        ].map((a, i) => {
          const Icon = a.icon;
          return (
             <GlowCard key={i}>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                     <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                        <Icon className="w-5 h-5 text-white/70" />
                     </div>
                     <h4 className="font-display font-semibold text-white/90">{a.title}</h4>
                  </div>
                  <p className="text-white/50 text-sm mb-4">{a.desc}</p>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                     <motion.div 
                       className="h-full bg-plant-500 rounded-full"
                       initial={{ width: 0 }}
                       animate={{ width: `${a.p}%` }}
                       transition={{ duration: 1, delay: 0.5 }}
                     />
                  </div>
                  <div className="text-right text-xs text-white/40 mt-1">{a.p}%</div>
                </div>
             </GlowCard>
          )
        })}
      </div>
    </div>
  );
}
