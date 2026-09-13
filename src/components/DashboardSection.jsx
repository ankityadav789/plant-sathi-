import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Leaf, Droplets, Bug, Sun, TrendingUp, RotateCcw, CheckCircle2, Heart,  } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import GlowCard from './ui/GlowCard.jsx';
import CircularProgress from './ui/CircularProgress.jsx';
import TiltCard from './ui/TiltCard.jsx';
import { staggerContainer, staggerItem } from '../utils/animations.js';

// Import all the intelligence modules to stack them
import WateringGuide from './WateringGuide.jsx';
import DiseaseAnalysis from './DiseaseAnalysis.jsx';
import WeatherIntelligence from './WeatherIntelligence.jsx';
import ChatbotInterface from './ChatbotInterface.jsx';
import { useAppContext } from '../context/AppContext.jsx';

export default function DashboardSection({ onRescan, apiData, scannedImage }) {
  const { t } = useTranslation();
  const { language, addPlant, gardenPlants } = useAppContext();
  
  // Debug logging for data origin
  useEffect(() => {
    if (apiData) {
      console.log("[Dashboard] Loaded with apiData:", apiData);
      if (apiData._source === 'localStorage') {
        console.log("[Dashboard] Origin: Restored from LocalStorage");
      } else {
        console.log("[Dashboard] Origin: Fresh Scan or Active Context");
      }
    } else {
      console.log("[Dashboard] Loaded with undefined/null apiData");
    }
  }, [apiData]);

  const data = apiData || {};
  const plantName = language === 'hi'
    ? (data?.plantId?.nameHi || data?.plantId?.nameEn || 'Unknown Plant')
    : (data?.plantId?.nameEn || 'Unknown Plant');

  // Auto-save scan to My Garden when a real result arrives
  useEffect(() => {
    if (!apiData?.plantId?.nameEn) return;
    
    // Deduplication guard
    const scanDate = new Date().toLocaleDateString();
    const alreadyExists = gardenPlants.some(
      p => p.scanDate === scanDate && p.nameEn === apiData.plantId.nameEn
    );
    if (alreadyExists) return;

    const newPlant = {
      id: `scan_${Date.now()}`,
      nameEn: apiData.plantId.nameEn ?? 'Unknown',
      nameHi: apiData.plantId.nameHi ?? '',
      scientificName: apiData.plantId.scientificName ?? '',
      type: 'Indoor',
      health: apiData.healthScore ?? 0,
      nextWater: apiData.water?.nextWatering ?? 'Soon',
      sunlight: 'Indirect',
      img: scannedImage || '',
      alerts: (apiData.disease?.status === 'Diseased' && apiData.disease?.confidence >= 60) ? [apiData.disease.name] : [],
      scanDate: scanDate,
      disease: (apiData.disease?.status === 'Diseased' && apiData.disease?.confidence >= 60) ? apiData.disease.name : null,
    };
    addPlant(newPlant);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiData]);

  // Early return empty state if no scan data is present
  if (!apiData || !apiData.plantId) {
    return (
      <section className="min-h-screen pt-32 pb-32 px-4 md:px-6 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
          <Leaf className="w-10 h-10 text-white/20" />
        </div>
        <h2 className="text-3xl font-display font-bold text-white/95 mb-3">{t('dashboard.noScanData') || 'No Scan Data'}</h2>
        <p className="text-white/40 mb-8 max-w-md">
          {t('dashboard.pleaseScan') || 'We could not find any recent scan results. Please scan a plant to view its dashboard.'}
        </p>
        <button
          onClick={onRescan}
          className="px-8 py-4 rounded-xl font-display font-bold text-lg bg-plant-500 text-surface-900 shadow-glow flex items-center gap-2 hover:bg-plant-400 transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
          {t('nav.scan') || 'Scan Now'}
        </button>
      </section>
    );
  }

  return (
    <section className="min-h-screen pt-24 pb-32 px-4 md:px-6 space-y-24">
      {/* 1. Hero & Overview Section */}
      <div className="max-w-6xl mx-auto">
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
        >
          <div>
            <div className="badge badge-success mb-4 px-3 py-1.5 shadow-lg shadow-plant-500/10">
              <CheckCircle2 className="w-4 h-4" />
              {t('dashboard.analysisComplete')}
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-extrabold text-white/95 tracking-tight">
              {plantName}
            </h2>
            {/* If Hindi mode and Hindi name exists and is distinct, show English Name below it */}
            {language === 'hi' && data?.plantId?.nameHi && data.plantId.nameHi !== data.plantId.nameEn && (
              <p className="text-white/75 mt-1.5 font-display text-lg font-semibold">{data.plantId.nameEn}</p>
            )}
            {/* Scientific Name - Never Translated */}
            <p className="text-white/40 mt-1 font-body text-base italic">{data?.plantId?.scientificName || ''}</p>
            
            {/* Integration Status Panel */}
            {data.apiStatus && (
              <div className="flex flex-wrap gap-2 mt-4">
                <span className={`px-2 py-1 rounded-md text-xs font-semibold ${data.apiStatus.plantIdSuccess ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>PlantNet {data.apiStatus.plantIdSuccess ? '✅' : '❌'}</span>
                <span className={`px-2 py-1 rounded-md text-xs font-semibold ${data.apiStatus.diseaseSuccess ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>Disease CV {data.apiStatus.diseaseSuccess ? '✅' : '❌'}</span>
                <span className={`px-2 py-1 rounded-md text-xs font-semibold ${data.apiStatus.weatherSuccess ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>Weather {data.apiStatus.weatherSuccess ? '✅' : '❌'}</span>
                <span className={`px-2 py-1 rounded-md text-xs font-semibold ${data.apiStatus.groqSuccess ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>AI Doctor {data.apiStatus.groqSuccess ? '✅' : '❌'}</span>
              </div>
            )}
            {/* Low Confidence Warning Banner */}
            {data?.disease?.lowConfidenceWarning && (
              <div className="mt-3 flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-xl">
                <span className="text-yellow-300 text-xs font-semibold">{data.disease.lowConfidenceWarning}</span>
              </div>
            )}
          </div>
          <motion.button
            onClick={onRescan}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 text-white/80 hover:text-white border border-white/10 hover:bg-white/10 transition-all font-display font-medium cursor-pointer shadow-xl backdrop-blur-xl"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RotateCcw className="w-4 h-4" />
            {t('dashboard.newScan')}
          </motion.button>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {/* Main Hero Card */}
          <motion.div variants={staggerItem} className="md:col-span-2 lg:col-span-1 lg:row-span-2">
            <TiltCard>
              <GlowCard className="h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <Heart className="w-32 h-32 text-plant-500" />
                </div>
                <div className="p-8 flex flex-col items-center justify-center h-full gap-6 relative z-10">
                  <CircularProgress
                    value={data?.healthScore || 0}
                    size={220}
                    strokeWidth={16}
                    color="auto"
                    sublabel="/ 100"
                  />
                  <div className="text-center mt-4">
                    <p className="font-display font-bold text-white/95 text-2xl">
                      {data?.healthScore >= 70 ? t('dashboard.goodHealth') : t('dashboard.needsAttention')}
                    </p>
                    <p className="text-plant-500 font-medium mt-1">
                      {data?.healthScore >= 70 ? t('dashboard.minorIssues') : t('dashboard.actionRequired')}
                    </p>
                    {data?.doctorReport?.healthExplanation && (
                      <p className="text-white/60 text-xs mt-4 max-w-xs mx-auto leading-relaxed">
                        {data.doctorReport.healthExplanation}
                      </p>
                    )}
                  </div>
                </div>
              </GlowCard>
            </TiltCard>
          </motion.div>

          {/* Plant ID Card */}
          <motion.div variants={staggerItem}>
            <GlowCard>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-plant-500/10 flex items-center justify-center">
                    <Leaf className="w-6 h-6 text-plant-500" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-white/90 text-lg">{t('dashboard.aiConfidence')}</h3>
                    <p className="text-white/40 text-sm">{data?.plantId?.confidence || 0}{t('dashboard.match')}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(data?.plantId?.commonNames || []).map((name) => (
                    <span key={name} className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.05] text-white/60 text-sm font-medium">
                      {name}
                    </span>
                  ))}
                  {/* Show Top 3 Predictions */}
                  {data?.plantId?.otherMatches && data.plantId.otherMatches.slice(0, 3).map((match, idx) => (
                    <span key={idx} className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.05] text-white/60 text-sm font-medium">
                      {language === 'hi' && match.hindiName ? match.hindiName : match.englishName} ({match.confidence}%)
                    </span>
                  ))}
                  {/* Fallback if commonNames is missing but family exists */}
                  {!(data?.plantId?.commonNames?.length > 0) && data?.plantId?.family && (
                    <span className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.05] text-white/60 text-sm font-medium">
                      {t('dashboard.family')}: {data.plantId.family}
                    </span>
                  )}
                </div>
              </div>
            </GlowCard>
          </motion.div>

          {/* AI Plant Profile Grid */}
          <motion.div variants={staggerItem} className="grid grid-cols-2 gap-4">
            <div className="p-5 rounded-3xl bg-aurora-blue/5 border border-aurora-blue/10 flex flex-col items-center justify-center text-center">
               <Leaf className="w-6 h-6 text-aurora-blue mb-2" />
               <span className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-1">Category</span>
               <span className="text-white/90 font-bold text-sm">{data?.doctorReport?.plantCategory || 'Unknown'}</span>
            </div>
            <div className="p-5 rounded-3xl bg-plant-500/5 border border-plant-500/10 flex flex-col items-center justify-center text-center">
               <TrendingUp className="w-6 h-6 text-plant-500 mb-2" />
               <span className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-1">Family</span>
               <span className="text-white/90 font-bold text-sm">{data?.doctorReport?.plantFamily || data?.plantId?.family || 'Unknown'}</span>
            </div>
            <div className="p-5 rounded-3xl bg-yellow-500/5 border border-yellow-500/10 flex flex-col items-center justify-center text-center">
               <Bug className="w-6 h-6 text-yellow-500 mb-2" />
               <span className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-1">{t('dashboard.risk')}</span>
               <span className="text-yellow-500 font-bold text-sm">{data?.disease?.severity || 'None'}</span>
            </div>
            <div className="p-5 rounded-3xl bg-orange-400/5 border border-orange-400/10 flex flex-col items-center justify-center text-center">
               <Sun className="w-6 h-6 text-orange-400 mb-2" />
               <span className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-1">Native Region</span>
               <span className="text-white/90 font-bold text-sm">{data?.doctorReport?.nativeRegion || 'Unknown'}</span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <div className="max-w-6xl mx-auto h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Scanned Plant Image */}
      {scannedImage && (
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl overflow-hidden border border-white/10 aspect-video max-h-72"
          >
            <img src={scannedImage} alt={plantName} className="w-full h-full object-cover" />
          </motion.div>
        </div>
      )}

      <div className="max-w-6xl mx-auto h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* 2. Watering Guide */}
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, margin: "-100px" }}>
        <WateringGuide apiData={apiData} />
      </motion.div>

      <div className="max-w-6xl mx-auto h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* 3. Disease Analysis */}
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, margin: "-100px" }}>
        <DiseaseAnalysis apiData={apiData} scannedImage={scannedImage} />
      </motion.div>

      <div className="max-w-6xl mx-auto h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* 4. Weather Intelligence */}
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, margin: "-100px" }}>
        <WeatherIntelligence apiData={apiData} />
      </motion.div>

      <div className="max-w-6xl mx-auto h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* AI Doctor Chat */}
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, margin: "-100px" }}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-4">
            <h2 className="text-3xl font-display font-bold text-white/95">
              {t('dashboard.askAiDoctor')}
            </h2>
            <p className="text-white/40">
              {t('dashboard.moreQuestions')}
            </p>
          </div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-black overflow-hidden max-w-6xl mx-auto drop-shadow-2xl">
          <ChatbotInterface apiData={apiData} />
        </div>
      </motion.div>

    </section>
  );
}
