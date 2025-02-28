from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
from app.schemas import UserCreate, UserInDB, UserUpdate
from app.crud import get_user_by_email, create_user, update_user, search_users as search_users_crud, get_user_notifications
from app.database import get_db
from app.dependencies import get_current_user, get_admin_user
from app.models import User, UserRole
from app.tasks import generate_email_for_employee

router = APIRouter(prefix="/users", tags=["users"])

"""POST"""
"""СОЗДАНИЕ ПОЛЬЗОВАТЕЛЯ"""
@router.post("/", response_model=UserInDB)
async def create_user_endpoint(user: UserCreate, db: Session = Depends(get_db), current_user: UserInDB = Depends(get_admin_user)):
    if current_user.role == UserRole.ADMIN:
        print("Received user data:", user.dict())  # Отладка
        # Если email_corporate не указан, генерируем его
        user_dict = user.dict(exclude_unset=True)
        if not user_dict.get("email_corporate"):
            user_dict["email_corporate"] = generate_email_for_employee.delay(user_dict).get()
        # Проверяем уникальность email_corporate
        db_user = get_user_by_email(db, email=user_dict["email_corporate"])
        if db_user:
            raise HTTPException(status_code=400, detail="Email corporate already registered")
        # Проверяем уникальность email_user, если он указан
        if user_dict.get("email_user"):
            db_user_email_user = db.query(User).filter(User.email_user == user_dict["email_user"]).first()
            if db_user_email_user:
                raise HTTPException(status_code=400, detail="Email user already registered")
        return create_user(db=db, user=UserCreate(**user_dict))
    else:
        raise HTTPException(status_code=403, detail="Not enough permissions")

"""GET"""
"""ИНФОРМАЦИЯ О СЕБЕ"""
@router.get("/me", response_model=UserInDB)
def read_users_me(current_user: UserInDB = Depends(get_current_user)):
    return current_user

"""ПОИСК СОТРУДНИКА"""
@router.get("/", response_model=List[UserInDB])
def search_users(
    q: str,
    db: Session = Depends(get_db)
):
    return search_users_crud(db, q)

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
    # Проверяем, может ли текущий пользователь видеть этот профиль
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="You can only view your own profile or profiles as an admin")
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