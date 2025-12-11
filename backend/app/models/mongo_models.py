from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

# ============================================
# MongoDB Document Schemas
# ============================================

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, info):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, schema, handler):
        return {"type": "string"}


class EmotionDataDoc(BaseModel):
    emotion: str
    confidence: float
    timestamp: float


class UserDocument(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    email: str
    name: str
    password_hash: str
    role: str = "agent"
    avatar: Optional[str] = None
    status: str = "offline"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class ActiveCallDocument(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    agent_id: str
    start_time: datetime = Field(default_factory=datetime.utcnow)
    current_emotion: str = "calm"
    current_confidence: float = 0.0
    emotion_history: List[EmotionDataDoc] = []
    alert_triggered: bool = False
    alert_duration: int = 0

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class CallReportDocument(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    agent_id: str
    agent_name: str
    date: datetime = Field(default_factory=datetime.utcnow)
    duration: int
    audio_url: Optional[str] = None
    client_emotions: List[EmotionDataDoc] = []
    agent_emotions: List[EmotionDataDoc] = []
    dominant_emotion: str
    stats: dict = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
