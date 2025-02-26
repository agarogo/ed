from celery import Celery
import os
from dotenv import load_dotenv
import random
import string

load_dotenv()

celery = Celery(
    "tasks",
    broker=os.getenv("REDIS_URL"),
    backend=os.getenv("REDIS_URL")
)

@celery.task
def generate_random_email():
    """Генерирует случайную почту в формате userXXXX@example.com."""
    random_str = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"user{random_str}@example.com"