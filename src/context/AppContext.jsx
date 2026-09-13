import { createContext, useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
const AppContext = createContext();

export function AppProvider({ children }) {
  const { i18n } = useTranslation();
  
  // Local storage init for Garden
  const [gardenPlants, setGardenPlants] = useState(() => {
    const saved = localStorage.getItem('plantsathi_garden');
    if (saved) return JSON.parse(saved);
    return [];
  });

  // Local storage init for Language
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('plantsathi_lang') || 'en';
  });

  // Local storage init for Last Scan Result
  const [lastScanResult, setLastScanResult] = useState(() => {
    const saved = localStorage.getItem('plantsathi_last_scan');
    if (saved) return JSON.parse(saved);
    return null;
  });

  // Local storage init for Last Scanned Image
  const [lastScannedImage, setLastScannedImage] = useState(() => {
    return localStorage.getItem('plantsathi_last_image') || null;
  });

  // Sync Garden
  useEffect(() => {
    try {
      localStorage.setItem('plantsathi_garden', JSON.stringify(gardenPlants));
    } catch (e) {
      console.warn('Could not save garden to localStorage (quota exceeded).');
    }
  }, [gardenPlants]);

  // Sync Language
  useEffect(() => {
    localStorage.setItem('plantsathi_lang', language);
    i18n.changeLanguage(language);
  }, [language, i18n]);

  // Sync Last Scan Result
  useEffect(() => {
    if (lastScanResult) {
      try {
        localStorage.setItem('plantsathi_last_scan', JSON.stringify(lastScanResult));
      } catch (e) {
        console.warn('Could not save scan result to localStorage (quota exceeded).');
      }
    } else {
      localStorage.removeItem('plantsathi_last_scan');
    }
  }, [lastScanResult]);

  // Sync Last Scanned Image (with Quota limit guard)
  useEffect(() => {
    if (lastScannedImage) {
      try {
        localStorage.setItem('plantsathi_last_image', lastScannedImage);
      } catch (e) {
        console.warn('Could not save image to localStorage (quota exceeded). Image persistence across reloads may be lost.');
      }
    } else {
      localStorage.removeItem('plantsathi_last_image');
    }
  }, [lastScannedImage]);

  // Actions
  const addPlant = (plant) => {
    setGardenPlants(prev => [plant, ...prev]);
  };

  const removePlant = (id) => {
    setGardenPlants(prev => prev.filter(p => p.id !== id));
  };

  const editPlant = (id, updatedData) => {
    setGardenPlants(prev => prev.map(p => p.id === id ? { ...p, ...updatedData } : p));
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'hi' : 'en');
  };

  return (
    <AppContext.Provider value={{
      gardenPlants,
      addPlant,
      removePlant,
      editPlant,
      language,
      toggleLanguage,
      lastScanResult,
      setLastScanResult,
      lastScannedImage,
      setLastScannedImage
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
