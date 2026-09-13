import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Leaf, Droplets, Bug, AlertCircle, FileText, CheckCircle2, LayoutDashboard, RotateCcw, ChevronDown, Sun, Sparkles, Activity } from 'lucide-react';
import RippleButton from './ui/RippleButton.jsx';
import GlowCard from './ui/GlowCard.jsx';
import { useAppContext } from '../context/AppContext.jsx';

const DISEASE_CONFIDENCE_THRESHOLD = 60;

export default function ResultsPage({ onNavigate, image, apiData }) {
  const { t } = useTranslation();
  const { addPlant, language } = useAppContext();
  const [showOtherMatches, setShowOtherMatches] = useState(false);

  // Fallback to empty object if API fails or is not available
  const data = apiData || {};
  const disease = data?.disease || { confidence: 0, name: 'Unavailable', status: 'Unavailable', severity: 'None' };
  const doctor = data?.doctorReport || {};

  const isHealthy = (data?.healthScore || 0) >= 70;
  const plantName = language === 'hi' ? (data?.plantId?.nameHi || data?.plantId?.nameEn || 'Unknown Plant') : (data?.plantId?.nameEn || 'Unknown Plant');
  const diseaseConfident = disease?.status === 'Diseased' && disease?.confidence >= DISEASE_CONFIDENCE_THRESHOLD;

  const displayImage = image || 'https://images.unsplash.com/photo-1620125861117-735954388836?auto=format&fit=crop&q=80&w=800';

  const formattedDiseaseName = (disease?.name || '')
    .replace(/___/g, " — ")
    .replace(/_/g, " ");

  const handleSaveReport = () => {
    const newPlant = {
      id: Date.now(),
      nameEn: data?.plantId?.nameEn || 'Unknown Plant',
      nameHi: data?.plantId?.nameHi || '',
      scientificName: data?.plantId?.scientificName || '',
      type: 'Indoor',
      health: data?.healthScore || 0,
      nextWater: 'Today',
      sunlight: 'Indirect',
      img: displayImage,
      alerts: diseaseConfident ? [data?.disease?.name] : [],
      scanDate: new Date().toLocaleDateString(),
      disease: diseaseConfident ? data?.disease?.name : null,
    };
    addPlant(newPlant);
    alert(language === 'hi' ? 'रिपोर्ट सहेजी गई और बगीचे में जोड़ी गई!' : 'Report saved and added to My Garden!');
  };

  const generateRecommendation = () => {
    const name = data?.plantId?.nameEn || 'Plant';
    const parts = [];

    if (isHealthy) {
      parts.push(`Your ${name} is in good health (${data?.healthScore || 0}%).`);
    } else {
      parts.push(`Your ${name} needs attention — health score is ${data?.healthScore || 0}%.`);
    }

    if (diseaseConfident) {
      parts.push(`We detected ${data?.disease?.name} (${data?.disease?.confidence}% confidence, severity: ${data?.disease?.severity}). Treat with appropriate fungicide or neem oil.`);
    } else {
      parts.push('No significant disease was detected.');
    }

    parts.push(`Water with approximately ${data?.water?.amount || '200ml'} and keep in bright indirect light. Wipe leaves regularly to maximize photosynthesis.`);

    return parts.join(' ');
  };

  return (
    <section className="min-h-screen pt-24 pb-32 px-6">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl font-display font-bold text-white/95 mb-2">{t('results.scanComplete')}</h2>
          <p className="text-white/40">{t('results.reviewAi')}</p>
        </motion.div>

        {/* 1. Uploaded Plant Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl overflow-hidden glass-card aspect-video border-[4px] border-surface-800"
        >
          <img
            src={displayImage}
            alt="Scanned Plant"
            className="w-full h-full object-cover"
            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1620125861117-735954388836?auto=format&fit=crop&q=80&w=800'; }}
          />
        </motion.div>

        {/* 2. Plant Information */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <GlowCard>
            <div className="p-6 text-center">
              <h3 className="text-3xl font-display font-bold text-white/95 mb-1">{plantName}</h3>
              {language === 'hi' && data?.plantId?.nameHi && data.plantId.nameHi !== data.plantId.nameEn && (
                <p className="text-white/75 font-display text-base font-semibold mb-1">{data.plantId.nameEn}</p>
              )}
              <p className="text-white/40 italic mb-4">{data?.plantId?.scientificName || 'Unknown Species'}</p>
              {data?.plantId?.confidence < 40 && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold mb-2">
                  <AlertCircle className="w-4 h-4" />
                  Low confidence - Results may be less accurate.
                </div>
              )}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-plant-500/10 border border-plant-500/20 text-plant-500 text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                {t('results.confidence', { val: data?.plantId?.confidence || 0 })}
              </div>
            </div>
          </GlowCard>

          {/* Other Possible Matches Accordion */}
          {data?.plantId?.otherMatches && data.plantId.otherMatches.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setShowOtherMatches(!showOtherMatches)}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <div className="font-display font-semibold text-white/80">{t('results.otherMatches')}</div>
                <motion.div animate={{ rotate: showOtherMatches ? 180 : 0 }}>
                  <ChevronDown className="w-5 h-5 text-white/50" />
                </motion.div>
              </button>
              <AnimatePresence>
                {showOtherMatches && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-3 space-y-3">
                      {data.plantId.otherMatches.map((match, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] flex justify-between items-center">
                          <div>
                            <div className="text-white/90 font-medium font-display">{match.englishName}</div>
                            <div className="text-white/40 italic text-sm">{match.scientificName}</div>
                          </div>
                          <div className="px-3 py-1 rounded-full bg-white/5 text-white/60 text-xs font-semibold">
                            {match.confidence}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

        </motion.div>

        {/* Info Grid */}
        <div className="grid md:grid-cols-2 gap-6">

                      {/* 3. Health Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <GlowCard className="h-full">
                <div className="p-6">

                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-plant-500/10 flex items-center justify-center">
                      <Leaf className="w-5 h-5 text-plant-500" />
                    </div>

                    <h3 className="font-display font-semibold text-white/90">
                      {t('results.healthStatus')}
                    </h3>
                  </div>

                  {/* Score */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-2xl font-bold font-display text-white">
                      {isHealthy
                        ? t('results.healthy')
                        : t('results.needsAttention')}
                    </div>

                    <div
                      className={`text-lg font-bold ${
                        isHealthy ? 'text-green-400' : 'text-yellow-400'
                      }`}
                    >
                      {data.healthScore}%
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full"
                      style={{
                        width: `${data.healthScore}%`,
                        backgroundColor: isHealthy
                          ? '#00e676'
                          : '#fbbf24'
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${data.healthScore}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  </div>

                  {/* Why this score */}
                  {data?.healthBreakdown && (
                    <div className="mt-6 pt-4 border-t border-white/5">

                      <div className="flex items-center gap-2 mb-4">
                        <Activity className="w-4 h-4 text-plant-500" />
                        <span className="text-sm font-semibold text-white/80">
                          Why this score?
                        </span>
                      </div>

                      <div className="space-y-4">

                        {[
                          {
                            key: 'disease',
                            label: 'Disease Assessment',
                            max: 40
                          },
                          {
                            key: 'speciesConfidence',
                            label: 'Species Confidence',
                            max: 30
                          },
                          {
                            key: 'weather',
                            label: 'Weather',
                            max: 15
                          },
                          {
                            key: 'water',
                            label: 'Water',
                            max: 15
                          }
                        ].map((factor) => {
                          const item = data.healthBreakdown[factor.key];

                          if (!item) return null;

                          const percentage = Math.min(
                            100,
                            Math.max(
                              0,
                              (item.weightedScore / factor.max) * 100
                            )
                          );

                          return (
                            <div key={factor.key}>

                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-white/60">
                                  {factor.label}
                                </span>

                                <span className="text-xs text-white/80 font-semibold">
                                  {item.weightedScore} / {factor.max}
                                </span>
                              </div>

                              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                  className="h-full rounded-full bg-plant-500"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percentage}%` }}
                                  transition={{ duration: 0.7 }}
                                />
                              </div>

                              <p className="text-[10px] text-white/35 mt-1.5 leading-relaxed">
                                {item.reason}
                              </p>

                            </div>
                          );
                        })}

                      </div>

                      <div className="mt-4 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">
                            Calculated Score
                          </span>

                          <span className="text-sm font-bold text-plant-500">
                            {data.healthBreakdown.total}/100
                          </span>
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              </GlowCard>
            </motion.div>

          {/* 4. Disease Detection */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <GlowCard className="h-full" glowColor={disease.confidence >= 80 ? "rgba(239, 68, 68, 0.15)" : disease.confidence >= 60 ? "rgba(251, 191, 36, 0.15)" : "rgba(0, 230, 118, 0.15)"}>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${disease.confidence >= 80 ? 'bg-red-500/10' : disease.confidence >= 60 ? 'bg-yellow-500/10' : 'bg-plant-500/10'}`}>
                    <Bug className={`w-5 h-5 ${disease.confidence >= 80 ? 'text-red-500' : disease.confidence >= 60 ? 'text-yellow-500' : 'text-plant-500'}`} />
                  </div>
                  <h3 className="font-display font-semibold text-white/90">{t('results.diseaseDetection')}</h3>
                </div>

                {/* Low Confidence Warning */}
                {disease.lowConfidenceWarning && (
                  <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-xl mb-4">
                    <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <span className="text-yellow-300 text-xs font-semibold">{disease.lowConfidenceWarning}</span>
                  </div>
                )}

                {disease.confidence >= 60 ? (
                  <>
                    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
                      <Bug className="w-4 h-4 text-red-400" />
                      <span className="text-red-300 font-semibold">
                        {formattedDiseaseName}
                      </span>
                    </div>
                     <div className="mt-4 flex flex-col space-y-2">
                       <p className="text-white/60 text-sm font-medium">
                         Plant Status: <span className="text-white font-bold">{disease.status}</span>
                       </p>
                       <p className="text-white/60 text-sm font-medium">
                         {t('results.severity')}: <span className="text-white/80 font-semibold">{disease.severity}</span>
                       </p>
                       <p className="text-white/40 text-xs font-medium">
                         {typeof disease.confidence === 'number' ? disease.confidence.toFixed(2) : disease.confidence}% Confidence Score
                       </p>
                     </div>
                  </>
                ) : (
                  <div className="text-sm font-medium text-plant-500 leading-relaxed max-w-[220px]">{disease.status || 'Healthy'}</div>
                )}

                {/* Model Source Badge
                 {disease.modelSource && (
                   <div className="mt-4 pt-3 border-t border-white/5">
                     <span className="text-[10px] text-white/25 font-semibold uppercase tracking-wider">Model: {disease.modelSource}</span>
                   </div>
                 )} */}
              </div>
            </GlowCard>
          </motion.div>
        </div>

        {/* 5. Water Recommendation */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <GlowCard glowColor="rgba(59, 130, 246, 0.15)">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-aurora-blue/10 flex items-center justify-center">
                  <Droplets className="w-5 h-5 text-aurora-blue" />
                </div>
                <h3 className="font-display font-semibold text-white/90">{t('results.waterRecommendation')}</h3>
              </div>

              <div className="bg-white/[0.03] p-4 rounded-xl border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/40 text-sm mb-1 uppercase tracking-wider font-semibold">{t('results.waterToday')}</p>
                    <p className="text-xl font-bold text-white">{t('results.yes')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/40 text-sm mb-1 uppercase tracking-wider font-semibold">{t('results.quantity')}</p>
                    <p className="text-xl font-bold text-aurora-blue">{data.water?.amount || 'N/A'}</p>
                  </div>
                </div>

                {data.water?.nextWatering && (
                  <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-white/40 text-[10px] uppercase tracking-wider font-semibold">{t('results.schedule')}</p>
                      <p className="text-sm font-medium text-white/80">{data.water.nextWatering}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/40 text-[10px] uppercase tracking-wider font-semibold">{t('results.frequency')}</p>
                      <p className="text-sm font-medium text-white/80">{data.water.frequency}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </GlowCard>
        </motion.div>

        {/* 6. AI Recommendation (Groq Plant Doctor) */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <GlowCard glowColor="rgba(0,230,118,0.12)">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-plant-500/10 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-plant-500" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-white/90">{t('results.aiCareAdvice')}</h3>
                  {doctor.overallGrade ? (
                    <span className="text-xs text-plant-500 font-bold">Grade: {doctor.overallGrade}</span>
                  ) : (
                    <span className="text-xs text-red-500 font-bold">Unavailable</span>
                  )}
                </div>
              </div>

              {/* Main summary */}
              <p className="text-white/70 leading-relaxed bg-plant-500/5 p-4 rounded-xl border border-plant-500/10 font-medium mb-4">
                {doctor.summary || generateRecommendation()}
              </p>

              {/* Beautiful Modern Recommendation Cards Grid */}
              {(doctor.recommendations || []).length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  {doctor.recommendations.map((rec, i) => {
                    const isWater = rec.type?.toLowerCase().includes('water');
                    const isSun = rec.type?.toLowerCase().includes('sun');
                    const isFert = rec.type?.toLowerCase().includes('fertilizer');

                    const Icon = isWater ? Droplets : isSun ? Sun : isFert ? Leaf : Sparkles;
                    const color = isWater ? 'text-blue-400' : isSun ? 'text-orange-400' : isFert ? 'text-plant-500' : 'text-purple-400';
                    const bg = isWater ? 'bg-blue-500/10 border-blue-500/20' : isSun ? 'bg-orange-500/10 border-orange-500/20' : isFert ? 'bg-plant-500/10 border-plant-500/20' : 'bg-purple-500/10 border-purple-500/20';

                    return (
                      <div key={i} className={`p-5 rounded-2xl border flex flex-col h-full shadow-lg ${bg}`}>
                        <div className="flex items-start gap-3 mb-3">
                          <div className={`p-2 rounded-xl bg-black/20 ${color}`}>
                            <Icon className="w-5 h-5" />
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
                                <AlertCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                                <span className="text-red-300 text-[10px] font-semibold leading-relaxed">{warn}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </GlowCard>
        </motion.div>

        {/* Navigation Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid gap-3 pt-6"
        >
          <RippleButton
            onClick={() => onNavigate('dashboard')}
            className="w-full py-4 rounded-2xl font-display font-bold text-lg bg-white hover:bg-gray-100 text-surface-900 shadow-glow flex items-center justify-center gap-2 transition-colors"
          >
            <LayoutDashboard className="w-5 h-5" />
            {t('results.viewDashboard')}
          </RippleButton>

          <RippleButton
            onClick={() => onNavigate('scan')}
            className="w-full py-4 rounded-2xl font-display font-bold text-lg bg-plant-500/20 hover:bg-plant-500/30 text-plant-400 border border-plant-500/30 flex items-center justify-center gap-2 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            {t('results.scanAnother')}
          </RippleButton>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={handleSaveReport} className="w-full py-3 rounded-xl font-display font-semibold bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center gap-2">
              <FileText className="w-4 h-4" /> {t('results.saveReport')}
            </button>
            <button onClick={() => onNavigate('home')} className="w-full py-3 rounded-xl font-display font-semibold bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-center">
              {t('results.goHome')}
            </button>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
