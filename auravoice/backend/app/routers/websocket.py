from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from typing import Optional
import json

from app.services.realtime_service import manager, process_realtime_audio
from app.services.auth_service import decode_token

router = APIRouter(tags=["WebSocket"])

@router.websocket("/ws/supervisor")
async def supervisor_websocket(
    websocket: WebSocket,
    token: str = Query(...),
    team_id: str = Query(...)
):
    """
    WebSocket pour les superviseurs.
    Reçoit les mises à jour en temps réel de tous les appels de l'équipe.
    """
    # Vérifier le token
    try:
        payload = decode_token(token)
        if payload.get("role") != "supervisor":
            await websocket.close(code=4003, reason="Accès non autorisé")
            return
    except Exception:
        await websocket.close(code=4001, reason="Token invalide")
        return
    
    await manager.connect_supervisor(websocket, team_id)
    
    try:
        # Envoyer l'état initial des appels actifs
        active_calls = manager.get_active_calls_for_team(team_id)
        await websocket.send_json({
            "type": "initial_state",
            "data": {"calls": active_calls}
        })
        
        while True:
            # Garder la connexion ouverte et traiter les messages
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Traiter les commandes du superviseur si nécessaire
            if message.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
    
    except WebSocketDisconnect:
        manager.disconnect_supervisor(websocket, team_id)


@router.websocket("/ws/agent")
async def agent_websocket(
    websocket: WebSocket,
    token: str = Query(...),
    agent_id: str = Query(...)
):
    """
    WebSocket pour les agents.
    Envoie les données audio en temps réel et reçoit les feedbacks.
    """
    # Vérifier le token
    try:
        payload = decode_token(token)
    except Exception:
        await websocket.close(code=4001, reason="Token invalide")
        return
    
    await manager.connect_agent(websocket, agent_id)
    
    try:
        while True:
            # Recevoir les données audio en binaire
            data = await websocket.receive()
            
            if "bytes" in data:
                # Données audio binaires
                audio_bytes = data["bytes"]
                
                # Extraire le call_id et timestamp du header (premiers 16 bytes)
                # Format: call_id (8 bytes) + timestamp (8 bytes float) + audio
                # Pour simplifier, on peut aussi envoyer en JSON avec base64
                
                # Traiter l'audio
                # await process_realtime_audio(call_id, audio_bytes, timestamp)
                pass
                
            elif "text" in data:
                message = json.loads(data["text"])
                
                if message.get("type") == "audio_chunk":
                    import base64
                    call_id = message["call_id"]
                    timestamp = message["timestamp"]
                    audio_data = base64.b64decode(message["audio"])
                    
                    emotion = await process_realtime_audio(call_id, audio_data, timestamp)
                    
                    # Renvoyer le feedback à l'agent
                    await websocket.send_json({
                        "type": "emotion_feedback",
                        "data": emotion.model_dump()
                    })
                
                elif message.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})
    
    except WebSocketDisconnect:
        manager.disconnect_agent(agent_id)
