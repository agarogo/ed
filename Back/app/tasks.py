from celery import Celery
from dotenv import load_dotenv
from app.schemas import UserCreate
from transliterate import translit
import os

load_dotenv()

celery = Celery(
    "tasks",
    broker=os.getenv("REDIS_URL"),
    backend=os.getenv("REDIS_URL")
)

@celery.task
def generate_email_for_employee(user_data: dict):
    user = UserCreate(**user_data)
    # Разделяем full_name на части (предполагаем "Фамилия Имя Отчество")
    name_parts = user.full_name.split()
    if len(name_parts) >= 2:
        first_initial = str(translit(name_parts[1][0], 'ru', reversed=True)).upper()  # Первая буква имени
        last_name = str(translit(name_parts[0], 'ru', reversed=True)).lower()  # Фамилия
        mail_name = f"{first_initial}.{last_name}"
        return f"{mail_name}@cyber-ed.ru"
    return f"{str(translit(user.full_name, 'ru', reversed=True)).lower()}@cyber-ed.ru"  # Фallback