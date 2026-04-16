# 🗺️ NeuroLive Roadmap 2026

General objective: Transitioning from a high-performance prototype to a specialized, state-aware multimodal AI assistant.

---

## 📍 Phase 1: Foundation & Stability (Q2 2026) - **IN PROGRESS**
Focus on reliability, audio quality, and codebase maintainability.

- [x] **Modular Architecture Refactoring**: Extracting independent components (Header, Sidebar, Types) for scalability.
- [x] **Low-Latency PCM Pipeline**: Stabilizing 16kHz capture and 24kHz playback sync.
- [ ] **Advanced Jitter Buffer**: Implement an adaptive buffer to handle network fluctuations without audio artifacts.
- [ ] **Acoustic Echo Cancellation (AEC) Tuning**: Fine-tune backend/frontend feedback loops to eliminate echo on speakerphone.
- [ ] **Dynamic VAD Sensitivity**: Allow users to adjust the interruption threshold manually for noisy environments.

---

## 📍 Phase 2: Multimodal & Context (Q3 2026)
Expanding the senses of the assistant beyond just voice.

- [ ] **Vision Integration**: Real-time camera stream support using Gemini's vision capabilities. "See what I see" mode.
- [ ] **File Context Injection**: Drag & drop support for PDFs/Images to guide the conversation.
- [ ] **Conversation Persistence**: Save sessions to a database (Supabase/PostgreSQL) with a historical browser.
- [ ] **Multi-Turn Context Management**: Improve the history window to maintain coherent long-term conversations.

---

## 📍 Phase 3: Personalization & Ecosystem (Q4 2026)
Tailoring the experience and opening it to other tools.

- [ ] **Custom Persona Builder**: UI to create, save, and share custom system prompts and voices.
- [ ] **Tool Calling (Function Calling)**: Allow NeuroLive to interact with external APIs (Weather, Calendar, Smart Home).
- [ ] **Authentication & Security**: Secure user accounts and production-ready rate limiting.
- [ ] **PWA Support**: Transform NeuroLive into a Progressive Web App for a native-like mobile experience.

---

## 📍 Phase 4: Intelligence & Analytics (2027)
Deep insights and model evolution.

- [ ] **Fine-tuned Audio Metrics**: Detailed analytics on Word Error Rate (WER) and Latency distributions.
- [ ] **Emotion Detection**: Integrate tonal analysis to respond with appropriate empathy levels.
- [ ] **Model Switching**: Support for Gemini 1.5 Pro or future Ultra models for complex reasoning tasks.

---

*Note: This roadmap is dynamic and will be updated based on community feedback and model updates from Google AI Studio.*
