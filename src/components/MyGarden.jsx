import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Grid, Search, Plus, Filter, Droplets, Sun, AlertTriangle, X, Trash2, Eye, Edit3, Leaf } from 'lucide-react';
import { useAppContext } from '../context/AppContext.jsx';

export default function MyGarden() {
  const { t } = useTranslation();
  const { gardenPlants, removePlant, editPlant, language } = useAppContext();

  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [viewPlant, setViewPlant] = useState(null);

  const getHealthColor = (h) => h > 80 ? 'bg-plant-500' : h > 50 ? 'bg-yellow-500' : 'bg-red-500';
  const getHealthColorText = (h) => h > 80 ? 'text-plant-500' : h > 50 ? 'text-yellow-500' : 'text-red-500';

  const getPlantName = (plant) => {
    if (language === 'hi') return plant.nameHi || plant.nameEn;
    return plant.nameEn;
  };

  const filtered = gardenPlants
    .filter(p => {
      if (filter === 'All') return true;
      if (filter === 'Indoor') return p.type === 'Indoor';
      if (filter === 'Outdoor') return p.type === 'Outdoor';
      if (filter === 'Needs Attention') return p.health < 80;
      if (filter === 'Healthy') return p.health >= 80;
      if (filter === 'Diseased') return p.alerts && p.alerts.length > 0;
      return true;
    })
    .filter(p => {
      const q = search.toLowerCase();
      return (p.nameEn || '').toLowerCase().includes(q) || 
             (p.nameHi || '').toLowerCase().includes(q) ||
             (p.scientificName || '').toLowerCase().includes(q);
    });

  const handleDelete = (id) => {
    removePlant(id);
    setDeleteConfirm(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-plant-500/10 flex items-center justify-center">
            <Grid className="w-7 h-7 text-plant-500" />
          </div>
          <div>
            <h2 className="text-3xl font-display font-bold text-white/95">{t('garden.myGarden')}</h2>
            <p className="text-white/40">{t('garden.tracking', { count: gardenPlants.length })}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input 
               type="text"
               placeholder={t('garden.search')}
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-white/90 focus:outline-none focus:border-plant-500/50 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { key: 'All', label: t('garden.filters.all') },
          { key: 'Indoor', label: t('garden.filters.indoor') },
          { key: 'Outdoor', label: t('garden.filters.outdoor') },
          { key: 'Healthy', label: language === 'hi' ? 'स्वस्थ' : 'Healthy' },
          { key: 'Diseased', label: language === 'hi' ? 'रोगग्रस्त' : 'Diseased' },
          { key: 'Needs Attention', label: t('garden.filters.needsAttention') },
        ].map(f => (
          <button 
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
              filter === f.key ? 'bg-white/15 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/80'
            }`}
          >
            {f.key === 'Needs Attention' && <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />}
            {f.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filtered.map(plant => (
            <motion.div
              layout
              key={plant.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="group relative rounded-3xl overflow-hidden bg-white/[0.02] border border-white/[0.05] hover:border-plant-500/30 transition-colors"
            >
              <div className="aspect-[4/3] w-full overflow-hidden relative">
                <img 
                  src={plant.img} 
                  alt={plant.nameEn} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1620125861117-735954388836?auto=format&fit=crop&q=80&w=400'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-900 via-transparent to-transparent opacity-80" />
                
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className={`px-2 py-1 rounded-md bg-black/60 backdrop-blur-md text-xs font-bold border border-white/10 ${getHealthColorText(plant.health)}`}>
                    {t('garden.health', { val: plant.health })}
                  </span>
                  <span className="px-2 py-1 rounded-md bg-black/60 backdrop-blur-md text-xs font-semibold border border-white/10 text-white/80">
                    {plant.type}
                  </span>
                </div>

                {plant.alerts && plant.alerts.length > 0 && (
                  <div className="absolute top-4 right-4 flex flex-col gap-1 items-end">
                    {plant.alerts.map(a => (
                      <span key={a} className="px-2 py-1 rounded-md bg-red-500/80 backdrop-blur-md text-[10px] font-bold text-white shadow-lg">
                        {a}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-5 flex flex-col gap-4">
                <div>
                  <h3 className="font-display font-bold text-lg text-white/95">{getPlantName(plant)}</h3>
                  {plant.scientificName && (
                    <p className="text-white/30 text-xs italic mt-0.5">{plant.scientificName}</p>
                  )}
                  {plant.scanDate && (
                    <p className="text-white/25 text-[10px] mt-1">Scanned: {plant.scanDate}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 rounded-xl p-3 flex items-start gap-3 border border-white/[0.05]">
                    <Droplets className="w-4 h-4 text-aurora-blue mt-0.5" />
                    <div>
                      <div className="text-[10px] text-white/40 uppercase tracking-widest font-semibold mb-0.5">{t('garden.water')}</div>
                      <div className="text-sm font-medium text-white/90">{plant.nextWater}</div>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 flex items-start gap-3 border border-white/[0.05]">
                    <Sun className="w-4 h-4 text-yellow-400 mt-0.5" />
                    <div>
                      <div className="text-[10px] text-white/40 uppercase tracking-widest font-semibold mb-0.5">{t('garden.light')}</div>
                      <div className="text-sm font-medium text-white/90">{plant.sunlight}</div>
                    </div>
                  </div>
                </div>

                {/* Health Bar */}
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-white/40">{t('garden.overallScore')}</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full ${getHealthColor(plant.health)} rounded-full`} style={{ width: `${plant.health}%` }} />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => setViewPlant(plant)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors text-xs font-semibold cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> {t('garden.view')}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(plant.id)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white/5 border border-white/10 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors text-xs font-semibold cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
      
      {filtered.length === 0 && (
         <div className="text-center py-20 text-white/40">{t('garden.empty')}</div>
      )}

      {/* Delete Confirmation Overlay */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="glass-card p-8 max-w-sm w-full text-center space-y-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <h3 className="text-xl font-display font-bold text-white/95 mb-2">
                  {t('garden.removeConfirmTitle')}
                </h3>
                <p className="text-white/40 text-sm">
                  {t('garden.removeConfirmDesc')}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-colors font-semibold cursor-pointer"
                >
                  {t('garden.cancel')}
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors cursor-pointer"
                >
                  {t('garden.delete')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Plant Detail Overlay */}
      <AnimatePresence>
        {viewPlant && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setViewPlant(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-card p-0 max-w-lg w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative aspect-video">
                <img 
                  src={viewPlant.img} 
                  alt={viewPlant.nameEn} 
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1620125861117-735954388836?auto=format&fit=crop&q=80&w=800'; }}
                />
                <button
                  onClick={() => setViewPlant(null)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white border-none cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute inset-0 bg-gradient-to-t from-surface-900 via-transparent to-transparent" />
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-2xl font-display font-bold text-white/95">{getPlantName(viewPlant)}</h3>
                  {viewPlant.scientificName && (
                    <p className="text-white/40 italic text-sm">{viewPlant.scientificName}</p>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                    <div className="text-[10px] text-white/40 uppercase tracking-widest font-semibold mb-1">{t('garden.water')}</div>
                    <div className="text-sm font-bold text-white/90">{viewPlant.nextWater}</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                    <div className="text-[10px] text-white/40 uppercase tracking-widest font-semibold mb-1">{t('garden.light')}</div>
                    <div className="text-sm font-bold text-white/90">{viewPlant.sunlight}</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                    <div className="text-[10px] text-white/40 uppercase tracking-widest font-semibold mb-1">{t('garden.healthLabel')}</div>
                    <div className={`text-sm font-bold ${getHealthColorText(viewPlant.health)}`}>{viewPlant.health}%</div>
                  </div>
                </div>
                {viewPlant.alerts && viewPlant.alerts.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {viewPlant.alerts.map(a => (
                      <span key={a} className="px-3 py-1 rounded-lg bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/30">{a}</span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
