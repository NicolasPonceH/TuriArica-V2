import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, Volume2, VolumeX } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const API_BASE = 'http://localhost:5000/api';

const QUICK_PROMPTS = [
  '🚌 ¿Qué micro me lleva a Playa El Laucho?',
  '🏛️ ¿Dónde están las momias Chinchorro?',
  '🌤️ ¿Cómo está el clima hoy en Arica?',
  '🍽️ ¿Dónde probar comida típica en el Agro?',
  '🏄‍♂️ ¿Qué playas son aptas para surf o bodyboard?'
];

export default function AssistantModal({ onClose }) {
  const { t } = useLanguage();

  const [messages, setMessages] = useState([
    {
      text: '¡Hola! Soy tu asistente turístico de Arica y Parinacota. Conozco los lugares patrimoniales, playas, horarios, cómo llegar en microbús y el clima en tiempo real.\n\n¿En qué te puedo orientar hoy?',
      isBot: true
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Reproducir audio con Text-to-Speech
  const handleSpeak = (text, idx) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingIdx === idx) {
      window.speechSynthesis.cancel();
      setSpeakingIdx(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_`]/g, '').replace(/\[.*?\]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'es-CL';
    utterance.onend = () => setSpeakingIdx(null);
    utterance.onerror = () => setSpeakingIdx(null);
    setSpeakingIdx(idx);
    window.speechSynthesis.speak(utterance);
  };

  // Enviar mensaje con Streaming SSE conectando al Backend
  const handleSend = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || isTyping) return;

    // Agregar mensaje de usuario
    setMessages(prev => [...prev, { text: query, isBot: false }]);
    setInput('');
    setIsTyping(true);

    // Preparar mensaje bot vacío para streaming progresivo
    setMessages(prev => [...prev, { text: '', isBot: true, isStreaming: true }]);

    try {
      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: query,
          stream: true
        })
      });

      if (!res.ok) {
        throw new Error(`Servidor respondió con código ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulated = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const raw = decoder.decode(value, { stream: true });
        const lines = raw.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') {
              break;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.chunk) {
                accumulated += parsed.chunk;
                setMessages(prev => {
                  const copy = [...prev];
                  const last = copy[copy.length - 1];
                  if (last && last.isBot) {
                    last.text = accumulated;
                  }
                  return copy;
                });
              }
            } catch {
              // Continuar
            }
          }
        }
      }

      // Marcar streaming completado
      setMessages(prev => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last && last.isBot) {
          last.isStreaming = false;
          if (!last.text) {
            last.text = 'No tengo suficiente información para responder eso con certeza.';
          }
        }
        return copy;
      });
      setIsTyping(false);
    } catch (err) {
      console.warn('[AI FALLBACK CLIENT]', err);
      setTimeout(() => {
        setMessages(prev => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last && last.isBot) {
            last.isStreaming = false;
            last.text = `No tengo suficiente información para responder eso con certeza en este momento.`;
          }
          return copy;
        });
        setIsTyping(false);
      }, 500);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-3 sm:p-6 bg-slate-950/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 50, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", damping: 26, stiffness: 320 }}
        onClick={e => e.stopPropagation()}
        className="glass-modal w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[650px] max-h-[90vh] border border-white/80 relative text-slate-800"
      >
        {/* Header oficial limpio sin mención a modelos de IA ni botón de reinicio */}
        <div className="glass-panel px-5 py-3.5 flex justify-between items-center border-b border-white/60 z-10 sticky top-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-sky-600 flex items-center justify-center text-white shadow-md shadow-brand-500/25">
              <Bot size={22} />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-slate-900 leading-tight">
                Asistente Turístico de Arica
              </h3>
              <p className="text-xs text-slate-500 font-semibold flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Guía oficial · En línea</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
              title="Cerrar asistente"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4 bg-slate-50/60">
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex gap-3 max-w-[88%] ${m.isBot ? 'self-start' : 'self-end flex-row-reverse'}`}
              >
                {m.isBot && (
                  <div className="w-8 h-8 shrink-0 rounded-xl bg-gradient-to-br from-brand-500 to-sky-600 flex items-center justify-center text-white shadow-sm mt-auto mb-1">
                    <Bot size={16} />
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <div
                    className={`p-4 text-xs sm:text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                      m.isBot
                        ? 'bg-white border border-slate-200/80 text-slate-800 rounded-2xl rounded-bl-sm font-medium'
                        : 'bg-brand-500 text-white rounded-2xl rounded-br-sm font-semibold shadow-brand-500/20'
                    }`}
                  >
                    {m.text || (m.isStreaming ? 'Consultando información oficial...' : '')}
                  </div>

                  {m.isBot && m.text && !m.isStreaming && (
                    <div className="flex items-center gap-2 px-1">
                      <button
                        onClick={() => handleSpeak(m.text, i)}
                        className="text-[11px] text-slate-500 hover:text-brand-600 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {speakingIdx === i ? <VolumeX size={13} className="text-red-500" /> : <Volume2 size={13} />}
                        <span>{speakingIdx === i ? 'Detener voz' : 'Escuchar'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {isTyping && messages[messages.length - 1]?.text === '' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="self-start flex gap-3 max-w-[85%]"
              >
                <div className="w-8 h-8 shrink-0 rounded-xl bg-brand-500 flex items-center justify-center text-white shadow-sm mt-auto mb-1">
                  <Bot size={16} />
                </div>
                <div className="bg-white border border-slate-200/80 p-3.5 rounded-2xl rounded-bl-sm flex items-center gap-1.5 shadow-sm h-10">
                  <motion.div className="w-2 h-2 bg-brand-400 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} />
                  <motion.div className="w-2 h-2 bg-brand-500 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} />
                  <motion.div className="w-2 h-2 bg-brand-600 rounded-full" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts Bar */}
        <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0">Preguntas frecuentes:</span>
          {QUICK_PROMPTS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              disabled={isTyping}
              className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-800 border border-sky-100 hover:bg-sky-100 hover:border-sky-200 whitespace-nowrap transition-colors shrink-0 cursor-pointer disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-3 sm:p-4 glass-panel border-t border-white/60 pb-safe">
          <div className="flex items-center gap-2 glass-pill rounded-2xl p-1.5 pr-2 border border-slate-200/80 focus-within:border-brand-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-100 transition-all">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Haz tu consulta sobre Arica (ej: ¿Cómo llegar al Morro en micro?)"
              className="flex-1 bg-transparent px-3 py-2 outline-none text-slate-800 text-xs sm:text-sm placeholder-slate-400"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              className={`p-2.5 sm:p-3 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                input.trim() && !isTyping
                  ? 'bg-gradient-to-r from-accent-500 to-amber-500 hover:from-accent-600 hover:to-amber-600 text-white shadow-md shadow-orange-500/20'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
