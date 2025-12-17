from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
from enum import Enum

# ============================================
# ENUMS
# ============================================

class EmotionType(str, Enum):
    JOY = "joy"
    ANGER = "anger"
    SADNESS = "sadness"
    ANXIETY = "anxiety"
    CALM = "calm"
    SURPRISE = "surprise"

class UserRole(str, Enum):
    AGENT = "agent"
    SUPERVISOR = "supervisor"

class AgentStatus(str, Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    ON_CALL = "on-call"
    BREAK = "break"

# ============================================
# EMOTION SCHEMAS
# ============================================

class EmotionData(BaseModel):
    emotion: EmotionType
    confidence: float  # 0-100
    timestamp: float  

class EmotionAnalysisResult(BaseModel):
    client_emotions: List[EmotionData]
    agent_emotions: List[EmotionData]
    dominant_emotion: EmotionType
    stats: "CallStats"

# ============================================
# USER SCHEMAS
# ============================================

class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: UserRole
   # team_id: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    avatar: Optional[str] = None
    team_id: str
    
    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# ============================================
# AGENT SCHEMAS
# ============================================

class AgentResponse(BaseModel):
    id: str
    name: str
    email: str
    avatar: Optional[str] = None
    role: UserRole
    status: AgentStatus
    
    class Config:
        from_attributes = True

# ============================================
# CALL SCHEMAS
# ============================================

class ActiveCall(BaseModel):
    id: str
    agent_id: str
    agent_name: str
    start_time: datetime
    current_emotion: EmotionData
    emotion_history: List[EmotionData]
    alert_triggered: bool
    alert_duration: int  # seconds

class CallStats(BaseModel):
    anger_percentage: float
    joy_percentage: float
    calm_percentage: float
    anxiety_percentage: float
    surprise_percentage: float
    sadness_percentage: float
    average_confidence: float

class CallReportCreate(BaseModel):
    agent_id: str
    duration: int
    audio_url: Optional[str] = None
    client_emotions: List[EmotionData]
    agent_emotions: List[EmotionData]

class CallReportResponse(BaseModel):
    id: str
    agent_id: str
    agent_name: str
    date: datetime
    duration: int
    audio_url: Optional[str] = None
    client_emotions: List[EmotionData]
    agent_emotions: List[EmotionData]
    dominant_emotion: EmotionType
    stats: CallStats
    
    class Config:
        from_attributes = True

# ============================================
# FILTER SCHEMAS
# ============================================

class ReportFilters(BaseModel):
    agent_id: Optional[str] = None
    emotion: Optional[EmotionType] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    min_anger_duration: Optional[int] = None  # seconds

# ============================================
# WEBSOCKET SCHEMAS
# ============================================

class WebSocketMessage(BaseModel):
    type: str  # "emotion_update", "alert", "call_started", "call_ended"
    data: dict
