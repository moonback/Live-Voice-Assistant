import { Mic, MicOff } from 'lucide-react';
import { AppState } from '../types';

interface HeaderProps {
  appState: AppState;
  toggleConnection: () => Promise<void>;
}

export function Header({ appState, toggleConnection }: HeaderProps) {
  return (
    <header className="h-20 flex items-center justify-between px-8 shrink-0 z-50">
      <div className="flex items-center gap-4 group cursor-default">
        <div className="relative">
          <div className="w-8 h-8 bg-blue-500 rounded-xl rotate-12 group-hover:rotate-45 transition-transform duration-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]" />
          <div className="absolute inset-0 w-8 h-8 bg-white/20 rounded-xl" />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/40">
            NeuroLive
          </span>
          <span className="text-[9px] font-bold text-blue-400 uppercase tracking-[3px]">Voice Interface</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className={`hidden md:flex px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest items-center gap-2.5 border transition-all duration-500 glass ${
          appState === 'listening' || appState === 'speaking'
            ? 'border-emerald-500/30 text-emerald-400'
            : appState === 'error'
            ? 'border-red-500/30 text-red-400'
            : 'border-white/10 text-white/40'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${
            appState === 'listening' || appState === 'speaking' 
              ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse' 
              : appState === 'error' 
              ? 'bg-red-500' 
              : 'bg-white/20'
          }`} />
          {appState === 'idle' ? 'System Ready' : appState === 'connecting' ? 'Initializing...' : appState === 'error' ? 'Connection Error' : 'Full Duplex Active'}
        </div>

        <button
          onClick={toggleConnection}
          disabled={appState === 'connecting'}
          className={`h-11 px-6 rounded-xl font-bold text-[12px] uppercase tracking-widest flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl ${
            appState === 'idle' || appState === 'error'
              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
              : 'bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20'
          }`}
        >
          {appState === 'idle' || appState === 'error' ? (
            <>
              <Mic className="w-4 h-4" />
              <span>Start Session</span>
            </>
          ) : (
            <>
              <MicOff className="w-4 h-4" />
              <span>End Session</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
