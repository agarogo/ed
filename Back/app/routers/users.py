from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.schemas import UserCreate, UserInDB, UserUpdate
from app.crud import get_user_by_email, create_user, update_user, search_users as search_users_crud  # Импортируем search_users, а не search_users_crud
from app.database import get_db
from app.dependencies import get_current_user, get_admin_user
from app.models import User
from app.tasks import generate_random_email  # Импортируем задачу

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/", response_model=UserInDB)
async def create_user_endpoint(user: UserCreate, db: Session = Depends(get_db), current_user: UserInDB = Depends(get_admin_user)):
    print("Received user data:", user.dict())  # Отладка
    # Генерируем случайную почту через Celery, если email не указан
    try:
        email = user.email if user.email else generate_random_email.delay().get(timeout=10)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate random email: {str(e)}")
    
    user_dict = user.dict(exclude_unset=True, exclude={"email"})  # Исключаем email из исходных данных
    # Не удаляем password, так как он нужен для валидации и создания пользователя
    user_dict["email"] = email
    db_user = get_user_by_email(db, email=email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return create_user(db=db, user=UserCreate(**user_dict))
    
@router.get("/me", response_model=UserInDB)
def read_users_me(current_user: UserInDB = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserInDB)
def update_user_me(
    user_update: UserUpdate,
    current_user: UserInDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return update_user(db, current_user.id, user_update)

@router.get("/", response_model=List[UserInDB])
def search_users(
    q: str,
    db: Session = Depends(get_db),
    current_user: UserInDB = Depends(get_current_user)
):
    return search_users_crud(db, q)

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