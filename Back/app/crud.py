from sqlalchemy.orm import Session
from sqlalchemy.sql import or_, and_
from passlib.context import CryptContext 
from fastapi import HTTPException
from dotenv import load_dotenv
from app.tasks import generate_email_for_employee
from app.logging_config import logger
from app.schemas import UserCreate, UserUpdate, NewsCreate, NewsUpdate
from app.models import User, Notification, News, UserRole
import os
"""ФУНКЦИИ"""

load_dotenv()

SPECIAL_CHARS = '!@#$%^&*()_-+=№;%:?*'
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

"""USER"""
def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email_corporate == email).first()

def get_user(db: Session, user_id: int):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

def password_check(user: UserCreate) -> bool:
    password = user.password
    if not (8 <= len(password) <= 40):
        return False
    try:
        name_parts = user.full_name.split()
        if len(name_parts) < 1:
            return False  # Пустое имя недопустимо
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ""
        if first_name in password or (last_name and last_name in password):
            return False
    except IndexError:
        return False
    has_special = any(char in SPECIAL_CHARS for char in password)
    if not has_special:
        return False
    upper_count = sum(1 for char in password if char.isupper())
    lower_count = sum(1 for char in password if char.islower())
    if upper_count + lower_count <= 2:
        return False
    try:
        with open('top_passwords.txt', 'r') as f:
            weak_passwords = {line.strip() for line in f}
        if password in weak_passwords:
            return False
    except FileNotFoundError:
        # Если файл не найден, можно либо вернуть False, либо пропустить эту проверку
        pass  # Предполагаем, что отсутствие файла не блокирует создание 
    return True

def create_user(db: Session, user: UserCreate) -> User:
    logger.info(f"Attempting to create user: {user.full_name}")
    if password_check(user):
        hashed_password = pwd_context.hash(user.password)
        db_user = User(
            birthday=user.birthday,
            sex=user.sex,
            tg_name=user.tg_name,
            position_employee=user.position_employee,
            subdivision=user.subdivision,
            email_user=user.email_user,
            email_corporate=user.email_corporate,
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
        logger.info(f"User created successfully: {db_user.email_corporate}, ID: {db_user.id}")
        return db_user
    else:
        logger.warning(f"Failed to create user with email {user.email_corporate}: Weak password")
        raise HTTPException(status_code=403, detail="Weak password")

def update_user(db: Session, user_id: int, user_update: UserUpdate):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        return None
    if all(value is None for value in [user_update.full_name, user_update.phone_number, user_update.role]):
        return db_user  # Ничего не обновляем, возвращаем как есть

    if user_update.full_name is not None:
        db_user.full_name = user_update.full_name
        create_notification(db, db_user.id, f"Ваше имя обновлено: {user_update.full_name}")
    if user_update.phone_number is not None:
        db_user.phone_number = user_update.phone_number
        create_notification(db, db_user.id, f"Ваш номер телефона обновлен: {user_update.phone_number}")
    if user_update.role is not None and db_user.role != "admin":
        db_user.role = user_update.role
        create_notification(db, db_user.id, f"Ваша роль обновлена: {user_update.role}")
    
    db.commit()
    db.refresh(db_user)
    return db_user

def search_users(db: Session, full_name: str = None, role: UserRole = None, sex: str = None, position_employee: str = None):
    try:
        query = db.query(User)

        # Фильтрация по full_name
        if full_name:
            query = query.filter(User.full_name.ilike(f"%{full_name}%"))

        # Фильтрация по роли
        if role:
            query = query.filter(User.role == role)

        # Фильтрация по полу
        if sex:
            if sex not in ["М", "Ж"]:
                raise HTTPException(status_code=422, detail="Invalid sex value. Must be 'М' or 'Ж'")
            query = query.filter(User.sex == sex)

        # Фильтрация по должности
        if position_employee:
            query = query.filter(User.position_employee.ilike(f"%{position_employee}%"))

        result = query.all()
        print(f"Search results for filters {locals()}: {[u.full_name for u in result]}")  # Отладка
        return result
    except Exception as e:
        print(f"Search error for filters {locals()}: {str(e)}")
        raise HTTPException(status_code=422, detail=f"Error processing filters: {str(e)}")

def authenticate_user(db: Session, email: str, password: str):
    """Аутентифицирует пользователя по email и паролю."""
    logger.info(f"Authentication attempt for email: {email}")
    user = get_user_by_email(db, email)
    if not user or not user.is_active:
        logger.warning(f"Authentication failed for {email}: User not found or inactive")
        return False
    if not pwd_context.verify(password, user.hashed_password):
        user.login_attempts += 1
        logger.warning(f"Authentication failed for {email}: Incorrect password, attempts: {user.login_attempts}")
        if user.login_attempts >= 5:
            user.is_active = False
            logger.error(f"User {email} blocked due to too many login attempts")
            if not has_block_notification(db, user.id):
                create_notification(db, user.id, "Ваш аккаунт заблокирован из-за неудачных попыток входа.")
                if user.role == "admin":
                    admins = db.query(User).filter(User.role == "admin").all()
                    for admin in admins:
                        if not has_block_notification(db, admin.id):
                            create_notification(db, admin.id, f"Пользователь {user.email_corporate} заблокирован из-за неудачных попыток входа.")
        db.commit()
        return False
    user.login_attempts = 0 
    db.commit()
    logger.info(f"User {email} authenticated successfully")
    return user 
    

"""УВЕДОМЛЕНИЯ"""
def create_notification(db: Session, user_id: int, message: str):
    if db.query(Notification).filter(Notification.user_id == user_id, Notification.message == message).first():
        return None
    db_notification = Notification(user_id=user_id, message=message)
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)
    return db_notification

def has_block_notification(db: Session, user_id: int):
    """Проверяет, есть ли уже уведомление о блокировке для пользователя."""
    return db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.message.like("%заблокирован из-за неудачных попыток входа%")
    ).first() is not None

def get_user_notifications(db: Session, user_id: int):
    return db.query(Notification).filter(Notification.user_id == user_id).order_by(Notification.created_at.desc()).all()


"""NEWS"""
def create_news(db: Session, news: NewsCreate, user_id: int):
    db_news = News(
        title=news.title,
        content=news.content,
        created_by=user_id,
        is_active=True
    )
    db.add(db_news)
    db.commit()
    db.refresh(db_news)
    return db_news

def get_news(db: Session, skip: int = 0, limit: int = 10):
    return db.query(News).filter(News.is_active == True).order_by(News.created_at.desc()).offset(skip).limit(limit).all()

def get_news_by_id(db: Session, news_id: int):
    return db.query(News).filter(News.id == news_id, News.is_active == True).first()

def update_news(db: Session, news_id: int, news_update: NewsUpdate):
    db_news = db.query(News).filter(News.id == news_id).first()
    if not db_news:
        return None
    if news_update.title is not None:
        db_news.title = news_update.title
    if news_update.content is not None:
        db_news.content = news_update.content
    if news_update.is_active is not None:
        db_news.is_active = news_update.is_active
    db.commit()
    db.refresh(db_news)
    return db_news

def delete_news(db: Session, news_id: int):
    db_news = db.query(News).filter(News.id == news_id).first()
    if not db_news:
        return None
    db_news.is_active = False
    db.commit()
    return db_news