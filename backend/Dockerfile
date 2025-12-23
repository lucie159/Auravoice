
# 1. Image de base
FROM python:3.10-slim

# 2. Installation des dépendances système
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# 3. Création utilisateur (OBLIGATOIRE pour Hugging Face)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

# 4. Dossier de travail
WORKDIR $HOME/app

# 5. Copie et installation des dépendances
COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# 6. Copie du code source
COPY --chown=user . .

# 7. Création des dossiers temporaires
RUN mkdir -p uploads temp_uploads

# 8. Exposition du port 7860 (Standard Hugging Face)
EXPOSE 7860

# 9. Démarrage de l'application sur le port 7860
# ATTENTION : On utilise bien 7860 ici pour la compatibilité Hugging Face
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]