import { Mic, MicOff } from 'lucide-react';
import { AppState } from '../types';

interface HeaderProps {
  appState: AppState;
  toggleConnection: () => Promise<void>;
}

export function Header({ appState, toggleConnection }: HeaderProps) {
  return (
    <header className="h-16 bg-[#15171B]/80 backdrop-blur-md border-b border-[#2A2D35] flex items-center justify-between px-6 shrink-0 sticky top-0 z-50">
      <div className="flex items-center gap-3 font-bold tracking-tight text-[18px] group cursor-default">
        <div className="w-6 h-6 bg-[#3B82F6] rounded shadow-[0_0_15px_rgba(59,130,246,0.5)] group-hover:scale-110 transition-transform duration-300" />
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-[#8E9299]">NeuroLive</span>
        <span className="text-[#8E9299]/60 font-normal text-[10px] self-end mb-1 ml-2 hidden sm:inline px-1.5 py-0.5 border border-[#2A2D35] rounded">v1.0</span>
      </div>
      <div className={`hidden md:flex px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide items-center gap-1.5 border transition-all duration-500 ${appState === 'listening' || appState === 'speaking'
        ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981] shadow-[0_0_10px_rgba(16,185,129,0.1)]'
        : appState === 'error'
          ? 'bg-red-500/10 border-red-500/30 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.1)]'
          : 'bg-[#8E9299]/10 border-[#8E9299]/30 text-[#8E9299]'
        }`}>
        <div className={`w-1.5 h-1.5 rounded-full ${appState === 'listening' || appState === 'speaking' ? 'bg-[#10B981] animate-pulse' : appState === 'error' ? 'bg-red-500' : 'bg-[#8E9299]'
          }`} />
        {appState === 'idle' ? 'HORS LIGNE' : appState === 'connecting' ? 'CONNEXION...' : appState === 'error' ? 'ERREUR' : 'FULL DUPLEX ACTIVE'}
      </div>
      <div className="flex gap-3">
        <button
          onClick={toggleConnection}
          disabled={appState === 'connecting'}
          className={`px-6 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${appState === 'idle' || appState === 'error'
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
  );
}
