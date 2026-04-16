export class AudioStreamer {
  private audioContext: AudioContext | null = null;
  private ws: WebSocket | null = null;
  private mediaStream: MediaStream | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private nextPlayTime: number = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  
  public onStateChange?: (state: 'idle' | 'listening' | 'speaking' | 'error') => void;
  public onInterrupted?: () => void;
  public onTranscription?: (role: 'user' | 'model', text: string, finished: boolean) => void;

  async connect(wsUrl: string) {
    this.ws = new WebSocket(wsUrl);
    this.ws.binaryType = 'arraybuffer';

    this.ws.onopen = () => {
      console.log('WebSocket connected');
    };

    this.ws.onmessage = async (event) => {
      if (typeof event.data === 'string') {
        const msg = JSON.parse(event.data);
        if (msg.type === 'interrupted') {
          this.handleInterruption();
        } else if (msg.type === 'turnComplete') {
          this.onStateChange?.('listening');
        } else if (msg.type === 'system' && msg.message === 'connected') {
          this.onStateChange?.('listening');
        } else if (msg.type === 'transcription') {
          this.onTranscription?.(msg.role, msg.text, msg.finished);
        }
      } else if (event.data instanceof ArrayBuffer) {
        this.onStateChange?.('speaking');
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

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      // Create AudioWorklet for PCM conversion
      const workletCode = `
        class PCMProcessor extends AudioWorkletProcessor {
          process(inputs, outputs, parameters) {
            const input = inputs[0];
            if (input && input.length > 0) {
              const channelData = input[0];
              const pcm16 = new Int16Array(channelData.length);
              for (let i = 0; i < channelData.length; i++) {
                let s = Math.max(-1, Math.min(1, channelData[i]));
                pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
              }
              this.port.postMessage(pcm16.buffer, [pcm16.buffer]);
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
        }
      };

      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.sourceNode.connect(this.workletNode);
      this.workletNode.connect(this.audioContext.destination); // Required to keep worklet alive in some browsers

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
    source.connect(this.audioContext.destination);

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
