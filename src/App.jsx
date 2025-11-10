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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl p-8 shadow-2xl border border-slate-600 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">TaskFlow Pro</h1>
          <p className="text-slate-300">Вход по ID пользователя</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Ваш ID из MAX
            </label>
            <div className="relative">
              <input
                type="text"
                value={maxUserId}
                onChange={(e) => setMaxUserId(e.target.value.replace(/\D/g, ''))}
                className="w-full p-4 bg-slate-700 border border-slate-500 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Введите цифровой ID"
                required
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs font-mono">
                  ID
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <div className="flex items-center space-x-2 text-red-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !maxUserId.trim()}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 rounded-xl hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 font-semibold shadow-lg border border-blue-400/30"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Подключение...</span>
              </div>
            ) : (
              "Войти в систему"
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
          <h2 className="text-xl font-bold text-white">Мои задачи</h2>
          <p className="text-slate-300 text-sm mt-1">
            {stats.completed} из {stats.total} завершено ({stats.completionRate}%)
          </p>
        </div>
        <button 
          onClick={onAddTask}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold w-full lg:w-auto border border-blue-400/30"
        >
          Новая задача
        </button>
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
              className="w-full p-4 bg-slate-700 border border-slate-500 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="flex space-x-1 bg-slate-700 p-1 rounded-xl border border-slate-500">
          {[
            { id: 'all', label: 'Все' },
            { id: 'active', label: 'Активные' },
            { id: 'completed', label: 'Завершенные' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                filter === tab.id 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow border border-blue-400/30' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-700 rounded-xl p-4 text-center border border-slate-500">
          <div className="text-xl font-bold text-blue-400">{stats.total}</div>
          <div className="text-slate-300 text-sm">Всего</div>
        </div>
        <div className="bg-slate-700 rounded-xl p-4 text-center border border-slate-500">
          <div className="text-xl font-bold text-yellow-400">{stats.active}</div>
          <div className="text-slate-300 text-sm">Активные</div>
        </div>
        <div className="bg-slate-700 rounded-xl p-4 text-center border border-slate-500">
          <div className="text-xl font-bold text-green-400">{stats.completed}</div>
          <div className="text-slate-300 text-sm">Завершено</div>
        </div>
        <div className="bg-slate-700 rounded-xl p-4 text-center border border-slate-500">
          <div className="text-xl font-bold text-purple-400">{stats.completionRate}%</div>
          <div className="text-slate-300 text-sm">Прогресс</div>
        </div>
      </div>

      {/* Список задач */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <svg className="w-16 h-16 mx-auto mb-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
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
              className={`group bg-slate-700 border rounded-xl p-4 transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                task.status === 'done' 
                  ? 'border-green-500/50 bg-green-500/10' 
                  : 'border-slate-500 hover:border-blue-500/50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className={`font-medium ${task.status === 'done' ? 'text-green-300 line-through' : 'text-white'}`}>
                    {task.title}
                  </h3>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-slate-300">
                    <span className="flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{task.estimated_minutes} мин</span>
                    </span>
                    <span className={`flex items-center space-x-1 ${
                      task.difficulty >= 4 ? 'text-red-400' : 
                      task.difficulty >= 3 ? 'text-orange-400' : 
                      task.difficulty >= 2 ? 'text-yellow-400' : 'text-green-400'
                    }`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>{task.difficulty}/5</span>
                    </span>
                    {task.status === 'done' && (
                      <span className="text-green-400 flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Завершено</span>
                      </span>
                    )}
                  </div>
                </div>
                {task.status !== 'done' && (
                  <button
                    onClick={() => onComplete(task.id)}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-2 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-110 shadow border border-green-400/30"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
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

// УЛУЧШЕННЫЙ ЭНЕРГЕТИЧЕСКИЙ КАЛЕНДАРЬ
function EnergyCalendar({ tasks, onAddTask }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

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
    if (energy === 0) return 'bg-slate-700';
    if (energy < 25) return 'bg-gradient-to-br from-green-500 to-emerald-500';
    if (energy < 50) return 'bg-gradient-to-br from-yellow-500 to-amber-500';
    if (energy < 75) return 'bg-gradient-to-br from-orange-500 to-red-500';
    return 'bg-gradient-to-br from-red-500 to-pink-500';
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 1: return 'bg-green-500';
      case 2: return 'bg-yellow-500';
      case 3: return 'bg-orange-500';
      case 4: return 'bg-red-500';
      case 5: return 'bg-purple-500';
      default: return 'bg-slate-500';
    }
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const renderMonthView = () => {
    const days = [];
    const today = new Date();
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const startDay = new Date(firstDay);
    startDay.setDate(firstDay.getDate() - firstDay.getDay() + 1);
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDay);
      date.setDate(startDay.getDate() + i);
      
      const dayTasks = getTasksForDate(date);
      const energyLevel = getDayEnergy(date);
      const isToday = date.toDateString() === today.toDateString();
      const isSelected = date.toDateString() === selectedDate.toDateString();
      const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
      
      days.push(
        <div 
          key={i}
          className={`
            relative p-2 rounded-lg cursor-pointer transition-all duration-300 transform hover:scale-110 group
            ${isSelected ? 'ring-2 ring-blue-500 scale-110' : ''}
            ${isToday ? 'ring-1 ring-slate-400' : ''}
            ${!isCurrentMonth ? 'opacity-40' : getEnergyColor(energyLevel)}
            min-h-[60px] border border-slate-500/30
          `}
          onClick={() => setSelectedDate(date)}
        >
          <div className="text-center">
            <div className={`text-sm font-medium mb-1 ${
              isCurrentMonth ? 'text-white' : 'text-slate-400'
            }`}>
              {date.getDate()}
            </div>
            
            {/* Индикаторы задач */}
            {dayTasks.length > 0 && (
              <div className="flex justify-center space-x-1 mb-1">
                {dayTasks.slice(0, 3).map((task, index) => (
                  <div 
                    key={index}
                    className={`w-2 h-2 rounded-full ${getDifficultyColor(task.difficulty)}`}
                    title={`${task.title} (${task.difficulty}/5)`}
                  />
                ))}
                {dayTasks.length > 3 && (
                  <div className="text-xs text-white/80">+{dayTasks.length - 3}</div>
                )}
              </div>
            )}
            
            {/* Уровень энергии */}
            {energyLevel > 0 && (
              <div className="text-xs text-white/90 font-semibold">
                {Math.round(energyLevel)}%
              </div>
            )}
          </div>
        </div>
      );
    }
    
    return days;
  };

  const selectedDayTasks = getTasksForDate(selectedDate);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Энергетический календарь</h2>
          <p className="text-slate-300 text-sm mt-1">
            {selectedDate.toLocaleDateString('ru-RU', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-slate-700 rounded-xl border border-slate-500">
            <button 
              onClick={() => navigateMonth(-1)}
              className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-600 rounded-l-xl transition-colors"
            >
              ←
            </button>
            <div className="px-4 py-2 text-white font-medium">
              {currentMonth.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
            </div>
            <button 
              onClick={() => navigateMonth(1)}
              className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-600 rounded-r-xl transition-colors"
            >
              →
            </button>
          </div>
          <button 
            onClick={onAddTask}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 shadow font-semibold border border-blue-400/30"
          >
            Добавить задачу
          </button>
        </div>
      </div>

      {/* Легенда календаря */}
      <div className="bg-slate-700 rounded-xl p-4 border border-slate-500">
        <h3 className="text-sm font-semibold text-white mb-3">Легенда энергии:</h3>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-slate-600 rounded border border-slate-500"></div>
            <span className="text-slate-300">Нет активности</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded"></div>
            <span className="text-slate-300">Низкая (1-25%)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gradient-to-br from-yellow-500 to-amber-500 rounded"></div>
            <span className="text-slate-300">Средняя (26-50%)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gradient-to-br from-orange-500 to-red-500 rounded"></div>
            <span className="text-slate-300">Высокая (51-75%)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gradient-to-br from-red-500 to-pink-500 rounded"></div>
            <span className="text-slate-300">Максимальная (76-100%)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-4">
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
          <div key={day} className="text-center font-medium text-slate-400 py-2 text-sm">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-3">
        {renderMonthView()}
      </div>

      {/* Задачи выбранного дня */}
      {selectedDayTasks.length > 0 && (
        <div className="bg-slate-700 rounded-xl p-4 border border-slate-500">
          <h3 className="text-lg font-semibold text-white mb-3">
            Задачи на {selectedDate.toLocaleDateString('ru-RU')}:
          </h3>
          <div className="space-y-2">
            {selectedDayTasks.map(task => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-slate-600 rounded-lg border border-slate-500">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${getDifficultyColor(task.difficulty)}`}></div>
                  <span className={`${task.status === 'done' ? 'text-green-300 line-through' : 'text-white'}`}>
                    {task.title}
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-slate-300">
                  <span>{task.estimated_minutes} мин</span>
                  <span className={`px-2 py-1 rounded ${
                    task.difficulty >= 4 ? 'bg-red-500/20 text-red-300' : 
                    task.difficulty >= 3 ? 'bg-orange-500/20 text-orange-300' : 
                    task.difficulty >= 2 ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-300'
                  }`}>
                    {task.difficulty}/5
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
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

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-xl font-bold text-white mb-2">Focus Timer</h2>
        <p className="text-slate-300">Метод Pomodoro для максимальной продуктивности</p>
      </div>

      {/* Main timer */}
      <div className={`relative rounded-2xl p-8 text-center border transition-all duration-300 ${
        mode === 'work' 
          ? 'bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/30' 
          : 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30'
      }`}>
        <div className="text-6xl font-bold text-white mb-4 font-mono">
          {formatTime(timeLeft)}
        </div>
        <div className={`text-lg font-semibold mb-2 ${
          mode === 'work' ? 'text-red-300' : 'text-green-300'
        }`}>
          {mode === 'work' ? 'Время фокуса' : 'Перерыв'}
        </div>
        <div className="text-slate-300 text-sm mb-6">
          Сессий завершено: <span className="text-blue-400 font-semibold">{sessionsCompleted}</span>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          {!isRunning ? (
            <button
              onClick={() => selectedTask && setIsRunning(true)}
              disabled={!selectedTask}
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105 shadow font-semibold disabled:opacity-50 disabled:cursor-not-allowed border border-green-400/30"
            >
              Старт
            </button>
          ) : (
            <button
              onClick={() => setIsRunning(false)}
              className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-xl hover:from-yellow-600 hover:to-amber-600 transition-all duration-300 transform hover:scale-105 shadow font-semibold border border-yellow-400/30"
            >
              Пауза
            </button>
          )}
          <button
            onClick={() => {
              setIsRunning(false);
              setTimeLeft(mode === 'work' ? 25 * 60 : 5 * 60);
            }}
            className="px-6 py-4 bg-slate-600 border border-slate-500 text-white rounded-xl hover:bg-slate-500 transition-all duration-300 transform hover:scale-105"
          >
            Сброс
          </button>
        </div>
      </div>

      {/* Task selection */}
      <div className="bg-slate-700 rounded-xl p-6 border border-slate-500">
        <label className="block text-white font-semibold mb-4">
          Выберите задачу для фокусировки:
        </label>
        <select
          value={selectedTask?.id || ''}
          onChange={(e) => {
            const task = tasks.find(t => t.id === parseInt(e.target.value));
            setSelectedTask(task);
          }}
          className="w-full p-4 bg-slate-600 border border-slate-500 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          disabled={isRunning}
        >
          <option value="" className="bg-slate-700">-- Выберите задачу --</option>
          {tasks.filter(t => t.status !== 'done').map(task => (
            <option key={task.id} value={task.id} className="bg-slate-700">
              {task.title} ({task.estimated_minutes}мин, сложность: {task.difficulty})
            </option>
          ))}
        </select>

        {selectedTask && (
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white">{selectedTask.title}</h3>
                <div className="text-blue-300 text-sm mt-1">
                  {selectedTask.estimated_minutes} мин • Сложность: {selectedTask.difficulty}/5
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Улучшенный профиль с температурной картой
function UserProfile({ tasks, currentUser }) {
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalMinutes = tasks.reduce((sum, task) => sum + task.estimated_minutes, 0);
  const totalWorkHours = Math.round(totalMinutes / 60);
  
  // Генерируем аватар на основе ID пользователя
  const getAvatarUrl = (userId) => {
    const colors = ['ff6b6b', '4ecdc4', '45b7d1', '96ceb4', 'feca57', 'ff9ff3', '54a0ff'];
    const color = colors[userId.length % colors.length];
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=${color}&color=fff&size=128&bold=true`;
  };

  const getProductivityLevel = () => {
    if (completionRate >= 80) return { level: '🔥 МАСТЕР', color: 'from-red-500 to-orange-500', description: 'Вы на вершине продуктивности!' };
    if (completionRate >= 60) return { level: '🚀 ПРОФИ', color: 'from-orange-500 to-yellow-500', description: 'Отличные результаты!' };
    if (completionRate >= 40) return { level: '💪 СТАБИЛЬНЫЙ', color: 'from-yellow-500 to-green-500', description: 'Хороший темп работы' };
    if (completionRate >= 20) return { level: '📈 РАСТУЩИЙ', color: 'from-green-500 to-cyan-500', description: 'Продолжайте в том же духе!' };
    return { level: '🌱 НАЧИНАЮЩИЙ', color: 'from-cyan-500 to-blue-500', description: 'Время набирать обороты!' };
  };

  const productivity = getProductivityLevel();

  // Температурная карта активности
  const getWeeklyActivity = () => {
    const weekDays = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dayTasks = tasks.filter(task => {
        const taskDate = new Date(task.created_at);
        return taskDate.toDateString() === date.toDateString();
      });
      
      const activityLevel = dayTasks.length;
      weekDays.push({
        date,
        tasks: dayTasks,
        activity: activityLevel
      });
    }
    
    return weekDays;
  };

  const weeklyActivity = getWeeklyActivity();

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-white">Мой профиль</h2>
        <p className="text-slate-300">Статистика и достижения</p>
      </div>

      {/* Аватар и основная информация */}
      <div className="bg-slate-700 rounded-2xl p-6 border border-slate-500">
        <div className="flex items-center space-x-6">
          <div className="relative">
            <img 
              src={getAvatarUrl(currentUser.id)}
              alt={currentUser.name}
              className="w-20 h-20 rounded-2xl border-4 border-blue-500 shadow"
            />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white">{currentUser.name}</h3>
            <div className={`inline-block mt-2 px-4 py-1 bg-gradient-to-r ${productivity.color} text-white rounded-full text-sm font-semibold`}>
              {productivity.level}
            </div>
            <p className="text-slate-300 text-sm mt-1">{productivity.description}</p>
          </div>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-700 rounded-xl p-4 text-center border border-slate-500">
          <div className="text-xl font-bold text-blue-400">{totalTasks}</div>
          <div className="text-slate-300 text-sm">Всего задач</div>
        </div>
        <div className="bg-slate-700 rounded-xl p-4 text-center border border-slate-500">
          <div className="text-xl font-bold text-green-400">{completedTasks}</div>
          <div className="text-slate-300 text-sm">Завершено</div>
        </div>
        <div className="bg-slate-700 rounded-xl p-4 text-center border border-slate-500">
          <div className="text-xl font-bold text-purple-400">{completionRate}%</div>
          <div className="text-slate-300 text-sm">Эффективность</div>
        </div>
        <div className="bg-slate-700 rounded-xl p-4 text-center border border-slate-500">
          <div className="text-xl font-bold text-orange-400">{totalWorkHours}ч</div>
          <div className="text-slate-300 text-sm">Всего времени</div>
        </div>
      </div>

      {/* Температурная карта активности */}
      <div className="bg-slate-700 rounded-2xl p-6 border border-slate-500">
        <h3 className="text-lg font-bold text-white mb-4">📊 Активность за неделю</h3>
        <div className="grid grid-cols-7 gap-2">
          {weeklyActivity.map((day, index) => (
            <div key={index} className="text-center">
              <div className="text-xs text-slate-400 mb-1">
                {day.date.toLocaleDateString('ru-RU', { weekday: 'short' })}
              </div>
              <div className={`
                w-8 h-8 mx-auto rounded-lg flex items-center justify-center text-xs font-semibold
                ${day.activity === 0 ? 'bg-slate-600 text-slate-400' : 
                  day.activity <= 2 ? 'bg-green-500/20 text-green-300' : 
                  day.activity <= 4 ? 'bg-yellow-500/20 text-yellow-300' : 
                  'bg-red-500/20 text-red-300'}
                border border-slate-500
              `}>
                {day.activity}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Достижения */}
      <div className="bg-slate-700 rounded-2xl p-6 border border-slate-500">
        <h3 className="text-lg font-bold text-white mb-4">🏆 Достижения</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`p-4 rounded-xl border transition-all duration-300 ${
            completedTasks >= 10 ? 'bg-yellow-500/20 border-yellow-400' : 'bg-slate-600 border-slate-500'
          }`}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-slate-500 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-white">Мастер задач</div>
                <div className="text-slate-300 text-sm">Завершите 10 задач</div>
                <div className="text-yellow-400 text-sm mt-1">
                  {completedTasks >= 10 ? '✅ Завершено!' : `${completedTasks}/10 задач`}
                </div>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-xl border transition-all duration-300 ${
            totalWorkHours >= 5 ? 'bg-green-500/20 border-green-400' : 'bg-slate-600 border-slate-500'
          }`}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-slate-500 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-white">Трудоголик</div>
                <div className="text-slate-300 text-sm">Потратьте 5+ часов</div>
                <div className="text-green-400 text-sm mt-1">
                  {totalWorkHours >= 5 ? '✅ Завершено!' : `${totalWorkHours}/5 часов`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Улучшенный ежедневный анализ
function DailyAnalysis({ tasks }) {
  const today = new Date().toDateString();
  const todayTasks = tasks.filter(task => new Date(task.created_at).toDateString() === today);
  const completedToday = todayTasks.filter(t => t.status === 'done').length;
  const pendingToday = todayTasks.filter(t => t.status !== 'done').length;

  const getMotivation = () => {
    if (completedToday === 0 && pendingToday === 0) {
      return { 
        message: 'Начните свой продуктивный день!', 
        emoji: '🎯',
        type: 'neutral',
        color: 'from-blue-500/10 to-purple-500/10 border-blue-500/30'
      };
    }
    if (completedToday >= pendingToday * 2) {
      return { 
        message: 'Отличная работа! Вы сегодня на высоте! 🔥', 
        emoji: '🎉',
        type: 'praise',
        color: 'from-green-500/10 to-emerald-500/10 border-green-500/30'
      };
    }
    if (completedToday > pendingToday) {
      return { 
        message: 'Хороший прогресс! Продолжайте в том же духе!', 
        emoji: '🚀',
        type: 'encouragement',
        color: 'from-yellow-500/10 to-amber-500/10 border-yellow-500/30'
      };
    }
    if (completedToday > 0) {
      return { 
        message: 'Есть над чем поработать! Не сдавайтесь! 💪', 
        emoji: '📈',
        type: 'warning',
        color: 'from-orange-500/10 to-red-500/10 border-orange-500/30'
      };
    }
    return { 
      message: 'Время взяться за дела! Начните с малого!', 
      emoji: '⚡',
      type: 'motivation',
      color: 'from-purple-500/10 to-pink-500/10 border-purple-500/30'
    };
  };

  const motivation = getMotivation();

  const getProductivityTips = () => {
    if (completedToday === 0) {
      return [
        'Начните с самой простой задачи - даже 5 минут работы лучше, чем ничего!',
        'Используйте правило двух минут: если задача занимает меньше 2 минут, сделайте её сразу',
        'Разбейте большую задачу на маленькие шаги'
      ];
    }
    if (pendingToday > completedToday) {
      return [
        'Сосредоточьтесь на завершении начатых задач перед тем как брать новые',
        'Используйте Pomodoro технику для лучшей концентрации',
        'Определите самые важные задачи и выполните их в первую очередь'
      ];
    }
    return [
      'Отличный старт! Планируйте следующие задачи с учетом своего темпа',
      'Не забывайте делать перерывы для поддержания продуктивности',
      'Регулярно пересматривайте свои цели и прогресс'
    ];
  };

  const tips = getProductivityTips();

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-white">Ежедневный анализ</h2>
        <p className="text-slate-300">Ваша продуктивность сегодня</p>
      </div>

      {/* Основная статистика */}
      <div className={`bg-gradient-to-r ${motivation.color} rounded-2xl p-8 text-center border`}>
        <div className="text-4xl mb-4">{motivation.emoji}</div>
        <div className="text-2xl font-bold text-white mb-4">{motivation.message}</div>
        
        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="text-xl font-bold text-white">{todayTasks.length}</div>
            <div className="text-white/80 text-sm">Всего</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="text-xl font-bold text-white">{completedToday}</div>
            <div className="text-white/80 text-sm">Завершено</div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="text-xl font-bold text-white">{pendingToday}</div>
            <div className="text-white/80 text-sm">В процессе</div>
          </div>
        </div>
      </div>

      {/* Рекомендации */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-700 rounded-xl p-6 border border-slate-500">
          <h3 className="text-lg font-bold text-white mb-4">💡 Советы на сегодня</h3>
          <div className="space-y-3">
            {tips.map((tip, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-slate-300 text-sm">{tip}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-700 rounded-xl p-6 border border-slate-500">
          <h3 className="text-lg font-bold text-white mb-4">📊 Быстрая статистика</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Эффективность:</span>
              <span className="text-blue-400 font-semibold">
                {todayTasks.length ? Math.round((completedToday / todayTasks.length) * 100) : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Время работы:</span>
              <span className="text-yellow-400 font-semibold">
                {Math.round(todayTasks.reduce((sum, task) => sum + task.estimated_minutes, 0) / 60)}ч
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Средняя сложность:</span>
              <span className="text-purple-400 font-semibold">
                {todayTasks.length ? Math.round(todayTasks.reduce((sum, task) => sum + task.difficulty, 0) / todayTasks.length) : 0}/5
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Продуктивность:</span>
              <span className={`font-semibold ${
                completedToday >= pendingToday ? 'text-green-400' : 'text-orange-400'
              }`}>
                {completedToday >= pendingToday ? 'Высокая' : 'Можно лучше'}
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

  const handleSubmit = () => {
    if (title.trim()) {
      onAdd(title, minutes, difficulty);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-600 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-white">Новая задача</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-2xl transform hover:scale-110"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Название задачи
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-4 bg-slate-700 border border-slate-500 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Что нужно сделать?"
              autoFocus
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Время (минут)
              </label>
              <input
                type="number"
                value={minutes}
                onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
                className="w-full p-4 bg-slate-700 border border-slate-500 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                min="0"
                max="480"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Сложность
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(parseInt(e.target.value))}
                className="w-full p-4 bg-slate-700 border border-slate-500 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
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
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 rounded-xl hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 font-semibold shadow border border-blue-400/30"
          >
            Создать задачу
          </button>
          <button
            onClick={onClose}
            className="px-6 py-4 bg-slate-700 border border-slate-500 text-white rounded-xl hover:bg-slate-600 transition-all duration-300 transform hover:scale-105"
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
    <div className="flex overflow-x-auto space-x-1 bg-slate-700 p-1 rounded-xl border border-slate-500 mb-6 scrollbar-hide">
      {[
        { id: 'tasks', label: 'Задачи' },
        { id: 'calendar', label: 'Календарь' },
        { id: 'pomodoro', label: 'Фокус' },
        { id: 'profile', label: 'Профиль' },
        { id: 'analysis', label: 'Анализ' }
      ].map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 whitespace-nowrap ${
            activeTab === tab.id 
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow border border-blue-400/30' 
              : 'text-slate-300 hover:text-white hover:bg-slate-600'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  if (!currentUser) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Шапка */}
        <header className="bg-slate-800 rounded-2xl p-6 shadow border border-slate-600 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow">
                  <span className="text-white font-bold text-lg">
                    {currentUser.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Добро пожаловать, {currentUser.name}!</h1>
                <p className="text-slate-300 text-sm">TaskFlow Pro - ваша система продуктивности</p>
                {currentUser.maxUserId && (
                  <p className="text-blue-400 text-xs mt-1">Синхронизировано с ботом MAX</p>
                )}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-6 py-2 bg-slate-700 border border-slate-500 text-white rounded-xl hover:bg-slate-600 transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
            >
              Выйти
            </button>
          </div>
        </header>

        {/* Навигация */}
        {renderNavigation()}

        {/* Основной контент */}
        <main className="bg-slate-800 rounded-2xl p-6 shadow border border-slate-600">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
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