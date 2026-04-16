# 🗺️ Feuille de Route NeuroLive 2026

Objectif général : Transition d'un prototype haute performance vers un assistant IA multimodal spécialisé et conscient du contexte.

---

## 📍 Phase 1 : Fondations et Stabilité (T2 2026) - **EN COURS**
Focus sur la fiabilité, la qualité audio et la maintenabilité du code.

- [x] **Refactorisation de l'Architecture Modulaire** : Extraction de composants indépendants (Header, Sidebar, Types) pour l'évolutivité.
- [x] **Pipeline PCM Faible Latence** : Stabilisation de la capture 16kHz et de la lecture 24kHz.
- [ ] **Buffer de Jitter Avancé** : Implémenter un buffer adaptatif pour gérer les fluctuations réseau sans artefacts audio.
- [ ] **Optimisation de l'Annulation d'Écho (AEC)** : Ajuster les boucles de rétroaction pour éliminer l'écho sur haut-parleur.
- [ ] **Sensibilité VAD Dynamique** : Permettre aux utilisateurs d'ajuster manuellement le seuil d'interruption pour les environnements bruyants.

---

## 📍 Phase 2 : Multimodalité et Contexte (T3 2026)
Étendre les sens de l'assistant au-delà de la simple voix.

- [ ] **Intégration de la Vision** : Support du flux caméra en temps réel via les capacités de vision de Gemini. Mode "Vois ce que je vois".
- [ ] **Injection de Contexte par Fichier** : Support du glisser-déposer pour les PDF/Images afin de guider la conversation.
- [ ] **Persistance de la Conversation** : Sauvegarde des sessions dans une base de données (Supabase/PostgreSQL) avec un historique complet.
- [ ] **Gestion du Contexte Multi-tours** : Améliorer la fenêtre d'historique pour maintenir des conversations cohérentes sur le long terme.

---

## 📍 Phase 3 : Personnalisation et Écosystème (T4 2026)
Adapter l'expérience et l'ouvrir à d'autres outils.

- [ ] **Créateur de Personnalités Personnalisées** : Interface pour créer, sauvegarder et partager des prompts système et des voix personnalisés.
- [ ] **Appels d'Outils (Function Calling)** : Permettre à NeuroLive d'interagir avec des API externes (Météo, Calendrier, Domotique).
- [ ] **Authentification et Sécurité** : Comptes utilisateurs sécurisés et limitation de débit (rate limiting) pour la production.
- [ ] **Support PWA** : Transformer NeuroLive en Progressive Web App pour une expérience mobile native.

---

## 📍 Phase 4 : Intelligence et Analyses (2027)
Insights profonds et évolution du modèle.

- [ ] **Métriques Audio Précises** : Analyses détaillées sur le taux d'erreur de mot (WER) et les distributions de latence.
- [ ] **Détection des Émotions** : Intégrer l'analyse tonale pour répondre avec des niveaux d'empathie appropriés.
- [ ] **Changement de Modèle** : Support de Gemini 1.5 Pro ou des futurs modèles Ultra pour les tâches de raisonnement complexes.

---

*Note : Cette feuille de route est dynamique et sera mise à jour en fonction des retours de la communauté et des mises à jour des modèles Google AI Studio.*
