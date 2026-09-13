import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Navbar from './components/Navbar.jsx';
import HeroSection from './components/HeroSection.jsx';
import ScanUploadSection from './components/ScanUploadSection.jsx';
import DashboardSection from './components/DashboardSection.jsx';
import ProcessingScreen from './components/ProcessingScreen.jsx';
import SplashScreen from "./components/SplashScreen";
import MyGarden from './components/MyGarden.jsx';
import DiseaseAnalysis from './components/DiseaseAnalysis.jsx';
import WateringGuide from './components/WateringGuide.jsx';
import WeatherIntelligence from './components/WeatherIntelligence.jsx';
import GrowthTimeline from './components/GrowthTimeline.jsx';
import Sustainability from './components/Sustainability.jsx';
import ChatbotInterface from './components/ChatbotInterface.jsx';
import ProfilePage from './components/ProfilePage.jsx';
import PlantCareCalendar from './components/PlantCareCalendar.jsx';
import AnalyticsPage from './components/AnalyticsPage.jsx';
import ResultsPage from './components/ResultsPage.jsx';
import FloatingParticles from './components/FloatingParticles.jsx';
import { plantService } from './api/services.js';
import { useAppContext } from './context/AppContext.jsx';

const pageMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
};
export default function App() {
  const { t } = useTranslation();
  const { lastScanResult, setLastScanResult, lastScannedImage, setLastScannedImage } = useAppContext();
  
  const [currentView, setCurrentView] = useState('home');
  const [apiError, setApiError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingStartedAt, setProcessingStartedAt] = useState(null);

  // States to coordinate processing animation and api request
    const [apiRequestDone, setApiRequestDone] = useState(false);



  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView]);

  useEffect(() => {
    if (currentView !== 'processing' || !apiRequestDone) {
      return;
    }

    // ProcessingScreen handles the small completion animation.
    // Navigation happens through handleProcessingComplete().
  }, [currentView, apiRequestDone]);

  
  
  const handleAnalyze = async (imageDataUrl) => {
  setLastScannedImage(imageDataUrl || null);
  setCurrentView('processing');
  setApiError(null);
  setLastScanResult(null);
  setApiRequestDone(false);
  setProcessingStartedAt(Date.now());

    try {
      const response = await plantService.analyzePlant(imageDataUrl);
      setLastScanResult(response.data);
    } catch (err) {
      console.error('[Analysis Error]', err);
      setApiError(err.message || 'Unable to analyze the image.');
    } finally {
      setApiRequestDone(true);
    }
  };

  const handleProcessingComplete = () => {
  if (apiError) {
    alert(`Analysis Error: ${apiError}`);

    setApiRequestDone(false);
    setApiError(null);
    setProcessingStartedAt(null);
    setCurrentView('scan');
    return;
  }

  setApiRequestDone(false);
  setApiError(null);
  setProcessingStartedAt(null);
  setCurrentView('result');
};

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HeroSection onGetStarted={() => setCurrentView('scan')} />;
      case 'scan':
        return <ScanUploadSection onAnalyze={handleAnalyze} />;
      case 'processing':
        return (
          <ProcessingScreen
            image={lastScannedImage}
            apiRequestDone={apiRequestDone}
            apiError={apiError}
            processingStartedAt={processingStartedAt}
            onComplete={handleProcessingComplete}
          />
        );
      case 'result':
        return <ResultsPage onNavigate={setCurrentView} image={lastScannedImage} apiData={lastScanResult} />;
      case 'dashboard':
        return <DashboardSection onRescan={() => setCurrentView('scan')} apiData={lastScanResult} scannedImage={lastScannedImage} />;
      case 'garden':
        return <div className="pt-24 pb-20 px-4"><MyGarden /></div>;
      case 'disease':
        return <div className="pt-24 pb-20 px-4"><DiseaseAnalysis apiData={lastScanResult} scannedImage={lastScannedImage} /></div>;
      case 'watering':
        return <div className="pt-24 pb-20 px-4"><WateringGuide apiData={lastScanResult} /></div>;
      case 'weather':
        return <div className="pt-24 pb-20 px-4"><WeatherIntelligence apiData={lastScanResult} /></div>;
      case 'timeline':
        return <div className="pt-24 pb-20 px-4"><GrowthTimeline apiData={lastScanResult} /></div>;
      case 'sustainability':
        return <div className="pt-24 pb-20 px-4"><Sustainability apiData={lastScanResult} /></div>;
      case 'chatbot':
        return <div className="pt-24 pb-20 px-4"><ChatbotInterface apiData={lastScanResult} /></div>;
      case 'profile':
        return <div className="pt-24 pb-20 px-4"><ProfilePage /></div>;
      case 'calendar':
        return <PlantCareCalendar />;
      case 'analytics':
        return <div className="pt-24 pb-20 px-4"><AnalyticsPage /></div>;
      default:
        return <HeroSection onGetStarted={() => setCurrentView('scan')} />;
    }
  };

  return (
    <>
      <AnimatePresence>
        {isLoading && (
          <SplashScreen onFinish={() => setIsLoading(false)} />
        )}
      </AnimatePresence>

      <div className="aurora-bg" />
      <FloatingParticles />

      <div className="relative z-10 min-h-screen">
        <Navbar currentView={currentView} setCurrentView={setCurrentView} />

        <AnimatePresence mode="wait">
          <motion.div key={currentView} {...pageMotion}>
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}
