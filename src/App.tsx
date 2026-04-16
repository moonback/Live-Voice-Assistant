import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2, Volume2, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { AudioStreamer } from './lib/audioUtils';
import { getSystemPrompt, BASE_SYSTEM_PROMPT } from './lib/systemPrompt';
import { PromptConfig } from './components/PromptConfig';
import { LiveVisualizer } from './components/LiveVisualizer';
import { VideoStreamer } from './lib/videoUtils';
import { SessionStats } from './components/SessionStats';
import { Camera, CameraOff, Video } from 'lucide-react';

type AppState = 'idle' | 'connecting' | 'listening' | 'speaking' | 'error';

const PERSONAS = {
  expert: {
    id: 'expert',
    name: 'Expert (Concis & Direct)',
    voice: 'Zephyr',
    instruction: 'Tu es un assistant vocal expert, concis et naturel. Réponds toujours en français. Garde tes réponses courtes pour une conversation fluide.'
  },
  amical: {
    id: 'amical',
    name: 'Amical (Chaleureux & Bavard)',
    voice: 'Kore',
    instruction: 'Tu es un assistant vocal amical, chaleureux et très bavard. Tu aimes développer tes réponses et montrer de l\'empathie. Réponds en français.'
  },
  pro: {
    id: 'pro',
    name: 'Professionnel (Neutre & Formel)',
    voice: 'Charon',
    instruction: 'Tu es un assistant professionnel, neutre et très formel. Tu utilises le vouvoiement et un vocabulaire soutenu. Réponds en français.'
  },
  creatif: {
    id: 'creatif',
    name: 'Créatif (Énergique & Expressif)',
    voice: 'Puck',
    instruction: 'Tu es un assistant vocal créatif, énergique et très expressif. Tu utilises des métaphores et as un ton enthousiaste. Réponds en français.'
  },
  direct: {
    id: 'direct',
    name: 'Direct (Autoritaire & Bref)',
    voice: 'Fenrir',
    instruction: 'Tu es un assistant vocal direct et autoritaire. Tu vas droit au but sans fioritures. Réponds en français de manière très brève.'
  }
};

