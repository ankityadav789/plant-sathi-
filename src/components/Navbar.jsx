import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Leaf, Scan, BarChart3, Menu, X, Droplets, CloudRain, MessageSquare, Thermometer, ShieldAlert, Award, Grid, Clock, Calendar, LineChart, Bell, Globe } from 'lucide-react';
import { useAppContext } from '../context/AppContext.jsx';

export default function Navbar({ currentView, setCurrentView }) {
  const { t } = useTranslation();
  const { language, toggleLanguage, gardenPlants } = useAppContext();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopMoreOpen, setDesktopMoreOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const primaryNavItems = [
    { id: 'home', label: t('nav.home'), icon: Leaf },
    { id: 'scan', label: t('nav.scan'), icon: Scan },
    { id: 'dashboard', label: t('nav.dashboard'), icon: BarChart3 },
    { id: 'garden', label: t('nav.garden'), icon: Grid },
  ];

  const secondaryNavItems = [
    { id: 'disease', label: t('nav.disease'), icon: ShieldAlert },
    { id: 'watering', label: t('nav.watering'), icon: Droplets },
    { id: 'weather', label: t('nav.weather'), icon: CloudRain },
    { id: 'timeline', label: t('nav.timeline'), icon: Clock },
    { id: 'calendar', label: t('nav.calendar'), icon: Calendar },
    { id: 'analytics', label: t('nav.analytics'), icon: LineChart },
    { id: 'sustainability', label: t('nav.sustainability'), icon: Thermometer },
    { id: 'chatbot', label: t('nav.chatbot'), icon: MessageSquare },
    { id: 'profile', label: t('nav.profile'), icon: Award },
  ];

  const renderNavItem = (item, isMobile = false) => {
    const Icon = item.icon;
    const isActive = currentView === item.id;
    return (
      <motion.button
        key={item.id}
        onClick={() => {
          setCurrentView(item.id);
          if (isMobile) setMobileOpen(false);
          setDesktopMoreOpen(false);
        }}
        className={`relative ${isMobile ? 'px-4 py-3 flex-row w-full' : 'px-4 py-2'} rounded-xl text-sm font-medium font-display flex items-center gap-3 transition-all duration-300 border-none cursor-pointer ${
          isActive
            ? 'text-plant-500 bg-plant-500/10'
            : 'text-white/60 hover:text-white hover:bg-white/5'
        }`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Icon className="w-4 h-4" />
        {item.label}
        {isActive && !isMobile && (
          <motion.div
            layoutId="navIndicator"
            className="absolute bottom-0 left-3 right-3 h-0.5 bg-plant-500 rounded-full"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        )}
      </motion.button>
    );
  };

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled || mobileOpen
            ? 'bg-surface-600/90 backdrop-blur-2xl border-b border-white/[0.06] shadow-lg shadow-black/40'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <motion.button
            onClick={() => setCurrentView('home')}
            className="flex items-center gap-2.5 group cursor-pointer bg-transparent border-none shrink-0"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-plant-500 to-aurora-teal flex items-center justify-center shadow-glow-sm group-hover:shadow-glow transition-shadow duration-300">
              <Leaf className="w-5 h-5 text-surface-900" />
            </div>
            <span className="text-lg font-display font-bold text-white/90 group-hover:text-white transition-colors hidden sm:block">
              Plant<span className="gradient-text">Sathi</span>
            </span>
          </motion.button>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {primaryNavItems.map(item => renderNavItem(item))}
            
            <div className="relative">
              <motion.button
                onClick={() => setDesktopMoreOpen(!desktopMoreOpen)}
                className={`relative px-4 py-2 rounded-xl text-sm font-medium font-display flex items-center gap-2 transition-all duration-300 border-none cursor-pointer ${
                  secondaryNavItems.some(item => item.id === currentView)
                    ? 'text-plant-500 bg-plant-500/10'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Menu className="w-4 h-4" />
                {t('nav.more')}
              </motion.button>

              <AnimatePresence>
                {desktopMoreOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full mt-2 right-0 w-64 bg-surface-600/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden p-2 grid gap-1"
                  >
                    {secondaryNavItems.map(item => renderNavItem(item, true))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Language Toggle */}
            <motion.button
              onClick={toggleLanguage}
              className="ml-2 px-3 py-2 rounded-xl text-sm font-bold font-display flex items-center gap-2 transition-all duration-300 border border-white/10 cursor-pointer bg-white/5 text-white/70 hover:text-white hover:bg-white/10"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Globe className="w-4 h-4" />
              {language === 'en' ? 'HI' : 'EN'}
            </motion.button>

            {/* Notifications */}
            <div className="relative ml-1">
              <motion.button
                onClick={() => { setNotificationsOpen(!notificationsOpen); setDesktopMoreOpen(false); }}
                className="relative p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all duration-300 border-none cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-surface-600" />
              </motion.button>

              <AnimatePresence>
                {notificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full mt-2 right-0 w-80 bg-surface-600/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden p-4"
                  >
                    <div className="flex justify-between items-center mb-4">
                       <h3 className="text-white/95 font-display font-semibold">{t('nav.notifications')}</h3>
                       <span className="text-xs text-white/40 cursor-pointer hover:text-white">{t('nav.markAllRead')}</span>
                    </div>
                    <div className="space-y-3">
                       {gardenPlants.filter(p => p.alerts && p.alerts.length > 0).length > 0 ? (
                         gardenPlants.filter(p => p.alerts && p.alerts.length > 0).map((plant, i) => (
                           <div key={i} className="flex gap-3">
                              <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                                 <ShieldAlert className="w-4 h-4 text-yellow-500" />
                              </div>
                              <div>
                                 <p className="text-sm text-white/90 font-medium">{plant.alerts[0]}</p>
                                 <p className="text-xs text-white/40 mt-0.5">{language === 'hi' ? plant.nameHi || plant.nameEn : plant.nameEn}</p>
                              </div>
                              {i === 0 && <div className="w-2 h-2 rounded-full bg-yellow-500 ml-auto mt-1" />}
                           </div>
                         ))
                       ) : (
                         <div className="text-white/40 text-sm py-4 text-center">{t('nav.noNotifications')}</div>
                       )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Mobile: Language + Profile + Menu */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleLanguage}
              className="p-2 rounded-xl text-white/60 hover:text-white bg-white/5 border border-white/10 text-xs font-bold cursor-pointer"
            >
              {language === 'en' ? 'हिं' : 'EN'}
            </button>
            <button
              className="p-2 rounded-xl text-white/60 hover:text-white bg-white/5 border border-white/10 cursor-pointer"
              onClick={() => {
                setCurrentView('profile');
                setMobileOpen(false);
              }}
            >
              <Award className="w-5 h-5" />
            </button>
            <button
              className="p-2 rounded-xl text-white/60 hover:text-white bg-white/5 border border-white/10 cursor-pointer"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu fullscreen overlay */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: '100vh' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden absolute top-[64px] left-0 right-0 overflow-y-auto bg-surface-600/95 backdrop-blur-2xl border-t border-white/[0.06] pb-24"
            >
              <div className="p-4 flex flex-col gap-1">
                <div className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-2 mt-4 px-2">
                  {t('nav.mainMenu')}
                </div>
                {primaryNavItems.map(item => renderNavItem(item, true))}
                
                <div className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-2 mt-6 px-2">
                  {t('nav.proFeatures')}
                </div>
                {secondaryNavItems.map(item => renderNavItem(item, true))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
      
      {/* Click outside overlay for desktop menus */}
      {(desktopMoreOpen || notificationsOpen) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => { setDesktopMoreOpen(false); setNotificationsOpen(false); }}
        />
      )}
    </>
  );
}
