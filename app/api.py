# app/api.py
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import datetime
from sqlalchemy.orm import Session

# Исправляем импорты
from models import SessionLocal, User, Task, init_db
from services import (
    get_or_create_user, add_task_for_user, list_tasks, complete_task, 
    analyze_day, sync_user_from_max, get_user_stats, update_user_profile,
    get_user_by_external_id, get_today_stats, get_user_by_max_id,
    sync_tasks_between_users, ensure_user_sync  # добавьте эти функции
)

app = FastAPI(title="TaskBot API")

# Инициализация БД при запуске
init_db()

# В api.py замени блок CORS на:
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:5173", 
        "http://localhost:8080", 
        "https://max.ru",
        "https://webtomax.vercel.app"  # ← ДОБАВЬ ЭТО
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Pydantic модели
class TaskCreate(BaseModel):
    title: str
    estimated_minutes: int = 0
    difficulty: int = 1

class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    difficulty: int
    status: str
    estimated_minutes: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class CompleteTaskRequest(BaseModel):
    task_id: int

class UserSyncRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None
    language_code: Optional[str] = None
    photo_url: Optional[str] = None

class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    energy: Optional[int] = None
    level: Optional[int] = None

class SyncRequest(BaseModel):
    max_user_id: str
    username: str

# Dependency для получения БД сессии
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# API endpoints
@app.get("/")
async def root():
    return {"message": "TaskBot API", "status": "running"}

