from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from dotenv import load_dotenv
import os
import random
import string

load_dotenv()

conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    MAIL_FROM=os.getenv("MAIL_FROM"),
    MAIL_PORT=int(os.getenv("MAIL_PORT")),
    MAIL_SERVER=os.getenv("MAIL_SERVER"),
    MAIL_TLS=True,
    MAIL_SSL=False
)

def generate_otp(length: int = 6) -> str:
    """Генерация случайного OTP."""
    return ''.join(random.choices(string.digits, k=length))

async def send_otp_email(email: str, otp: str):
    """Отправка OTP на пользовательскую почту."""
    message = MessageSchema(
        subject="Ваш код подтверждения",
        recipients=[email],
        body=f"Ваш код для входа: {otp}\nДействителен 5 минут.",
        subtype="plain"
    )
    fm = FastMail(conf)
    await fm.send_message(message)
    return True