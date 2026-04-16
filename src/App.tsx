import { useState, useEffect, useRef } from 'react';
import { MicOff, Loader2, Volume2, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { AudioStreamer } from './lib/audioUtils';
import { Header } from './components/Header';

import { AppState, TranscriptionMsg, PERSONAS, PersonaKey } from './types';

export default function App() {
  const [appState, setAppState] = useState<AppState>('idle');
  const [selectedPersona, setSelectedPersona] = useState<PersonaKey>('expert');
  const [customTraits, setCustomTraits] = useState('');
  const [transcriptions, setTranscriptions] = useState<TranscriptionMsg[]>([]);
  const [vadThreshold, setVadThreshold] = useState(-45);
  const [currentVolume, setCurrentVolume] = useState(-100);
  const [sessionId, setSessionId] = useState('');
  const streamerRef = useRef<AudioStreamer | null>(null);
  const transcriptionsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (streamerRef.current) {
        streamerRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (transcriptionsEndRef.current) {
      transcriptionsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcriptions]);

  const toggleConnection = async () => {
    if (appState !== 'idle' && appState !== 'error') {
      // Disconnect
      streamerRef.current?.stop();
      streamerRef.current = null;
      setAppState('idle');
      return;
    }

    setAppState('connecting');
    setTranscriptions([]); // Clear previous transcriptions
    setSessionId(Math.random().toString(36).substring(7).toUpperCase());
    try {
      const streamer = new AudioStreamer();
      streamerRef.current = streamer;

      streamer.onStateChange = (state) => {
        setAppState(state);
      };

      streamer.onVolumeChange = (db) => {
        setCurrentVolume(db);
      };

      streamer.vadThreshold = vadThreshold;

      streamer.onTranscription = (role, text, finished) => {
        setTranscriptions(prev => {
          const last = prev[prev.length - 1];
          // If the last message is from the same role and not finished, append to it
          if (last && last.role === role && !last.finished) {
            const updated = [...prev];
            updated[updated.length - 1] = { ...last, text: last.text + text, finished };
            return updated;
          } else {
            // Create a new message
            return [...prev, { id: Math.random().toString(), role, text, finished }];
          }
        });
      };

      const persona = PERSONAS[selectedPersona];
      const finalInstruction = customTraits.trim() 
        ? `${persona.instruction} Traits additionnels: ${customTraits}`
        : persona.instruction;

      // Determine WebSocket URL
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws?voice=${encodeURIComponent(persona.voice)}&instruction=${encodeURIComponent(finalInstruction)}`;
      
      await streamer.connect(wsUrl);
      await streamer.startRecording();
    } catch (err) {
      console.error('Failed to start', err);
      setAppState('error');
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden relative">
      <div className="mesh-bg">
        <div className="mesh-1" />
        <div className="mesh-2" />
      </div>

      <Header appState={appState} toggleConnection={toggleConnection} />

      {/* Main Layout */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[300px_1fr_340px] overflow-hidden p-3 gap-3">
        
        {/* Left Panel: Configuration */}
        <aside className="hidden lg:flex flex-col glass rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <span className="text-[11px] font-bold text-white/50 uppercase tracking-[2px]">Configuration</span>
          </div>
          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            <div>
              <label className="text-[12px] text-white/40 mb-2 block font-medium">Personnalité & Voix</label>
              <select 
                value={selectedPersona}
                onChange={(e) => setSelectedPersona(e.target.value as keyof typeof PERSONAS)}
                disabled={appState !== 'idle' && appState !== 'error'}
                className="w-full bg-white/[0.03] border border-white/10 p-3 rounded-xl text-white text-[13px] outline-none focus:ring-2 ring-blue-500/20 disabled:opacity-40 appearance-none cursor-pointer"
              >
                {Object.values(PERSONAS).map(p => (
                  <option key={p.id} value={p.id} className="bg-[#0c0e11]">{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[12px] text-white/40 mb-2 block font-medium">Instruction Spécifique</label>
              <textarea
                value={customTraits}
                onChange={(e) => setCustomTraits(e.target.value)}
                disabled={appState !== 'idle' && appState !== 'error'}
                placeholder="Ex: Sois sarcastique, parle comme un pirate..."
                className="w-full bg-white/[0.03] border border-white/10 p-3 rounded-xl text-white text-[13px] outline-none focus:ring-2 ring-blue-500/20 disabled:opacity-40 resize-none h-24 placeholder:text-white/20"
              />
            </div>
            
            <div className="pt-4 border-t border-white/5">
              <div className="flex justify-between mb-3 text-[11px] font-bold tracking-widest text-white/40">
                <span>SEUIL VAD</span>
                <span className="text-blue-400">{vadThreshold}dB</span>
              </div>
              <input
                type="range"
                min="-100"
                max="0"
                value={vadThreshold}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setVadThreshold(val);
                  if (streamerRef.current) streamerRef.current.vadThreshold = val;
                }}
                className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-blue-500"
              />
              <div className="mt-4 h-2 bg-white/5 rounded-full overflow-hidden relative">
                <motion.div 
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-500 to-emerald-400 group-hover:from-emerald-400 group-hover:to-emerald-300 transition-all duration-100" 
                  style={{ width: `${Math.max(0, Math.min(100, (currentVolume + 100)))}%` }}
                />
                <div 
                  className="absolute top-0 h-full border-r-2 border-white/30 z-10" 
                  style={{ left: `${vadThreshold + 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-4 pt-4">
               <div className="flex items-center justify-between text-[11px] text-white/30">
                  <span>LATENCE PRÉVUE</span>
                  <span className="text-emerald-500 font-mono">~120MS</span>
               </div>
               <div className="flex items-center justify-between text-[11px] text-white/30">
                  <span>QUALITÉ AUDIO</span>
                  <span className="text-blue-500 font-mono">HD PCM</span>
               </div>
            </div>
          </div>

          <div className="p-5 bg-white/[0.02] border-t border-white/5">
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Pipeline Optimisé</span>
            </div>
          </div>
        </aside>

        {/* Center Stage: The Core */}
        <section className="flex flex-col items-center justify-center relative rounded-2xl overflow-hidden glass shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
          
          <div className="relative w-[400px] h-[400px] flex items-center justify-center">
            {/* Background Rings */}
            <motion.div 
              className="absolute w-full h-full border border-white/5 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
            />
            <motion.div 
              className="absolute w-[80%] h-[80%] border border-white/5 rounded-full border-dashed"
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
            />
            
            {/* Audio Waves when speaking */}
            {appState === 'speaking' && (
              <div className="absolute inset-0 flex items-center justify-center gap-2 z-0">
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-[3px] bg-blue-400/50 rounded-full"
                    animate={{ 
                      height: [20, 100 + Math.random() * 100, 20],
                      opacity: [0.3, 1, 0.3]
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 0.6 + Math.random() * 0.4, 
                      ease: "easeInOut",
                      delay: i * 0.05
                    }}
                  />
                ))}
              </div>
            )}

            {/* Core Orb */}
            <motion.div
              className="w-40 h-40 rounded-full flex items-center justify-center relative z-10 cursor-pointer"
              animate={{
                backgroundColor: appState === 'error' ? '#ef4444' : appState === 'listening' ? '#10b981' : '#3b82f6',
                boxShadow: appState === 'error' 
                  ? '0 0 80px rgba(239,68,68,0.4), inset 0 0 20px rgba(255,255,255,0.4)' 
                  : appState === 'listening'
                  ? '0 0 80px rgba(16,185,129,0.4), inset 0 0 20px rgba(255,255,255,0.4)'
                  : '0 0 80px rgba(59,130,246,0.4), inset 0 0 20px rgba(255,255,255,0.4)',
                scale: appState === 'speaking' ? [1, 1.05, 1] : 1,
              }}
              transition={{ 
                scale: { repeat: Infinity, duration: 1, ease: "easeInOut" },
                backgroundColor: { duration: 0.5 }
              }}
              onClick={toggleConnection}
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />
              {appState === 'idle' && <MicOff className="w-12 h-12 text-white drop-shadow-lg" />}
              {appState === 'connecting' && <Loader2 className="w-12 h-12 text-white animate-spin drop-shadow-lg" />}
              {appState === 'listening' && <Activity className="w-12 h-12 text-white drop-shadow-lg" />}
              {appState === 'speaking' && <Volume2 className="w-12 h-12 text-white drop-shadow-lg" />}
              {appState === 'error' && <MicOff className="w-12 h-12 text-white drop-shadow-lg" />}
            </motion.div>
          </div>

          <div className="mt-12 text-center z-10 px-6">
            <motion.h2 
              className="text-3xl font-bold mb-3 tracking-tight"
              key={appState}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {appState === 'idle' && 'Prêt pour l\'échange'}
              {appState === 'connecting' && 'Initialisation...'}
              {appState === 'listening' && 'À votre écoute'}
              {appState === 'speaking' && 'Réponse en cours'}
              {appState === 'error' && 'Session Interrompue'}
            </motion.h2>
            <p className="text-white/40 text-sm max-w-sm mx-auto font-medium">
              {appState === 'idle' ? 'Configurez votre assistant et cliquez sur l\'orb pour démarrer.' : 'Interaction fluide en temps réel. Parlez quand vous voulez.'}
            </p>
          </div>
        </section>

        {/* Right Panel: Transcriptions */}
        <aside className="hidden lg:flex flex-col glass rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <span className="text-[11px] font-bold text-white/50 uppercase tracking-[2px]">Transcription Live</span>
            {appState !== 'idle' && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-tighter">Live</span>
              </div>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {transcriptions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-white/20 space-y-4">
                 <div className="p-4 rounded-full bg-white/[0.02] border border-white/5">
                    <Activity className="w-6 h-6" />
                 </div>
                 <p className="text-[13px] italic font-medium">En attente de conversation...</p>
              </div>
            ) : (
              transcriptions.map((msg) => (
                <motion.div 
                  key={msg.id} 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-1.5"
                >
                  <div className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${msg.role === 'user' ? 'text-emerald-400' : 'text-blue-400'}`}>
                    <span>{msg.role === 'user' ? 'Vous' : 'Gemini'}</span>
                    <div className={`h-[1px] flex-1 ${msg.role === 'user' ? 'bg-emerald-400/10' : 'bg-blue-400/10'}`} />
                  </div>
                  <div className={`text-[14px] leading-relaxed text-white/90 font-medium ${!msg.finished ? 'opacity-70' : ''}`}>
                    {msg.text}
                    {!msg.finished && <span className="inline-block w-1.5 h-3.5 ml-1.5 bg-blue-500/50 animate-pulse rounded-sm align-middle" />}
                  </div>
                </motion.div>
              ))
            )}
            <div ref={transcriptionsEndRef} />
          </div>

          <div className="p-5 bg-white/[0.02] border-t border-white/5 space-y-4">
            <div>
               <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest block mb-2">Métriques Session</span>
               <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="bg-black/20 p-2 rounded-lg border border-white/5">
                     <span className="text-white/20 block">ID SESSION</span>
                     <span className="text-blue-400 truncate block">{sessionId || '---'}</span>
                  </div>
                  <div className="bg-black/20 p-2 rounded-lg border border-white/5">
                     <span className="text-white/20 block">MODÈLE</span>
                     <span className="text-emerald-400 block">FLASH 1.5</span>
                  </div>
               </div>
            </div>
          </div>
        </aside>

      </main>

      {/* Footer Status Bar */}
      <footer className="h-12 glass border-t border-white/5 flex items-center px-6 gap-8 text-[10px] font-bold text-white/30 uppercase tracking-widest shrink-0">
        <div className="flex items-center gap-2">
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
           <span className="hidden sm:inline">Streamer:</span> <span className="text-white/60 font-mono">Actif</span>
        </div>
        <div className="flex items-center gap-2 border-l border-white/10 pl-8">
           <span className="hidden sm:inline">Codec:</span> <span className="text-white/60 font-mono">L16 @ 24kHz</span>
        </div>
        <div className="flex items-center gap-2 border-l border-white/10 pl-8 ml-auto">
           <span className="hidden sm:inline">Protection:</span> <span className="text-emerald-500 font-mono">WSS/TLS-v1.3</span>
        </div>
      </footer>
    </div>
  );
}
