from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.schemas import UserCreate, UserInDB, UserUpdate
from app.crud import get_user_by_email, create_user, update_user, search_users as search_users_crud, get_user_notifications, get_user, unblock_user, mark_notification_as_read
from app.database import get_db
from app.dependencies import get_current_user, get_admin_user
from app.models import User, UserRole
from app.tasks import generate_email_for_employee
from app.logging_config import logger

router = APIRouter(prefix="/users", tags=["users"])

# POST
@router.post("/", response_model=UserInDB)
async def create_user_endpoint(user: UserCreate, db: Session = Depends(get_db), current_user: UserInDB = Depends(get_admin_user)):
    logger.info(f"Admin {current_user.email_corporate} is creating user: {user.full_name}")
    print("Received user data:", user.dict())
    user_dict = user.dict(exclude_unset=True)
    if not user_dict.get("email_corporate"):
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

# GET
@router.get("/me", response_model=UserInDB)
def read_users_me(current_user: UserInDB = Depends(get_current_user)):
    return current_user

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
    filters = {
        "full_name": full_name,
        "role": role,
        "sex": sex,
        "position_employee": position_employee
    }
    print(f"Received filters: {filters}")
    users = search_users_crud(db, **filters)
    return users[skip:skip + limit]

@router.get("/{user_id}", response_model=UserInDB)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: UserInDB = Depends(get_current_user)
):
    db_user = db.query(User).filter(User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.get("/me/notifications", response_model=List[dict])
def get_notifications(current_user: UserInDB = Depends(get_current_user), db: Session = Depends(get_db)):
    notifications = get_user_notifications(db, current_user.id)
    # Преобразуем результат в зависимости от структуры данных
    if isinstance(notifications[0], tuple):  # Если data отсутствует
        return [{"id": n[0], "message": n[2], "is_read": n[3], "created_at": n[4], "data": None} for n in notifications]
    return [{"id": n.id, "message": n.message, "is_read": n.is_read, "created_at": n.created_at, "data": n.data} for n in notifications]

@router.put("/notifications/{notification_id}/read", response_model=dict)
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: UserInDB = Depends(get_current_user)
):
    notification = mark_notification_as_read(db, notification_id, current_user.id)
    return {"id": notification.id, "message": notification.message, "is_read": notification.is_read, "created_at": notification.created_at, "data": notification.data}

# PUT
@router.put("/me", response_model=UserInDB)
def update_user_me(
    user_update: UserUpdate,
    current_user: UserInDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return update_user(db, current_user.id, user_update)

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

# Разблокировка пользователя
@router.post("/unblock/{blocked_user_id}", response_model=UserInDB)
def unblock_user_endpoint(
    blocked_user_id: int,
    db: Session = Depends(get_db),
    current_user: UserInDB = Depends(get_admin_user)
):
    return unblock_user(db, blocked_user_id, current_user)