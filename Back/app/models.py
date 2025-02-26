from sqlalchemy import Column, Integer, String, Boolean, Enum, DateTime
from sqlalchemy.sql import func
from app.database import Base
import enum

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    USER = "user"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    phone_number = Column(String, nullable=True)
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)
    is_active = Column(Boolean, default=True)
    login_attempts = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())