import express from 'express';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import path from 'path';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = process.env.PORT || 3000;

  // Setup WebSocket Server
  const wss = new WebSocketServer({ server, path: '/ws' });

  // Initialize Gemini AI
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
    console.log('Client connected to WebSocket');
    let session: any = null;
    const messageQueue: any[] = [];

    // Parse configuration from URL
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const voiceName = url.searchParams.get('voice') || 'Zephyr';
    const systemInstruction = url.searchParams.get('instruction') || "Tu es un assistant vocal...";
    
    console.log(`[WS] Nouvelle connexion - Voix: ${voiceName}, Instruction: ${systemInstruction.substring(0, 50)}...`);

    const processInput = (data: any) => {
      if (!session) return;
      if (Buffer.isBuffer(data)) {
        const base64Audio = data.toString('base64');
        session.sendRealtimeInput({
          audio: { data: base64Audio, mimeType: 'audio/pcm;rate=16000' }
        });
      } else {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.type === 'clientContent' && msg.text) {
             session.sendRealtimeInput({ text: msg.text });
          }
          if (msg.type === 'image' && msg.data) {
             session.sendRealtimeInput({
               mediaChunks: [{ data: msg.data, mimeType: 'image/jpeg' }]
             });
          }
        } catch (e) {
          console.error('[WS] Erreur parsing message', e);
        }
      }
    };

    // Connect to Gemini Live API
    const sessionPromise = ai.live.connect({
      model: 'gemini-3.1-flash-live-preview',
      callbacks: {
        onopen: () => {
          console.log('Connected to Gemini Live');
          ws.send(JSON.stringify({ type: 'system', message: 'connected' }));
        },
        onmessage: async (message: LiveServerMessage) => {
          if (message.serverContent?.modelTurn) {
            console.log(`[Gemini] Tour de modèle détecté (${message.serverContent.modelTurn.parts.length} parties)`);
            ws.send(JSON.stringify({ type: 'text', content: '', reset: true }));
            const parts = message.serverContent.modelTurn.parts;
            for (const part of parts) {
              if (part.inlineData && part.inlineData.data) {
                const buffer = Buffer.from(part.inlineData.data, 'base64');
                ws.send(buffer);
              }
              if (part.text && part.text.trim() !== "") {
                console.log(`[Gemini] Texte reçu: "${part.text}"`);
                ws.send(JSON.stringify({ type: 'text', content: part.text }));
              }
            }
          }
          if (message.serverContent?.interrupted) {
            console.log('[Gemini] Interruption détectée');
            ws.send(JSON.stringify({ type: 'interrupted' }));
          }
          if (message.serverContent?.turnComplete) {
            console.log('[Gemini] Fin du tour de parole');
            ws.send(JSON.stringify({ type: 'turnComplete' }));
          }
        },
        onclose: () => {
          console.log('Gemini Live closed');
          ws.send(JSON.stringify({ type: 'system', message: 'disconnected' }));
        },
        onerror: (err) => {
          console.error('Gemini Live error', err);
          ws.send(JSON.stringify({ type: 'error', message: 'Gemini connection error' }));
        }
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName } },
        },
        systemInstruction,
      },
    });

    sessionPromise.then(s => {
      session = s;
      console.log('[Gemini] Session prête, traitement de la file d\'attente...');
      while (messageQueue.length > 0) {
        processInput(messageQueue.shift());
      }
    }).catch(err => {
      console.error('Failed to connect to Gemini', err);
      ws.close();
    });

    ws.on('message', (data) => {
      if (session) {
        processInput(data);
      } else {
        messageQueue.push(data);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
      if (session && typeof session.close === 'function') {
        session.close();
      }
    });
  });

  // API routes FIRST
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
