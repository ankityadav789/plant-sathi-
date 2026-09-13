import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, TrendingUp, Sparkles, Leaf } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import GlowCard from './ui/GlowCard.jsx';
import { useAppContext } from '../context/AppContext.jsx';

export default function GrowthTimeline({ apiData }) {
  const { t } = useTranslation();
  const { gardenPlants, language } = useAppContext();

  // Use real scan history from garden (sorted by most recent)
  const scanHistory = gardenPlants
    .filter(p => p.scanDate)
    .slice(0, 8)
    .map(p => ({
      date: p.scanDate,
      type: p.disease ? 'Alert' : 'Scan',
      desc: p.disease
        ? t('timeline.diseaseDetected', { disease: p.disease })
        : t('timeline.scannedSuccess', { plant: p.nameEn ?? p.nameHi ?? 'Plant' }),
      health: p.health ?? 80,
    }));

  // Real AI insights from doctor report
  const insights = apiData?.doctorReport
    ? [
        apiData.doctorReport.summary && {
          title: t('timeline.aiHealthSummary'),
          color: 'text-aurora-teal',
          border: 'border-aurora-teal/20 bg-aurora-teal/5',
          body: apiData.doctorReport.summary,
        },
        apiData.doctorReport.recoveryPlan && {
          title: t('timeline.carePlan'),
          color: 'text-white/80',
          border: 'border-white/10 bg-white/5',
          body: apiData.doctorReport.recoveryPlan,
        },
        apiData.doctorReport.seasonalTips && {
          title: t('timeline.seasonalTips'),
          color: 'text-plant-400',
          border: 'border-plant-500/20 bg-plant-500/5',
          body: apiData.doctorReport.seasonalTips,
        },
      ].filter(Boolean)
    : [];

  const plantName = language === 'hi'
    ? (apiData?.plantId?.nameHi || apiData?.plantId?.nameEn || (language === 'hi' ? 'अज्ञात पौधा' : 'Unknown Plant'))
    : (apiData?.plantId?.nameEn || 'Unknown Plant');

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-plant-500/10 flex items-center justify-center">
          <Clock className="w-7 h-7 text-plant-500" />
        </div>
        <div>
          <h2 className="text-3xl font-display font-bold text-white/95">
            {t('timeline.title')}
          </h2>
          <p className="text-white/40">{apiData ? plantName : t('timeline.scanHistory')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Health Score Summary */}
        <GlowCard glowColor="rgba(0, 230, 118, 0.15)">
          <div className="p-6">
            <h3 className="font-display font-semibold text-white/90 text-lg mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-plant-500" />
              {t('timeline.healthStatus')}
            </h3>

            {apiData ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="text-5xl font-display font-bold text-plant-500">
                    {apiData.healthScore ?? 0}
                  </div>
                  <div>
                    <div className="text-white/80 font-medium">
                      {(apiData.healthScore ?? 0) >= 80
                        ? t('timeline.excellentHealth')
                        : (apiData.healthScore ?? 0) >= 60
                        ? t('timeline.goodHealth')
                        : t('timeline.needsCare')}
                    </div>
                    <div className="text-white/40 text-sm">/ 100</div>
                  </div>
                </div>

                <div className="relative h-3 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="absolute top-0 bottom-0 bg-gradient-to-r from-plant-500 to-aurora-teal rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${apiData.healthScore ?? 0}%` }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                  />
                </div>

                {/* Key metrics */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <div className="text-white/40 text-xs uppercase tracking-wider mb-1">
                      {t('timeline.idConfidence')}
                    </div>
                    <div className="text-white/90 font-bold">{apiData.plantId?.confidence ?? 0}%</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <div className="text-white/40 text-xs uppercase tracking-wider mb-1">
                      {t('timeline.diseaseRisk')}
                    </div>
                    <div className="text-white/90 font-bold">{apiData.disease?.severity ?? 'None'}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <div className="text-white/40 text-xs uppercase tracking-wider mb-1">
                      {t('timeline.waterStatus')}
                    </div>
                    <div className="text-white/90 font-bold text-xs">{apiData.water?.status ?? 'N/A'}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <div className="text-white/40 text-xs uppercase tracking-wider mb-1">
                      {t('timeline.aiGrade')}
                    </div>
                    <div className="text-plant-500 font-bold text-lg">{apiData.doctorReport?.overallGrade ?? 'N/A'}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
                <TrendingUp className="w-10 h-10 text-white/20" />
                <p className="text-white/40 text-sm">
                  {t('timeline.scanPrompt')}
                </p>
              </div>
            )}
          </div>
        </GlowCard>

        {/* AI Insights from Groq */}
        <GlowCard>
          <div className="p-6">
            <h3 className="font-display font-semibold text-white/90 text-lg mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-aurora-teal" />
              {t('timeline.aiInsights')}
            </h3>
            {insights.length > 0 ? (
              <div className="space-y-4">
                {insights.map((ins, i) => (
                  <div key={i} className={`p-4 rounded-xl border ${ins.border}`}>
                    <h4 className={`font-display font-semibold ${ins.color} mb-1`}>{ins.title}</h4>
                    <p className="text-white/60 text-sm leading-relaxed">{ins.body}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
                <Sparkles className="w-10 h-10 text-white/20" />
                <p className="text-white/40 text-sm">
                  {t('timeline.insightPrompt')}
                </p>
              </div>
            )}
          </div>
        </GlowCard>
      </div>

      {/* Scan History Log */}
      <h3 className="font-display font-bold text-xl text-white/90 mt-8 mb-4">
        {t('timeline.scanHistory')}
      </h3>
      {scanHistory.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {scanHistory.map((h, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05] transition-colors relative overflow-hidden group"
            >
              <div className={`absolute top-0 left-0 w-1 h-full ${h.type === 'Scan' ? 'bg-plant-500' : 'bg-red-500'}`} />
              <div className="flex justify-between items-start mb-2">
                <span className="text-white/40 text-xs font-semibold uppercase tracking-wider">{h.date}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-white/10 ${h.health >= 80 ? 'text-plant-500' : 'text-yellow-500'}`}>
                  {h.health}%
                </span>
              </div>
              <h4 className="font-display text-white/90 font-semibold mb-1">{h.type}</h4>
              <p className="text-white/50 text-sm leading-relaxed">{h.desc}</p>
            </motion.div>
          ))}
        </div>
      ) : (
        <GlowCard>
          <div className="p-12 flex flex-col items-center justify-center text-center gap-4">
            <Leaf className="w-14 h-14 text-white/20" />
            <p className="text-white/50 font-medium">
              {t('timeline.emptyHistory')}
            </p>
          </div>
        </GlowCard>
      )}
    </div>
  );
}
