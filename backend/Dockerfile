# backend/Dockerfile

# 1. Image de base
FROM python:3.10-slim

# 2. Augmenter le timeout pour éviter les erreurs de réseau lent
ENV PIP_DEFAULT_TIMEOUT=1000

# 3. Installation des dépendances système (On ajoute g++ et make pour la compilation)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    gcc \
    g++ \
    make \
    && rm -rf /var/lib/apt/lists/*

# 4. Dossier de travail
WORKDIR /app

# 5. Copie des requirements (SANS torch dedans !)
COPY requirements.txt .

# 6. Mise à jour de pip (important pour gérer les gros fichiers)
RUN pip install --upgrade pip

# 7. --- ÉTAPE CRITIQUE : INSTALLATION PYTORCH ---
# On l'installe SEUL avant le reste pour gérer la mémoire.
# On force la version CPU (https://download.pytorch.org/whl/cpu)
# --no-cache-dir est vital pour ne pas stocker le fichier de 200Mo en cache RAM
RUN pip install --no-cache-dir torch==2.1.2 torchaudio==2.1.2 --index-url https://download.pytorch.org/whl/cpu

# 8. Installation du reste des dépendances
RUN pip install --no-cache-dir -r requirements.txt

# 9. Copie du code
COPY . .

# 10. Création des dossiers
RUN mkdir -p uploads temp_uploads && chmod 777 uploads temp_uploads

# 11. Démarrage
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]