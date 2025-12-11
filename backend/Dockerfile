# backend/Dockerfile

# 1. Image de base légère (Linux)
FROM python:3.10-slim

# 2. Installation des dépendances système (C'est ça qui règle les problèmes de DLL/ffmpeg !)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

# 3. Dossier de travail
WORKDIR /app

# 4. Copie des requirements
COPY requirements.txt .

# 5. Installation des librairies Python
# On ajoute --no-cache-dir pour alléger l'image
RUN pip install --no-cache-dir -r requirements.txt

# 6. Copie du code
COPY . .

# 7. Création des dossiers nécessaires
RUN mkdir -p uploads temp_uploads

# 8. Exposition du port
EXPOSE 8000

# 9. Commande de démarrage
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]