@app.get("/tasks/list")
async def get_tasks(external_id: str, db: Session = Depends(get_db)):
    """Получить задачи пользователя"""
    try:
        tasks = list_tasks(external_id)
        return {"tasks": tasks, "count": len(tasks)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/tasks/create")
async def create_task(task_data: TaskCreate, external_id: str, db: Session = Depends(get_db)):
    """Создать новую задачу"""
    try:
        task = add_task_for_user(
            external_id, 
            task_data.title, 
            task_data.estimated_minutes, 
            task_data.difficulty
        )
        return {"task": task, "message": "Task created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/tasks/complete")
async def complete_task_endpoint(request: CompleteTaskRequest, external_id: str, db: Session = Depends(get_db)):
    """Завершить задачу"""
    try:
        task = complete_task(external_id, request.task_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        return {"task": task, "message": "Task completed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/user/analytics")
async def get_user_analytics(external_id: str, db: Session = Depends(get_db)):
    """Получить аналитику пользователя"""
    try:
        tasks = list_tasks(external_id)
        user = get_or_create_user(external_id)
        analytics = analyze_day(user, tasks)
        return analytics
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/user/profile")
async def get_user_profile(external_id: str, db: Session = Depends(get_db)):
    """Получить профиль пользователя"""
    try:
        user = get_or_create_user(external_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        tasks = list_tasks(external_id)
        total_tasks = len(tasks)
        completed_tasks = len([t for t in tasks if t.status == 'done'])
        
        profile_data = {
            "user_id": user.external_id,
            "name": user.name,
            "energy": user.energy,
            "level": user.level,
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "completion_rate": round((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0, 1),
            "created_at": user.created_at
        }
        
        return profile_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/user/sync")
async def sync_user(request: UserSyncRequest, external_id: str, db: Session = Depends(get_db)):
    """Синхронизировать данные пользователя из MAX"""
    try:
        user_data = request.dict()
        user = sync_user_from_max(external_id, user_data)
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        return {
            "user": {
                "external_id": user.external_id,
                "name": user.name,
                "energy": user.energy,
                "level": user.level
            },
            "message": "User synchronized successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/user/stats")
async def get_user_stats_endpoint(external_id: str, db: Session = Depends(get_db)):
    """Получить полную статистику пользователя"""
    try:
        stats = get_user_stats(external_id)
        if not stats:
            raise HTTPException(status_code=404, detail="User not found")
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/user/profile")
async def update_user_profile_endpoint(request: UserUpdateRequest, external_id: str, db: Session = Depends(get_db)):
    """Обновить профиль пользователя"""
    try:
        user = update_user_profile(
            external_id,
            name=request.name,
            energy=request.energy,
            level=request.level
        )
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        return {
            "user": {
                "external_id": user.external_id,
                "name": user.name,
                "energy": user.energy,
                "level": user.level
            },
            "message": "Profile updated successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/user/today-stats")
async def get_today_stats_endpoint(external_id: str, db: Session = Depends(get_db)):
    """Получить статистику за сегодня"""
    try:
        stats = get_today_stats(external_id)
        if not stats:
            raise HTTPException(status_code=404, detail="User not found")
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Проверка здоровья API"""
    return {
        "status": "healthy",
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "service": "TaskBot API"
    }

@app.get("/debug/user/{external_id}")
async def debug_user(external_id: str, db: Session = Depends(get_db)):
    """Отладочная информация о пользователе"""
    try:
        user = get_user_by_external_id(external_id)
        if not user:
            return {"error": "User not found"}
            
        tasks = list_tasks(external_id)
        
        return {
            "user": {
                "id": user.id,
                "external_id": user.external_id,
                "name": user.name,
                "energy": user.energy,
                "level": user.level,
                "created_at": user.created_at
            },
            "tasks_count": len(tasks),
            "tasks": [{"id": t.id, "title": t.title, "status": t.status} for t in tasks[:5]]
        }
    except Exception as e:
        return {"error": str(e)}

@app.post("/user/create")
async def create_user_endpoint(external_id: str, name: str, db: Session = Depends(get_db)):
    """Создать пользователя"""
    try:
        user = get_or_create_user(external_id, name)
        return {
            "user": {
                "external_id": user.external_id,
                "name": user.name,
                "energy": user.energy,
                "level": user.level
            },
            "message": "User created successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/user/sync-with-bot")
async def sync_with_bot(request: SyncRequest, db: Session = Depends(get_db)):
    """Синхронизировать веб-пользователя с ботом"""
    try:
        external_id = ensure_user_sync(request.max_user_id, request.username)
        return {
            "external_id": external_id,
            "message": "User synchronized with bot"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/user/bot-tasks")
async def get_bot_tasks(max_user_id: str, db: Session = Depends(get_db)):
    """Получить задачи из бота для веб-приложения"""
    try:
        external_id = f"max_{max_user_id}"
        tasks = list_tasks(external_id)
        return {"tasks": tasks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/sync/users")
async def sync_users(source_external_id: str, target_external_id: str, db: Session = Depends(get_db)):
    """Синхронизировать задачи между пользователями"""
    try:
        success = sync_tasks_between_users(source_external_id, target_external_id)
        if not success:
            raise HTTPException(status_code=404, detail="Users not found or sync failed")
        return {"message": "Users synchronized successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
# Добавьте эти endpoints в api.py

@app.get("/user/daily-stats")
async def get_daily_stats(external_id: str, db: Session = Depends(get_db)):
    """Получить ежедневную статистику"""
    try:
        today = datetime.datetime.utcnow().date()
        tasks = list_tasks(external_id)
        
        today_tasks = [t for t in tasks if t.created_at.date() == today]
        completed_today = len([t for t in today_tasks if t.status == 'done'])
        pending_today = len([t for t in today_tasks if t.status != 'done'])
        
        # Анализ продуктивности
        if completed_today == 0 and pending_today == 0:
            analysis = {
                "message": "Сегодня еще нет задач. Начни с чего-то маленького!",
                "emoji": "🤔",
                "is_positive": False
            }
        elif completed_today >= pending_today * 2:
            analysis = {
                "message": "Отличная работа! Ты сегодня просто машина продуктивности!",
                "emoji": "🎉",
                "is_positive": True
            }
        elif completed_today > pending_today:
            analysis = {
                "message": "Хороший день! Продолжай в том же духе!",
                "emoji": "👍",
                "is_positive": True
            }
        else:
            analysis = {
                "message": "Эй, нубик! Больше незавершенных задач, чем выполненных. Соберись!",
                "emoji": "💀",
                "is_positive": False
            }
        
        return {
            "completed_today": completed_today,
            "pending_today": pending_today,
            "total_today": len(today_tasks),
            "analysis": analysis
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/user/productivity-stats")
async def get_productivity_stats(external_id: str, db: Session = Depends(get_db)):
    """Получить статистику продуктивности для температурной карты"""
    try:
        tasks = list_tasks(external_id)
        completed_tasks = [t for t in tasks if t.status == 'done']
        pending_tasks = [t for t in tasks if t.status != 'done']
        
        # Расчет "температуры"
        total_energy = sum(t.difficulty for t in tasks) if tasks else 1
        completed_energy = sum(t.difficulty for t in completed_tasks)
        productivity_score = round((completed_energy / total_energy) * 100) if total_energy > 0 else 0
        
        # Определение уровня температуры
        if productivity_score >= 80:
            temperature = 5
            temperature_label = "🔥 Горячий перфекционист!"
        elif productivity_score >= 60:
            temperature = 4
            temperature_label = "😎 Теплый профессионал"
        elif productivity_score >= 40:
            temperature = 3
            temperature_label = "😊 Стабильный работник"
        elif productivity_score >= 20:
            temperature = 2
            temperature_label = "🤔 Нагревающийся"
        else:
            temperature = 1
            temperature_label = "❄️ Охлажденный"
        
        # Расчет серии дней
        completed_dates = [t.created_at.date() for t in completed_tasks]
        unique_dates = sorted(set(completed_dates), reverse=True)
        
        streak = 0
        today = datetime.datetime.utcnow().date()
        for i, date in enumerate(unique_dates):
            if (today - date).days == i:
                streak += 1
            else:
                break
        
        return {
            "completed_tasks": len(completed_tasks),
            "pending_tasks": len(pending_tasks),
            "completion_rate": round((len(completed_tasks) / len(tasks)) * 100) if tasks else 0,
            "productivity_score": productivity_score,
            "temperature": temperature,
            "temperature_label": temperature_label,
            "streak": streak,
            "total_tasks": len(tasks)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
    
