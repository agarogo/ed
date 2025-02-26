from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, users
from app.database import engine
from . import models

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Разрешаем запросы с фронтенда
    allow_credentials=True,
    allow_methods=["*"],  # Разрешаем все методы
    allow_headers=["*"],  # Разрешаем все заголовки
)

app.include_router(auth.router)
app.include_router(users.router)