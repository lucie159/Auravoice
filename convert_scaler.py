import pickle
import base64
import os

# Chemin vers ton fichier scaler original (adapte si besoin)
input_path = "backend/app/models/scaler.pkl" 
# Chemin de sortie pour la version texte
output_path = "backend/app/models/scaler_b64.txt"

if not os.path.exists(input_path):
    # Essayer avec le nom v2 si le v1 n'existe plus
    input_path = "backend/app/models/scaler_v2.pkl"

print(f"Lecture de : {input_path}")

try:
    with open(input_path, "rb") as f:
        data = f.read()
        
    # Encodage en texte (Base64)
    b64_data = base64.b64encode(data).decode("utf-8")
    
    with open(output_path, "w") as f:
        f.write(b64_data)
        
    print(f"✅ SUCCÈS ! Fichier créé : {output_path}")
    print("Tu peux maintenant pousser ce fichier .txt sur Git.")
except Exception as e:
    print(f"❌ Erreur : {e}")