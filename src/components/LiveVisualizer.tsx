import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { AudioStreamer } from '../lib/audioUtils';

interface LiveVisualizerProps {
  streamer: AudioStreamer | null;
  active: boolean;
}

export const LiveVisualizer: React.FC<LiveVisualizerProps> = ({ streamer, active }) => {
  const [data, setData] = useState<Uint8Array>(new Uint8Array(16).fill(0));
  const requestRef = useRef<number>(0);

  const update = () => {
    if (streamer && active) {
      const freqData = new Uint8Array(16);
      streamer.getFrequencyData(freqData);
      setData(freqData);
      requestRef.current = requestAnimationFrame(update);
    }
  };

  useEffect(() => {
    if (active) {
      requestRef.current = requestAnimationFrame(update);
    } else {
      setData(new Uint8Array(16).fill(0));
      cancelAnimationFrame(requestRef.current);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [active, streamer]);

  return (
    <div className="flex items-center justify-center gap-1.5 h-32 w-full">
      {Array.from(data).slice(0, 12).map((v: number, i) => {
        // Multiplier pour rendre les petites variations plus visibles
        const height = Math.max(4, (v / 255) * 100);
        return (
          <motion.div
            key={i}
            className="w-[4px] bg-[#3B82F6] rounded-full"
            animate={{ 
              height: active ? height : 4,
              backgroundColor: v > 150 ? '#10B981' : '#3B82F6',
              opacity: active ? 0.8 : 0.2
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          />
        );
      })}
    </div>
  );
};
