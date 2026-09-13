import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  ShieldCheck,
  Leaf,
  FlaskConical,
  Cpu,
  AlertCircle
} from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { Float, Environment } from '@react-three/drei';

function EnergyCore() {
  return (
    <group>
      <Float speed={3} rotationIntensity={4} floatIntensity={0}>
        <mesh rotation={[Math.PI / 4, 0, 0]}>
          <torusGeometry args={[1.8, 0.02, 16, 100]} />
          <meshStandardMaterial
            color="#00e676"
            emissive="#00e676"
            emissiveIntensity={3}
          />
        </mesh>
      </Float>

      <Float speed={4} rotationIntensity={5} floatIntensity={0}>
        <mesh rotation={[-Math.PI / 4, 0, 0]}>
          <torusGeometry args={[1.6, 0.02, 16, 100]} />
          <meshStandardMaterial
            color="#3b82f6"
            emissive="#3b82f6"
            emissiveIntensity={3}
          />
        </mesh>
      </Float>

      <Float speed={5} rotationIntensity={2} floatIntensity={2}>
        <mesh>
          <icosahedronGeometry args={[1, 1]} />
          <meshStandardMaterial
            color="#00e676"
            emissive="#00e676"
            emissiveIntensity={1}
            wireframe
            transparent
            opacity={0.3}
          />
        </mesh>

        <mesh scale={0.8}>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color="#3b82f6"
            emissive="#3b82f6"
            emissiveIntensity={2}
            transparent
            opacity={0.8}
          />
        </mesh>
      </Float>
    </group>
  );
}

const MIN_PROCESSING_TIME = 5500;

