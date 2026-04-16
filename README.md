# 🧠 NeuroLive — Live Architect

<div align="center">
  <img width="1200" height="475" alt="NeuroLive Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
  
  [![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![Gemini](https://img.shields.io/badge/Gemini_3.1-4285F4?style=for-the-badge&logo=google-gemini&logoColor=white)](https://aistudio.google.com/)
</div>

---

NeuroLive est une application de pointe démontrant les capacités du modèle **Gemini 3.1 Flash Live**. Elle permet une interaction vocale en temps réel, bidirectionnelle et sans interruption (full-duplex) avec un assistant nommé **Laura**.

## ✨ Caractéristiques Principales

- **🎙️ Interaction Full-Duplex** : Parlez et écoutez simultanément. L'IA peut être interrompue à tout moment pour une conversation naturelle.
- **🤖 Assistant "Laura"** : Propulsée par un prompt système robuste et modulaire situé dans `src/lib/systemPrompt.ts`.
- **🎭 Personnalités Dynamiques** : Choisissez parmi plusieurs personas (Expert, Amical, Pro, Créatif, Direct) ou ajoutez des traits personnalisés.
- **⚡ Performance Extrême** : Latence E2E optimisée (~150ms) via WebSocket et flux audio PCM brut (16kHz).
- **💎 Design Premium** : Interface sombre moderne, animations via Framer Motion et icônes Lucide.
- **🛡️ Architecture Robuste** : Backend Node.js/Express gérant la signalisation et la communication sécurisée avec l'API Gemini.

## 🛠️ Stack Technique

### Frontend
- **React 19** & **Vite 6**
- **Tailwind CSS v4** (Design system moderne)
- **Framer Motion** (Micro-animations interactives)
- **Web Audio API** (Capture PCM et streaming basse latence)

### Backend
- **Node.js** (Runtime)
- **Express** (Serveur API & Middleware Vite)
- **ws (WebSocket)** (Communication temps réel)
- **@google/genai** (SDK officiel Gemini)

## 🚀 Installation Rapide

**Prérequis :** Node.js v18+ 

1. **Cloner le projet** :
   ```bash
   git clone https://github.com/Mayss/Live-Voice-Assistant.git
   cd Live-Voice-Assistant
   ```

2. **Installer les dépendances** :
   ```bash
   npm install
   ```

3. **Configuration** :
   Créez ou modifiez le fichier `.env.local` à la racine :
   ```env
   GEMINI_API_KEY=VOTRE_CLE_API_GEMINI
   PORT=3000
   ```

4. **Lancer en mode développement** :
   ```bash
   npm run dev
   ```
   Accédez à `http://localhost:3000`.

## 📂 Structure du Projet

```text
├── src/
│   ├── components/       # Composants React (PromptConfig, UI elements)
│   ├── lib/              # Logique métier (audioUtils, systemPrompt)
│   ├── App.tsx           # Point d'entrée Frontend & gestion d'état
│   └── main.tsx          # Montage React
├── server.ts             # Serveur Express & Orchestrateur WebSocket
├── skills/               # (Optionnel) Modules de compétences spécialisés
└── config/               # Configurations globales
```

## 🧠 Configuration du Prompt Système

Le comportement de l'assistant est défini de manière "en dure" dans `src/lib/systemPrompt.ts`. Ce fichier permet de garantir que l'IA conserve une identité constante (**Laura**) et suit des directives de concision et de fluidité vocale indispensables pour une expérience temps réel.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une Issue ou une Pull Request pour suggérer des améliorations (VAD amélioré, support multilingue dynamique, etc.).

---

<p align="center">Développé avec ❤️ pour l'écosystème Gemini Live Architect.</p>
