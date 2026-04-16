<div align="center">
<img width="1200" height="475" alt="NeuroLive Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# 🧠 NeuroLive | Assistant Vocal IA Haute Performance
**Découvrez le futur de l'IA conversationnelle en full-duplex avec Gemini 3 Flash Live.**

[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/Fastify-000000?style=flat&logo=fastify&logoColor=white)](https://www.fastify.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

</div>

---

## 🚀 Présentation
**NeuroLive** est une architecture d'assistant vocal de qualité production, conçue pour une latence extrêmement faible et des interactions naturelles en full-duplex. En utilisant l'API **Gemini 3 Flash Live**, il permet aux utilisateurs d'interrompre l'IA naturellement, tout comme dans une conversation humaine.

Le système contourne les limitations traditionnelles du REST en utilisant un pipeline WebSocket dédié pour le streaming audio bidirectionnel en PCM.

## ✨ Fonctionnalités Clés
- **⚡ Latence Ultra-Faible** : Temps de réponse de bout en bout inférieur à 200ms grâce à la transmission brute PCM/WebSocket.
- **🗣️ Interruption Naturelle (Barge-in)** : Détection d'activité vocale (VAD) avancée qui gère les interruptions immédiatement.
- **🎭 Système Multi-Personnalités** : Choisissez entre des profils spécialisés (Expert, Créatif, Professionnel, etc.).
- **💬 Transcription en Direct** : Feedback visuel en temps réel de votre parole et de la réponse de l'IA.
- **🎚️ Pipeline Audio Adaptatif** : AudioWorklets natifs pour un traitement audio haute performance sans bloquer le thread principal.
- **📈 Métriques en Temps Réel** : Suivez la latence, le jitter et l'état de la connexion directement depuis l'interface.

## 🛠️ Stack Technique
- **Frontend** : React 18, Vite, Framer Motion (animations), Lucide Icons, Tailwind CSS.
- **Backend** : Node.js, Fastify pour l'orchestration des WebSockets.
- **LLM** : Gemini 3 Flash Live Preview.
- **Audio** : Web Audio API, PCM AudioWorklets (Capture 16kHz / Lecture 24kHz).

## 📦 Installation et Configuration

### Prérequis
- Node.js (v18+)
- Une clé API Google AI Studio

### Développement Local
1. **Cloner le dépôt** :
   ```bash
   git clone https://github.com/Mayss/Live-Voice-Assistant.git
   cd Live-Voice-Assistant
   ```
2. **Installer les dépendances** :
   ```bash
   npm install
   ```
3. **Configurer l'Environnement** :
   Créez un fichier `.env.local` à la racine :
   ```env
   GEMINI_API_KEY=votre_cle_api_ici
   ```
4. **Lancer le serveur de développement** :
   ```bash
   npm run dev
   ```

## 🗺️ Feuille de Route (Roadmap)
Pour une vue détaillée de nos plans futurs, consultez la [Feuille de Route Complète](./ROADMAP.md).
- [x] Phase 1 : Pipeline Audio Robuste et Refactorisation du Core
- [ ] Phase 2 : Vision Multimodale et Analyse d'Images
- [ ] Phase 3 : Mémoire Persistante et Intégration de Base de Données Vectorielle
- [ ] Phase 4 : Déploiement en Production et Mise à l'Échelle

## 📄 Licence
Licence MIT - Copyright (c) 2026 Équipe NeuroLive.