export default function ProcessingScreen({
  image,
  apiRequestDone,
  apiError,
  processingStartedAt,
  onComplete
}) {
  const { t } = useTranslation();

  const [progress, setProgress] = useState(8);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [complete, setComplete] = useState(false);

  const phases = useMemo(
  () => [
    {
      text: 'Image uploaded',
      icon: Cpu
    },
    {
      text: 'Checking image quality',
      icon: ShieldCheck
    },
    {
      text: 'Identifying plant',
      icon: Leaf
    },
    {
      text: 'Analyzing plant health',
      icon: FlaskConical
    },
    {
      text: 'Checking disease',
      icon: ShieldCheck
    },
    {
      text: 'Preparing Plant Doctor report',
      icon: CheckCircle2
    }
  ],
  []
);

  /*
   * One single timer controls the visual progress.
   * It cannot reach 100% until the minimum display time is complete.
   */
 useEffect(() => {
  if (!processingStartedAt) return;

  const updateProgress = () => {
    const elapsed = Date.now() - processingStartedAt;

    const timeRatio = Math.min(
      elapsed / MIN_PROCESSING_TIME,
      1
    );

    const visualProgress = 8 + timeRatio * 80;

    const nextProgress =
      apiRequestDone && elapsed >= MIN_PROCESSING_TIME
        ? 100
        : Math.min(88, visualProgress);

    setProgress(nextProgress);

    /*
     * Timeline thresholds.
     *
     * Each phase owns a range of the progress.
     */
    const phaseThresholds = [
      10,  // Image uploaded
      25,  // Checking image quality
      50,  // Identifying plant
      70,  // Analyzing health
      88,  // Checking disease
      100  // Preparing report
    ];

    let activePhase = 0;

    for (let i = 0; i < phaseThresholds.length; i++) {
      if (nextProgress >= phaseThresholds[i]) {
        activePhase = Math.min(
          i + 1,
          phases.length - 1
        );
      } else {
        break;
      }
    }

    /*
     * Before final completion, keep the last phase
     * as the active phase rather than marking everything done.
     */
    if (!apiRequestDone || elapsed < MIN_PROCESSING_TIME) {
      activePhase = Math.min(
        activePhase,
        phases.length - 2
      );
    }

    setCurrentPhase(activePhase);
  };

  updateProgress();

  const interval = setInterval(updateProgress, 100);

  return () => clearInterval(interval);
}, [processingStartedAt, apiRequestDone, phases.length]);

  /*
   * Completion only happens when BOTH conditions are satisfied:
   *
   * 1. API request finished
   * 2. Minimum processing time has passed
   */
  useEffect(() => {
    if (!processingStartedAt || !apiRequestDone) {
      return;
    }

    const elapsed = Date.now() - processingStartedAt;
    const remaining = Math.max(
      0,
      MIN_PROCESSING_TIME - elapsed
    );

    const timer = setTimeout(() => {
      setProgress(100);
      

      setTimeout(() => {
        setComplete(true);

        setTimeout(() => {
          onComplete?.();
        }, 700);
      }, 700);
    }, remaining);

    return () => clearTimeout(timer);
  }, [
    processingStartedAt,
    apiRequestDone,
    onComplete,
    phases.length
  ]);

  return (
    <div className="min-h-screen w-full bg-[#05070b] relative overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0 opacity-15 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 5] }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <EnergyCore />
          <Environment preset="city" />
        </Canvas>
      </div>

      {/* Scan line */}
      {!complete && !apiError && (
        <motion.div
          className="absolute left-0 right-0 h-48 bg-gradient-to-b from-transparent via-plant-500/10 to-transparent pointer-events-none"
          animate={{ y: ['-100vh', '100vh'] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
      )}

      <div className="relative z-10 w-full max-w-2xl mx-auto px-5 py-8 md:py-12">

        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-plant-500 text-xs uppercase tracking-[0.25em] font-semibold mb-2">
            PlantSathi AI
          </p>

          <h2 className="text-3xl md:text-4xl font-display font-bold text-white">
            {apiError
              ? 'Analysis Could Not Continue'
              : complete
                ? 'Analysis Complete'
                : 'Analyzing Your Plant'}
          </h2>

          <p className="text-white/40 text-sm mt-2">
            {apiError
              ? 'Please try again with a suitable plant image.'
              : complete
                ? 'Preparing your plant health report...'
                : 'Please keep this window open while PlantSathi analyzes the image.'}
          </p>
        </div>

        {/* Uploaded Image */}
        <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-black/30 shadow-2xl mb-6">

          {image ? (
            <>
              <img
                src={image}
                alt="Uploaded plant"
                className="w-full aspect-[16/10] object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />

              <div className="absolute left-4 bottom-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-black/55 backdrop-blur-md border border-white/10">
                {apiError ? (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                ) : complete ? (
                  <CheckCircle2 className="w-4 h-4 text-plant-500" />
                ) : (
                  <Cpu className="w-4 h-4 text-plant-500" />
                )}

                <span className="text-xs font-semibold text-white/90">
                  {apiError
                    ? 'Image rejected'
                    : complete
                      ? 'Analysis complete'
                      : 'Image being analyzed'}
                </span>
              </div>

              {!apiError && !complete && (
                <motion.div
                  className="absolute left-0 right-0 h-1 bg-plant-500 shadow-[0_0_18px_rgba(0,230,118,0.9)]"
                  animate={{ top: ['0%', '100%'] }}
                  transition={{
                    duration: 2.8,
                    repeat: Infinity,
                    ease: 'linear'
                  }}
                />
              )}
            </>
          ) : (
            <div className="aspect-[16/10] flex items-center justify-center text-white/30">
              Preparing image...
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="flex flex-col items-center mb-7">

          <div className="relative w-32 h-32">

            <svg
              className="w-full h-full -rotate-90"
              viewBox="0 0 100 100"
            >
              <circle
                className="text-white/10"
                stroke="currentColor"
                strokeWidth="5"
                fill="transparent"
                r="43"
                cx="50"
                cy="50"
              />

              <motion.circle
                className={
                  apiError
                    ? 'text-red-400'
                    : 'text-plant-500'
                }
                stroke="currentColor"
                strokeWidth="5"
                strokeDasharray={270}
                strokeDashoffset={
                  270 - (270 * progress) / 100
                }
                strokeLinecap="round"
                fill="transparent"
                r="43"
                cx="50"
                cy="50"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">

              {apiError ? (
                <AlertCircle className="w-8 h-8 text-red-400" />
              ) : complete ? (
                <CheckCircle2 className="w-9 h-9 text-plant-500" />
              ) : (
                <>
                  <span className="text-3xl font-display font-bold text-white tabular-nums">
                    {Math.round(progress)}
                  </span>
                  <span className="text-xs text-plant-500 font-semibold">
                    %
                  </span>
                </>
              )}

            </div>
          </div>

          <p className="mt-3 text-sm font-medium text-white/65">
            {apiError
              ? 'Please upload another image'
              : complete
                ? 'Ready'
                : 'AI analysis in progress...'}
          </p>
        </div>

        {/* Timeline */}
        <div className="glass-card rounded-3xl border border-white/10 p-5 md:p-6">

          <div className="space-y-3">

            {phases.map((phase, i) => {
              const Icon = phase.icon;

              const isPast = i < currentPhase;
              const isCurrent = i === currentPhase;
              const isFuture = i > currentPhase;

              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 transition-all duration-500 ${
                    isFuture ? 'opacity-25' : 'opacity-100'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                      apiError && isCurrent
                        ? 'bg-red-500/10 border-red-500/30 text-red-400'
                        : isCurrent
                          ? 'bg-plant-500/15 border-plant-500/40 text-plant-500'
                          : isPast
                            ? 'bg-white/10 border-white/10 text-plant-500'
                            : 'bg-transparent border-white/10 text-white/30'
                    }`}
                  >
                    {isPast && !apiError ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>

                  <div className="flex-1">
                    <p
                      className={`text-sm font-display font-medium ${
                        isCurrent
                          ? 'text-white'
                          : isPast
                            ? 'text-white/70'
                            : 'text-white/30'
                      }`}
                    >
                      {phase.text}
                    </p>

                    {isCurrent && !complete && !apiError && (
                      <motion.div
                        className="h-0.5 mt-1 bg-gradient-to-r from-transparent via-plant-500 to-transparent"
                        animate={{
                          x: ['-100%', '100%']
                        }}
                        transition={{
                          duration: 1.4,
                          repeat: Infinity,
                          ease: 'linear'
                        }}
                      />
                    )}
                  </div>

                  {isPast && !apiError && (
                    <CheckCircle2 className="w-4 h-4 text-plant-500" />
                  )}
                </div>
              );
            })}

          </div>

          <div className="mt-5 pt-4 border-t border-white/5 text-center">
            <p className="text-[10px] text-white/25">
              PlantSathi is preparing your complete AI analysis.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}