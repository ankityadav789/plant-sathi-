import { motion } from 'framer-motion';
import { Droplets, CloudRain, Sun, Wind, Cloudy, Thermometer, CloudLightning, Gauge } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import GlowCard from './ui/GlowCard.jsx';
import CircularProgress from './ui/CircularProgress.jsx';

export default function WateringGuide({ apiData }) {
  const { t } = useTranslation();
  // Pull watering data from recommendations array or legacy fields
  const hydrationText = apiData?.water?.status || '';
  const recommendations = apiData?.doctorReport?.recommendations || [];
  const wateringRec = recommendations.find(r => r.type?.toLowerCase().includes('water'));
  const wateringAdvice = wateringRec || apiData?.water?.advice || apiData?.doctorReport?.wateringAdvice || '';
  const waterAmount = wateringRec?.quantity || apiData?.doctorReport?.waterAmount;
  const nextWatering = wateringRec?.frequency || apiData?.doctorReport?.nextWateringTime;
  
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-aurora-blue/10 flex items-center justify-center">
          <Droplets className="w-7 h-7 text-aurora-blue" />
        </div>
        <div>
          <h2 className="text-3xl font-display font-bold text-white/95">{t('watering.title')}</h2>
          <p className="text-white/40">{t('watering.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Main Hydration Meter */}
        <GlowCard className="lg:col-span-1" glowColor="rgba(59, 130, 246, 0.2)">
          <div className="p-8 flex flex-col items-center justify-center text-center h-full relative overflow-hidden">
            {/* Animated droplets bg */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-aurora-blue"
                  initial={{ y: -20, opacity: 0, x: Math.random() * 200 - 100 }}
                  animate={{ y: 300, opacity: [0, 1, 0] }}
                  transition={{ duration: 2 + Math.random(), repeat: Infinity, delay: Math.random() * 2 }}
                />
              ))}
            </div>

            <CircularProgress
              value={apiData?.healthScore || 0}
              size={200}
              strokeWidth={14}
              color="#3b82f6"
              sublabel={t('watering.optimalLevels')}
            />
            <h3 className="font-display font-bold text-white/90 text-xl mt-6">{hydrationText}</h3>
          </div>
        </GlowCard>

        {/* AI Recommendations */}
        <GlowCard className="lg:col-span-2">
          <div className="p-8 h-full">
            <h3 className="font-display font-semibold text-white/90 text-lg mb-6 flex items-center gap-2">
              <CloudRain className="w-5 h-5 text-aurora-blue" />
              {t('watering.aiRecommendations')}
            </h3>
            
            <div className="grid grid-cols-1 gap-6">
              {wateringAdvice && (
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex flex-col gap-4">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-plant-500/10 flex items-center justify-center flex-shrink-0">
                      <Droplets className="w-5 h-5 text-plant-500" />
                    </div>
                    <div>
                      <h4 className="font-display font-semibold text-white/90 mb-1">{t('watering.waterToday')}</h4>
                      <p className="text-white/50 text-sm leading-relaxed">
                        {typeof wateringAdvice === 'object' ? wateringAdvice.reason || wateringAdvice.quantity : wateringAdvice}
                      </p>
                    </div>
                  </div>
                  
                  {(waterAmount || nextWatering) && (
                    <div className="mt-2 pt-4 border-t border-white/5 flex gap-12">
                      {nextWatering && (
                        <div>
                          <p className="text-white/40 text-[10px] uppercase tracking-wider font-semibold mb-1">{t('results.schedule')}</p>
                          <p className="text-white/80 text-sm font-medium">{nextWatering}</p>
                        </div>
                      )}
                      {waterAmount && (
                        <div>
                          <p className="text-white/40 text-[10px] uppercase tracking-wider font-semibold mb-1">{t('results.quantity')}</p>
                          <p className="text-white/80 text-sm font-medium">{waterAmount}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </GlowCard>

      </div>
    </div>
  );
}
