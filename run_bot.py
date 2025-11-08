# run_bot.py
import asyncio
import logging
import threading
import uvicorn
import sys
import os

# Добавляем путь к app в sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.api import app as api_app
from app.models import init_db

logging.basicConfig(level=logging.INFO)

def run_api():
    """Запуск FastAPI сервера"""
    uvicorn.run(api_app, host="0.0.0.0", port=8000, log_level="info")

def run_bot():
    """Запуск бота"""
    from app.bot_impl import main
    main()  # aiomax сам запускает asyncio

if __name__ == "__main__":
    # Инициализируем базу данных
    init_db()
    
    # Запускаем API в отдельном потоке
    api_thread = threading.Thread(target=run_api, daemon=True)
    api_thread.start()
    
    # Запускаем бота в основном потоке
    logging.info("🚀 Starting TaskBot with API...")
    run_bot()