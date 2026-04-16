import React, { useEffect, useState } from 'react';
import { Activity, Gauge, Clock, Wifi } from 'lucide-react';

interface SessionStatsProps {
  appState: string;
}

export const SessionStats: React.FC<SessionStatsProps> = ({ appState }) => {
  const [sessionTime, setSessionTime] = useState(0);

  useEffect(() => {
    let interval: number;
    if (appState !== 'idle' && appState !== 'error') {
      interval = window.setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    } else {
      setSessionTime(0);
    }
    return () => clearInterval(interval);
  }, [appState]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-[#15171B] border border-[#2A2D35] rounded-xl p-4 flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-1">
        <Activity className="w-4 h-4 text-[#10B981]" />
        <span className="text-[11px] font-bold text-[#8E9299] uppercase tracking-wider">Métriques de Session</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#0C0D0E] border border-[#2A2D35] p-3 rounded-lg">
          <div className="flex items-center gap-2 text-[#8E9299] mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase font-medium">Durée</span>
          </div>
          <div className="text-lg font-mono text-[#D1D5DB]">{formatTime(sessionTime)}</div>
        </div>

        <div className="bg-[#0C0D0E] border border-[#2A2D35] p-3 rounded-lg">
          <div className="flex items-center gap-2 text-[#8E9299] mb-1">
            <Wifi className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase font-medium">Latence</span>
          </div>
          <div className="text-lg font-mono text-[#10B981]">~145ms</div>
        </div>

        <div className="bg-[#0C0D0E] border border-[#2A2D35] p-3 rounded-lg">
          <div className="flex items-center gap-2 text-[#8E9299] mb-1">
            <Gauge className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase font-medium">Volume</span>
          </div>
          <div className="text-lg font-mono text-[#3B82F6] capitalize">{appState === 'speaking' ? 'Sortie' : appState === 'listening' ? 'Entrée' : '--'}</div>
        </div>

        <div className="bg-[#0C0D0E] border border-[#2A2D35] p-3 rounded-lg flex flex-col justify-center">
           <div className="text-[10px] text-[#8E9299] uppercase font-medium mb-1 text-center">Modèle</div>
           <div className="text-[10px] font-mono text-center text-[#3B82F6]">3.1-Flash-Live</div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-1">
        <div className={`w-2 h-2 rounded-full ${appState === 'idle' ? 'bg-[#8E9299]' : 'bg-[#10B981] animate-pulse'}`} />
        <span className="text-[10px] text-[#8E9299]">Signalisation WebSocket Active</span>
      </div>
    </div>
  );
};
