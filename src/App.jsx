// App.jsx
import React, { useEffect, useState } from "react";

const API = "http://localhost:8000";

// Компонент входа по ID
function LoginForm({ onLogin }) {
  const [maxUserId, setMaxUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (maxUserId.trim()) {
      setLoading(true);
      setError("");
      
      try {
        const userResponse = await fetch(`${API}/user/profile?external_id=max_${maxUserId}`);
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          onLogin(`max_${maxUserId}`, userData.name, maxUserId);
        } else {
          setError("Пользователь с таким ID не найден. Начните с бота в MAX!");
        }
      } catch (error) {
        setError("Ошибка подключения к серверу");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Анимированный фон */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20 w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg animate-bounce">
              <span className="text-white font-bold text-2xl">⚡</span>
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full border-4 border-slate-900 animate-pulse"></div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">TaskFlow Pro</h1>
          <p className="text-white/70">Вход по ID пользователя</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-3">
              Ваш ID из MAX
            </label>
            <div className="relative">
              <input
                type="text"
                value={maxUserId}
                onChange={(e) => setMaxUserId(e.target.value.replace(/\D/g, ''))}
                className="w-full p-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all backdrop-blur-sm"
                placeholder="Введите цифровой ID"
                required
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="bg-cyan-400/20 text-cyan-300 px-2 py-1 rounded text-xs font-mono">
                  ID
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-400/20 border border-red-400/30 rounded-xl p-4 animate-shake">
              <div className="flex items-center space-x-2 text-red-200">
                <span>⚠️</span>
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !maxUserId.trim()}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-4 rounded-xl hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-lg hover:shadow-cyan-500/25 hover:scale-105 transform duration-300"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Подключение...</span>
              </div>
            ) : (
              "Войти в систему 🚀"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// Улучшенный компонент списка задач
function TaskList({ tasks, onComplete, onAddTask, currentUser }) {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTasks = tasks.filter(task => {
    const matchesFilter = filter === 'all' || 
      (filter === 'active' && task.status !== 'done') ||
      (filter === 'completed' && task.status === 'done');
    
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: tasks.length,
    active: tasks.filter(t => t.status !== 'done').length,
    completed: tasks.filter(t => t.status === 'done').length,
    completionRate: tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100) : 0
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">📝 Мои задачи</h2>
          <p className="text-white/60 mt-1">
            {stats.completed} из {stats.total} завершено ({stats.completionRate}%)
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={onAddTask}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all shadow-lg hover:shadow-cyan-500/25 hover:scale-105 transform duration-300 font-semibold"
          >
            + Новая задача
          </button>
        </div>
      </div>

      {/* Поиск и фильтры */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Поиск задач..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-cyan-400 focus:border-transparent backdrop-blur-sm"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40">
              🔍
            </div>
          </div>
        </div>
        <div className="flex space-x-1 bg-white/5 p-1 rounded-xl border border-white/10">
          {[
            { id: 'all', label: 'Все', emoji: '📋' },
            { id: 'active', label: 'Активные', emoji: '⏳' },
            { id: 'completed', label: 'Завершенные', emoji: '✅' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`flex items-center space-x-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                filter === tab.id 
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{tab.emoji}</span>
              <span className="hidden sm:block">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl p-4 text-center border border-cyan-400/20 backdrop-blur-sm">
          <div className="text-2xl font-bold text-cyan-400">{stats.total}</div>
          <div className="text-white/60 text-sm">Всего</div>
        </div>
        <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 rounded-xl p-4 text-center border border-yellow-400/20 backdrop-blur-sm">
          <div className="text-2xl font-bold text-yellow-400">{stats.active}</div>
          <div className="text-white/60 text-sm">Активные</div>
        </div>
        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl p-4 text-center border border-green-400/20 backdrop-blur-sm">
          <div className="text-2xl font-bold text-green-400">{stats.completed}</div>
          <div className="text-white/60 text-sm">Завершено</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-4 text-center border border-purple-400/20 backdrop-blur-sm">
          <div className="text-2xl font-bold text-purple-400">{stats.completionRate}%</div>
          <div className="text-white/60 text-sm">Прогресс</div>
        </div>
      </div>

      {/* Список задач */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 text-white/40">
            <div className="text-6xl mb-4">📝</div>
            <div className="text-lg mb-2">
              {searchTerm ? 'Задачи не найдены' : 'Задач пока нет'}
            </div>
            <div className="text-sm">
              {searchTerm ? 'Попробуйте изменить запрос' : 'Создайте первую задачу'}
            </div>
          </div>
        ) : (
          filteredTasks.map(task => (
            <div 
              key={task.id} 
              className={`group bg-white/5 border rounded-2xl p-4 transition-all duration-300 hover:bg-white/10 hover:scale-105 hover:shadow-lg backdrop-blur-sm ${
                task.status === 'done' 
                  ? 'border-green-400/30 bg-green-500/5' 
                  : 'border-white/10 hover:border-cyan-400/30'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className={`font-semibold text-lg ${
                    task.status === 'done' ? 'text-green-300 line-through' : 'text-white'
                  }`}>
                    {task.title}
                  </h3>
                  <div className="flex items-center space-x-4 mt-2 text-sm">
                    <span className="text-cyan-300 flex items-center space-x-1">
                      <span>⏱️</span>
                      <span>{task.estimated_minutes}м</span>
                    </span>
                    <span className="text-yellow-300 flex items-center space-x-1">
                      <span>⚡</span>
                      <span>{task.difficulty}/5</span>
                    </span>
                    {task.status === 'done' && (
                      <span className="text-green-300 flex items-center space-x-1">
                        <span>✅</span>
                        <span>Завершено</span>
                      </span>
                    )}
                  </div>
                </div>
                {task.status !== 'done' && (
                  <button
                    onClick={() => onComplete(task.id)}
                    className="opacity-0 group-hover:opacity-100 bg-gradient-to-r from-green-500 to-emerald-500 text-white p-3 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg transform hover:scale-110 duration-200"
                  >
                    <span className="flex items-center space-x-1">
                      <span>✅</span>
                      <span className="hidden sm:block">Готово</span>
                    </span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Улучшенный календарь с анимациями
function EnergyCalendar({ tasks, onAddTask }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState('month');

  const getTasksForDate = (date) => {
    return tasks.filter(task => {
      const taskDate = new Date(task.created_at);
      return taskDate.toDateString() === date.toDateString();
    });
  };

  const getDayEnergy = (date) => {
    const dayTasks = getTasksForDate(date);
    if (dayTasks.length === 0) return 0;
    
    const totalEnergy = dayTasks.reduce((sum, task) => {
      const energy = task.difficulty * (task.estimated_minutes / 60);
      return sum + (task.status === 'done' ? energy * 0.7 : energy);
    }, 0);
    
    return Math.min(totalEnergy, 100);
  };

  const getEnergyColor = (energy) => {
    if (energy === 0) return 'from-gray-500/20 to-gray-600/20';
    if (energy < 25) return 'from-green-400/50 to-emerald-500/50';
    if (energy < 50) return 'from-yellow-400/50 to-amber-500/50';
    if (energy < 75) return 'from-orange-400/50 to-red-500/50';
    return 'from-red-400/50 to-pink-500/50';
  };

  const renderMonthView = () => {
    const days = [];
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const startDay = new Date(firstDay);
    startDay.setDate(firstDay.getDate() - firstDay.getDay() + 1);
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDay);
      date.setDate(startDay.getDate() + i);
      
      const dayTasks = getTasksForDate(date);
      const energyLevel = getDayEnergy(date);
      const isToday = date.toDateString() === today.toDateString();
      const isSelected = date.toDateString() === selectedDate.toDateString();
      const isCurrentMonth = date.getMonth() === today.getMonth();
      
      days.push(
        <div 
          key={i}
          className={`
            relative p-2 rounded-xl cursor-pointer transition-all duration-300 group backdrop-blur-sm
            ${isSelected ? 'scale-110 ring-2 ring-cyan-400 ring-opacity-80 z-10' : ''}
            ${isToday ? 'ring-2 ring-white ring-opacity-50' : ''}
            ${!isCurrentMonth ? 'opacity-40' : ''}
            bg-gradient-to-br ${getEnergyColor(energyLevel)}
            hover:scale-105 hover:shadow-lg
          `}
          onClick={() => setSelectedDate(date)}
        >
          <div className="text-center">
            <div className={`text-sm font-semibold mb-1 ${
              isCurrentMonth ? 'text-white' : 'text-white/60'
            }`}>
              {date.getDate()}
            </div>
            {dayTasks.length > 0 && (
              <div className="text-xs text-white/80 font-medium">
                {dayTasks.length}📝
              </div>
            )}
          </div>
          
          {/* Energy level indicator */}
          {energyLevel > 0 && (
            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-4/5 h-1 bg-black/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white/60 transition-all duration-500"
                style={{ width: `${energyLevel}%` }}
              ></div>
            </div>
          )}
        </div>
      );
    }
    
    return days;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">📅 Энергетический календарь</h2>
          <p className="text-white/60 mt-1">
            {selectedDate.toLocaleDateString('ru-RU', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setView(view === 'month' ? 'week' : 'month')}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 transition-colors backdrop-blur-sm"
          >
            {view === 'month' ? 'Неделя' : 'Месяц'}
          </button>
          <button 
            onClick={onAddTask}
            className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all shadow-lg hover:shadow-cyan-500/25 hover:scale-105 transform duration-300"
          >
            + Добавить
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-4">
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
          <div key={day} className="text-center font-semibold text-white/60 py-3 text-sm">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {renderMonthView()}
      </div>
    </div>
  );
}

// Улучшенный Pomodoro таймер
function PomodoroTimer({ tasks, onTaskComplete }) {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState('work');
  const [selectedTask, setSelectedTask] = useState(null);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  useEffect(() => {
    let interval = null;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }
    
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    if (mode === 'work' && selectedTask) {
      onTaskComplete(selectedTask.id);
      setSessionsCompleted(prev => prev + 1);
      setMode('break');
      setTimeLeft(5 * 60);
    } else {
      setMode('work');
      setTimeLeft(25 * 60);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (25 * 60 - timeLeft) / (25 * 60) * 100;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">🍅 Focus Timer</h2>
        <p className="text-white/60">Метод Pomodoro для максимальной продуктивности</p>
      </div>

      {/* Main timer */}
      <div className={`relative rounded-3xl p-8 text-center backdrop-blur-lg border transition-all duration-500 ${
        mode === 'work' 
          ? 'bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-400/30' 
          : 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-400/30'
      }`}>
        <div className="relative z-10">
          <div className="text-7xl font-bold text-white mb-4 font-mono animate-pulse">
            {formatTime(timeLeft)}
          </div>
          <div className={`text-xl font-semibold mb-2 ${
            mode === 'work' ? 'text-red-300' : 'text-green-300'
          }`}>
            {mode === 'work' ? '⏰ Время фокуса' : '☕ Перерыв'}
          </div>
          <div className="text-white/60 text-sm mb-6">
            Сессий завершено: <span className="text-cyan-300 font-semibold">{sessionsCompleted}</span>
          </div>

          <div className="flex justify-center space-x-4">
            {!isRunning ? (
              <button
                onClick={() => selectedTask && setIsRunning(true)}
                disabled={!selectedTask}
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg hover:shadow-green-500/25 hover:scale-105 transform duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Старт 🚀
              </button>
            ) : (
              <button
                onClick={() => setIsRunning(false)}
                className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-xl hover:from-yellow-600 hover:to-amber-600 transition-all shadow-lg hover:shadow-yellow-500/25 hover:scale-105 transform duration-300 font-semibold"
              >
                Пауза ⏸️
              </button>
            )}
            <button
              onClick={() => {
                setIsRunning(false);
                setTimeLeft(mode === 'work' ? 25 * 60 : 5 * 60);
              }}
              className="px-6 py-4 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 transition-colors backdrop-blur-sm"
            >
              Сброс 🔄
            </button>
          </div>
        </div>
      </div>

      {/* Task selection */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
        <label className="block text-white font-semibold mb-4">
          🎯 Выберите задачу для фокусировки:
        </label>
        <select
          value={selectedTask?.id || ''}
          onChange={(e) => {
            const task = tasks.find(t => t.id === parseInt(e.target.value));
            setSelectedTask(task);
          }}
          className="w-full p-4 bg-white/5 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all backdrop-blur-sm"
          disabled={isRunning}
        >
          <option value="" className="bg-slate-800">-- Выберите задачу --</option>
          {tasks.filter(t => t.status !== 'done').map(task => (
            <option key={task.id} value={task.id} className="bg-slate-800">
              {task.title} (⏱{task.estimated_minutes}м ⚡{task.difficulty})
            </option>
          ))}
        </select>

        {selectedTask && (
          <div className="mt-4 p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-400/20 rounded-xl backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white">{selectedTask.title}</h3>
                <div className="text-cyan-300 text-sm mt-1">
                  ⏱️ {selectedTask.estimated_minutes} мин • ⚡ {selectedTask.difficulty}/5
                </div>
              </div>
              <div className="text-cyan-400 text-2xl animate-bounce">
                {mode === 'work' ? '🎯' : '☕'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Улучшенный профиль с аватаркой
function UserProfile({ tasks, currentUser }) {
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalMinutes = tasks.reduce((sum, task) => sum + task.estimated_minutes, 0);
  
  // Генерируем аватар на основе ID пользователя
  const getAvatarUrl = (userId) => {
    const colors = ['ff6b6b', '4ecdc4', '45b7d1', '96ceb4', 'feca57', 'ff9ff3', '54a0ff'];
    const color = colors[userId.length % colors.length];
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=${color}&color=fff&size=128&bold=true`;
  };

  const getProductivityLevel = () => {
    if (completionRate >= 80) return { level: '🔥 Мастер', color: 'from-red-500 to-orange-500' };
    if (completionRate >= 60) return { level: '🚀 Профи', color: 'from-orange-500 to-yellow-500' };
    if (completionRate >= 40) return { level: '💪 Стабильный', color: 'from-yellow-500 to-green-500' };
    if (completionRate >= 20) return { level: '📈 Растущий', color: 'from-green-500 to-cyan-500' };
    return { level: '🌱 Начинающий', color: 'from-cyan-500 to-blue-500' };
  };

  const productivity = getProductivityLevel();

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white">👤 Мой профиль</h2>
        <p className="text-white/60">Статистика и достижения</p>
      </div>

      {/* Аватар и основная информация */}
      <div className="bg-gradient-to-br from-white/5 to-white/10 rounded-3xl p-6 border border-white/10 backdrop-blur-sm">
        <div className="flex items-center space-x-6">
          <div className="relative">
            <img 
              src={getAvatarUrl(currentUser.id)}
              alt={currentUser.name}
              className="w-20 h-20 rounded-2xl border-4 border-cyan-400/50 shadow-lg"
            />
            <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-400 rounded-full border-4 border-slate-900"></div>
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-white">{currentUser.name}</h3>
            <div className={`inline-block mt-2 px-4 py-1 bg-gradient-to-r ${productivity.color} text-white rounded-full text-sm font-semibold`}>
              {productivity.level}
            </div>
          </div>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl p-4 text-center border border-cyan-400/20 backdrop-blur-sm">
          <div className="text-2xl font-bold text-cyan-400">{totalTasks}</div>
          <div className="text-white/60 text-sm">Всего задач</div>
        </div>
        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl p-4 text-center border border-green-400/20 backdrop-blur-sm">
          <div className="text-2xl font-bold text-green-400">{completedTasks}</div>
          <div className="text-white/60 text-sm">Завершено</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-4 text-center border border-purple-400/20 backdrop-blur-sm">
          <div className="text-2xl font-bold text-purple-400">{completionRate}%</div>
          <div className="text-white/60 text-sm">Эффективность</div>
        </div>
        <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-xl p-4 text-center border border-orange-400/20 backdrop-blur-sm">
          <div className="text-2xl font-bold text-orange-400">{Math.round(totalMinutes / 60)}ч</div>
          <div className="text-white/60 text-sm">Всего времени</div>
        </div>
      </div>

      {/* Достижения */}
      <div className="bg-gradient-to-br from-white/5 to-white/10 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
        <h3 className="text-xl font-bold text-white mb-4">🏆 Достижения</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`p-4 rounded-xl border ${
            completedTasks >= 10 ? 'bg-yellow-500/20 border-yellow-400/30' : 'bg-white/5 border-white/10'
          }`}>
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{completedTasks >= 10 ? '🎯' : '📝'}</span>
              <div>
                <div className="font-semibold text-white">Мастер задач</div>
                <div className="text-white/60 text-sm">Завершите 10 задач</div>
                <div className="text-yellow-400 text-sm mt-1">
                  {completedTasks >= 10 ? '✅ Завершено!' : `${completedTasks}/10 задач`}
                </div>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-xl border ${
            totalMinutes >= 300 ? 'bg-green-500/20 border-green-400/30' : 'bg-white/5 border-white/10'
          }`}>
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{totalMinutes >= 300 ? '⏰' : '🕒'}</span>
              <div>
                <div className="font-semibold text-white">Трудоголик</div>
                <div className="text-white/60 text-sm">Потратьте 5+ часов</div>
                <div className="text-green-400 text-sm mt-1">
                  {totalMinutes >= 300 ? '✅ Завершено!' : `${Math.round(totalMinutes/60)}/5 часов`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Улучшенный анализ
function DailyAnalysis({ tasks }) {
  const today = new Date().toDateString();
  const todayTasks = tasks.filter(task => new Date(task.created_at).toDateString() === today);
  const completedToday = todayTasks.filter(t => t.status === 'done').length;
  const pendingToday = todayTasks.filter(t => t.status !== 'done').length;

  const getMotivation = () => {
    if (completedToday === 0 && pendingToday === 0) {
      return { message: 'Начните свой продуктивный день!', emoji: '🎯', color: 'from-cyan-500/10 to-blue-500/10' };
    }
    if (completedToday >= pendingToday * 2) {
      return { message: 'Отличная работа! Вы сегодня на высоте!', emoji: '🎉', color: 'from-green-500/10 to-emerald-500/10' };
    }
    if (completedToday > pendingToday) {
      return { message: 'Хороший прогресс! Продолжайте в том же духе!', emoji: '🚀', color: 'from-yellow-500/10 to-amber-500/10' };
    }
    if (completedToday > 0) {
      return { message: 'Есть над чем поработать! Не сдавайтесь!', emoji: '💪', color: 'from-orange-500/10 to-red-500/10' };
    }
    return { message: 'Время взяться за дела! Начните с малого!', emoji: '📈', color: 'from-purple-500/10 to-pink-500/10' };
  };

  const motivation = getMotivation();

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white">📈 Ежедневный анализ</h2>
        <p className="text-white/60">Ваша продуктивность сегодня</p>
      </div>

      {/* Основная статистика */}
      <div className={`bg-gradient-to-br ${motivation.color} rounded-3xl p-8 text-center border border-white/10 backdrop-blur-sm`}>
        <div className="text-6xl mb-4 animate-bounce">{motivation.emoji}</div>
        <div className="text-2xl font-bold text-white mb-4">{motivation.message}</div>
        
        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
          <div className="bg-white/10 rounded-xl p-4">
            <div className="text-2xl font-bold text-white">{todayTasks.length}</div>
            <div className="text-white/60 text-sm">Всего</div>
          </div>
          <div className="bg-green-500/20 rounded-xl p-4">
            <div className="text-2xl font-bold text-white">{completedToday}</div>
            <div className="text-white/60 text-sm">Завершено</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <div className="text-2xl font-bold text-white">{pendingToday}</div>
            <div className="text-white/60 text-sm">В процессе</div>
          </div>
        </div>
      </div>

      {/* Рекомендации */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
          <h3 className="text-xl font-bold text-white mb-4">💡 Советы на сегодня</h3>
          <div className="space-y-3 text-white/80">
            {completedToday === 0 && (
              <p>Начните с самой простой задачи - даже 5 минут работы лучше, чем ничего!</p>
            )}
            {pendingToday > completedToday && (
              <p>Сосредоточьтесь на завершении начатых задач перед тем как брать новые.</p>
            )}
            {completedToday > 0 && (
              <p>Отличный старт! Планируйте следующие задачи с учетом своего темпа.</p>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-2xl p-6 border border-cyan-400/20 backdrop-blur-sm">
          <h3 className="text-xl font-bold text-white mb-4">📊 Быстрая статистика</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-white/70">Эффективность:</span>
              <span className="text-cyan-400 font-semibold">
                {todayTasks.length ? Math.round((completedToday / todayTasks.length) * 100) : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/70">Время работы:</span>
              <span className="text-yellow-400 font-semibold">
                {Math.round(todayTasks.reduce((sum, task) => sum + task.estimated_minutes, 0) / 60)}ч
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/70">Средняя сложность:</span>
              <span className="text-purple-400 font-semibold">
                {todayTasks.length ? Math.round(todayTasks.reduce((sum, task) => sum + task.difficulty, 0) / todayTasks.length) : 0}/5
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Улучшенное модальное окно
function AddTaskModal({ onAdd, onClose }) {
  const [title, setTitle] = useState("");
  const [minutes, setMinutes] = useState(25);
  const [difficulty, setDifficulty] = useState(2);
  const [category, setCategory] = useState('work');

  const categories = [
    { id: 'work', emoji: '💼', label: 'Работа', color: 'blue' },
    { id: 'study', emoji: '📚', label: 'Учеба', color: 'green' },
    { id: 'personal', emoji: '🎯', label: 'Личное', color: 'purple' },
    { id: 'health', emoji: '🏃', label: 'Здоровье', color: 'red' },
    { id: 'home', emoji: '🏠', label: 'Дом', color: 'yellow' }
  ];

  const handleSubmit = () => {
    if (title.trim()) {
      onAdd(title, minutes, difficulty);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-slate-800 rounded-3xl p-6 w-full max-w-md border border-white/10 shadow-2xl animate-scaleIn">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">🎯 Новая задача</h3>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-3">
              Название задачи
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all backdrop-blur-sm"
              placeholder="Что нужно сделать?"
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white/80 mb-3">
              Категория
            </label>
            <div className="grid grid-cols-5 gap-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`p-3 rounded-xl border transition-all ${
                    category === cat.id 
                      ? `bg-${cat.color}-500/20 border-${cat.color}-400/50` 
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="text-lg">{cat.emoji}</div>
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-3">
                Время (минут)
              </label>
              <input
                type="number"
                value={minutes}
                onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
                className="w-full p-4 bg-white/5 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all backdrop-blur-sm"
                min="0"
                max="480"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/80 mb-3">
                Сложность
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(parseInt(e.target.value))}
                className="w-full p-4 bg-white/5 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all backdrop-blur-sm"
              >
                <option value={1}>🟢 Легко</option>
                <option value={2}>🟡 Средне</option>
                <option value={3}>🟠 Сложно</option>
                <option value={4}>🔴 Очень сложно</option>
                <option value={5}>💪 Эксперт</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-4 rounded-xl hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-lg hover:shadow-cyan-500/25 hover:scale-105 transform duration-300"
          >
            Создать задачу
          </button>
          <button
            onClick={onClose}
            className="px-6 py-4 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 transition-colors backdrop-blur-sm"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}

// Главный компонент приложения
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks');

  useEffect(() => {
    if (currentUser && tasks.length === 0) {
      loadTasks();
    }
  }, [currentUser]);

  const loadTasks = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API}/tasks/list?external_id=${currentUser.id}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || data || []);
      }
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userId, userName, maxUserId) => {
    setCurrentUser({ 
      id: userId, 
      name: userName || 'Пользователь', 
      maxUserId 
    });
    localStorage.setItem("taskbot_user", JSON.stringify({ 
      id: userId, 
      maxUserId 
    }));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setTasks([]);
    localStorage.removeItem("taskbot_user");
  };

  const handleAddTask = async (title, minutes, difficulty) => {
    if (!currentUser) return;

    try {
      const response = await fetch(`${API}/tasks/create?external_id=${currentUser.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          estimated_minutes: minutes,
          difficulty
        }),
      });

      if (response.ok) {
        const newTask = await response.json();
        setTasks(prev => [newTask.task, ...prev]);
      }
    } catch (error) {
      console.error("Error creating task:", error);
    }
  };

  const handleCompleteTask = async (taskId) => {
    if (!currentUser) return;

    try {
      const response = await fetch(`${API}/tasks/complete?external_id=${currentUser.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task_id: taskId
        }),
      });

      if (response.ok) {
        setTasks(prev => prev.map(task => 
          task.id === taskId ? { ...task, status: 'done' } : task
        ));
      }
    } catch (error) {
      console.error("Error completing task:", error);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("taskbot_user");
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setCurrentUser({ 
        ...userData, 
        name: 'Пользователь' 
      });
    }
  }, []);

  const renderNavigation = () => (
    <div className="flex space-x-1 bg-white/5 p-1 rounded-2xl border border-white/10 mb-6 backdrop-blur-sm">
      {[
        { id: 'tasks', label: 'Задачи', emoji: '📝' },
        { id: 'calendar', label: 'Календарь', emoji: '📅' },
        { id: 'pomodoro', label: 'Фокус', emoji: '🍅' },
        { id: 'profile', label: 'Профиль', emoji: '👤' },
        { id: 'analysis', label: 'Анализ', emoji: '📈' }
      ].map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
            activeTab === tab.id 
              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg' 
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <span className="text-base">{tab.emoji}</span>
            <span className="hidden sm:block">{tab.label}</span>
          </div>
        </button>
      ))}
    </div>
  );

  if (!currentUser) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Шапка */}
        <header className="bg-white/5 backdrop-blur-lg rounded-3xl p-6 shadow-2xl border border-white/10 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">
                    {currentUser.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-4 border-slate-900"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Добро пожаловать, {currentUser.name}!</h1>
                <p className="text-white/60">TaskFlow Pro - ваша система продуктивности</p>
                {currentUser.maxUserId && (
                  <p className="text-cyan-400 text-sm mt-1">🤖 Синхронизировано с ботом MAX</p>
                )}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-6 py-2 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 transition-colors backdrop-blur-sm"
            >
              Выйти
            </button>
          </div>
        </header>

        {/* Навигация */}
        {renderNavigation()}

        {/* Основной контент */}
        <main className="bg-white/5 backdrop-blur-lg rounded-3xl p-6 shadow-2xl border border-white/10">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-white">Загрузка...</span>
            </div>
          ) : (
            <div className="text-white">
              {activeTab === 'tasks' && (
                <TaskList 
                  tasks={tasks} 
                  onComplete={handleCompleteTask}
                  onAddTask={() => setShowAddTask(true)}
                  currentUser={currentUser}
                />
              )}
              {activeTab === 'calendar' && (
                <EnergyCalendar 
                  tasks={tasks}
                  onAddTask={() => setShowAddTask(true)}
                />
              )}
              {activeTab === 'pomodoro' && (
                <PomodoroTimer 
                  tasks={tasks}
                  onTaskComplete={handleCompleteTask}
                />
              )}
              {activeTab === 'profile' && (
                <UserProfile 
                  tasks={tasks}
                  currentUser={currentUser}
                />
              )}
              {activeTab === 'analysis' && (
                <DailyAnalysis tasks={tasks} />
              )}
            </div>
          )}
        </main>

        {/* Модальное окно добавления задачи */}
        {showAddTask && (
          <AddTaskModal
            onAdd={handleAddTask}
            onClose={() => setShowAddTask(false)}
          />
        )}
      </div>
    </div>
  );

}

