# services.py (дополненный)
import random, datetime
from models import SessionLocal, User, Task, Analytics

QUOTES = [
    "Сделай шаг — и дорога появится.",
    "Лучшее время начать — сейчас.",
    "Разбей большую задачу на маленькие шаги.",
    "Маленький прогресс — всё равно прогресс.",
    "Дисциплина — это когда ты делаешь то, что нужно, даже когда не хочется.",
    "Успех — это сумма маленьких усилий, повторяемых изо дня в день.",
    "Не откладывай на завтра то, что можно сделать за две минуты сегодня."
]

def random_motivation():
    return random.choice(QUOTES)

def decompose_task(title):
    hints = []
    parts = [p.strip() for p in (title.replace(' и ', ',').split(',')) if p.strip()]
    if len(parts) <= 1:
        words = title.split()
        if len(words) <= 3:
            hints.append("Попробуй выделить 2-3 конкретных шаги: подготовка, действие, проверка.")
        else:
            hints.append("Разбей задачу на шаги: 1) " + " 2) ".join(words[:2]))
    else:
        for i, p in enumerate(parts[:4], start=1):
            hints.append(f"Шаг {i}: {p}")
    return hints

def analyze_day(user, tasks):
    today = datetime.datetime.utcnow().date()
    done = [t for t in tasks if t.status == 'done' and t.created_at.date() == today]
    pending = [t for t in tasks if t.status != 'done' and t.created_at.date() == today]
    score = len(done) - len(pending)
    
    if score >= 3:
        result = 'success'
        text = f"🎉 Отлично! Сегодня выполнено {len(done)} задач. Ты просто машина продуктивности!"
    elif score >= 1:
        result = 'success'
        text = f"✅ Хорошо! Выполнено {len(done)} задач. Продолжай в том же духе!"
    elif score == 0:
        result = 'neutral'
        text = f"⚖️ Норм. Выполнил {len(done)} задач и откладывал {len(pending)}. Завтра будет лучше!"
    else:
        result = 'fail'
        text = f"💀 Хмм... Выполнено {len(done)} задач, но {len(pending)} не сделано. Не будь нубом — начни с малого!"
    
    return {'result': result, 'text': text, 'stats': {'done': len(done), 'pending': len(pending), 'score': score}}

def normalize_user_id(user_id):
    """Нормализует user_id для единообразного хранения"""
    if user_id is None:
        return "demo_user"
        
    if isinstance(user_id, int):
        user_id = str(user_id)
    
    # Если пришел числовой ID из MAX, добавляем префикс
    if user_id.isdigit() and not user_id.startswith('max_'):
        user_id = f"max_{user_id}"
    
    return user_id

def get_or_create_user(external_id, name=None):
    db = SessionLocal()
    
    try:
        # Нормализуем external_id
        external_id = normalize_user_id(external_id)
        
        user = db.query(User).filter_by(external_id=external_id).first()
        if not user:
            user = User(external_id=external_id, name=name)
            db.add(user)
            db.commit()
            db.refresh(user)
        return user
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()

def add_task_for_user(external_id, title, estimated_minutes=0, difficulty=1):
    db = SessionLocal()
    
    try:
        # Нормализуем external_id
        external_id = normalize_user_id(external_id)
        
        user = db.query(User).filter_by(external_id=external_id).first()
        if not user:
            user = User(external_id=external_id)
            db.add(user)
            db.commit()
            db.refresh(user)
        
        task = Task(
            user_id=user.id, 
            title=title, 
            estimated_minutes=estimated_minutes, 
            difficulty=difficulty
        )
        
        # Two-minute rule
        if estimated_minutes > 0 and estimated_minutes <= 2:
            task.status = 'quick'
        else:
            task.status = 'pending'
        
        db.add(task)
        db.commit()
        db.refresh(task)
        
        return task
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()

def list_tasks(external_id):
    db = SessionLocal()
    
    try:
        # Нормализуем external_id
        external_id = normalize_user_id(external_id)
        
        user = db.query(User).filter_by(external_id=external_id).first()
        if not user:
            return []
            
        tasks = db.query(Task).filter_by(user_id=user.id).order_by(Task.created_at.desc()).all()
        return tasks
    except Exception as e:
        print(f"Error listing tasks: {e}")
        return []
    finally:
        db.close()

def complete_task(external_id, task_id):
    db = SessionLocal()
    
    try:
        # Нормализуем external_id
        external_id = normalize_user_id(external_id)
        
        user = db.query(User).filter_by(external_id=external_id).first()
        if not user:
            return None
            
        task = db.query(Task).filter_by(id=task_id, user_id=user.id).first()
        if not task:
            return None
            
        task.status = 'done'
        db.commit()
        
        return task
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()

