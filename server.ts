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

    // Parse configuration from URL
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const voiceName = url.searchParams.get('voice') || 'Zephyr';
    const systemInstruction = url.searchParams.get('instruction') || "Tu es un assistant vocal expert, concis et naturel. Réponds toujours en français. Garde tes réponses courtes pour une conversation fluide.";

    // Connect to Gemini Live API
    const sessionPromise = ai.live.connect({
      model: 'gemini-3.1-flash-live-preview',
      callbacks: {
        onopen: () => {
          console.log('Connected to Gemini Live');
          ws.send(JSON.stringify({ type: 'system', message: 'connected' }));
        },
        onmessage: async (message: LiveServerMessage) => {
          // Handle audio output from Gemini
          if (message.serverContent?.modelTurn) {
            const parts = message.serverContent.modelTurn.parts;
            for (const part of parts) {
              if (part.inlineData && part.inlineData.data) {
                // Send binary audio to frontend
                const buffer = Buffer.from(part.inlineData.data, 'base64');
                ws.send(buffer);
              }
            }
          }
          // Handle interruption (barge-in)
          if (message.serverContent?.interrupted) {
            ws.send(JSON.stringify({ type: 'interrupted' }));
          }
          // Handle turn complete
          if (message.serverContent?.turnComplete) {
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
    }).catch(err => {
      console.error('Failed to connect to Gemini', err);
      ws.close();
    });

    ws.on('message', (data) => {
      if (Buffer.isBuffer(data)) {
        // Audio from client (PCM 16kHz)
        if (session) {
          const base64Audio = data.toString('base64');
          session.sendRealtimeInput({
            audio: { data: base64Audio, mimeType: 'audio/pcm;rate=16000' }
          });
        }
      } else {
        // JSON message from client
        try {
          const msg = JSON.parse(data.toString());
          if (msg.type === 'clientContent' && session && msg.text) {
             session.sendRealtimeInput({ text: msg.text });
          }
        } catch (e) {
          console.error('Error parsing WS message', e);
        }
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
