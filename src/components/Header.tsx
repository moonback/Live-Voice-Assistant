import { Mic, MicOff, RadioTower, Sparkles } from 'lucide-react';
import { AppState } from '../types';

interface HeaderProps {
  appState: AppState;
  toggleConnection: () => Promise<void>;
}

const stateLabel: Record<AppState, string> = {
  idle: 'Prêt au lancement',
  connecting: 'Connexion en cours',
  listening: 'Écoute active',
  speaking: 'Réponse vocale',
  error: 'Erreur de session',
};

export function Header({ appState, toggleConnection }: HeaderProps) {
  const isLive = appState === 'listening' || appState === 'speaking';

  return (
    <header className="h-22 flex items-center justify-between px-5 md:px-8 shrink-0 z-50">
      <div className="flex items-center gap-4 cursor-default">
        <div className="brand-emblem">
          <div className="brand-emblem-inner" />
          <Sparkles className="w-4 h-4 text-[#fef08a]" />
        </div>
        <div className="flex flex-col">
          <span className="text-[1.4rem] leading-none tracking-tight font-semibold font-display text-white">
            NeuroLive
          </span>
          <span className="text-[10px] font-semibold text-white/55 uppercase tracking-[0.28em]">
            Voice Control Studio
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        <div className="hidden md:flex px-4 py-2 rounded-full text-[11px] font-semibold uppercase tracking-[0.16em] items-center gap-2 border border-white/10 bg-white/[0.03]">
          <RadioTower className={`w-3.5 h-3.5 ${isLive ? 'text-emerald-300' : appState === 'error' ? 'text-rose-300' : 'text-white/50'}`} />
          <span className={`${isLive ? 'text-emerald-100' : appState === 'error' ? 'text-rose-100' : 'text-white/70'}`}>
            {stateLabel[appState]}
          </span>
        </div>

        <button
          onClick={toggleConnection}
          disabled={appState === 'connecting'}
          className={`h-11 px-5 rounded-xl font-semibold text-[11px] uppercase tracking-[0.18em] flex items-center gap-2.5 transition-all duration-300 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed border ${
            appState === 'idle' || appState === 'error'
              ? 'bg-cyan-300 text-slate-950 border-cyan-200 hover:bg-cyan-200'
              : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-100 border-rose-300/30'
          }`}
        >
          {appState === 'idle' || appState === 'error' ? (
            <>
              <Mic className="w-4 h-4" />
              <span>Démarrer</span>
            </>
          ) : (
            <>
              <MicOff className="w-4 h-4" />
              <span>Arrêter</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
