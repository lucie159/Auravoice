from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.schemas import UserLogin, Token, UserCreate, UserResponse
from app.services.auth_service import (
    verify_password, 
    hash_password, 
    create_access_token,
    get_current_user
)
from app.config import settings

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# ============================================
# ROUTES
# ============================================

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    """Authentification utilisateur"""
    
    if settings.database_type == "postgresql":
        from app.database.postgres import AsyncSessionLocal
        from app.models.postgres_models import User
        
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(User).where(User.email == credentials.email)
            )
            user = result.scalar_one_or_none()
            
            if not user or not verify_password(credentials.password, user.password_hash):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Email ou mot de passe incorrect"
                )
            
            token = create_access_token(str(user.id), user.role)
            
            return Token(
                access_token=token,
                user=UserResponse(
                    id=str(user.id),
                    email=user.email,
                    name=user.name,
                    role=user.role,
                    team_id=user.team_id,
                    avatar=user.avatar
                )
            )
    else:
        from app.database.mongodb import get_mongodb
        
        db = get_mongodb()
        user = await db.users.find_one({"email": credentials.email})
        
        if not user or not verify_password(credentials.password, user["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou mot de passe incorrect"
            )
        
        token = create_access_token(str(user["_id"]), user["role"])
        
        return Token(
            access_token=token,
            user=UserResponse(
                id=str(user["_id"]),
                email=user["email"],
                name=user["name"],
                role=user["role"],
                team_id=user["team_id"],
                avatar=user.get("avatar")
            )
        )


@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate):
    """Créer un nouvel utilisateur"""
    
    password_hash = hash_password(user_data.password)
    
    if settings.database_type == "postgresql":
        from app.database.postgres import AsyncSessionLocal
        from app.models.postgres_models import User
        import uuid
        
        async with AsyncSessionLocal() as session:
            # Vérifier si l'email existe déjà
            existing = await session.execute(
                select(User).where(User.email == user_data.email)
            )
            if existing.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cet email est déjà utilisé"
                )
            
            new_user = User(
                id=uuid.uuid4(),
                email=user_data.email,
                name=user_data.name,
                password_hash=password_hash,
                role=user_data.role,
                team_id="default"
            )
            
            session.add(new_user)
            await session.commit()
            await session.refresh(new_user)
            
            return UserResponse(
                id=str(new_user.id),
                email=new_user.email,
                name=new_user.name,
                role=new_user.role,
                team_id=new_user.team_id
            )
    else:
        from app.database.mongodb import get_mongodb
        from bson import ObjectId
        
        db = get_mongodb()
        
        # Vérifier si l'email existe
        existing = await db.users.find_one({"email": user_data.email})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cet email est déjà utilisé"
            )
        
        new_user = {
            "_id": ObjectId(),
            "email": user_data.email,
            "name": user_data.name,
            "password_hash": password_hash,
            "role": user_data.role,
            "team_id": user_data.team_id,
            "status": "offline"
        }
        
        await db.users.insert_one(new_user)
        
        return UserResponse(
            id=str(new_user["_id"]),
            email=new_user["email"],
            name=new_user["name"],
            role=new_user["role"],
            team_id=new_user["team_id"]
        )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Récupérer l'utilisateur courant"""
    
    if settings.database_type == "postgresql":
        from app.database.postgres import AsyncSessionLocal
        from app.models.postgres_models import User
        from uuid import UUID
        
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(User).where(User.id == UUID(current_user["id"]))
            )
            user = result.scalar_one_or_none()
            
            if not user:
                raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
            
            return UserResponse(
                id=str(user.id),
                email=user.email,
                name=user.name,
                role=user.role,
                team_id=user.team_id,
                avatar=user.avatar
            )
    else:
        from app.database.mongodb import get_mongodb
        from bson import ObjectId
        
        db = get_mongodb()
        user = await db.users.find_one({"_id": ObjectId(current_user["id"])})
        
        if not user:
            raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
        
        return UserResponse(
            id=str(user["_id"]),
            email=user["email"],
            name=user["name"],
            role=user["role"],
            team_id=user["team_id"],
            avatar=user.get("avatar")
        )
