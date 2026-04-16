import { useState, useEffect, useRef } from 'react';
import { MicOff, Loader2, Volume2, Activity, Settings2, SlidersHorizontal, ShieldCheck, AudioLines } from 'lucide-react';
import { motion } from 'motion/react';
import { AudioStreamer } from './lib/audioUtils';
import { Header } from './components/Header';
import { buildSystemPrompt } from './lib/prompts';

import { AppState, TranscriptionMsg, PERSONAS, PersonaKey, MODELS, ModelKey } from './types';

export default function App() {
  const [appState, setAppState] = useState<AppState>('idle');
  const [selectedPersona, setSelectedPersona] = useState<PersonaKey>('expert');
  const [selectedModel, setSelectedModel] = useState<ModelKey>('gemini-3.1-flash');
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
      streamerRef.current?.stop();
      streamerRef.current = null;
      setAppState('idle');
      return;
    }

    setAppState('connecting');
    setTranscriptions([]);
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
        setTranscriptions((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.role === role && !last.finished) {
            const updated = [...prev];
            updated[updated.length - 1] = { ...last, text: last.text + text, finished };
            return updated;
          }

          return [...prev, { id: Math.random().toString(), role, text, finished }];
        });
      };

      const persona = PERSONAS[selectedPersona];
      const model = MODELS[selectedModel];
      const systemPrompt = buildSystemPrompt(selectedPersona, customTraits);

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws?voice=${encodeURIComponent(persona.voice)}&instruction=${encodeURIComponent(systemPrompt)}&model=${encodeURIComponent(model.id)}`;

      await streamer.connect(wsUrl);
      await streamer.startRecording();
    } catch (err) {
      console.error('Failed to start', err);
      setAppState('error');
    }
  };

  const appStateLabel: Record<AppState, string> = {
    idle: 'Prêt pour une session premium',
    connecting: 'Handshake sécurisé en cours…',
    listening: 'Capture vocale active',
    speaking: 'Synthèse vocale en sortie',
    error: 'Session interrompue',
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden relative text-white">
      <div className="noise-overlay" />
      <div className="atmosphere-bg">
        <div className="halo halo-cyan" />
        <div className="halo halo-violet" />
        <div className="halo halo-gold" />
      </div>

      <Header appState={appState} toggleConnection={toggleConnection} />

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[300px_1fr_350px] overflow-hidden p-3 md:p-4 gap-3 md:gap-4">
        <aside className="hidden lg:flex flex-col panel rounded-3xl overflow-hidden">
          <div className="panel-title-row">
            <span className="panel-title">Configuration</span>
            <Settings2 className="w-4 h-4 text-white/45" />
          </div>

          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            <div>
              <label className="label">Persona & voix</label>
              <select
                value={selectedPersona}
                onChange={(e) => setSelectedPersona(e.target.value as keyof typeof PERSONAS)}
                disabled={appState !== 'idle' && appState !== 'error'}
                className="control"
              >
                {Object.values(PERSONAS).map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#131722]">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Modèle IA</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as ModelKey)}
                disabled={appState !== 'idle' && appState !== 'error'}
                className="control"
              >
                {Object.entries(MODELS).map(([key, m]) => (
                  <option key={key} value={key} className="bg-[#131722]">
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Style conversationnel</label>
              <textarea
                value={customTraits}
                onChange={(e) => setCustomTraits(e.target.value)}
                disabled={appState !== 'idle' && appState !== 'error'}
                placeholder="Ex: ton exécutif, synthèse brève, tutoiement…"
                className="control h-24 resize-none placeholder:text-white/25"
              />
            </div>

            <div className="pt-4 border-t border-white/10 space-y-3">
              <div className="flex justify-between text-[11px] font-semibold tracking-[0.16em] text-white/50 uppercase">
                <span>Seuil VAD</span>
                <span className="text-cyan-200">{vadThreshold} dB</span>
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
                className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-cyan-300"
              />
              <div className="meter-shell">
                <motion.div className="meter-fill" style={{ width: `${Math.max(0, Math.min(100, currentVolume + 100))}%` }} />
                <div className="meter-threshold" style={{ left: `${vadThreshold + 100}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-2">
              <div className="mini-kpi">
                <span>Latence estimée</span>
                <strong>~120 ms</strong>
              </div>
              <div className="mini-kpi">
                <span>Flux audio</span>
                <strong>PCM HD · 24k</strong>
              </div>
              <div className="mini-kpi">
                <span>Sécurité</span>
                <strong>WSS / TLS 1.3</strong>
              </div>
            </div>
          </div>

          <div className="p-5 border-t border-white/10 bg-white/[0.02] flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.18em] text-white/55 font-semibold">Pipeline optimisé</span>
          </div>
        </aside>

        <section className="panel rounded-3xl flex flex-col items-center justify-center relative overflow-hidden px-6">
          <div className="scanline" />

          <motion.div
            className="absolute -top-30 w-[35rem] h-[35rem] rounded-full blur-3xl opacity-25"
            animate={{ rotate: [0, 360] }}
            transition={{ repeat: Infinity, duration: 40, ease: 'linear' }}
            style={{ background: 'conic-gradient(from 0deg, rgba(34,211,238,0.2), rgba(139,92,246,0.25), rgba(250,204,21,0.18), rgba(34,211,238,0.2))' }}
          />

          <div className="relative w-[330px] h-[330px] md:w-[420px] md:h-[420px] flex items-center justify-center">
            <motion.div className="orb-ring ring-a" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 24, ease: 'linear' }} />
            <motion.div className="orb-ring ring-b" animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 14, ease: 'linear' }} />

            {appState === 'speaking' && (
              <div className="absolute inset-0 flex items-center justify-center gap-1.5 md:gap-2 z-0">
                {[...Array(14)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-[3px] bg-cyan-200/55 rounded-full"
                    animate={{ height: [16, 58 + Math.random() * 80, 16], opacity: [0.25, 1, 0.25] }}
                    transition={{ repeat: Infinity, duration: 0.7 + Math.random() * 0.4, ease: 'easeInOut', delay: i * 0.045 }}
                  />
                ))}
              </div>
            )}

            <motion.button
              onClick={toggleConnection}
              disabled={appState === 'connecting'}
              className="orb-core"
              animate={{
                scale: appState === 'speaking' ? [1, 1.07, 1] : 1,
                boxShadow:
                  appState === 'error'
                    ? '0 0 110px rgba(251,113,133,0.55), inset 0 0 50px rgba(255,255,255,0.34)'
                    : appState === 'listening'
                    ? '0 0 120px rgba(45,212,191,0.62), inset 0 0 45px rgba(255,255,255,0.32)'
                    : '0 0 120px rgba(56,189,248,0.5), inset 0 0 45px rgba(255,255,255,0.28)',
              }}
              transition={{ scale: { repeat: Infinity, duration: 1, ease: 'easeInOut' }, boxShadow: { duration: 0.4 } }}
            >
              {appState === 'idle' && <MicOff className="w-12 h-12 md:w-14 md:h-14 text-white" />}
              {appState === 'connecting' && <Loader2 className="w-12 h-12 md:w-14 md:h-14 text-white animate-spin" />}
              {appState === 'listening' && <Activity className="w-12 h-12 md:w-14 md:h-14 text-white" />}
              {appState === 'speaking' && <Volume2 className="w-12 h-12 md:w-14 md:h-14 text-white" />}
              {appState === 'error' && <MicOff className="w-12 h-12 md:w-14 md:h-14 text-white" />}
            </motion.button>
          </div>

          <div className="mt-10 text-center z-10">
            <motion.h2 key={appState} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-2xl md:text-4xl font-display tracking-tight mb-3">
              {appStateLabel[appState]}
            </motion.h2>
            <p className="text-white/70 text-sm md:text-[15px] max-w-lg leading-relaxed">
              Interface vocale repensée pour un rendu plus premium: lisibilité, feedback clair et sensation de contrôle instantané.
            </p>
          </div>
        </section>

        <aside className="hidden lg:flex flex-col panel rounded-3xl overflow-hidden">
          <div className="panel-title-row">
            <span className="panel-title">Transcription live</span>
            <SlidersHorizontal className="w-4 h-4 text-white/45" />
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {transcriptions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-white/35 space-y-4 text-center">
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/12">
                  <AudioLines className="w-6 h-6" />
                </div>
                <p className="text-[13px] font-medium">En attente de conversation…</p>
              </div>
            ) : (
              transcriptions.map((msg) => (
                <motion.div key={msg.id} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} className="chat-block">
                  <div className={`chat-role ${msg.role === 'user' ? 'chat-role-user' : 'chat-role-ai'}`}>
                    <span>{msg.role === 'user' ? 'Vous' : 'Assistant'}</span>
                    <div className="h-px flex-1 bg-current opacity-25" />
                  </div>
                  <p className={`text-[14px] leading-relaxed text-white/90 ${!msg.finished ? 'opacity-70' : ''}`}>
                    {msg.text}
                    {!msg.finished && <span className="inline-block w-1.5 h-3.5 ml-1.5 bg-cyan-200/70 animate-pulse rounded-sm align-middle" />}
                  </p>
                </motion.div>
              ))
            )}
            <div ref={transcriptionsEndRef} />
          </div>

          <div className="p-5 border-t border-white/10 bg-white/[0.02] space-y-3">
            <span className="text-[10px] tracking-[0.2em] uppercase text-white/45 font-semibold block">Métriques session</span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="metric-card">
                <span>ID session</span>
                <strong>{sessionId || '---'}</strong>
              </div>
              <div className="metric-card">
                <span>Modèle</span>
                <strong>{MODELS[selectedModel].label}</strong>
              </div>
            </div>
          </div>
        </aside>
      </main>

      <footer className="h-12 panel border-t border-white/10 flex items-center px-4 md:px-6 gap-4 md:gap-8 text-[10px] font-semibold text-white/55 uppercase tracking-[0.14em] shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.8)]" />
          <span>Streamer</span>
          <strong className="text-white/90 normal-case">Actif</strong>
        </div>
        <div className="flex items-center gap-2 border-l border-white/15 pl-4 md:pl-8">
          <span>Codec</span>
          <strong className="text-white/90 normal-case">L16 @ 24kHz</strong>
        </div>
        <div className="flex items-center gap-2 border-l border-white/15 pl-4 md:pl-8 ml-auto">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" />
          <strong className="text-emerald-100 normal-case">WSS/TLS-v1.3</strong>
        </div>
      </footer>
    </div>
  );
}
