<div align="center">
<img width="1200" height="475" alt="NeuroLive Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# 🧠 NeuroLive | High-Performance AI Voice Assistant
**Experience the Future of Full-Duplex Conversational AI with Gemini 3 Flash Live.**

[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/Fastify-000000?style=flat&logo=fastify&logoColor=white)](https://www.fastify.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

</div>

---

## 🚀 Overview
**NeuroLive** is a production-grade, real-time voice assistant architecture designed for extremely low latency and natural, full-duplex interactions. Leveraging the **Gemini 3 Flash Live API**, it allows users to interrupt the AI naturally, just like a human conversation.

The system bypasses traditional REST overhead by using a dedicated WebSocket pipeline for bidirectional PCM audio streaming.

## ✨ Key Features
- **⚡ Ultra-Low Latency**: End-to-end response times under 200ms using raw PCM/WebSocket transmission.
- **🗣️ Natural Interruption (Barge-in)**: Advanced Voice Activity Detection (VAD) handles interruptions immediately.
- **🎭 Multi-Persona System**: Choose between specialized profiles (Expert, Creative, Professional, etc.).
- **💬 Live Transcription**: Real-time visual feedback of both your speech and the AI's response.
- **🎚️ Adaptive Audio Pipeline**: Native browser AudioWorklets for high-performance audio processing without main-thread blocking.
- **📈 Real-time Metrics**: Monitor latency, jitter, and signal status directly from the dashboard.

## 🛠️ Tech Stack
- **Frontend**: React 18, Vite, Framer Motion (animations), Lucide Icons, Tailwind CSS.
- **Backend**: Node.js, Fastify for WebSocket orchestration.
- **LLM**: Gemini 3 Flash Live Preview.
- **Audio**: Web Audio API, PCM AudioWorklets (16kHz Capture / 24kHz Playback).

## 📦 Installation & Setup

### Prerequisites
- Node.js (v18+)
- A Google AI Studio API Key

### Local Development
1. **Clone the repository**:
   ```bash
   git clone https://github.com/Mayss/Live-Voice-Assistant.git
   cd Live-Voice-Assistant
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment**:
   Create a `.env.local` file in the root:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```
4. **Start the development server**:
   ```bash
   npm run dev
   ```

## 🗺️ Roadmap
For a detailed view of our future plans, check the [Full Roadmap](./ROADMAP.md).
- [x] Phase 1: Robust Audio Pipeline & Core Refactoring
- [ ] Phase 2: Multimodal Vision & Image Analysis
- [ ] Phase 3: Persistent Memory & Vector Database Integration
- [ ] Phase 4: Production Deployment & Scaling

## 📄 License
MIT License - Copyright (c) 2026 NeuroLive Team.
