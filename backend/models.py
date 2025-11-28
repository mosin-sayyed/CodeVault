from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, func
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

# USER MODEL
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="user")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    snippets = relationship("Snippet", back_populates="user", cascade="all, delete")
    favorites = relationship("Favorite", back_populates="user", cascade="all, delete")

#snippet model
class Snippet(Base):
    __tablename__ = "snippets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    title = Column(String(200), nullable=False)
    language = Column(String(50), nullable=False)
    description = Column(String(500), nullable=True)
    code = Column(Text, nullable=False)
    tags = Column(String(500), nullable=True)  
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="snippets")
    favorited_by = relationship("Favorite", back_populates="snippet", cascade="all, delete")





class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    snippet_id = Column(Integer, ForeignKey("snippets.id"))

    user = relationship("User", back_populates="favorites")
    snippet = relationship("Snippet", back_populates="favorited_by")

