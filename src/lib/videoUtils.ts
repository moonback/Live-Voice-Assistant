/**
 * Utilitaire pour la capture de frames vidéo à partir de la caméra.
 */
export class VideoStreamer {
  private videoElement: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private stream: MediaStream | null = null;
  private timer: number | null = null;

  async start(onFrame: (base64: string) => void) {
    this.stream = await navigator.mediaDevices.getUserMedia({ 
      video: { width: 640, height: 480, frameRate: 5 } 
    });
    
    this.videoElement = document.createElement('video');
    this.videoElement.srcObject = this.stream;
    this.videoElement.play();

    this.canvas = document.createElement('canvas');
    this.canvas.width = 640;
    this.canvas.height = 480;

    const ctx = this.canvas.getContext('2d');

    this.timer = window.setInterval(() => {
      if (ctx && this.videoElement) {
        ctx.drawImage(this.videoElement, 0, 0, 640, 480);
        const base64 = this.canvas!.toDataURL('image/jpeg', 0.6).split(',')[1];
        onFrame(base64);
      }
    }, 1000); // 1 frame per second is enough for Gemini Live
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
    }
    this.videoElement = null;
    this.canvas = null;
  }
}
