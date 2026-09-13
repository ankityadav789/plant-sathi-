import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Mic, User, Bot, Leaf, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { plantService } from '../api/services.js';
import { useAppContext } from '../context/AppContext.jsx';

function formatChatMessage(content = '') {
  return String(content)
    // Remove bold / italic markers
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')

    // Remove Markdown headings
    .replace(/^#{1,6}\s*/gm, '')

    // Remove horizontal rules
    .replace(/^[-*_]{3,}\s*$/gm, '')

    // Convert simple Markdown bullets to clean bullets
    .replace(/^\s*[-*]\s+/gm, '• ')

    // Remove HTML line breaks
    .replace(/<br\s*\/?>/gi, '\n')

    // Remove accidental table separators
    .replace(/^\s*\|?[\s:-]+\|[\s|:-]*$/gm, '')

    // Clean excessive blank lines
    .replace(/\n{3,}/g, '\n\n')

    .trim();
}

export default function ChatbotInterface({ apiData }) {
  const { t } = useTranslation();
  const { language } = useAppContext();

  const greeting = t('chatbot.greeting');

  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', content: greeting }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef(null);

  const suggestedQuestions = [t('chatbot.q1'), t('chatbot.q2'), t('chatbot.q3')];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // If language changes, update first greeting message
  useEffect(() => {
    setMessages(prev => {
      const updated = [...prev];
      if (updated[0]?.role === 'assistant') {
        updated[0] = { ...updated[0], content: greeting };
      }
      return updated;
    });
  }, [language]);

  const handleSend = async (text) => {
    const val = (text || inputVal).trim();
    if (!val) return;

    const userMessage = { id: Date.now(), role: 'user', content: val };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputVal('');
    setIsTyping(true);

    // Build history for the API (exclude the first greeting for context efficiency)
    const historyForApi = newMessages
      .slice(1) // skip initial greeting
      .map(m => ({ role: m.role, content: m.content }));

    try {
      const result = await plantService.chatWithPlantSathi(historyForApi, apiData || null, language);
      const botReply = result?.reply ?? t('chatbot.error');
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: botReply }]);
    } catch {
      const errMsg = "AI Doctor is temporarily unavailable.";
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: errMsg }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col pt-8">
      {/* Chat header */}
      <div className="flex items-center gap-4 mb-6 px-4">
        <div className="w-12 h-12 rounded-full bg-plant-500/20 flex items-center justify-center p-1 relative border border-plant-500/30">
          <div className="absolute inset-0 rounded-full bg-plant-500/20 blur-sm" style={{ position: 'absolute' }} />
          <Bot className="w-6 h-6 text-plant-500 relative z-10" />
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-surface-900 z-20" />
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold text-white/95 leading-none">Veda</h2>
          <p className="text-white/40 text-sm mt-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            {t('chatbot.online')}
          </p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 scrollbar-none pb-4 flex flex-col gap-6">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-white/10' : 'bg-plant-500/20 border border-plant-500/30'}`}>
                {msg.role === 'user' ? <User className="w-4 h-4 text-white/80" /> : <Leaf className="w-4 h-4 text-plant-500" />}
              </div>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-plant-500 text-surface-900 rounded-tr-none font-medium'
                  : 'bg-white/5 border border-white/10 text-white/90 rounded-tl-none'
              }`}>
                {formatChatMessage(msg.content)
                  .split('\n')
                  .map((line, index) => {
                    const text = line.trim();

                    if (!text) {
                      return <div key={index} className="h-2" />;
                    }

                    return (
                      <p key={index} className="mb-2 last:mb-0">
                        {text}
                      </p>
                    );
                  })}
              </div>
            </motion.div>
          ))}

          {isTyping && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex gap-3 max-w-[85%]"
            >
              <div className="w-8 h-8 rounded-full bg-plant-500/20 border border-plant-500/30 flex-shrink-0 flex items-center justify-center">
                <Leaf className="w-4 h-4 text-plant-500" />
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 rounded-tl-none flex items-center gap-1.5 h-[52px]">
                <motion.div className="w-1.5 h-1.5 bg-plant-500 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
                <motion.div className="w-1.5 h-1.5 bg-plant-500 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} />
                <motion.div className="w-1.5 h-1.5 bg-plant-500 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={endRef} />
      </div>

      {/* Quick Action Buttons */}
      {!isTyping && (
        <div className="px-4 mb-4 flex gap-2 overflow-x-auto scrollbar-none pb-2">
          {[
            '🌿 Why is my plant unhealthy?',
            '💧 Water Recommendation',
            '🌱 Fertilizer Advice',
            '🦠 Disease Treatment',
            '☀ Sunlight Guide',
            '📅 7-Day Care Plan'
          ].map((q, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              onClick={() => handleSend(q)}
              className="px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 cursor-pointer text-left"
            >
              {q}
            </motion.button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="px-4">
        <div className="flex gap-2 items-center p-2 rounded-2xl bg-white/5 border border-white/10 focus-within:border-plant-500/50 transition-colors backdrop-blur-xl shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
          <button className="p-3 text-white/40 hover:text-plant-500 transition-colors rounded-xl hover:bg-plant-500/10 cursor-pointer">
            <Plus className="w-5 h-5" />
          </button>
          <input
            type="text"
            placeholder={t('chatbot.placeholder')}
            className="flex-1 bg-transparent border-none outline-none text-white/90 placeholder-white/30 text-sm font-body px-2 h-12"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isTyping && handleSend()}
          />
          <button className="p-3 text-aurora-blue/60 hover:text-aurora-blue transition-colors rounded-xl hover:bg-aurora-blue/10 cursor-pointer">
            <Mic className="w-5 h-5" />
          </button>
          <button
            className={`p-3 rounded-xl transition-all cursor-pointer ${inputVal.trim() && !isTyping ? 'bg-plant-500 text-surface-900 shadow-[0_0_15px_rgba(0,230,118,0.3)]' : 'bg-white/10 text-white/40 cursor-not-allowed'}`}
            onClick={() => handleSend()}
            disabled={!inputVal.trim() || isTyping}
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </div>
        <p className="text-center text-[10px] text-white/30 mt-3 uppercase tracking-widest font-medium">
          {t('chatbot.disclaimer')}
        </p>
      </div>
    </div>
  );
}
