from sqlalchemy.orm import Session
from sqlalchemy.sql import or_, and_
from . import models, schemas
from passlib.context import CryptContext 
from app.models import User
import os
from dotenv import load_dotenv

load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_user_by_email(db: Session, email: str):
    return db.query( User).filter( User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = pwd_context.hash(user.password)
    db_user =  User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        phone_number=user.phone_number,
        role=user.role,
        is_active=True,
        login_attempts=0
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_id: int, user_update: schemas.UserUpdate):
    db_user = db.query( User).filter( User.id == user_id).first()
    if db_user:
        if user_update.full_name is not None:
            db_user.full_name = user_update.full_name
        if user_update.phone_number is not None:
            db_user.phone_number = user_update.phone_number
        if user_update.role is not None and db_user.role != "admin":  # Ограничение изменения роли только для неадминов
            db_user.role = user_update.role
        db.commit()
        db.refresh(db_user)
    return db_user

def search_users(db: Session, query: str):
    try:
        result = db.query( User).filter(
            or_(
                 User.email.ilike(f"%{query}%"),
                 User.full_name.ilike(f"%{query}%"),
                and_( User.phone_number.isnot(None),  User.phone_number.ilike(f"%{query}%"))
            )
        ).all()
        print(f"Search results for '{query}': {result}")
        return result
    except Exception as e:
        print(f"Search error for '{query}': {str(e)}")
        return []


def authenticate_user(db: Session, email: str, password: str):
    """Аутентифицирует пользователя по email и паролю."""
    user = get_user_by_email(db, email)
    if not user:
        return False
    if not pwd_context.verify(password, user.hashed_password):
        return False
    return user