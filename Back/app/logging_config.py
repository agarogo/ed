import logging
import os
from datetime import datetime

# Создаём директорию для логов, если её нет
log_dir = "logs"
if not os.path.exists(log_dir):
    os.makedirs(log_dir)

# Настраиваем логгер
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.FileHandler(f"{log_dir}/app_{datetime.now().strftime('%Y-%m-%d')}.log"),
        logging.StreamHandler()  # Вывод в консоль
    ]
)

logger = logging.getLogger("app")