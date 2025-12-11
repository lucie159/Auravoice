import asyncio
from passlib.context import CryptContext
from app.database.postgres import AsyncSessionLocal
from app.models.postgres_models import User
from sqlalchemy import select
import uuid

# Configuration du hachage de mot de passe (comme dans ton auth_service)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

async def create_super_admin():
    print(" Création du compte Administrateur...")
    
    # 1. Tes identifiants Admin
    ADMIN_EMAIL = "edenelucie@gmail.com"
    ADMIN_PASSWORD = "admin123"  # Change-le si tu veux
    ADMIN_NAME = "Edene Lucie"
    
    async with AsyncSessionLocal() as session:
        try:
            # 2. Vérifier s'il existe déjà
            result = await session.execute(select(User).where(User.email == ADMIN_EMAIL))
            existing_user = result.scalar_one_or_none()
            
            if existing_user:
                print(f"⚠️ L'utilisateur {ADMIN_EMAIL} existe déjà !")
                return

            # 3. Créer l'utilisateur
            new_admin = User(
                id=uuid.uuid4(),
                email=ADMIN_EMAIL,
                name=ADMIN_NAME,
                password_hash=get_password_hash(ADMIN_PASSWORD),
                role="supervisor",  # C'est ce rôle qui donne accès au Dashboard
                team_id="admin_team",
                status="offline"
            )
            
            session.add(new_admin)
            await session.commit()
            print(f"✅ Succès ! Admin créé : {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
            print("👉 Tu peux maintenant te connecter sur le Frontend.")
            
        except Exception as e:
            print(f"❌ Erreur : {e}")
            await session.rollback()

if __name__ == "__main__":
    # Lancer la fonction asynchrone
    asyncio.run(create_super_admin())