import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Upload, Camera, Image as ImageIcon, X, Sparkles, AlertCircle } from 'lucide-react';
import RippleButton from './ui/RippleButton.jsx';

export default function ScanUploadSection({ onAnalyze }) {
  const { t } = useTranslation();
  const [mode, setMode] = useState(null); // 'camera', or 'preview'
  const [dragOver, setDragOver] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const [cameraStream, setCameraStream] = useState(null);

  const handleFileSelect = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target.result);
      setMode('preview');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setCameraStream(stream);
      setMode('camera');
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      alert('Unable to access camera. Please allow camera permissions or use upload instead.');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    setSelectedImage(canvas.toDataURL('image/jpeg', 0.9));
    stopCamera();
    setMode('preview');
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  };

  const reset = () => {
    setSelectedImage(null);
    setMode(null);
    stopCamera();
  };

  return (
    <section className="min-h-screen pt-24 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="badge badge-success mb-4 inline-flex">
            <Sparkles className="w-3.5 h-3.5" />
            {t('scan.aiScanner')}
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white/95">
            {t('scan.scanYourPlant').split(' ').map((word, i, arr) => 
               i === arr.length - 1 ? <span key={i} className="gradient-text">{word}</span> : word + ' '
            )}
          </h2>
          <p className="text-white/40 mt-3 max-w-lg mx-auto">
            {t('scan.subtitle')}
          </p>
        </motion.div>

        {/* Dynamic State Container */}
        <AnimatePresence mode="wait">
          
          {/* STATE 1: Mode Select (Upload vs Camera) */}
          {!mode && (
            <motion.div
              key="modeSelect"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto"
            >
              {/* Upload Card - Also an active dropzone */}
              <motion.div
                className={`glass-card p-8 flex flex-col items-center text-center gap-4 cursor-pointer border-2 transition-colors ${dragOver ? 'border-plant-500 bg-plant-500/10' : 'border-transparent'}`}
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  fileInputRef.current?.click();
                }}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <div className="w-16 h-16 rounded-2xl bg-plant-500/10 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-plant-500" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-white/90 text-lg">{t('scan.uploadPhoto')}</h3>
                  <p className="text-white/40 text-sm mt-1">{t('scan.dragDrop')}</p>
                </div>
              </motion.div>

              {/* Camera Card */}
              <motion.div
                className="glass-card p-8 flex flex-col items-center text-center gap-4 cursor-pointer border-2 border-transparent"
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.97 }}
                onClick={startCamera}
              >
                <div className="w-16 h-16 rounded-2xl bg-aurora-blue/10 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-aurora-blue" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-white/90 text-lg">{t('scan.liveCamera')}</h3>
                  <p className="text-white/40 text-sm mt-1">{t('scan.takeNew')}</p>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* STATE 2: Live Camera View */}
          {mode === 'camera' && (
            <motion.div
              key="cameraMode"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl mx-auto"
            >
              <div className="relative rounded-3xl overflow-hidden glass-card shadow-2xl bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full aspect-[4/3] md:aspect-video object-cover block"
                />
                
                {/* Close Button */}
                <button
                  onClick={reset}
                  className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/80 transition-colors border-none cursor-pointer z-10"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Target overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
                  <div className="w-full h-full max-w-sm max-h-sm border-2 border-dashed border-white/40 rounded-xl relative">
                     <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-black/50 px-3 py-1 rounded-full text-xs text-white backdrop-blur-md">{t('scan.positionPlant')}</span>
                  </div>
                </div>

                {/* Capture button */}
                <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                  <RippleButton
                    onClick={capturePhoto}
                    className="w-16 h-16 rounded-full bg-white text-plant-500 shadow-[0_0_20px_rgba(255,255,255,0.4)] flex items-center justify-center hover:scale-105 transition-transform"
                  >
                    <Camera className="w-7 h-7" />
                  </RippleButton>
                </div>
              </div>
            </motion.div>
          )}

          {/* STATE 3: Image Preview & Analyze */}
          {mode === 'preview' && selectedImage && (
            <motion.div
              key="previewMode"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl mx-auto flex flex-col gap-8 items-center"
            >
              {/* Image preview */}
              <div className="relative rounded-3xl overflow-hidden glass-card w-full aspect-video border-4 border-surface-800">
                <img
                  src={selectedImage}
                  alt="Plant Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={reset}
                  className="absolute top-4 right-4 p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-colors border-none cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none opacity-0 hover:opacity-100 transition-opacity flex items-end p-4">
                    <span className="text-white/80 text-sm flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" /> {t('scan.imageReady')}
                    </span>
                </div>
              </div>

              {/* Action Area */}
              <div className="flex flex-col w-full text-center">
                <div>
                  <h3 className="text-2xl font-display font-bold text-white/90 mb-2">{t('scan.readyToAnalyze')}</h3>
                  <p className="text-white/40 text-sm mb-6 leading-relaxed max-w-md mx-auto">
                    {t('scan.analyzeDesc')}
                  </p>
                  
                  <div className="bg-white/5 p-4 rounded-xl flex items-center justify-center gap-3 border border-white/5 mb-8 text-left max-w-md mx-auto">
                     <AlertCircle className="w-5 h-5 text-plant-500 shrink-0" />
                     <p className="text-white/50 text-xs leading-relaxed">
                       {t('scan.warningLighting')}
                     </p>
                  </div>

                  <RippleButton 
                    onClick={() => onAnalyze(selectedImage)}
                    className="w-full max-w-md mx-auto py-4 rounded-xl font-display font-bold text-lg bg-plant-500 text-surface-900 flex justify-center items-center gap-2 hover:bg-plant-400 transition-colors shadow-glow"
                  >
                     <Sparkles className="w-5 h-5" />
                     {t('scan.analyzeBtn')}
                  </RippleButton>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files[0])}
        />
        
      </div>
    </section>
  );
}
