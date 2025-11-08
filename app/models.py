from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
import datetime
import os

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'data.db')
SQLITE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    external_id = Column(String, unique=True, index=True)  # id from MAX/messenger
    name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    energy = Column(Integer, default=50)
    level = Column(Integer, default=1)
    tasks = relationship('Task', back_populates='user')
    analytics = relationship('Analytics', back_populates='user')

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    difficulty = Column(Integer, default=1)
    status = Column(String, default="pending")  # pending, done, scheduled, quick
    estimated_minutes = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    user = relationship('User', back_populates='tasks')

class Analytics(Base):
    __tablename__ = "analytics"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(DateTime, default=datetime.datetime.utcnow)
    summary = Column(Text)
    result = Column(String)  # success / fail / neutral
    user = relationship('User', back_populates='analytics')

def init_db():
    Base.metadata.create_all(bind=engine)
