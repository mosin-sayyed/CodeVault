from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    email: EmailStr
    role: str
    created_at: datetime

    class Config:
        orm_mode = True


class SnippetCreate(BaseModel):
    title: str
    language: str
    description: Optional[str] = None
    code: str
    tags: Optional[str] = None  # comma separated

class SnippetUpdate(BaseModel):
    title: Optional[str] = None
    language: Optional[str] = None
    description: Optional[str] = None
    code: Optional[str] = None
    tags: Optional[str] = None

class SnippetOut(BaseModel):
    id: int
    user_id: int
    title: str
    language: str
    description: Optional[str]
    code: str
    tags: Optional[str]
    is_favorite: bool
    created_at: datetime

    class Config:
        orm_mode = True