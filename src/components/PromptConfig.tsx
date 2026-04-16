/**
 * Nouveau composant pour la gestion visuelle du prompt system.
 * Bien que le prompt soit "en dure", ce composant permet de visualiser les directives actives.
 */
import React from 'react';
import { Terminal, ShieldCheck, Zap } from 'lucide-react';

interface PromptConfigProps {
  instruction: string;
}

export const PromptConfig: React.FC<PromptConfigProps> = ({ instruction }) => {
  return (
    <div className="flex flex-col gap-4 p-4 bg-[#15171B] border border-[#2A2D35] rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 mb-2">
        <ShieldCheck className="w-4 h-4 text-[#3B82F6]" />
        <span className="text-[11px] font-bold text-[#8E9299] uppercase tracking-wider">System Prompt Actif</span>
      </div>
      
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#3B82F6]/20 to-[#10B981]/20 rounded-lg blur opacity-50 group-hover:opacity-100 transition duration-500"></div>
        <div className="relative bg-[#0C0D0E] border border-[#2A2D35] p-3 rounded-lg flex flex-col gap-2">
          <div className="flex items-center justify-between font-mono text-[10px] text-[#8E9299] border-b border-[#2A2D35] pb-2 mb-1">
            <div className="flex items-center gap-1.5 ">
              <Terminal className="w-3 h-3" />
              <span>CORE_INSTRUCTIONS.SYS</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-yellow-500" />
              <span>LIVE_SYNC_ENABLED</span>
            </div>
          </div>
          <div className="text-[12px] text-[#D1D5DB] leading-relaxed max-h-[120px] overflow-y-auto custom-scrollbar italic whitespace-pre-wrap">
            {instruction}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        <div className="p-2 bg-[#0C0D0E] border border-[#2A2D35] rounded flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
          <span className="text-[10px] text-[#8E9299]">Latence optimisée</span>
        </div>
        <div className="p-2 bg-[#0C0D0E] border border-[#2A2D35] rounded flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] animate-pulse" />
          <span className="text-[10px] text-[#8E9299]">Formatage Vocal</span>
        </div>
      </div>
    </div>
  );
};
