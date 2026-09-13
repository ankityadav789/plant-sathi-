import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CloudRain, Sun, Wind, Thermometer, Leaf } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import GlowCard from './ui/GlowCard.jsx';
import LocationSelector from './ui/LocationSelector.jsx';
import { useAppContext } from '../context/AppContext.jsx';
import { plantService } from '../api/services.js';

export default function WeatherIntelligence({ apiData }) {
  const { t } = useTranslation();
  const { language, setLastScanResult } = useAppContext();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const weather = apiData?.weather;
  const waterAdvice = apiData?.doctorReport?.wateringAdvice;
  const smartInsights = apiData?.doctorReport?.smartInsights;

  useEffect(() => {
    if (!weather || weather.condition === 'Unavailable') {
      if (navigator.geolocation && !isRefreshing) {
        setIsRefreshing(true);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            handleLocationUpdate(pos.coords.latitude, pos.coords.longitude, 'Current Location');
          },
          () => setIsRefreshing(false)
        );
      }
    }
  }, []);

  // If no live data, show a graceful empty state
  if (!weather || weather.condition === 'Unavailable') {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
              <CloudRain className="w-7 h-7 text-white/90" />
            </div>
            <div>
              <h2 className="text-3xl font-display font-bold text-white/95">
                {t('weather.title')}
              </h2>
              <p className="text-white/40">
                {t('weather.subtitle')}
              </p>
            </div>
          </div>
          <LocationSelector 
            onLocationSelect={async (lat, lon, name) => {
              // Gracefully handle if missing lat/lon due to any API change
            }}
            currentLocationName={weather?.location}
            isRefreshing={false}
          />
        </div>
        <GlowCard>
          <div className="p-12 flex flex-col items-center justify-center text-center gap-4">
            <CloudRain className="w-14 h-14 text-white/20" />
            <p className="text-white/50 font-medium">
              Unable to fetch live weather.
            </p>
          </div>
        </GlowCard>
      </div>
    );
  }

  const isRainy = (weather?.condition ?? '').toLowerCase().includes('rain');

  const handleLocationUpdate = async (lat, lon, name) => {
    setIsRefreshing(true);
    try {
      const res = await plantService.refreshWeather(lat, lon, apiData);
      if (res.success) {
        setLastScanResult({
          ...apiData,
          weather: res.weather,
          doctorReport: res.doctorReport,
          water: res.water
        });
      }
    } catch (err) {
      console.error('Failed to refresh weather', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // We now use Groq's smartInsights instead of manually deriving tips

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
            <CloudRain className="w-7 h-7 text-white/90" />
          </div>
          <div>
            <h2 className="text-3xl font-display font-bold text-white/95">
              {t('weather.title')}
            </h2>
            <p className="text-white/40">
              {t('weather.subtitle')}
            </p>
          </div>
        </div>
        <LocationSelector 
          onLocationSelect={handleLocationUpdate}
          currentLocationName={weather?.location}
          isRefreshing={isRefreshing}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Current Weather Main Card */}
        <div className="lg:col-span-2">
          <GlowCard className="h-full">
            <div className="p-8 flex flex-col justify-between h-full relative overflow-hidden">

              {/* Animated Background */}
              {isRainy ? (
                <div className="absolute inset-0 pointer-events-none opacity-20">
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-0.5 h-4 bg-white/50 rounded-full"
                      style={{ left: `${Math.random() * 100}%`, top: -10 }}
                      animate={{ y: [0, 400], opacity: [0, 1, 0] }}
                      transition={{ duration: 0.5 + Math.random() * 0.5, repeat: Infinity, delay: Math.random() }}
                    />
                  ))}
                </div>
              ) : (
                <div className="absolute top-0 right-0 p-12 pointer-events-none opacity-30">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}>
                    <Sun className="w-32 h-32 text-yellow-400 blur-sm" />
                  </motion.div>
                </div>
              )}

              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-8">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 rounded-md bg-white/10 text-white/80 text-xs font-semibold">
                      {weather.location ?? t('weather.locationUnknown')}
                    </span>
                    <span className="px-2 py-1 rounded-md bg-aurora-blue/20 text-aurora-blue text-xs font-semibold">
                      {t('weather.liveData')}
                    </span>
                  </div>
                  <div className="text-7xl font-display font-bold text-white/95 mt-4">
                    {weather.temperature ?? '--'}°C
                  </div>
                  <div className="text-2xl font-display font-medium text-white/60 mt-1">
                    {weather.condition ?? '--'}
                  </div>
                  <p className="text-white/40 mt-3 text-sm max-w-sm">
                    {t('weather.humidity')} {weather?.humidity ?? '--'}% — {(weather?.humidity ?? 60) > 70 ? t('weather.waterNotNeeded') : t('weather.waterConsider')}
                  </p>
                  {weather?.lastUpdated && (
                    <p className="text-white/30 text-xs mt-4 italic">
                      Last updated: {new Date(weather.lastUpdated).toLocaleTimeString()}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05] min-w-[120px]">
                    <Thermometer className="w-5 h-5 text-orange-400 mb-2" />
                    <div className="text-white/40 text-xs mb-1 uppercase tracking-wider">
                      {t('weather.uvIndex')}
                    </div>
                    <div className="text-white/90 font-bold">{weather.uvIndex ?? '--'}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05] min-w-[120px]">
                    <CloudRain className="w-5 h-5 text-aurora-blue mb-2" />
                    <div className="text-white/40 text-xs mb-1 uppercase tracking-wider">
                      {t('weather.humidity')}
                    </div>
                    <div className="text-white/90 font-bold">{weather.humidity ?? '--'}%</div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05] min-w-[120px]">
                    <Wind className="w-5 h-5 text-white/70 mb-2" />
                    <div className="text-white/40 text-xs mb-1 uppercase tracking-wider">
                      {t('weather.windSpeed')}
                    </div>
                    <div className="text-white/90 font-bold">{weather.windSpeed ?? '--'} km/h</div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05] min-w-[120px]">
                    <div className="text-white/40 text-xs mb-1 uppercase tracking-wider">
                      Sunrise / Sunset
                    </div>
                    <div className="text-white/90 font-bold text-sm mb-1">{weather?.sunrise ?? '--'}</div>
                    <div className="text-white/60 font-medium text-xs">{weather?.sunset ?? '--'}</div>
                  </div>
                </div>
              </div>
            </div>
          </GlowCard>
        </div>

        {/* Smart Recommendations */}
        <div className="space-y-6">
          {waterAdvice && (
            <GlowCard glowColor="rgba(0,180,255,0.15)">
              <div className="p-6">
                <h3 className="text-lg font-display font-semibold text-white/90 mb-4 flex items-center gap-2">
                  <CloudRain className="w-5 h-5 text-aurora-blue" />
                  Smart Water Recommendation
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-white/60 text-sm">Water Today:</span>
                    <span className={`font-bold ${waterAdvice.waterToday === 'YES' ? 'text-aurora-blue' : 'text-orange-400'}`}>{waterAdvice.waterToday}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-white/60 text-sm">Quantity:</span>
                    <span className="text-white/90 font-medium">{waterAdvice.quantity}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-white/60 text-sm">Best Time:</span>
                    <span className="text-white/90 font-medium">{waterAdvice.bestTime}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-aurora-blue/5 border border-aurora-blue/20">
                    <span className="text-aurora-blue text-sm block mb-1">Reason:</span>
                    <span className="text-white/80 text-sm">{waterAdvice.reason}</span>
                  </div>
                </div>
              </div>
            </GlowCard>
          )}

          {smartInsights && (
            <GlowCard glowColor="rgba(0,230,118,0.15)">
              <div className="p-6">
                <h3 className="text-lg font-display font-semibold text-white/90 mb-4 flex items-center gap-2">
                  <Leaf className="w-5 h-5 text-plant-500" />
                  Smart Insights
                </h3>
                <div className="space-y-4">
                  {smartInsights.todaysChecklist && smartInsights.todaysChecklist.length > 0 && (
                    <div className="p-4 rounded-xl border border-plant-500/20 bg-plant-500/5">
                      <h4 className="font-display font-semibold text-plant-400 mb-2">Today's Care Checklist</h4>
                      <ul className="space-y-1">
                        {smartInsights.todaysChecklist.map((task, i) => (
                          <li key={i} className="text-white/70 text-sm flex items-start gap-2">
                            <span className="text-plant-500">✔</span> {task}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {smartInsights.tomorrowsAdvice && (
                    <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                      <h4 className="font-display font-semibold text-white/80 mb-1">Tomorrow's Advice</h4>
                      <p className="text-white/60 text-sm">{smartInsights.tomorrowsAdvice}</p>
                    </div>
                  )}
                  {smartInsights.weeklyCarePlan && (
                    <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                      <h4 className="font-display font-semibold text-white/80 mb-1">Weekly Care Plan</h4>
                      <p className="text-white/60 text-sm">{smartInsights.weeklyCarePlan}</p>
                    </div>
                  )}
                  {smartInsights.recoveryPrediction && (
                    <div className="p-4 rounded-xl border border-orange-400/20 bg-orange-400/5">
                      <h4 className="font-display font-semibold text-orange-400 mb-1">Recovery Prediction</h4>
                      <p className="text-white/60 text-sm">{smartInsights.recoveryPrediction}</p>
                    </div>
                  )}
                </div>
              </div>
            </GlowCard>
          )}
        </div>

      </div>
    </div>
  );
}
