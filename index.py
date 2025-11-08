# index.py
import sys
import os

# Добавляем текущую директорию в путь
sys.path.append(os.path.dirname(__file__))

from app.api import app

# Экспортируем приложение для Vercel
application = app