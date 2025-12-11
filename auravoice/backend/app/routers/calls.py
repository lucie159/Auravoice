from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from typing import List, Optional
from datetime import datetime
import uuid
import aiofiles
import os

from app.models.schemas import (
    ActiveCall, CallReportCreate, CallReportResponse, 
    ReportFilters, EmotionData, CallStats
)
from app.services.auth_service import get_current_user, require_supervisor
from app.services.realtime_service import manager
from app.services.emotion_ai_service import emotion_service
from app.config import settings

router = APIRouter(prefix="/api", tags=["Calls"])

# ============================================
# APPELS ACTIFS (Temps Réel)
# ============================================

@router.get("/calls/active", response_model=List[ActiveCall])
async def get_active_calls(current_user: dict = Depends(require_supervisor)):
    """Récupérer tous les appels actifs (superviseurs uniquement)"""
    
    # Récupérer le team_id de l'utilisateur
    if settings.database_type == "postgresql":
        from app.database.postgres import AsyncSessionLocal
        from app.models.postgres_models import User
        from uuid import UUID
        
        async with AsyncSessionLocal() as session:
            from sqlalchemy import select
            result = await session.execute(
                select(User).where(User.id == UUID(current_user["id"]))
            )
            user = result.scalar_one_or_none()
            team_id = user.team_id if user else "default"
    else:
        from app.database.mongodb import get_mongodb
        from bson import ObjectId
        
        db = get_mongodb()
        user = await db.users.find_one({"_id": ObjectId(current_user["id"])})
        team_id = user["team_id"] if user else "default"
    
    # Récupérer les appels actifs
    calls = manager.get_active_calls_for_team(team_id)
    
    return [
        ActiveCall(
            id=call["id"],
            agent_id=call["agent_id"],
            agent_name=call["agent_name"],
            start_time=datetime.fromisoformat(call["start_time"]),
            current_emotion=EmotionData(**call["current_emotion"]),
            emotion_history=[EmotionData(**e) for e in call["emotion_history"]],
            alert_triggered=call["alert_triggered"],
            alert_duration=call["alert_duration"]
        )
        for call in calls
    ]


