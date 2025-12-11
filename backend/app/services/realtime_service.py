import asyncio
from typing import Dict, Set
from fastapi import WebSocket
import json
from datetime import datetime

from app.models.schemas import EmotionData, WebSocketMessage, EmotionType
from app.services.emotion_ai_service import emotion_service

class ConnectionManager:
    """Gestionnaire de connexions WebSocket pour le temps réel"""
    
    def __init__(self):
        # Connexions des superviseurs par team_id
        self.supervisor_connections: Dict[str, Set[WebSocket]] = {}
        # Connexions des agents par agent_id
        self.agent_connections: Dict[str, WebSocket] = {}
        # État des appels actifs
        self.active_calls: Dict[str, dict] = {}
        # Alertes actives
        self.active_alerts: Dict[str, int] = {}  # call_id -> durée en secondes
    
    async def connect_supervisor(self, websocket: WebSocket, team_id: str):
        """Connecter un superviseur"""
        await websocket.accept()
        if team_id not in self.supervisor_connections:
            self.supervisor_connections[team_id] = set()
        self.supervisor_connections[team_id].add(websocket)
    
    async def connect_agent(self, websocket: WebSocket, agent_id: str):
        """Connecter un agent"""
        await websocket.accept()
        self.agent_connections[agent_id] = websocket
    
    def disconnect_supervisor(self, websocket: WebSocket, team_id: str):
        """Déconnecter un superviseur"""
        if team_id in self.supervisor_connections:
            self.supervisor_connections[team_id].discard(websocket)
    
    def disconnect_agent(self, agent_id: str):
        """Déconnecter un agent"""
        if agent_id in self.agent_connections:
            del self.agent_connections[agent_id]
    
    async def broadcast_to_team(self, team_id: str, message: WebSocketMessage):
        """Envoyer un message à tous les superviseurs d'une équipe"""
        if team_id in self.supervisor_connections:
            message_json = message.model_dump_json()
            for connection in self.supervisor_connections[team_id]:
                try:
                    await connection.send_text(message_json)
                except Exception:
                    pass
    
    async def send_to_agent(self, agent_id: str, message: WebSocketMessage):
        """Envoyer un message à un agent spécifique"""
        if agent_id in self.agent_connections:
            try:
                await self.agent_connections[agent_id].send_text(
                    message.model_dump_json()
                )
            except Exception:
                pass
    
    async def start_call(self, call_id: str, agent_id: str, agent_name: str, team_id: str):
        """Démarrer un nouvel appel"""
        self.active_calls[call_id] = {
            "id": call_id,
            "agent_id": agent_id,
            "agent_name": agent_name,
            "team_id": team_id,
            "start_time": datetime.utcnow().isoformat(),
            "current_emotion": EmotionData(
                emotion=EmotionType.CALM,
                confidence=80,
                timestamp=0
            ).model_dump(),
            "emotion_history": [],
            "alert_triggered": False,
            "alert_duration": 0
        }
        
        await self.broadcast_to_team(team_id, WebSocketMessage(
            type="call_started",
            data=self.active_calls[call_id]
        ))
    
    async def end_call(self, call_id: str):
        """Terminer un appel"""
        if call_id in self.active_calls:
            call = self.active_calls[call_id]
            await self.broadcast_to_team(call["team_id"], WebSocketMessage(
                type="call_ended",
                data={"call_id": call_id}
            ))
            del self.active_calls[call_id]
            
        if call_id in self.active_alerts:
            del self.active_alerts[call_id]
    
    async def update_emotion(
        self, 
        call_id: str, 
        emotion_data: EmotionData
    ):
        """Mettre à jour l'émotion d'un appel"""
        if call_id not in self.active_calls:
            return
        
        call = self.active_calls[call_id]
        call["current_emotion"] = emotion_data.model_dump()
        call["emotion_history"].append(emotion_data.model_dump())
        
        # Vérifier les alertes (émotions négatives > 30s)
        is_negative = emotion_data.emotion in [EmotionType.ANGER, EmotionType.ANXIETY]
        
        if is_negative:
            if call_id not in self.active_alerts:
                self.active_alerts[call_id] = 0
            self.active_alerts[call_id] += 3  # +3 secondes par chunk
            
            if self.active_alerts[call_id] >= 30 and not call["alert_triggered"]:
                call["alert_triggered"] = True
                await self.broadcast_to_team(call["team_id"], WebSocketMessage(
                    type="alert",
                    data={
                        "call_id": call_id,
                        "agent_id": call["agent_id"],
                        "agent_name": call["agent_name"],
                        "emotion": emotion_data.emotion,
                        "duration": self.active_alerts[call_id]
                    }
                ))
        else:
            # Reset l'alerte si l'émotion redevient positive
            if call_id in self.active_alerts:
                self.active_alerts[call_id] = max(0, self.active_alerts[call_id] - 3)
        
        call["alert_duration"] = self.active_alerts.get(call_id, 0)
        
        # Broadcast la mise à jour
        await self.broadcast_to_team(call["team_id"], WebSocketMessage(
            type="emotion_update",
            data={
                "call_id": call_id,
                "emotion": emotion_data.model_dump(),
                "alert_triggered": call["alert_triggered"],
                "alert_duration": call["alert_duration"]
            }
        ))
    
    def get_active_calls_for_team(self, team_id: str) -> list:
        """Récupérer tous les appels actifs d'une équipe"""
        return [
            call for call in self.active_calls.values()
            if call["team_id"] == team_id
        ]


# Instance globale
manager = ConnectionManager()


async def process_realtime_audio(
    call_id: str,
    audio_data: bytes,
    timestamp: float
):
    """
    Traiter un chunk audio en temps réel.
    Appelé depuis le WebSocket ou l'API de streaming.
    """
    emotion_data = await emotion_service.analyze_realtime_chunk(audio_data)
    emotion_data.timestamp = timestamp
    
    await manager.update_emotion(call_id, emotion_data)
    
    return emotion_data
