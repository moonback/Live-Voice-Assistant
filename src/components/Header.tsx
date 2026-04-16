import { Mic, MicOff } from 'lucide-react';
import { AppState } from '../types';

interface HeaderProps {
  appState: AppState;
  toggleConnection: () => Promise<void>;
}

export function Header({ appState, toggleConnection }: HeaderProps) {
  return (
    <header className="h-16 bg-[#15171B] border-b border-[#2A2D35] flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-3 font-bold tracking-tight text-[18px]">
        <div className="w-6 h-6 bg-[#3B82F6] rounded" />
        NeuroLive
        <span className="text-[#8E9299] font-normal text-sm ml-2 hidden sm:inline">v1.0</span>
      </div>
      <div className={`hidden md:flex px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide items-center gap-1.5 border ${appState === 'listening' || appState === 'speaking'
        ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]'
        : appState === 'error'
          ? 'bg-red-500/10 border-red-500/30 text-red-500'
          : 'bg-[#8E9299]/10 border-[#8E9299]/30 text-[#8E9299]'
        }`}>
        <div className={`w-1.5 h-1.5 rounded-full ${appState === 'listening' || appState === 'speaking' ? 'bg-[#10B981]' : appState === 'error' ? 'bg-red-500' : 'bg-[#8E9299]'
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
