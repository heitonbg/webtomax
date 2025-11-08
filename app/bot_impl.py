# app/bot_impl.py
import aiomax
from aiomax import buttons
import logging
import re
import asyncio
from datetime import datetime

from .services import random_motivation, decompose_task, analyze_day, get_or_create_user, add_task_for_user, list_tasks, complete_task
from .models import init_db
from .config import MAX_BOT_TOKEN

logging.basicConfig(level=logging.INFO)

class TaskBot:
    def __init__(self):
        self.token = MAX_BOT_TOKEN
        self.bot = aiomax.Bot(self.token, default_format="markdown")
        self.active_chats = {}  # {user_id: chat_id} для отправки уведомлений
        self.setup_handlers()
        
    def normalize_user_id(self, user_data):
        """Нормализует user_id из MAX API"""
        user_id = user_data.user_id
        
        # MAX присылает числа, конвертируем в строку
        if isinstance(user_id, int):
            user_id = str(user_id)
        
        return user_id
        
    def get_main_keyboard(self):
        """Создает главное меню с кнопками"""
        kb = buttons.KeyboardBuilder()
        kb.add(buttons.CallbackButton('📝 Добавить задачу', 'add_task'))
        kb.add(buttons.CallbackButton('📋 Список задач', 'list_tasks'))
        kb.row(buttons.CallbackButton('✅ Завершить задачу', 'complete_task'))
        kb.add(buttons.CallbackButton('💫 Мотивация', 'motivation'))
        kb.row(buttons.CallbackButton('🔍 Разложить задачу', 'decompose_task'))
        kb.add(buttons.CallbackButton('📊 Анализ дня', 'analyze_day'))
        return kb

    def get_add_task_keyboard(self):
        """Клавиатура для добавления задач"""
        kb = buttons.KeyboardBuilder()
        kb.add(buttons.CallbackButton('📚 Учеба', 'add_study'))
        kb.add(buttons.CallbackButton('💼 Работа', 'add_work'))
        kb.row(buttons.CallbackButton('🏠 Дом', 'add_home'))
        kb.add(buttons.CallbackButton('🎯 Личное', 'add_personal'))
        kb.row(buttons.CallbackButton('⬅️ Назад', 'back_main'))
        return kb

    def get_complete_keyboard(self, tasks):
        """Клавиатура для завершения задач"""
        kb = buttons.KeyboardBuilder()
        for task in tasks[:8]:  # Ограничиваем количество кнопок
            kb.add(buttons.CallbackButton(f'✅ {task.title[:15]}...', f'complete_{task.id}'))
        kb.row(buttons.CallbackButton('⬅️ Назад', 'back_main'))
        return kb

    def format_task_list(self, tasks):
        """Форматирует список задач для отображения"""
        if not tasks:
            return "📝 Список задач пуст."
            
        lines = []
        for t in tasks:
            status_icon = "✅" if t.status == "done" else "⏳" if t.status == "pending" else "⚡" if t.status == "quick" else "📅"
            time_info = f"⏱{t.estimated_minutes}m" if t.estimated_minutes else ""
            diff_info = f"⚡{t.difficulty}" if t.difficulty > 1 else ""
            info_parts = [p for p in [time_info, diff_info] if p]
            info_str = f" ({' '.join(info_parts)})" if info_parts else ""
            
            lines.append(f"{status_icon} `{t.id:02d}` {t.title}{info_str}")
            
        return "📋 **Твои задачи:**\n\n" + "\n".join(lines)
        
    def setup_handlers(self):
        bot = self.bot

        @bot.on_bot_start()
        async def welcome(pd):
            user_id = self.normalize_user_id(pd.user)
            name = pd.user.name
            chat_id = pd.chat_id
            
            # Сохраняем chat_id для отправки уведомлений
            self.active_chats[user_id] = chat_id
            
            user = get_or_create_user(user_id, name)
            logging.info(f"🆕 Новый пользователь: {user_id} ({name})")
            
            await pd.send(
                f"🧠 **Привет, {name}!**\n\n"
                "Я бот для управления задачами с интеграцией веб-приложения.\n\n"
                "💡 *Задачи, созданные в веб-приложении, будут видны здесь и наоборот!*\n\n"
                "Выбери действие:",
                keyboard=self.get_main_keyboard()
            )

        @bot.on_command('start')
        async def cmd_start(ctx):
            user_id = self.normalize_user_id(ctx.sender)
            name = ctx.sender.name
            chat_id = ctx.recipient.chat_id
            
            # Сохраняем chat_id для отправки уведомлений
            self.active_chats[user_id] = chat_id
            
            user = get_or_create_user(user_id, name)
            logging.info(f"🔁 Пользователь перезапустил бота: {user_id} ({name})")
            
            await ctx.reply(
                f"✅ **С возвращением, {name}!**\n\n"
                "Задачи синхронизированы с веб-приложением.\n\n"
                "Выбери действие:",
                keyboard=self.get_main_keyboard()
            )

        # Обработчики кнопок
        @bot.on_button_callback('add_task')
        async def add_task_handler(cb):
            user_id = self.normalize_user_id(cb.user)
            self.active_chats[user_id] = cb.message.recipient.chat_id
            
            await cb.answer(
                text="🎯 **Добавление задачи**\n\n"
                     "Выбери категорию или напиши задачу вручную:\n\n"
                     "💡 *Пример:*\n"
                     "`/add сделать домашку est=30 difficulty=2`",
                keyboard=self.get_add_task_keyboard()
            )

        @bot.on_button_callback('list_tasks')
        async def list_tasks_handler(cb):
            try:
                user_id = self.normalize_user_id(cb.user)
                self.active_chats[user_id] = cb.message.recipient.chat_id
                
                # ВСЕГДА получаем свежие данные из базы
                tasks = list_tasks(user_id)
                logging.info(f"📋 Пользователь {user_id} запросил список задач: {len(tasks)} задач")
                
                if not tasks:
                    await cb.answer(
                        text="📝 Список задач пуст.\n\n"
                             "Добавь задачи через кнопку '📝 Добавить задачу' или в веб-приложении.",
                        keyboard=self.get_main_keyboard()
                    )
                    return
                    
                task_text = self.format_task_list(tasks)
                await cb.answer(
                    text=task_text,
                    keyboard=self.get_main_keyboard()
                )
                
            except Exception as e:
                logging.exception("Error in list_tasks_handler")
                await cb.answer("❌ Ошибка при получении списка задач")

        @bot.on_button_callback('complete_task')
        async def complete_task_handler(cb):
            try:
                user_id = self.normalize_user_id(cb.user)
                self.active_chats[user_id] = cb.message.recipient.chat_id
                
                # ВСЕГДА получаем свежие данные из базы
                tasks = list_tasks(user_id)
                pending_tasks = [t for t in tasks if t.status != 'done']
                
                if not pending_tasks:
                    await cb.answer(
                        text="🎉 Нет активных задач для завершения!\n\n"
                             "Все задачи выполнены 🚀",
                        keyboard=self.get_main_keyboard()
                    )
                    return
                    
                await cb.answer(
                    text="✅ **Завершение задачи**\n\n"
                         "Выбери задачу для завершения:",
                    keyboard=self.get_complete_keyboard(pending_tasks)
                )
                
            except Exception as e:
                logging.exception("Error in complete_task_handler")
                await cb.answer("❌ Ошибка при получении списка задач")

        @bot.on_button_callback(lambda data: data.payload.startswith('complete_'))
        async def complete_specific_task(cb):
            try:
                task_id = int(cb.payload.split('_')[1])
                user_id = self.normalize_user_id(cb.user)
                self.active_chats[user_id] = cb.message.recipient.chat_id
                
                # Завершаем задачу и получаем обновленные данные
                completed_task = complete_task(user_id, task_id)
                
                if not completed_task:
                    await cb.answer("❌ Задача не найдена")
                else:
                    # Получаем ОБНОВЛЕННЫЙ список задач
                    updated_tasks = list_tasks(user_id)
                    task_text = self.format_task_list(updated_tasks)
                    
                    await cb.answer(
                        text=f"✅ Задача '{completed_task.title}' завершена! 🎉\n\n{task_text}",
                        keyboard=self.get_main_keyboard()
                    )
                    
                    logging.info(f"✅ Пользователь {user_id} завершил задачу: {completed_task.title}")
                    
            except Exception as e:
                logging.exception("Error in complete_specific_task")
                await cb.answer("❌ Ошибка при завершении задачи")

        @bot.on_button_callback('motivation')
        async def motivation_handler(cb):
            try:
                user_id = self.normalize_user_id(cb.user)
                self.active_chats[user_id] = cb.message.recipient.chat_id
                
                q = random_motivation()
                await cb.answer(
                    text=f"💫 **Мотивация:**\n\n{q}",
                    keyboard=self.get_main_keyboard()
                )
            except Exception as e:
                logging.exception("Error in motivation_handler")
                await cb.answer("❌ Не могу найти мотивацию...")

        @bot.on_button_callback('decompose_task')
        async def decompose_handler(cb):
            user_id = self.normalize_user_id(cb.user)
            self.active_chats[user_id] = cb.message.recipient.chat_id
            
            await cb.answer(
                text="🔍 **Разложение задачи**\n\n"
                     "Напиши задачу для разложения:\n\n"
                     "💡 *Пример:*\n"
                     "`/decompose подготовить отчет по проекту`",
                keyboard=self.get_main_keyboard()
            )

        @bot.on_button_callback('analyze_day')
        async def analyze_handler(cb):
            try:
                user_id = self.normalize_user_id(cb.user)
                self.active_chats[user_id] = cb.message.recipient.chat_id
                
                # ВСЕГДА получаем свежие данные из базы
                tasks = list_tasks(user_id)
                user = get_or_create_user(user_id)
                res = analyze_day(user, tasks)
                
                await cb.answer(
                    text=f"📊 **Анализ дня:**\n\n{res['text']}",
                    keyboard=self.get_main_keyboard()
                )
                
                logging.info(f"📊 Пользователь {user_id} запросил анализ дня")
                
            except Exception as e:
                logging.exception("Error in analyze_handler")
                await cb.answer("❌ Ошибка при анализе дня")

        # Кнопки быстрого добавления задач
        @bot.on_button_callback('add_study')
        async def add_study_handler(cb):
            user_id = self.normalize_user_id(cb.user)
            self.active_chats[user_id] = cb.message.recipient.chat_id
            
            await cb.answer(
                text="📚 **Учебные задачи**\n\n"
                     "Напиши учебную задачу:\n\n"
                     "💡 *Пример:*\n"
                     "`/add сделать домашку по математике est=60 difficulty=2`",
                keyboard=self.get_add_task_keyboard()
            )

        @bot.on_button_callback('add_work')
        async def add_work_handler(cb):
            user_id = self.normalize_user_id(cb.user)
            self.active_chats[user_id] = cb.message.recipient.chat_id
            
            await cb.answer(
                text="💼 **Рабочие задачи**\n\n"
                     "Напиши рабочую задачу:\n\n"
                     "💡 *Пример:*\n"
                     "`/add подготовить отчет est=45 difficulty=3`",
                keyboard=self.get_add_task_keyboard()
            )

        @bot.on_button_callback('add_home')
        async def add_home_handler(cb):
            user_id = self.normalize_user_id(cb.user)
            self.active_chats[user_id] = cb.message.recipient.chat_id
            
            await cb.answer(
                text="🏠 **Домашние задачи**\n\n"
                     "Напиши домашнюю задачу:\n\n"
                     "💡 *Пример:*\n"
                     "`/add убраться в комнате est=30 difficulty=1`",
                keyboard=self.get_add_task_keyboard()
            )

        @bot.on_button_callback('add_personal')
        async def add_personal_handler(cb):
            user_id = self.normalize_user_id(cb.user)
            self.active_chats[user_id] = cb.message.recipient.chat_id
            
            await cb.answer(
                text="🎯 **Личные задачи**\n\n"
                     "Напиши личную задачу:\n\n"
                     "💡 *Пример:*\n"
                     "`/add сходить в спортзал est=90 difficulty=2`",
                keyboard=self.get_add_task_keyboard()
            )

        # Назад в главное меню
        @bot.on_button_callback('back_main')
        async def back_main_handler(cb):
            user_id = self.normalize_user_id(cb.user)
            self.active_chats[user_id] = cb.message.recipient.chat_id
            
            await cb.answer(
                text="🏠 **Главное меню**",
                keyboard=self.get_main_keyboard()
            )

        # Команды
        @bot.on_command('add')
        async def cmd_add(ctx):
            try:
                user_id = self.normalize_user_id(ctx.sender)
                self.active_chats[user_id] = ctx.recipient.chat_id
                
                text = ctx.message.body.text or ""
                args = text[len("/add"):].strip()
                est = 0
                diff = 1
                
                # Парсим параметры
                m_est = re.search(r"est\s*=\s*(\d+)", args)
                m_diff = re.search(r"difficulty\s*=\s*(\d+)", args)
                
                if m_est:
                    est = int(m_est.group(1))
                    args = re.sub(r"est\s*=\s*\d+", "", args)
                if m_diff:
                    diff = int(m_diff.group(1))
                    args = re.sub(r"difficulty\s*=\s*\d+", "", args)
                    
                title = args.strip()
                if not title:
                    await ctx.reply(
                        "❌ **Укажи название задачи после /add**\n\n"
                        "💡 *Пример:*\n"
                        "`/add сделать домашку est=30 difficulty=2`",
                        keyboard=self.get_main_keyboard()
                    )
                    return
                    
                # Добавляем задачу в базу
                task = add_task_for_user(user_id, title, estimated_minutes=est, difficulty=diff)
                
                # Сразу получаем ОБНОВЛЕННЫЙ список задач
                updated_tasks = list_tasks(user_id)
                task_text = self.format_task_list(updated_tasks)
                
                if task.status == "quick":
                    response = (f'⚡ **Быстрая задача добавлена!**\n\n'
                              f'"{title}" (<=2 мин)\n\n'
                              f'💡 *Сделай прямо сейчас!*\n\n'
                              f'{task_text}')
                else:
                    est_info = f"⏱{est}m" if est else ""
                    diff_info = f"⚡{diff}" if diff > 1 else ""
                    info_parts = [p for p in [est_info, diff_info] if p]
                    info_str = f" ({' '.join(info_parts)})" if info_parts else ""
                    
                    response = (f'✅ **Задача добавлена**\n\n'
                              f'"{title}"{info_str}\n\n'
                              f'{task_text}')
                
                await ctx.reply(response, keyboard=self.get_main_keyboard())
                logging.info(f"📝 Пользователь {user_id} добавил задачу: {title}")
                    
            except Exception as e:
                logging.exception("Error in cmd_add")
                await ctx.reply(
                    "❌ Ошибка при добавлении задачи",
                    keyboard=self.get_main_keyboard()
                )

        @bot.on_command('list_tasks')
        async def cmd_list(ctx):
            try:
                user_id = self.normalize_user_id(ctx.sender)
                self.active_chats[user_id] = ctx.recipient.chat_id
                
                # ВСЕГДА получаем свежие данные из базы
                tasks = list_tasks(user_id)
                logging.info(f"📋 Пользователь {user_id} запросил список задач: {len(tasks)} задач")
                
                if not tasks:
                    await ctx.reply(
                        "📝 **Список задач пуст**\n\n"
                        "Добавь задачи через:\n"
                        "• Кнопку '📝 Добавить задачу'\n"  
                        "• Команду `/add <задача>`\n"
                        "• Веб-приложение",
                        keyboard=self.get_main_keyboard()
                    )
                    return
                    
                task_text = self.format_task_list(tasks)
                await ctx.reply(task_text, keyboard=self.get_main_keyboard())
                
            except Exception as e:
                logging.exception("Error in cmd_list")
                await ctx.reply(
                    "❌ Ошибка при получении списка задач",
                    keyboard=self.get_main_keyboard()
                )

        @bot.on_command('complete')
        async def cmd_complete(ctx):
            try:
                user_id = self.normalize_user_id(ctx.sender)
                self.active_chats[user_id] = ctx.recipient.chat_id
                
                text = ctx.message.body.text or ""
                arg = text[len("/complete"):].strip()
                
                if not arg or not arg.isdigit():
                    await ctx.reply(
                        "❌ **Укажи ID задачи**\n\n"
                        "💡 *Пример:*\n"
                        "`/complete 1`\n\n"
                        "Посмотри ID через `/list_tasks`",
                        keyboard=self.get_main_keyboard()
                    )
                    return
                    
                task_id = int(arg)
                completed_task = complete_task(user_id, task_id)
                
                if not completed_task:
                    await ctx.reply(
                        "❌ **Задача не найдена**\n\n"
                        "Проверь ID через `/list_tasks`",
                        keyboard=self.get_main_keyboard()
                    )
                else:
                    # Получаем ОБНОВЛЕННЫЙ список задач
                    updated_tasks = list_tasks(user_id)
                    task_text = self.format_task_list(updated_tasks)
                    
                    await ctx.reply(
                        f"✅ **Задача завершена!**\n\n"
                        f"'{completed_task.title}' ✅\n\n"
                        f"{task_text}",
                        keyboard=self.get_main_keyboard()
                    )
                    
                    logging.info(f"✅ Пользователь {user_id} завершил задачу: {completed_task.title}")
                    
            except Exception as e:
                logging.exception("Error in cmd_complete")
                await ctx.reply(
                    "❌ Ошибка при завершении задачи",
                    keyboard=self.get_main_keyboard()
                )

        @bot.on_command('motivation')
        async def cmd_motivation(ctx):
            try:
                user_id = self.normalize_user_id(ctx.sender)
                self.active_chats[user_id] = ctx.recipient.chat_id
                
                q = random_motivation()
                await ctx.reply(
                    f"💫 **Мотивация:**\n\n{q}",
                    keyboard=self.get_main_keyboard()
                )
            except Exception as e:
                logging.exception("Error in cmd_motivation")
                await ctx.reply(
                    "❌ Не могу найти мотивацию...",
                    keyboard=self.get_main_keyboard()
                )

        @bot.on_command('decompose')
        async def cmd_decompose(ctx):
            try:
                user_id = self.normalize_user_id(ctx.sender)
                self.active_chats[user_id] = ctx.recipient.chat_id
                
                text = ctx.message.body.text or ""
                arg = text[len("/decompose"):].strip()
                
                if not arg:
                    await ctx.reply(
                        "❌ **Укажи задачу для разложения**\n\n"
                        "💡 *Пример:*\n"
                        "`/decompose подготовить отчет по проекту`",
                        keyboard=self.get_main_keyboard()
                    )
                    return
                    
                hints = []
                
                if arg.isdigit():
                    # Если передан ID, ищем задачу
                    tasks = list_tasks(user_id)
                    found_task = None
                    for t in tasks:
                        if t.id == int(arg):
                            found_task = t
                            break
                    
                    if found_task:
                        hints = decompose_task(found_task.title)
                        response = f"🔍 **Разложение задачи:**\n'{found_task.title}'\n\n" + "\n".join(hints)
                    else:
                        await ctx.reply(
                            "❌ Задача с таким ID не найдена",
                            keyboard=self.get_main_keyboard()
                        )
                        return
                else:
                    # Если передан текст, разлагаем его
                    hints = decompose_task(arg)
                    response = f"🔍 **Разложение задачи:**\n'{arg}'\n\n" + "\n".join(hints)
                    
                await ctx.reply(response, keyboard=self.get_main_keyboard())
                    
            except Exception as e:
                logging.exception("Error in cmd_decompose")
                await ctx.reply(
                    "❌ Ошибка при разложении задачи",
                    keyboard=self.get_main_keyboard()
                )

        @bot.on_command('analyze')
        async def cmd_analyze(ctx):
            try:
                user_id = self.normalize_user_id(ctx.sender)
                self.active_chats[user_id] = ctx.recipient.chat_id
                
                # ВСЕГДА получаем свежие данные из базы
                tasks = list_tasks(user_id)
                user = get_or_create_user(user_id)
                res = analyze_day(user, tasks)
                
                await ctx.reply(
                    f"📊 **Анализ дня:**\n\n{res['text']}",
                    keyboard=self.get_main_keyboard()
                )
                
                logging.info(f"📊 Пользователь {user_id} запросил анализ дня")
                
            except Exception as e:
                logging.exception("Error in cmd_analyze")
                await ctx.reply(
                    "❌ Ошибка при анализе дня",
                    keyboard=self.get_main_keyboard()
                )

        # Обработка любых сообщений (не команд)
        @bot.on_message()
        async def handle_all_messages(message):
            try:
                user_id = self.normalize_user_id(message.sender)
                self.active_chats[user_id] = message.recipient.chat_id
                
                text = message.body.text or ""
                
                # Игнорируем команды (они обрабатываются выше)
                if text.startswith('/'):
                    return
                    
                # Для обычных сообщений показываем справку
                await message.reply(
                    "🤖 **Бот управления задачами**\n\n"
                    "💡 *Доступные команды:*\n"
                    "`/start` - регистрация\n"
                    "`/add [задача]` - добавить задачу\n"
                    "`/list_tasks` - список задач\n"
                    "`/complete [id]` - завершить задачу\n"
                    "`/motivation` - мотивация\n"
                    "`/decompose [текст/id]` - разложить задачу\n"
                    "`/analyze` - анализ дня\n\n"
                    "🌐 *Задачи синхронизированы с веб-приложением*\n\n"
                    "Выбери действие:",
                    keyboard=self.get_main_keyboard()
                )
                
            except Exception as e:
                logging.exception("Error in handle_all_messages")

    def run(self):
        logging.info("🚀 Starting Task Bot with real-time synchronization...")
        self.bot.run()

def main():
    # Инициализируем базу данных
    init_db()
    
    # Создаем и запускаем бота
    bot = TaskBot()
    bot.run()

if __name__ == "__main__":
    main()