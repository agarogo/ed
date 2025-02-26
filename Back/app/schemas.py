from pydantic import BaseModel, EmailStr
from typing import Optional
from app.models import UserRole
from enum import Enum
from datetime import datetime

class UserRole(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    USER = "user"

#User
class UserBase(BaseModel):
    email: Optional[EmailStr] = None  # Сделали email необязательным
    full_name: str
    phone_number: Optional[str] = None
    role: UserRole

class UserCreate(UserBase):
    password: str  # Остаётся обязательным

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    role: Optional[UserRole] = None

class UserInDB(UserBase):
    id: int
    is_active: bool
    login_attempts: int
    created_at: datetime

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None