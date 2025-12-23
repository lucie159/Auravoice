---
title: AuraVoice Backend
emoji: 🎙️
colorFrom: purple
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# AuraVoice Backend  

Backend FastAPI pour le copilote émotionnel AuraVoice.
Hébergé sur Hugging Face Spaces via Docker.

## Démarrage Rapide

### Option 1: Docker (Recommandé)

```bash
# Démarrer avec PostgreSQL
docker-compose up -d

# Ou avec MongoDB
DATABASE_TYPE=mongodb docker-compose up -d
Option 2: Installation Manuelle
code
Bash
# Créer l'environnement virtuel
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou: venv\Scripts\activate  # Windows

# Installer les dépendances
pip install -r requirements.txt

# Copier et configurer .env
cp .env.example .env
# Éditer .env avec vos paramètres

# Démarrer le serveur
python -m app.main
Structure
code
Code
backend/
├── app/
│   ├── config.py           # Configuration
│   ├── main.py             # Point d'entrée FastAPI
│   ├── database/           # Connexions PostgreSQL/MongoDB
│   ├── models/             # Schémas Pydantic et modèles ORM
│   ├── routers/            # Routes API
│   └── services/           # Services métier
├── models/                 # Placez votre modèle IA ici
├── uploads/                # Fichiers audio temporaires
├── requirements.txt
├── Dockerfile
└── docker-compose.yml
🔌 Intégration de Votre Modèle IA
Option Actuelle : Modèle TensorFlow (.keras)
Le projet est configuré pour utiliser un modèle TensorFlow personnalisé.
Placez votre modèle dans app/models/speech_emotion_model.keras
Placez le scaler dans app/models/scaler.pkl
Le service app/services/emotion_ai.py gère le chargement et la prédiction.
📡 API Endpoints
Authentification
POST /api/auth/login - Connexion
POST /api/auth/register - Inscription
GET /api/auth/me - Utilisateur courant
Appels
GET /api/calls/active - Appels en cours (superviseur)
POST /api/calls/start - Démarrer un appel
POST /api/calls/{id}/end - Terminer un appel
Analyse
POST /api/analyze/upload - Analyser un fichier audio
Rapports
GET /api/reports - Liste des rapports (avec filtres)
POST /api/reports - Créer un rapport
GET /api/reports/{id} - Détail d'un rapport
WebSocket
WS /ws/supervisor?token=...&team_id=... - Temps réel superviseur
WS /ws/agent?token=...&agent_id=... - Temps réel agent
🔧 Configuration Frontend
Mettez à jour le frontend pour pointer vers ce backend:
code
Env
# Dans le frontend Next.js
NEXT_PUBLIC_API_URL=https://votre-espace-huggingface.hf.space
NEXT_PUBLIC_USE_REAL_API=true
📊 Base de Données
PostgreSQL (Recommandé pour la production)
code
SQL
-- Les tables sont créées automatiquement au démarrage
-- Voir app/models/postgres_models.py pour le schéma