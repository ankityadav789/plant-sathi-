import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Shield, CheckCircle2, ChevronRight, TestTube, Crosshair, ArrowRight, Activity, ThermometerSun, Leaf } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import GlowCard from './ui/GlowCard.jsx';

export default function DiseaseAnalysis({ apiData, scannedImage }) {
  const { t } = useTranslation();
  const disease = apiData?.disease || { status: 'Healthy', confidence: 0, name: 'None', severity: 'None', cause: 'No disease analysis available.' };
  const doctor = apiData?.doctorReport || {};

  const severityColors = {
    None: 'text-plant-500 bg-plant-500/10 border-plant-500/20',
    Low: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    Medium: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    High: 'text-red-500 bg-red-500/10 border-red-500/20',
  };

  const hasDisease = disease.status === 'Diseased';
  const displayImage = scannedImage || 'https://images.unsplash.com/photo-1597055974479-7ddcefa54a9d?auto=format&fit=crop&q=80&w=600';

  if (!hasDisease) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-plant-500/10 flex items-center justify-center">
            <Shield className="w-7 h-7 text-plant-500" />
          </div>
          <div>
            <h2 className="text-3xl font-display font-bold text-white/95">{t('disease.title')}</h2>
            <p className="text-white/40">{t('disease.subtitle')}</p>
          </div>
        </div>
        <GlowCard glowColor="rgba(0, 230, 118, 0.15)">
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
            <Leaf className="w-16 h-16 text-plant-500 mb-2" />
            <h3 className="text-2xl font-display font-bold text-white/90">{t('disease.healthy')}</h3>
            <p className="text-white/50 max-w-lg">
              {doctor.diseaseExplanation || disease.cause || t('disease.healthyDesc')}
            </p>
          </div>
        </GlowCard>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-yellow-500" />
        </div>
        <div>
          <h2 className="text-3xl font-display font-bold text-white/95">{t('disease.title')}</h2>
          <p className="text-white/40">{t('disease.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <GlowCard glowColor="rgba(251,191,36,0.15)">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-display font-bold text-white/90">{disease.status}</h3>
                  <p className="text-white/80 font-medium text-lg mt-1 text-yellow-400">{disease.name}</p>
                </div>
                <div className={`px-4 py-2 rounded-xl border font-semibold text-sm ${severityColors[disease.severity] || severityColors.Medium}`}>
                  {disease.severity} {t('disease.severity')}
                </div>
              </div>

              {/* Image comparison */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="relative group">
                  <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-black/60 backdrop-blur-md text-white/80 text-xs font-medium z-10 border border-white/10">{t('disease.yourPlant')}</div>
                  <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-white/5 border border-white/10">
                    <img src={displayImage} alt="User plant" className="w-full h-full object-cover" />
                    {/* Bounding box simulation over original image */}
                    <div className="absolute top-[20%] left-[30%] w-24 h-24 border-2 border-red-500/80 rounded-sm bg-red-500/10" />
                    <div className="absolute top-[20%] left-[30%] -translate-y-full px-2 py-1 bg-red-500 text-white text-[10px] font-bold rounded-t-sm">{t('disease.confidence', { val: disease.confidence })}</div>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-black/60 backdrop-blur-md text-white/80 text-xs font-medium z-10 border border-white/10">AI Reference</div>
                  <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center p-4">
                    <p className="text-white/30 text-center font-medium text-sm">Targeting Reference Pathogen Data...</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-display font-semibold text-white/80 flex items-center gap-2 mb-2"><Crosshair className="w-4 h-4 text-plant-500" /> {t('disease.aiExplanation')}</h4>
                <p className="text-white/60 text-sm leading-relaxed p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  {doctor.diseaseExplanation || 'Disease details unavailable.'}
                </p>
              </div>
            </div>
          </GlowCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <GlowCard blur>
            <div className="p-6">
              <h3 className="font-display font-semibold text-white/90 mb-4 flex items-center gap-2">
                <ThermometerSun className="w-5 h-5 text-orange-500" /> {t('disease.favorableConditions')}
              </h3>
              
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <div className="text-orange-500 font-semibold mb-1 text-sm">Possible Cause</div>
                  <div className="text-white/60 text-sm leading-relaxed">{disease.cause}</div>
                  
                </div>
              </div>
            </div>
          </GlowCard>

          <GlowCard>
            <div className="p-6">
              <h3 className="font-display font-semibold text-white/90 mb-4 flex items-center gap-2">
                <TestTube className="w-5 h-5 text-aurora-purple" /> {t('disease.medicinePrescriptions')}
              </h3>
              
              <div className="space-y-4">
                {(doctor.recommendations || []).filter(r => r.type?.toLowerCase().includes('treatment') || r.type?.toLowerCase().includes('prevention')).length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {doctor.recommendations
                      .filter(r => r.type?.toLowerCase().includes('treatment') || r.type?.toLowerCase().includes('prevention'))
                      .map((rec, i) => {
                        const isTreatment = rec.type?.toLowerCase().includes('treatment');
                        const color = isTreatment ? 'text-aurora-purple' : 'text-plant-500';
                        const bg = isTreatment ? 'bg-purple-500/10 border-purple-500/20' : 'bg-plant-500/10 border-plant-500/20';
                        
                        return (
                          <div key={i} className={`p-5 rounded-2xl border flex flex-col h-full shadow-lg ${bg}`}>
                            <div className="flex items-start gap-3 mb-3">
                              <div className={`p-2 rounded-xl bg-black/20 ${color}`}>
                                {isTreatment ? <TestTube className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                              </div>
                              <div>
                                <h4 className={`font-display font-bold text-sm ${color}`}>{rec.title}</h4>
                                <span className="text-[10px] uppercase tracking-wider font-semibold opacity-70 text-white/70">{rec.type}</span>
                              </div>
                            </div>
                            
                            <p className="text-white/80 text-sm font-medium mb-4 flex-1">
                              {rec.summary || rec.reason}
                            </p>

                            {(rec.quantity || rec.frequency) && (
                              <div className="flex items-center gap-4 text-xs font-semibold bg-black/20 p-2.5 rounded-xl mb-3">
                                {rec.quantity && <span className="text-white/90">⚖️ {rec.quantity}</span>}
                                {rec.frequency && <span className="text-white/90">⏱️ {rec.frequency}</span>}
                              </div>
                            )}

                            {rec.actionSteps?.length > 0 && (
                              <div className="space-y-1.5 mt-auto border-t border-white/5 pt-3">
                                {rec.actionSteps.map((step, idx) => (
                                  <div key={idx} className="flex gap-2 text-xs text-white/70 items-start">
                                    <span className={`flex-shrink-0 mt-0.5 ${color}`}>•</span>
                                    <span>{step}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {rec.warnings?.length > 0 && (
                              <div className="mt-4 space-y-2">
                                {rec.warnings.map((warn, idx) => (
                                  <div key={idx} className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 p-2 rounded-lg">
                                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                                    <span className="text-red-300 text-[10px] font-semibold leading-relaxed">{warn}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                    })}
                  </div>
                ) : (
                  <div className="text-white/40 text-sm italic">{t('disease.noTreatment')}</div>
                )}
              </div>
            </div>
          </GlowCard>
        </div>
      </div>
    </div>
  );
}
