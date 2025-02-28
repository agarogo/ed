from sqlalchemy.orm import Session
from sqlalchemy.sql import or_, and_
from app.schemas import UserCreate, UserUpdate, NewsCreate, NewsUpdate
from passlib.context import CryptContext
from app.models import User, Notification, News, UserRole
from fastapi import HTTPException
import os
from dotenv import load_dotenv
from app.tasks import generate_email_for_employee

load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

"""USER"""
def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email_corporate == email).first()

def password_check(user: UserCreate):
    checker = False
    if len(user.password) >= 8 and len(user.password) <= 40:
        n = user.full_name.split()[0]
        n1 = user.full_name.split()[1]
        if n not in user.password and n1 not in user.password:
            for i in range(len(user.password)):
                if user.password[i] in '!@#$%^&*()_-+=№;%:?*':
                    checker1 = False
                    k1 = 0
                    k2 = 0
                    for i in range(len(user.password)):
                        if user.password[i].isupper():
                            k1 += 1
                        if user.password[i].islower():
                            k2 += 1
                    if k1 + k2 > 2:
                        checker1 = True
                    if checker1:
                        checker2 = True
                        with open('top_passwords.txt') as f_open:
                            data = f_open.read()
                            if data in user.password:
                                checker2 = False
                        if checker2:
                            checker = True
    return checker

def create_user(db: Session, user: UserCreate):
    hashed_password = pwd_context.hash(user.password)
    email_corporate = user.email_corporate or generate_email_for_employee(user.dict())
    db_user_existing = get_user_by_email(db, email_corporate)
    if db_user_existing:
        raise HTTPException(status_code=400, detail="Email corporate already registered")

    db_user = User(
        birthday=user.birthday,
        sex=user.sex,
        tg_name=user.tg_name,
        position_employee=user.position_employee,
        subdivision=user.subdivision,
        email_user=user.email_user,
        email_corporate=email_corporate,
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

def update_user(db: Session, user_id: int, user_update: UserUpdate):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        return None
    if all(value is None for value in [user_update.full_name, user_update.phone_number, user_update.role]):
        return db_user

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

def get_user(db: Session, user_id: int):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)
    if not user or not user.is_active:
        return False
    if not pwd_context.verify(password, user.hashed_password):
        user.login_attempts += 1
        if user.login_attempts >= 5:
            user.is_active = False
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