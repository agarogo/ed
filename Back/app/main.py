from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth_main, users, news
from app.database import engine
from app import models

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_main.router)
app.include_router(users.router)
app.include_router(news.router)