@router.post("/calls/start")
async def start_call(
    agent_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Démarrer un nouvel appel"""
    call_id = str(uuid.uuid4())
    
    # Récupérer les infos de l'agent
    if settings.database_type == "postgresql":
        from app.database.postgres import AsyncSessionLocal
        from app.models.postgres_models import User
        from uuid import UUID
        
        async with AsyncSessionLocal() as session:
            from sqlalchemy import select
            result = await session.execute(
                select(User).where(User.id == UUID(agent_id))
            )
            agent = result.scalar_one_or_none()
            agent_name = agent.name if agent else "Agent"
            team_id = agent.team_id if agent else "default"
    else:
        from app.database.mongodb import get_mongodb
        from bson import ObjectId
        
        db = get_mongodb()
        agent = await db.users.find_one({"_id": ObjectId(agent_id)})
        agent_name = agent["name"] if agent else "Agent"
        team_id = agent["team_id"] if agent else "default"
    
    await manager.start_call(call_id, agent_id, agent_name, team_id)
    
    return {"call_id": call_id, "message": "Appel démarré"}


@router.post("/calls/{call_id}/end")
async def end_call(
    call_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Terminer un appel"""
    await manager.end_call(call_id)
    return {"message": "Appel terminé"}


# ============================================
# ANALYSE AUDIO
# ============================================

@router.post("/analyze")
async def analyze_audio(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Analyser un fichier audio uploadé"""
    
    # Vérifier le type de fichier
    if not file.filename.lower().endswith(('.wav', '.mp3', '.m4a', '.ogg')):
        raise HTTPException(
            status_code=400,
            detail="Format de fichier non supporté. Utilisez WAV, MP3, M4A ou OGG."
        )
    
    # Sauvegarder le fichier temporairement
    os.makedirs(settings.upload_dir, exist_ok=True)
    file_path = os.path.join(settings.upload_dir, f"{uuid.uuid4()}_{file.filename}")
    
    async with aiofiles.open(file_path, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    try:
        # Analyser l'audio
        result = await emotion_service.analyze_audio_file(file_path)
        
        return {
            "client_emotions": [e.model_dump() for e in result["client_emotions"]],
            "agent_emotions": [e.model_dump() for e in result["agent_emotions"]],
            "dominant_emotion": result["dominant_emotion"],
            "stats": result["stats"]
        }
    finally:
        # Nettoyer le fichier temporaire
        if os.path.exists(file_path):
            os.unlink(file_path)


# ============================================
# RAPPORTS
# ============================================

@router.get("/reports", response_model=List[CallReportResponse])
async def get_reports(
    agent_id: Optional[str] = None,
    emotion: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    current_user: dict = Depends(get_current_user)
):
    """Récupérer les rapports d'appels avec filtres"""
    
    if settings.database_type == "postgresql":
        from app.database.postgres import AsyncSessionLocal
        from app.models.postgres_models import CallReport, User
        from sqlalchemy import select, and_
        from uuid import UUID
        
        async with AsyncSessionLocal() as session:
            # Construire la requête avec filtres
            query = select(CallReport, User.name).join(User)
            
            conditions = []
            
            # Filtrer par team si agent
            if current_user["role"] == "agent":
                conditions.append(CallReport.agent_id == UUID(current_user["id"]))
            elif agent_id:
                conditions.append(CallReport.agent_id == UUID(agent_id))
            
            if emotion:
                conditions.append(CallReport.dominant_emotion == emotion)
            
            if date_from:
                conditions.append(CallReport.date >= date_from)
            
            if date_to:
                conditions.append(CallReport.date <= date_to)
            
            if conditions:
                query = query.where(and_(*conditions))
            
            query = query.order_by(CallReport.date.desc()).limit(100)
            
            result = await session.execute(query)
            reports = result.all()
            
            return [
                CallReportResponse(
                    id=str(report.id),
                    agent_id=str(report.agent_id),
                    agent_name=agent_name,
                    date=report.date,
                    duration=report.duration,
                    audio_url=report.audio_url,
                    client_emotions=[EmotionData(**e) for e in report.client_emotions],
                    agent_emotions=[EmotionData(**e) for e in report.agent_emotions],
                    dominant_emotion=report.dominant_emotion,
                    stats=CallStats(
                        anger_percentage=report.anger_percentage,
                        joy_percentage=report.joy_percentage,
                        calm_percentage=report.calm_percentage,
                        anxiety_percentage=report.anxiety_percentage,
                        surprise_percentage=report.surprise_percentage,
                        sadness_percentage=report.sadness_percentage,
                        average_confidence=report.average_confidence
                    )
                )
                for report, agent_name in reports
            ]
    else:
        from app.database.mongodb import get_mongodb
        from bson import ObjectId
        
        db = get_mongodb()
        
        # Construire le filtre
        filter_query = {}
        
        if current_user["role"] == "agent":
            filter_query["agent_id"] = current_user["id"]
        elif agent_id:
            filter_query["agent_id"] = agent_id
        
        if emotion:
            filter_query["dominant_emotion"] = emotion
        
        if date_from or date_to:
            filter_query["date"] = {}
            if date_from:
                filter_query["date"]["$gte"] = date_from
            if date_to:
                filter_query["date"]["$lte"] = date_to
        
        cursor = db.call_reports.find(filter_query).sort("date", -1).limit(100)
        reports = await cursor.to_list(length=100)
        
        return [
            CallReportResponse(
                id=str(report["_id"]),
                agent_id=report["agent_id"],
                agent_name=report["agent_name"],
                date=report["date"],
                duration=report["duration"],
                audio_url=report.get("audio_url"),
                client_emotions=[EmotionData(**e) for e in report["client_emotions"]],
                agent_emotions=[EmotionData(**e) for e in report["agent_emotions"]],
                dominant_emotion=report["dominant_emotion"],
                stats=CallStats(**report["stats"])
            )
            for report in reports
        ]


@router.post("/reports", response_model=CallReportResponse)
async def create_report(
    report_data: CallReportCreate,
    current_user: dict = Depends(get_current_user)
):
    """Créer un nouveau rapport d'appel"""
    
    # Calculer les stats
    stats = emotion_service._calculate_stats(report_data.client_emotions)
    dominant = emotion_service._get_dominant_emotion(report_data.client_emotions)
    
    if settings.database_type == "postgresql":
        from app.database.postgres import AsyncSessionLocal
        from app.models.postgres_models import CallReport, User
        from sqlalchemy import select
        from uuid import UUID
        import uuid as uuid_lib
        
        async with AsyncSessionLocal() as session:
            # Récupérer le nom de l'agent
            result = await session.execute(
                select(User).where(User.id == UUID(report_data.agent_id))
            )
            agent = result.scalar_one_or_none()
            agent_name = agent.name if agent else "Agent"
            
            new_report = CallReport(
                id=uuid_lib.uuid4(),
                agent_id=UUID(report_data.agent_id),
                duration=report_data.duration,
                audio_url=report_data.audio_url,
                client_emotions=[e.model_dump() for e in report_data.client_emotions],
                agent_emotions=[e.model_dump() for e in report_data.agent_emotions],
                dominant_emotion=dominant,
                **stats
            )
            
            session.add(new_report)
            await session.commit()
            await session.refresh(new_report)
            
            return CallReportResponse(
                id=str(new_report.id),
                agent_id=str(new_report.agent_id),
                agent_name=agent_name,
                date=new_report.date,
                duration=new_report.duration,
                audio_url=new_report.audio_url,
                client_emotions=report_data.client_emotions,
                agent_emotions=report_data.agent_emotions,
                dominant_emotion=dominant,
                stats=CallStats(**stats)
            )
    else:
        from app.database.mongodb import get_mongodb
        from bson import ObjectId
        
        db = get_mongodb()
        
        # Récupérer le nom de l'agent
        agent = await db.users.find_one({"_id": ObjectId(report_data.agent_id)})
        agent_name = agent["name"] if agent else "Agent"
        
        new_report = {
            "_id": ObjectId(),
            "agent_id": report_data.agent_id,
            "agent_name": agent_name,
            "date": datetime.utcnow(),
            "duration": report_data.duration,
            "audio_url": report_data.audio_url,
            "client_emotions": [e.model_dump() for e in report_data.client_emotions],
            "agent_emotions": [e.model_dump() for e in report_data.agent_emotions],
            "dominant_emotion": dominant,
            "stats": stats
        }
        
        await db.call_reports.insert_one(new_report)
        
        return CallReportResponse(
            id=str(new_report["_id"]),
            agent_id=new_report["agent_id"],
            agent_name=agent_name,
            date=new_report["date"],
            duration=new_report["duration"],
            audio_url=new_report["audio_url"],
            client_emotions=report_data.client_emotions,
            agent_emotions=report_data.agent_emotions,
            dominant_emotion=dominant,
            stats=CallStats(**stats)
        )


@router.get("/reports/{report_id}", response_model=CallReportResponse)
async def get_report(
    report_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Récupérer un rapport spécifique"""
    
    if settings.database_type == "postgresql":
        from app.database.postgres import AsyncSessionLocal
        from app.models.postgres_models import CallReport, User
        from sqlalchemy import select
        from uuid import UUID
        
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(CallReport, User.name)
                .join(User)
                .where(CallReport.id == UUID(report_id))
            )
            row = result.one_or_none()
            
            if not row:
                raise HTTPException(status_code=404, detail="Rapport non trouvé")
            
            report, agent_name = row
            
            return CallReportResponse(
                id=str(report.id),
                agent_id=str(report.agent_id),
                agent_name=agent_name,
                date=report.date,
                duration=report.duration,
                audio_url=report.audio_url,
                client_emotions=[EmotionData(**e) for e in report.client_emotions],
                agent_emotions=[EmotionData(**e) for e in report.agent_emotions],
                dominant_emotion=report.dominant_emotion,
                stats=CallStats(
                    anger_percentage=report.anger_percentage,
                    joy_percentage=report.joy_percentage,
                    calm_percentage=report.calm_percentage,
                    anxiety_percentage=report.anxiety_percentage,
                    surprise_percentage=report.surprise_percentage,
                    sadness_percentage=report.sadness_percentage,
                    average_confidence=report.average_confidence
                )
            )
    else:
        from app.database.mongodb import get_mongodb
        from bson import ObjectId
        
        db = get_mongodb()
        report = await db.call_reports.find_one({"_id": ObjectId(report_id)})
        
        if not report:
            raise HTTPException(status_code=404, detail="Rapport non trouvé")
        
        return CallReportResponse(
            id=str(report["_id"]),
            agent_id=report["agent_id"],
            agent_name=report["agent_name"],
            date=report["date"],
            duration=report["duration"],
            audio_url=report.get("audio_url"),
            client_emotions=[EmotionData(**e) for e in report["client_emotions"]],
            agent_emotions=[EmotionData(**e) for e in report["agent_emotions"]],
            dominant_emotion=report["dominant_emotion"],
            stats=CallStats(**report["stats"])
        )
