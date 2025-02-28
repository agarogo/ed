from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Optional
from app.schemas import UserCreate, UserInDB, UserUpdate
from app.crud import get_user_by_email, create_user, update_user, search_users as search_users_crud, get_user_notifications, get_user
from app.database import get_db
from app.dependencies import get_current_user, get_admin_user
from app.models import User, UserRole
from app.tasks import generate_email_for_employee
from app.logging_config import logger

router = APIRouter(prefix="/users", tags=["users"])

"""POST"""
"""СОЗДАНИЕ ПОЛЬЗОВАТЕЛЯ"""
@router.post("/", response_model=UserInDB)
async def create_user_endpoint(user: UserCreate, db: Session = Depends(get_db), current_user: UserInDB = Depends(get_admin_user)):
    logger.info(f"Admin {current_user.email_corporate} is creating user: {user.full_name}")
    print("Received user data:", user.dict())  # Отладка
    user_dict = user.dict(exclude_unset=True)
    if not user_dict.get("email_corporate"):
        # Передаём объект user напрямую, Celery вернёт результат асинхронно
        user_dict["email_corporate"] = generate_email_for_employee(user)
    db_user = get_user_by_email(db, email=user_dict["email_corporate"])
    if db_user:
        raise HTTPException(status_code=400, detail="Email corporate already registered")
    if user_dict.get("email_user"):
        db_user_email_user = db.query(User).filter(User.email_user == user_dict["email_user"]).first()
        if db_user_email_user:
            raise HTTPException(status_code=400, detail="Email user already registered")
    logger.info(f"User {user_dict['email_corporate']} created by admin {current_user.email_corporate}")
    return create_user(db=db, user=UserCreate(**user_dict))

"""GET"""
"""ИНФОРМАЦИЯ О СЕБЕ"""
@router.get("/me", response_model=UserInDB)
def read_users_me(current_user: UserInDB = Depends(get_current_user)):
    return current_user

"""ПОИСК СОТРУДНИКА"""
@router.get("/", response_model=List[UserInDB])
def search_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    full_name: Optional[str] = Query(None, description="Поиск по полному имени (имя, фамилия, отчество)"),
    role: Optional[UserRole] = Query(None, description="Фильтр по роли (admin, manager, user)"),
    sex: Optional[str] = Query(None, description="Фильтр по полу (М или Ж)"),
    position_employee: Optional[str] = Query(None, description="Фильтр по должности"),
    skip: int = 0,
    limit: int = 10
):
    # Собираем параметры фильтрации
    filters = {
        "full_name": full_name,
        "role": role,
        "sex": sex,
        "position_employee": position_employee
    }
    print(f"Received filters: {filters}")  # Отладка
    users = search_users_crud(db, **filters)
    return users[skip:skip + limit]

"""ПРОСМОТР СОТРУДНИКА"""
@router.get("/{user_id}", response_model=UserInDB)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: UserInDB = Depends(get_current_user)  # Доступно для всех авторизованных пользователей
):
    db_user = db.query(User).filter(User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

"""ПРОСМОТР УВЕДОМЛЕНИЙ"""
@router.get("/me/notifications", response_model=List[dict])
def get_notifications(current_user: UserInDB = Depends(get_current_user), db: Session = Depends(get_db)):
    notifications = get_user_notifications(db, current_user.id)
    return [{"id": n.id, "message": n.message, "is_read": n.is_read, "created_at": n.created_at} for n in notifications]

"""PUT"""
"""ИЗМЕНЕНИЕ СВОИХ ДАННЫХ"""
@router.put("/me", response_model=UserInDB)
def update_user_me(
    user_update: UserUpdate,
    current_user: UserInDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return update_user(db, current_user.id, user_update)

"""ИЗМЕНЕНИЕ ДАННЫХ СОТРУДНИКА АДМИНОМ"""
@router.put("/{user_id}", response_model=UserInDB)
def update_user_endpoint(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: UserInDB = Depends(get_admin_user)
):
    db_user = update_user(db, user_id, user_update)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user