def get_user_by_external_id(external_id):
    """Получить пользователя по external_id"""
    db = SessionLocal()
    
    try:
        external_id = normalize_user_id(external_id)
        user = db.query(User).filter_by(external_id=external_id).first()
        return user
    except Exception as e:
        print(f"Error getting user: {e}")
        return None
    finally:
        db.close()

def update_user_profile(external_id, name=None, energy=None, level=None):
    """Обновить профиль пользователя"""
    db = SessionLocal()
    
    try:
        external_id = normalize_user_id(external_id)
        user = db.query(User).filter_by(external_id=external_id).first()
        
        if user:
            if name is not None:
                user.name = name
            if energy is not None:
                user.energy = energy
            if level is not None:
                user.level = level
                
            db.commit()
            db.refresh(user)
            
        return user
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()

def sync_user_from_max(external_id, max_user_data):
    """Синхронизировать данные пользователя из MAX"""
    if not max_user_data:
        return None
        
    name = f"{max_user_data.get('first_name', '')} {max_user_data.get('last_name', '')}".strip()
    if not name:
        name = max_user_data.get('username', 'Пользователь MAX')
    
    return update_user_profile(external_id, name=name)

def get_user_stats(external_id):
    """Получить статистику пользователя"""
    db = SessionLocal()
    
    try:
        external_id = normalize_user_id(external_id)
        user = db.query(User).filter_by(external_id=external_id).first()
        
        if not user:
            return None
            
        tasks = db.query(Task).filter_by(user_id=user.id).all()
        total_tasks = len(tasks)
        completed_tasks = len([t for t in tasks if t.status == 'done'])
        pending_tasks = len([t for t in tasks if t.status != 'done'])
        
        completion_rate = round((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0, 1)
        
        # Анализ сложности
        difficulty_stats = {
            'high': len([t for t in tasks if t.difficulty >= 4]),
            'medium': len([t for t in tasks if t.difficulty == 3]),
            'low': len([t for t in tasks if t.difficulty <= 2]),
        }
        
        return {
            'user_id': user.external_id,
            'name': user.name,
            'energy': user.energy,
            'level': user.level,
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'pending_tasks': pending_tasks,
            'completion_rate': completion_rate,
            'difficulty_stats': difficulty_stats
        }
    except Exception as e:
        print(f"Error getting user stats: {e}")
        return None
    finally:
        db.close()

def delete_task(external_id, task_id):
    """Удалить задачу пользователя"""
    db = SessionLocal()
    
    try:
        external_id = normalize_user_id(external_id)
        user = db.query(User).filter_by(external_id=external_id).first()
        
        if not user:
            return False
            
        task = db.query(Task).filter_by(id=task_id, user_id=user.id).first()
        if not task:
            return False
            
        db.delete(task)
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()

def update_task(external_id, task_id, title=None, estimated_minutes=None, difficulty=None, status=None):
    """Обновить задачу пользователя"""
    db = SessionLocal()
    
    try:
        external_id = normalize_user_id(external_id)
        user = db.query(User).filter_by(external_id=external_id).first()
        
        if not user:
            return None
            
        task = db.query(Task).filter_by(id=task_id, user_id=user.id).first()
        if not task:
            return None
            
        if title is not None:
            task.title = title
        if estimated_minutes is not None:
            task.estimated_minutes = estimated_minutes
        if difficulty is not None:
            task.difficulty = difficulty
        if status is not None:
            task.status = status
            
        db.commit()
        db.refresh(task)
        return task
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()

def get_today_stats(external_id):
    """Получить статистику за сегодня"""
    db = SessionLocal()
    
    try:
        external_id = normalize_user_id(external_id)
        user = db.query(User).filter_by(external_id=external_id).first()
        
        if not user:
            return None
            
        today = datetime.datetime.utcnow().date()
        tasks = db.query(Task).filter_by(user_id=user.id).filter(
            Task.created_at >= today
        ).all()
        
        completed_today = len([t for t in tasks if t.status == 'done'])
        pending_today = len([t for t in tasks if t.status != 'done'])
        
        return {
            'completed_today': completed_today,
            'pending_today': pending_today,
            'total_today': len(tasks)
        }
    except Exception as e:
        print(f"Error getting today stats: {e}")
        return None
    finally:
        db.close()

# services.py - добавьте эти функции

def get_user_by_max_id(max_user_id):
    """Получить пользователя по ID из MAX"""
    db = SessionLocal()
    try:
        # Преобразуем MAX ID в наш формат
        external_id = f"max_{max_user_id}"
        user = db.query(User).filter_by(external_id=external_id).first()
        return user
    finally:
        db.close()

def sync_tasks_between_users(source_user_id, target_user_id):
    """Синхронизировать задачи между пользователями"""
    db = SessionLocal()
    try:
        source_user = db.query(User).filter_by(external_id=source_user_id).first()
        target_user = db.query(User).filter_by(external_id=target_user_id).first()
        
        if not source_user or not target_user:
            return False
            
        # Получаем задачи исходного пользователя
        source_tasks = db.query(Task).filter_by(user_id=source_user.id).all()
        
        # Копируем задачи целевому пользователю
        for task in source_tasks:
            # Проверяем, нет ли уже такой задачи
            existing_task = db.query(Task).filter_by(
                user_id=target_user.id, 
                title=task.title,
                status=task.status
            ).first()
            
            if not existing_task:
                new_task = Task(
                    user_id=target_user.id,
                    title=task.title,
                    description=task.description,
                    difficulty=task.difficulty,
                    status=task.status,
                    estimated_minutes=task.estimated_minutes
                )
                db.add(new_task)
        
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        print(f"Sync error: {e}")
        return False
    finally:
        db.close()

def enhanced_daily_analysis(user, tasks):
    """Улучшенный ежедневный анализ с рекомендациями"""
    today = datetime.datetime.utcnow().date()
    today_tasks = [t for t in tasks if t.created_at.date() == today]
    
    if not today_tasks:
        return {
            'result': 'neutral',
            'text': "📝 Сегодня еще нет задач. Начни с маленького шага!",
            'recommendation': "Попробуй добавить быструю задачу на 2 минуты.",
            'emoji': "🤔"
        }
    
    completed_today = [t for t in today_tasks if t.status == 'done']
    pending_today = [t for t in today_tasks if t.status != 'done']
    
    completion_ratio = len(completed_today) / len(today_tasks) if today_tasks else 0
    
    # Анализ сложности
    avg_difficulty = sum(t.difficulty for t in today_tasks) / len(today_tasks)
    completed_difficulty = sum(t.difficulty for t in completed_today) / len(completed_today) if completed_today else 0
    
    if completion_ratio >= 0.8:
        result = 'success'
        emoji = "🎉"
        text = f"Отлично! Выполнено {len(completed_today)} из {len(today_tasks)} задач!"
        recommendation = "Ты сегодня на высоте! Можешь взяться за что-то сложное."
    elif completion_ratio >= 0.5:
        result = 'success'
        emoji = "👍"
        text = f"Хорошо! Выполнено {len(completed_today)} из {len(today_tasks)} задач."
        recommendation = "Продолжай в том же духе! Ты близок к отличному результату."
    elif completion_ratio > 0:
        result = 'neutral'
        emoji = "💪"
        text = f"Неплохо, но можно лучше. Выполнено {len(completed_today)} из {len(today_tasks)}."
        recommendation = "Сосредоточься на одной задаче за раз. Используй Pomodoro таймер!"
    else:
        result = 'fail'
        emoji = "💀"
        text = f"Эй, нубик! 0 из {len(today_tasks)} задач выполнено. Соберись!"
        recommendation = "Начни с самой простой задачи. Даже 2 минуты работы - это прогресс!"
    
    # Дополнительные рекомендации по сложности
    if avg_difficulty > 3 and completion_ratio < 0.5:
        recommendation += " Слишком сложные задачи? Разбей их на части командой /decompose"
    
    return {
        'result': result,
        'text': text,
        'recommendation': recommendation,
        'emoji': emoji,
        'stats': {
            'completed': len(completed_today),
            'pending': len(pending_today),
            'total': len(today_tasks),
            'completion_ratio': round(completion_ratio * 100),
            'avg_difficulty': round(avg_difficulty, 1)
        }
    }        

def ensure_user_sync(max_user_id, username):
    """Обеспечить синхронизацию пользователя между ботом и веб-приложением"""
    db = SessionLocal()
    try:
        # MAX user ID
        max_external_id = f"max_{max_user_id}"
        # Web user ID (на основе имени)
        web_external_id = f"user_{username.lower().replace(' ', '_')}"
        
        max_user = db.query(User).filter_by(external_id=max_external_id).first()
        web_user = db.query(User).filter_by(external_id=web_external_id).first()
        
        # Если оба пользователя существуют, синхронизируем задачи
        if max_user and web_user and max_user.id != web_user.id:
            # Синхронизируем в обе стороны
            sync_tasks_between_users(max_external_id, web_external_id)
            sync_tasks_between_users(web_external_id, max_external_id)
            
        return web_external_id
    finally:
        db.close()
        