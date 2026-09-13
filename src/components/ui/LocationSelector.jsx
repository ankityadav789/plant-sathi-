import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, Navigation, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function LocationSelector({ onLocationSelect, currentLocationName, isRefreshing }) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (val) => {
    setQuery(val);
    if (val.length < 3) {
      setResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(val)}&count=5&language=en&format=json`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      console.error('Geocoding error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const selectLocation = (lat, lon, name) => {
    onLocationSelect(lat, lon, name);
    setIsOpen(false);
    setQuery('');
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      selectLocation(pos.coords.latitude, pos.coords.longitude, 'Current Location');
    }, () => {
      alert(t('weather.locationDenied') || 'Location permission denied. Please search manually.');
    });
  };

  return (
    <div className="relative z-50" ref={containerRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        disabled={isRefreshing}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-xs font-semibold transition-colors disabled:opacity-50"
      >
        {isRefreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4 text-aurora-blue" />}
        {currentLocationName || t('weather.locationUnknown') || 'Unknown Location'}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full right-0 md:left-0 mt-2 w-72 bg-surface-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl"
          >
            <div className="p-3">
              <div className="relative">
                <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  autoFocus
                  placeholder={t('weather.searchCity') || 'Search city...'} 
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-sm text-white/90 focus:outline-none focus:border-aurora-blue/50 transition-colors"
                />
              </div>

              <button 
                onClick={useCurrentLocation}
                className="w-full mt-2 flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-aurora-blue/10 flex items-center justify-center">
                  <Navigation className="w-4 h-4 text-aurora-blue" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white/90">{t('weather.currentLocation') || 'Current Location'}</div>
                  <div className="text-xs text-white/40">Use GPS</div>
                </div>
              </button>

              {query.length >= 3 && (
                <div className="mt-2 border-t border-white/5 pt-2 max-h-48 overflow-y-auto scrollbar-none">
                  {isSearching ? (
                    <div className="text-center py-4 text-white/40 text-xs">Searching...</div>
                  ) : results.length > 0 ? (
                    results.map((res) => (
                      <button 
                        key={res.id}
                        onClick={() => selectLocation(res.latitude, res.longitude, res.name)}
                        className="w-full flex flex-col px-3 py-2 rounded-xl hover:bg-white/5 transition-colors text-left"
                      >
                        <span className="text-sm font-semibold text-white/90">{res.name}</span>
                        <span className="text-xs text-white/40">{res.admin1 ? `${res.admin1}, ` : ''}{res.country}</span>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-4 text-white/40 text-xs">No cities found.</div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
