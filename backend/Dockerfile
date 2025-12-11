# backend/Dockerfile

# 1. Image de base (Python 3.10)
FROM python:3.10-slim

# 2. Installation des dépendances système (ffmpeg pour l'audio)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# 3. Dossier de travail
WORKDIR /app

# 4. Copie des requirements
COPY requirements.txt .

# 5. --- ASTUCE CRITIQUE POUR RENDER ---
# On installe d'abord PyTorch version CPU (beaucoup plus léger)
# Cela évite de télécharger la version GPU qui fait 2Go et fait planter le build
RUN pip install --no-cache-dir torch torchaudio --index-url https://download.pytorch.org/whl/cpu

# 6. Ensuite on installe le reste
RUN pip install --no-cache-dir -r requirements.txt

# 7. Copie du code
COPY . .

# 8. Création des dossiers nécessaires (permissions)
RUN mkdir -p uploads temp_uploads && chmod 777 uploads temp_uploads

# 9. Commande de démarrage
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]