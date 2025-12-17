from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Enum, ForeignKey, JSON
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="agent")  # agent, supervisor
    team_id = Column(String(100), nullable=False, default="default", index=True)
    avatar = Column(String(500), nullable=True)
    status = Column(String(20), default="offline")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relations
    calls = relationship("CallReport", back_populates="agent")
    active_calls = relationship("ActiveCall", back_populates="agent")


class ActiveCall(Base):
    __tablename__ = "active_calls"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    start_time = Column(DateTime, default=datetime.utcnow)
    current_emotion = Column(String(20), default="calm")
    current_confidence = Column(Float, default=0.0)
    emotion_history = Column(JSON, default=list)
    alert_triggered = Column(Boolean, default=False)
    alert_duration = Column(Integer, default=0)
    
    # Relations
    agent = relationship("User", back_populates="active_calls")


class CallReport(Base):
    __tablename__ = "call_reports"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    date = Column(DateTime, default=datetime.utcnow, index=True)
    duration = Column(Integer, nullable=False)  # seconds
    audio_url = Column(String(500), nullable=True)
    
    # Emotion data stored as JSON
    client_emotions = Column(JSON, default=list)
    agent_emotions = Column(JSON, default=list)
    dominant_emotion = Column(String(20), nullable=False)
    
    # Stats
    anger_percentage = Column(Float, default=0.0)
    joy_percentage = Column(Float, default=0.0)
    calm_percentage = Column(Float, default=0.0)
    anxiety_percentage = Column(Float, default=0.0)
    surprise_percentage = Column(Float, default=0.0)
    sadness_percentage = Column(Float, default=0.0)
    average_confidence = Column(Float, default=0.0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relations
    agent = relationship("User", back_populates="calls")
