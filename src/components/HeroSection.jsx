import { useRef, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Scan, Camera, Sparkles, ArrowRight, Shield, Zap, Brain } from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, ContactShadows, PresentationControls, Sphere, MeshDistortMaterial } from '@react-three/drei';
import { useTranslation } from 'react-i18next';
import RippleButton from './ui/RippleButton.jsx';

function PlantHologram() {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <group ref={meshRef} position={[0, -0.5, 0]}>
        {/* Abstract futuristic plant representation */}
        <Sphere args={[1.5, 64, 64]}>
          <MeshDistortMaterial
            color="#00e676"
            attach="material"
            distort={0.4}
            speed={2}
            roughness={0.2}
            metalness={0.8}
            emissive="#00e676"
            emissiveIntensity={0.2}
            wireframe={true}
          />
        </Sphere>
        <Sphere args={[1.2, 32, 32]} position={[0, 0, 0]}>
           <MeshDistortMaterial
            color="#7c3aed"
            attach="material"
            distort={0.6}
            speed={1.5}
            roughness={0.1}
            metalness={1}
            emissive="#7c3aed"
            emissiveIntensity={0.4}
            transparent
            opacity={0.7}
          />
        </Sphere>
      </group>
    </Float>
  );
}

export default function HeroSection({ onGetStarted }) {
  const { t } = useTranslation();

  const features = [
    { icon: Brain, title: t('hero.featureAiTitle'), desc: t('hero.featureAiDesc') },
    { icon: Shield, title: t('hero.featurePestTitle'), desc: t('hero.featurePestDesc') },
    { icon: Zap, title: t('hero.featureCareTitle'), desc: t('hero.featureCareDesc') },
  ];

  return (
    <section className="min-h-screen pt-24 pb-20 flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* 3D Canvas Background */}
      <div className="absolute inset-0 z-0 opacity-60">
        <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
          <PresentationControls
            global
            config={{ mass: 2, tension: 500 }}
            snap={{ mass: 4, tension: 1500 }}
            rotation={[0, 0, 0]}
            polar={[-Math.PI / 3, Math.PI / 3]}
            azimuth={[-Math.PI / 1.4, Math.PI / 2]}
          >
            <Suspense fallback={null}>
              <PlantHologram />
              <Environment preset="city" />
            </Suspense>
          </PresentationControls>
          <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={20} blur={2} far={4} />
        </Canvas>
      </div>

      <div className="relative z-10 px-6 flex flex-col items-center w-full">
        {/* Hero Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="badge badge-success mb-8 text-xs tracking-widest uppercase backdrop-blur-md bg-white/5 border-white/10 shadow-xl"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {t('hero.badge')}
        </motion.div>

        {/* Hero Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
          className="text-5xl md:text-7xl lg:text-8xl font-display font-extrabold text-center leading-[1.05] tracking-tight max-w-5xl"
        >
          <span className="text-white/95">{t('hero.heading1')}</span>
          <br />
          <span className="gradient-text-bright">{t('hero.heading2')}</span>
        </motion.h1>

        {/* Hero Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-white/50 text-lg md:text-xl max-w-2xl text-center mt-6 font-body leading-relaxed backdrop-blur-[2px]"
        >
          {t('hero.subtitle')}
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="flex flex-col sm:flex-row gap-4 mt-10"
        >
          <RippleButton onClick={onGetStarted} variant="primary" className="text-base px-8 py-4 z-20">
            <Scan className="w-5 h-5" />
            {t('hero.uploadBtn')}
            <ArrowRight className="w-4 h-4 ml-1" />
          </RippleButton>
          <RippleButton variant="secondary" className="text-base px-8 py-4 z-20 bg-white/5 hover:bg-white/10 backdrop-blur-lg border border-white/10" onClick={onGetStarted}>
            <Camera className="w-5 h-5" />
            {t('hero.cameraBtn')}
          </RippleButton>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-24 max-w-4xl w-full"
        >
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                className="glass-card glow-border p-6 flex flex-col items-center text-center gap-3 cursor-default"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 + i * 0.15 }}
                whileHover={{ scale: 1.03, y: -4 }}
              >
                <div className="w-12 h-12 rounded-2xl bg-plant-500/10 flex items-center justify-center mb-1">
                  <Icon className="w-6 h-6 text-plant-500" />
                </div>
                <h3 className="font-display font-semibold text-white/90 text-base">{f.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
          className="flex flex-wrap justify-center gap-10 mt-16"
        >
          {[
            { val: '50K+', label: t('hero.statScanned') },
            { val: '99.2%', label: t('hero.statAccuracy') },
            { val: '200+', label: t('hero.statSpecies') },
            { val: '24/7', label: t('hero.statSupport') },
          ].map((s) => (
            <div key={s.label} className="text-center glass-card px-6 py-4 rounded-3xl border-white/5">
              <div className="text-2xl font-display font-bold gradient-text">{s.val}</div>
              <div className="text-white/30 text-[10px] mt-1 tracking-widest uppercase">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
