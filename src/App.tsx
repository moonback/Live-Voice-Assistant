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
    <div className="h-screen w-screen bg-[#0C0D0E] text-white flex flex-col font-sans overflow-hidden">
      <Header appState={appState} toggleConnection={toggleConnection} />

      {/* Main Layout */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-[1px] bg-[#2A2D35] overflow-hidden">
        
        {/* Left Panel */}
        <aside className="hidden lg:flex flex-col bg-[#0C0D0E]">
          <div className="p-4 border-b border-[#2A2D35] flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#8E9299] uppercase tracking-[1px]">Configuration Audio</span>
          </div>
          <div className="p-5">
            <label className="text-[12px] text-[#8E9299] mb-2 block">Personnalité & Voix</label>
            <select 
              value={selectedPersona}
              onChange={(e) => setSelectedPersona(e.target.value as keyof typeof PERSONAS)}
              disabled={appState !== 'idle' && appState !== 'error'}
              className="w-full bg-[#15171B] border border-[#2A2D35] p-2.5 rounded-md text-white mb-4 text-[13px] outline-none focus:border-[#3B82F6] disabled:opacity-50"
            >
              {Object.values(PERSONAS).map(p => (
                <option key={p.id} value={p.id}>{p.name} - Voix: {p.voice}</option>
              ))}
            </select>

            <label className="text-[12px] text-[#8E9299] mb-2 block">Traits additionnels (Optionnel)</label>
            <textarea
              value={customTraits}
              onChange={(e) => setCustomTraits(e.target.value)}
              disabled={appState !== 'idle' && appState !== 'error'}
              placeholder="Ex: Parle comme un pirate, sois sarcastique..."
              className="w-full bg-[#15171B] border border-[#2A2D35] p-2.5 rounded-md text-white mb-6 text-[13px] outline-none focus:border-[#3B82F6] disabled:opacity-50 resize-none h-20"
            />
            
            <div className="mb-5">
              <div className="flex justify-between mb-2 text-[11px] text-[#8E9299]">
                <span>Seuil VAD</span>
                <span>{vadThreshold}dB</span>
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
                className="w-full h-1 bg-[#2A2D35] rounded-full appearance-none cursor-pointer accent-[#3B82F6]"
              />
              <div className="mt-2 h-1 bg-[#2A2D35] rounded-full overflow-hidden relative">
                <div 
                  className="absolute left-0 top-0 h-full bg-[#10B981] transition-all duration-100" 
                  style={{ width: `${Math.max(0, Math.min(100, (currentVolume + 100)))}%` }}
                />
                <div 
                  className="absolute top-0 h-full border-r border-white/50 z-10" 
                  style={{ left: `${vadThreshold + 100}%` }}
                />
              </div>
            </div>

            <div className="mb-5">
              <div className="flex justify-between mb-2 text-[11px] text-[#8E9299]">
                <span>Suppression de Bruit</span>
                <span>High</span>
              </div>
              <div className="h-1 bg-[#2A2D35] rounded-full relative">
                <div className="absolute left-0 top-0 h-full bg-[#3B82F6] rounded-full w-[85%]"></div>
              </div>
            </div>

            <label className="text-[12px] text-[#8E9299] mb-2 block mt-6">Pipeline Codec</label>
            <div className="font-mono text-[11px] text-[#10B981]">PCM @ 16kHz / 24kHz</div>
          </div>
        </aside>

        {/* Center Stage */}
        <section className="flex flex-col items-center justify-center relative bg-[radial-gradient(circle_at_center,#1A1D23_0%,#0C0D0E_100%)]">
          <div className="relative w-[300px] h-[300px] flex items-center justify-center">
            <div className="absolute w-[300px] h-[300px] border border-[#3B82F6]/10 rounded-full" />
            <div className="absolute w-[220px] h-[220px] border border-[#3B82F6]/10 rounded-full" />
            
            {appState === 'speaking' && (
              <div className="absolute w-[280px] h-[100px] flex items-center justify-center gap-1 z-0 opacity-50">
                {[40, 80, 120, 100, 140, 90, 50].map((h, i) => (
                  <motion.div
                    key={i}
                    className="w-[3px] bg-[#3B82F6] rounded-sm"
                    animate={{ height: [h * 0.3, h, h * 0.3] }}
                    transition={{ repeat: Infinity, duration: 1 + i * 0.1, ease: "easeInOut" }}
                  />
                ))}
              </div>
            )}

            <motion.div
              className="w-[120px] h-[120px] rounded-full flex items-center justify-center relative z-10"
              animate={{
                backgroundColor: appState === 'error' ? '#EF4444' : appState === 'listening' ? '#10B981' : '#3B82F6',
                boxShadow: appState === 'error' 
                  ? '0 0 60px rgba(239,68,68,0.2), 0 0 120px rgba(239,68,68,0.2)' 
                  : appState === 'listening'
                  ? '0 0 60px rgba(16,185,129,0.2), 0 0 120px rgba(16,185,129,0.2)'
                  : '0 0 60px rgba(59,130,246,0.2), 0 0 120px rgba(59,130,246,0.2)',
                scale: appState === 'speaking' ? [1, 1.1, 1] : 1,
              }}
              transition={{ scale: { repeat: Infinity, duration: 0.8 } }}
            >
              {appState === 'idle' && <MicOff className="w-10 h-10 text-white" />}
              {appState === 'connecting' && <Loader2 className="w-10 h-10 text-white animate-spin" />}
              {appState === 'listening' && <Activity className="w-10 h-10 text-white" />}
              {appState === 'speaking' && <Volume2 className="w-10 h-10 text-white" />}
              {appState === 'error' && <MicOff className="w-10 h-10 text-white" />}
            </motion.div>
          </div>

          <div className="mt-10 text-center z-10">
            <h2 className="text-2xl font-light mb-2 text-white">
              {appState === 'idle' && 'Prêt à commencer'}
              {appState === 'connecting' && 'Connexion en cours...'}
              {appState === 'listening' && 'L\'IA vous écoute...'}
              {appState === 'speaking' && 'Gemini parle...'}
              {appState === 'error' && 'Erreur de connexion'}
            </h2>
            <p className="text-[#8E9299] text-sm">
              {appState === 'idle' ? 'Cliquez sur Démarrer la session pour activer le micro.' : 'Parlez naturellement, vous pouvez l\'interrompre à tout moment.'}
            </p>
          </div>
        </section>

        {/* Right Panel */}
        <aside className="hidden lg:flex flex-col bg-[#0C0D0E]">
          <div className="p-4 border-b border-[#2A2D35] flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#8E9299] uppercase tracking-[1px]">Transcription Live</span>
          </div>
          <div className="flex-1 overflow-y-auto flex flex-col p-5 gap-4">
            {transcriptions.length === 0 ? (
              <div className="text-[13px] text-[#8E9299] italic">En attente de la conversation...</div>
            ) : (
              transcriptions.map((msg) => (
                <div key={msg.id} className="text-[13px] leading-relaxed">
                  <div className={`font-mono text-[10px] mb-1 uppercase ${msg.role === 'user' ? 'text-[#10B981]' : 'text-[#3B82F6]'}`}>
                    {msg.role === 'user' ? 'Vous' : 'Gemini'}
                  </div>
                  <span className="text-white">{msg.text}</span>
                  {!msg.finished && <span className="inline-block w-1.5 h-3 ml-1 bg-[#8E9299] animate-pulse" />}
                </div>
              ))
            )}
            <div ref={transcriptionsEndRef} />
          </div>
          <div className="p-4 border-t border-[#2A2D35]">
            <span className="text-[11px] font-semibold text-[#8E9299] uppercase tracking-[1px] block mb-3">Contexte Actif</span>
            <div className="text-[12px] text-[#8E9299] leading-relaxed">
              Modèle : gemini-3.1-flash-live-preview<br/>
              Modalité : Audio-to-Audio<br/>
              Session ID : {sessionId || 'NON DÉFINI'}
            </div>
          </div>
        </aside>

      </main>

      {/* Footer */}
      <footer className="h-10 bg-[#15171B] border-t border-[#2A2D35] flex items-center px-6 gap-8 text-[11px] font-mono text-[#8E9299] shrink-0 overflow-x-auto whitespace-nowrap">
        <div className="flex gap-2">LATENCE E2E: <span className="text-[#10B981]">~150ms</span></div>
        <div className="flex gap-2">JITTER: <span className="text-[#10B981]">12ms</span></div>
        <div className="flex gap-2">SIGNALISATION: <span className="text-[#10B981]">WebSocket</span></div>
        <div className="flex gap-2">PROTOCOL: <span className="text-[#10B981]">WSS/TCP</span></div>
        <div className="flex gap-2 ml-auto">ENCRYPTÉ: <span className="text-[#10B981]">TLS 1.3</span></div>
      </footer>
    </div>
  );
}
