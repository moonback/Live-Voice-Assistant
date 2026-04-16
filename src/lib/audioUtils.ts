export class AudioStreamer {
  private audioContext: AudioContext | null = null;
  private ws: WebSocket | null = null;
  private mediaStream: MediaStream | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private nextPlayTime: number = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private analyser: AnalyserNode | null = null;
  
   public onStateChange?: (state: 'idle' | 'listening' | 'speaking' | 'error') => void;
  public onInterrupted?: () => void;
  public onTranscript?: (text: string, reset?: boolean) => void;

  getWs() {
      return this.ws;
  }

  async connect(wsUrl: string) {
    this.ws = new WebSocket(wsUrl);
    this.ws.binaryType = 'arraybuffer';

    this.ws.onopen = () => {
      console.log('[Connection] WebSocket stabilisé');
    };

    this.ws.onmessage = async (event) => {
      if (typeof event.data === 'string') {
        const msg = JSON.parse(event.data);
        if (msg.type === 'interrupted') {
          this.handleInterruption();
        } else if (msg.type === 'turnComplete') {
          this.onStateChange?.('listening');
          } else if (msg.type === 'text') {
          console.log('[Transcript] Segment reçu:', msg.content);
          this.onTranscript?.(msg.content, msg.reset);
        }
      } else if (event.data instanceof ArrayBuffer) {
        if (this.audioContext?.state === 'suspended') {
           this.audioContext.resume();
        }
        // Éviter de spammer onStateChange si on est déjà en train de parler
        if (this.onStateChange && !this.isPlayingAudio()) {
          this.onStateChange('speaking');
        }
        this.playAudio(event.data);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket closed');
      this.stop();
      this.onStateChange?.('idle');
    };

    this.ws.onerror = (err) => {
      console.error('WebSocket error', err);
      this.onStateChange?.('error');
    };
  }

  async startRecording() {
    try {
      this.audioContext = new AudioContext({ sampleRate: 16000 });
      this.nextPlayTime = this.audioContext.currentTime;

      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      const workletCode = `
        class PCMProcessor extends AudioWorkletProcessor {
          constructor() {
            super();
            this.threshold = 0.01;
            this.port.onmessage = (e) => {
              if (e.data.threshold !== undefined) {
                this.threshold = e.data.threshold;
              }
            };
          }
          process(inputs, outputs, parameters) {
            const input = inputs[0];
            if (input && input.length > 0) {
              const channelData = input[0];
              
              // Calcul simple du volume (RMS)
              let sum = 0;
              for (let i = 0; i < channelData.length; i++) {
                sum += channelData[i] * channelData[i];
              }
              const rms = Math.sqrt(sum / channelData.length);

              // N'envoyer que si le volume est significatif
              if (rms > this.threshold) {
                const pcm16 = new Int16Array(channelData.length);
                for (let i = 0; i < channelData.length; i++) {
                  let s = Math.max(-1, Math.min(1, channelData[i]));
                  pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                }
                this.port.postMessage(pcm16.buffer, [pcm16.buffer]);
              }
            }
            return true;
          }
        }
        registerProcessor('pcm-processor', PCMProcessor);
      `;
      const blob = new Blob([workletCode], { type: 'application/javascript' });
      const workletUrl = URL.createObjectURL(blob);
      
      await this.audioContext.audioWorklet.addModule(workletUrl);
      
      this.workletNode = new AudioWorkletNode(this.audioContext, 'pcm-processor');
      this.workletNode.port.onmessage = (e) => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(e.data); // Send ArrayBuffer
        } else if (this.ws && this.ws.readyState !== WebSocket.CONNECTING) {
           console.warn('[Audio] WebSocket non ouvert, abandon du buffer');
        }
      };

      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.sourceNode.connect(this.analyser);
      this.analyser.connect(this.workletNode);
      this.workletNode.connect(this.audioContext.destination); 

      this.onStateChange?.('listening');
    } catch (err) {
      console.error('Error starting recording', err);
      this.onStateChange?.('error');
    }
  }

  private playAudio(arrayBuffer: ArrayBuffer) {
    if (!this.audioContext) return;

    const int16Data = new Int16Array(arrayBuffer);
    const float32Data = new Float32Array(int16Data.length);
    for (let i = 0; i < int16Data.length; i++) {
      float32Data[i] = int16Data[i] / 32768.0;
    }

    // Gemini Live returns 24kHz audio
    const audioBuffer = this.audioContext.createBuffer(1, float32Data.length, 24000);
    audioBuffer.getChannelData(0).set(float32Data);

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    
    if (this.analyser) {
        source.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
    } else {
        source.connect(this.audioContext.destination);
    }

    if (this.nextPlayTime < this.audioContext.currentTime) {
      this.nextPlayTime = this.audioContext.currentTime;
    }
    
    source.start(this.nextPlayTime);
    this.nextPlayTime += audioBuffer.duration;

    this.activeSources.push(source);
    source.onended = () => {
      this.activeSources = this.activeSources.filter(s => s !== source);
    };
  }

  private handleInterruption() {
    if (!this.audioContext) return;
    this.nextPlayTime = this.audioContext.currentTime;
    this.activeSources.forEach(source => {
      try {
        source.stop();
      } catch (e) {
        // Ignore if already stopped
      }
    });
    this.activeSources = [];
    this.onInterrupted?.();
  }

  getFrequencyData(dataArray: any) {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(dataArray);
    }
  }

   setThreshold(value: number) {
    if (this.workletNode) {
      this.workletNode.port.postMessage({ threshold: value });
    }
  }

  isPlayingAudio() {
    return this.activeSources.length > 0;
  }

  stop() {
    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.onStateChange?.('idle');
  }
}
