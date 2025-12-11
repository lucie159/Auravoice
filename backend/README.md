# AuraVoice Backend

Backend FastAPI pour le copilote émotionnel AuraVoice.

## 🚀 Démarrage Rapide

### Option 1: Docker (Recommandé)

\`\`\`bash
# Démarrer avec PostgreSQL
docker-compose up -d

# Ou avec MongoDB
DATABASE_TYPE=mongodb docker-compose up -d
\`\`\`

### Option 2: Installation Manuelle

\`\`\`bash
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
\`\`\`

## 📁 Structure

\`\`\`
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
\`\`\`

## 🔌 Intégration de Votre Modèle IA

### Option 1: Modèle ONNX Local

1. Placez votre modèle dans `models/emotion_model.onnx`
2. Éditez `app/services/emotion_ai_service.py`:
   - Adaptez la méthode `predict()` de `ONNXEmotionModel`
   - Ajustez le prétraitement selon votre modèle
   - Modifiez le mapping des sorties

\`\`\`python
# Dans ONNXEmotionModel.predict():
# 1. Prétraitement audio (mel-spectrogramme, MFCC, etc.)
# 2. Format d'entrée de votre modèle
# 3. Mapping des sorties vers EmotionType
\`\`\`

3. Configurez `.env`:
\`\`\`env
EMOTION_MODEL_TYPE=local
EMOTION_MODEL_PATH=./models/emotion_model.onnx
\`\`\`

### Option 2: Modèle HuggingFace

1. Configurez `.env`:
\`\`\`env
EMOTION_MODEL_TYPE=huggingface
EMOTION_MODEL_NAME=superb/wav2vec2-base-superb-er
\`\`\`

2. Adaptez le mapping des labels si nécessaire dans `HuggingFaceEmotionModel._map_label_to_emotion()`

### Option 3: API Externe

Créez une nouvelle classe héritant de `EmotionModelBase`:

\`\`\`python
class APIEmotionModel(EmotionModelBase):
    async def predict(self, audio_chunk, sample_rate):
        # Appeler votre API
        response = await httpx.post("https://your-api.com/predict", ...)
        return EmotionType(response["emotion"]), response["confidence"]
\`\`\`

## 📡 API Endpoints

### Authentification
- `POST /api/auth/login` - Connexion
- `POST /api/auth/register` - Inscription
- `GET /api/auth/me` - Utilisateur courant

### Appels
- `GET /api/calls/active` - Appels en cours (superviseur)
- `POST /api/calls/start` - Démarrer un appel
- `POST /api/calls/{id}/end` - Terminer un appel

### Analyse
- `POST /api/analyze` - Analyser un fichier audio

### Rapports
- `GET /api/reports` - Liste des rapports (avec filtres)
- `POST /api/reports` - Créer un rapport
- `GET /api/reports/{id}` - Détail d'un rapport

### WebSocket
- `WS /ws/supervisor?token=...&team_id=...` - Temps réel superviseur
- `WS /ws/agent?token=...&agent_id=...` - Temps réel agent

## 🔧 Configuration Frontend

Mettez à jour le frontend pour pointer vers ce backend:

\`\`\`env
# Dans le frontend Next.js
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_USE_REAL_API=true
\`\`\`

## 📊 Base de Données

### PostgreSQL (Recommandé pour la production)
\`\`\`sql
-- Les tables sont créées automatiquement au démarrage
-- Voir app/models/postgres_models.py pour le schéma
\`\`\`

### MongoDB (Alternative NoSQL)
\`\`\`javascript
// Collections créées automatiquement:
// - users
// - call_reports  
// - active_calls
\`\`\`

## 🔒 Sécurité

- Les mots de passe sont hashés avec bcrypt
- Authentification JWT avec expiration configurable
- CORS configuré pour le frontend
- Validation des fichiers audio uploadés