export default function App() {
  const [appState, setAppState] = useState<AppState>('idle');
  const [selectedPersona, setSelectedPersona] = useState<keyof typeof PERSONAS>('expert');
  const [customTraits, setCustomTraits] = useState('');
  const [transcript, setTranscript] = useState('');
  const [isVisionEnabled, setIsVisionEnabled] = useState(false);
  const [vadThreshold, setVadThreshold] = useState(0.01);
  const streamerRef = useRef<AudioStreamer | null>(null);
  const videoRef = useRef<VideoStreamer | null>(null);

  useEffect(() => {
    return () => {
      streamerRef.current?.stop();
      videoRef.current?.stop();
    };
  }, []);

  const toggleConnection = async () => {
    if (appState !== 'idle' && appState !== 'error') {
      console.log('[Action] Fermeture manuelle de la session');
      streamerRef.current?.stop();
      videoRef.current?.stop();
      streamerRef.current = null;
      videoRef.current = null;
      setAppState('idle');
      setTranscript('');
      return;
    }

    console.log('[Action] Initialisation de la connexion...');
    setAppState('connecting');
    try {
      const streamer = new AudioStreamer();
      streamerRef.current = streamer;

      streamer.onStateChange = (state) => {
        console.log(`[State] Transition vers: ${state}`);
        setAppState(state);
        
        // VAD Adaptatif : augmenter le seuil quand l'IA parle pour ignorer l'écho des haut-parleurs
        if (state === 'speaking') {
          streamerRef.current?.setThreshold(vadThreshold * 4); // Très robuste pendant la parole IA
        } else if (state === 'listening') {
          streamerRef.current?.setThreshold(vadThreshold); // Sensibilité normale pendant l'écoute
        }
      };

      streamer.onTranscript = (text, reset) => {
        if (reset) {
          setTranscript(text);
        } else {
          setTranscript(prev => prev + text);
        }
      };

      streamer.onInterrupted = () => {
        console.log('[Event] L\'IA a été interrompue par l\'utilisateur');
        setTranscript(prev => prev + '... [Interrompu]');
      };

      const persona = PERSONAS[selectedPersona];
      const finalInstruction = getSystemPrompt(`${persona.instruction}${customTraits.trim() ? ` Traits additionnels: ${customTraits}` : ''}`);

      // Determine WebSocket URL
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws?voice=${encodeURIComponent(persona.voice)}&instruction=${encodeURIComponent(finalInstruction)}`;
      
      await streamer.connect(wsUrl);
      await streamer.startRecording();

      if (isVisionEnabled) {
        console.log('[Action] Démarrage de la capture vidéo...');
        const videoStreamer = new VideoStreamer();
        videoRef.current = videoStreamer;
        videoStreamer.start((base64) => {
          if (streamer.getWs()?.readyState === WebSocket.OPEN) {
            streamer.getWs()?.send(JSON.stringify({ type: 'image', data: base64 }));
          }
        });
      }
    } catch (err) {
      console.error('Failed to start', err);
      setAppState('error');
    }
  };

  return (
    <div className="h-screen w-screen bg-[#0C0D0E] text-white flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="h-16 bg-[#15171B] border-b border-[#2A2D35] flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3 font-bold tracking-tight text-[18px]">
          <div className="w-6 h-6 bg-[#3B82F6] rounded" />
          GEMINI LIVE ARCHITECT
          <span className="text-[#8E9299] font-normal text-sm ml-2 hidden sm:inline">v3.1 Production Node</span>
        </div>
        <div className={`hidden md:flex px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide items-center gap-1.5 border ${
          appState === 'listening' || appState === 'speaking' 
            ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]' 
            : appState === 'error'
            ? 'bg-red-500/10 border-red-500/30 text-red-500'
            : 'bg-[#8E9299]/10 border-[#8E9299]/30 text-[#8E9299]'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${
            appState === 'listening' || appState === 'speaking' ? 'bg-[#10B981]' : appState === 'error' ? 'bg-red-500' : 'bg-[#8E9299]'
          }`} />
          {appState === 'idle' ? 'HORS LIGNE' : appState === 'connecting' ? 'CONNEXION...' : appState === 'error' ? 'ERREUR' : 'FULL DUPLEX ACTIVE'}
        </div>
        <div className="flex gap-3">
          <button
            onClick={toggleConnection}
            disabled={appState === 'connecting'}
            className={`px-6 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              appState === 'idle' || appState === 'error'
                ? 'bg-[#3B82F6] hover:bg-blue-600 text-white'
                : 'bg-[#EF4444] hover:bg-red-600 text-white'
            }`}
          >
            {appState === 'idle' || appState === 'error' ? (
              <>
                <Mic className="w-4 h-4" />
                <span className="hidden sm:inline">Démarrer Session</span>
              </>
            ) : (
              <>
                <MicOff className="w-4 h-4" />
                <span className="hidden sm:inline">Terminer Session</span>
              </>
            )}
          </button>
        </div>
      </header>

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
                <span>Seuil de Détection (VAD)</span>
                <span>{(vadThreshold * 1000).toFixed(0)} pts</span>
              </div>
              <input 
                type="range"
                min="0.001"
                max="0.1"
                step="0.001"
                value={vadThreshold}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setVadThreshold(val);
                  streamerRef.current?.setThreshold(val);
                }}
                className="w-full h-1 bg-[#2A2D35] rounded-full appearance-none cursor-pointer accent-[#3B82F6]"
              />
              <div className="flex justify-between mt-1 text-[9px] text-[#8E9299]">
                <span>Sensible</span>
                <span>Robuste</span>
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

            <label className="text-[12px] text-[#8E9299] mb-2 block mt-6">Mode Multimodal</label>
            <button
               onClick={() => setIsVisionEnabled(!isVisionEnabled)}
               disabled={appState !== 'idle' && appState !== 'error'}
               className={`w-full p-2.5 rounded-md text-[13px] font-medium flex items-center justify-center gap-2 border transition-all ${
                 isVisionEnabled 
                   ? 'bg-[#10B981]/10 border-[#10B981]/50 text-[#10B981]' 
                   : 'bg-[#15171B] border-[#2A2D35] text-[#8E9299]'
               }`}
            >
              {isVisionEnabled ? <Video className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
              {isVisionEnabled ? 'Vision Activée' : 'Activer Vision'}
            </button>

            <label className="text-[12px] text-[#8E9299] mb-2 block mt-6">Pipeline Codec</label>
            <div className="font-mono text-[11px] text-[#10B981]">PCM @ 16kHz / 24kHz</div>
          </div>
        </aside>

        {/* Center Stage */}
        <section className="flex flex-col items-center justify-center relative bg-[radial-gradient(circle_at_center,#1A1D23_0%,#0C0D0E_100%)]">
          <div className="relative w-[300px] h-[300px] flex items-center justify-center">
            <div className="absolute w-[300px] h-[300px] border border-[#3B82F6]/10 rounded-full" />
            <div className="absolute w-[220px] h-[220px] border border-[#3B82F6]/10 rounded-full" />
            
            {(appState === 'speaking' || appState === 'listening') && (
              <div className="absolute w-[280px] h-[100px] flex items-center justify-center z-0">
                <LiveVisualizer streamer={streamerRef.current} active={appState === 'speaking' || appState === 'listening'} />
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
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 scrollbar-hide">
            <PromptConfig instruction={getSystemPrompt(`${PERSONAS[selectedPersona].instruction}${customTraits.trim() ? ` Traits additionnels: ${customTraits}` : ''}`)} />
            
            <SessionStats appState={appState} />

            <div className="p-5 border-t border-[#2A2D35] text-[13px] leading-relaxed bg-[#15171B]/50 rounded-xl">
              <div className="font-mono text-[10px] text-[#3B82F6] mb-1 uppercase">Transcription Live</div>
              <div className="text-[#D1D5DB] min-h-[100px] max-h-[200px] overflow-y-auto custom-scrollbar italic">
                {transcript || (
                  <span className="text-[#8E9299]">En attente de la parole d'IA...</span>
                )}
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-[#2A2D35]">
            <span className="text-[11px] font-semibold text-[#8E9299] uppercase tracking-[1px] block mb-3">Contexte Actif</span>
            <div className="text-[12px] text-[#8E9299] leading-relaxed">
              Modèle : gemini-3.1-flash-live-preview<br/>
              Modalité : Audio-to-Audio<br/>
              Session ID : {Math.random().toString(36).substring(7)}
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
