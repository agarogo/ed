from pydantic import BaseModel, EmailStr
from typing import Optional
from enum import Enum
from datetime import datetime, date


"""USER"""
class UserRole(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    USER = "user"

class UserBase(BaseModel):
    full_name: str
    birthday: date
    sex: str
    email_user: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    tg_name: str
    position_employee: str
    subdivision: str
    role: UserRole

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    birthday: Optional[date] = None
    sex: Optional[str] = None
    email_user: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    tg_name: Optional[str] = None
    position_employee: Optional[str] = None
    subdivision: Optional[str] = None
    role: Optional[UserRole] = None

class UserCreate(UserBase):
    password: str
    email_corporate: Optional[EmailStr] = None  # Добавляем для фронта, если нужно

class UserInDB(UserBase):
    id: int
    is_active: bool
    login_attempts: int
    created_at: datetime
    email_corporate: EmailStr  # Убедимся, что поле есть

    class Config:
        orm_mode = True


"""NEWS"""
class NewsBase(BaseModel):
    title: str
    content: str

class NewsCreate(NewsBase):
    pass

class NewsUpdate(NewsBase):
    is_active: Optional[bool] = None

class NewsInDB(NewsBase):
    id: int
    created_by: int
    is_active: bool
    created_at: datetime

    class Config:
        orm_mode = True


"""TOKEN"""
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
