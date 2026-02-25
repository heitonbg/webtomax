import React, { useEffect, useState } from "react";

const API = "https://botmax-iwrawww.amvera.io";

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl p-8 shadow-2xl border border-slate-600 w-full max-w-md mx-4 text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>
        <h2 className="text-xl font-bold text-white mb-3">Загрузка</h2>
        <p className="text-slate-300 mb-2">Подключаемся к MAX...</p>
        <p className="text-slate-400 text-sm">Определяем ваш аккаунт</p>
      </div>
    </div>
  );
}

// Компонент ошибки
function ErrorScreen({ error, onRetry }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl p-8 shadow-2xl border border-slate-600 w-full max-w-md mx-4 text-center">
        <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-3">Ошибка подключения</h2>
        <p className="text-slate-300 mb-4">{error}</p>
        <button
          onClick={onRetry}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-colors font-semibold"
        >
          Попробовать снова
        </button>
      </div>
    </div>
  );
}

// Автоматический вход через MAX Bridge
function AutoLogin({ onLogin, onError }) {
  const [status, setStatus] = useState("Инициализация...");

  useEffect(() => {
    initializeMaxLogin();
  }, []);

  const initializeMaxLogin = async () => {
    try {
      setStatus("Проверяем MAX Bridge...");
      
      if (!window.WebApp) {
        throw new Error("MAX Bridge не доступен. Откройте приложение через MAX мессенджер.");
      }

      setStatus("Получаем данные пользователя...");
      
      const initData = window.WebApp.initDataUnsafe;
      console.log("MAX initData:", initData);

      if (!initData || !initData.user) {
        throw new Error("Не удалось получить данные пользователя из MAX.");
      }

      const user = initData.user;
      const maxUserId = user.id.toString();
      
      setStatus(`Привет, ${user.first_name || 'Пользователь'}!`);

      const externalId = `max_${maxUserId}`;
      
      setStatus("Синхронизация с сервером...");

      try {
        const userResponse = await fetch(`${API}/user/profile?external_id=${externalId}`);
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          completeLogin(externalId, userData.name, user, initData);
        } else {
          await createNewUser(externalId, user, initData);
        }
      } catch (error) {
        console.error("Ошибка при проверке пользователя:", error);
        await createNewUser(externalId, user, initData);
      }

    } catch (error) {
      console.error("Ошибка автоматического входа:", error);
      onError(error.message);
    }
  };

  const createNewUser = async (externalId, user, initData) => {
    setStatus("Создаем ваш профиль...");
    
    try {
      const createResponse = await fetch(`${API}/user/create?external_id=${externalId}&name=${encodeURIComponent(getUserName(user))}`);
      
      if (!createResponse.ok) {
        throw new Error("Не удалось создать пользователя на сервере");
      }

      await syncUserData(externalId, user, initData);
      
      completeLogin(externalId, getUserName(user), user, initData);
    } catch (error) {
      console.error("Ошибка создания пользователя:", error);
      onError("Ошибка создания профиля: " + error.message);
    }
  };

  const syncUserData = async (externalId, user, initData) => {
    try {
      await fetch(`${API}/user/sync?external_id=${externalId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: user.first_name,
          last_name: user.last_name,
          username: user.username,
          language_code: user.language_code,
          photo_url: user.photo_url
        }),
      });
    } catch (error) {
      console.warn("Не удалось синхронизировать дополнительные данные:", error);
    }
  };

  const completeLogin = (externalId, userName, userData, initData) => {
    setStatus("Вход выполнен!");
    
    onLogin({
      id: externalId,
      name: userName,
      maxUserId: userData.id.toString(),
      userData: userData,
      initData: initData
    });
  };

  const getUserName = (user) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.first_name || user.username || 'Пользователь MAX';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl p-8 shadow-2xl border border-slate-600 w-full max-w-md mx-4 text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-3">Автоматический вход</h2>
        <p className="text-slate-300 mb-2">{status}</p>
        <div className="flex justify-center mt-4">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    </div>
  );
}

function MobileNavigation({ activeTab, setActiveTab }) {
  const [showMenu, setShowMenu] = useState(false);

  const tabs = [
    { id: 'tasks', label: 'Задачи', icon: '📝' },
    { id: 'calendar', label: 'Календарь', icon: '📅' },
    { id: 'pomodoro', label: 'Фокус', icon: '⏱️' },
    { id: 'kanban', label: 'Канбан', icon: '📋' },
    { id: 'analysis', label: 'Анализ', icon: '📊' },
    { id: 'profile', label: 'Профиль', icon: '👤' }
  ];

  return (
    <>
      {/* Мобильное меню */}
      <div className="lg:hidden">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="w-full bg-slate-700 border border-slate-500 rounded-xl p-4 text-white flex items-center justify-between mb-4 min-h-[44px]"
        >
          <span className="font-semibold">
            {tabs.find(tab => tab.id === activeTab)?.label}
          </span>
          <svg className="w-5 h-5 transform transition-transform" style={{ transform: showMenu ? 'rotate(180deg)' : 'none' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showMenu && (
          <div className="bg-slate-700 rounded-xl border border-slate-500 p-2 mb-6 space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setShowMenu(false);
                }}
                className={`w-full text-left p-3 rounded-lg transition-all duration-200 min-h-[44px] flex items-center ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                    : 'text-slate-300 hover:bg-slate-600'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Десктопная навигация */}
      <div className="hidden lg:flex overflow-x-auto space-x-1 bg-slate-700 p-1 rounded-xl border border-slate-500 mb-6 scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 whitespace-nowrap min-w-0 min-h-[44px] ${
              activeTab === tab.id 
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow border border-blue-400/30' 
                : 'text-slate-300 hover:text-white hover:bg-slate-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </>
  );
}

// Панель подзадач
function SubtasksPanel({ task, onClose, onAddSubtask, onCompleteSubtask, onRefresh }) {
  const [subtasks, setSubtasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddSubtask, setShowAddSubtask] = useState(false);

  useEffect(() => {
    loadSubtasks();
  }, [task]);

  const canAddSubtasks = task && task.status !== 'done' && !task.parent_id;

  const loadSubtasks = async () => {
    if (!task) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API}/tasks/${task.id}/subtasks?external_id=${task.user_id || task.external_id}`);
      if (response.ok) {
        const data = await response.json();
        setSubtasks(data.subtasks || []);
      }
    } catch (error) {
      console.error("Error loading subtasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubtask = async (title, minutes, difficulty) => {
    if (!canAddSubtasks) {
      alert("Нельзя добавлять подзадачи к завершенной задаче или к другой подзадаче");
      return;
    }

    try {
      const response = await fetch(`${API}/tasks/${task.id}/subtasks?external_id=${task.user_id || task.external_id}`, {
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
        await loadSubtasks();
        setShowAddSubtask(false);
        if (onRefresh) onRefresh();
      } else {
        const errorData = await response.json();
        alert(`Ошибка: ${errorData.detail || 'Неизвестная ошибка'}`);
      }
    } catch (error) {
      console.error("Error creating subtask:", error);
      alert("Ошибка при создании подзадачи");
    }
  };

  const handleCompleteSubtask = async (subtaskId) => {
    try {
      const response = await fetch(`${API}/tasks/${task.id}/subtasks/${subtaskId}/complete?external_id=${task.user_id || task.external_id}`, {
        method: "POST",
      });

      if (response.ok) {
        await loadSubtasks();
        if (onRefresh) onRefresh();
      }
    } catch (error) {
      console.error("Error completing subtask:", error);
    }
  };

  const handleCompleteAll = async () => {
    try {
      const response = await fetch(`${API}/tasks/complete?external_id=${task.user_id || task.external_id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task_id: task.id
        }),
      });

      if (response.ok) {
        onClose();
        if (onRefresh) onRefresh();
      }
    } catch (error) {
      console.error("Error completing parent task:", error);
    }
  };

  const completedSubtasks = subtasks.filter(st => st.status === 'done').length;
  const totalSubtasks = subtasks.length;
  const progress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-3 sm:p-4 z-50">
      <div className="bg-slate-800 rounded-2xl p-4 sm:p-6 w-full max-w-md border border-slate-600 shadow-xl max-h-[90vh] overflow-y-auto mx-2">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold text-white">Подзадачи</h3>
            <p className="text-slate-300 text-sm mt-1 truncate">{task.title}</p>
            {!canAddSubtasks && (
              <p className="text-orange-300 text-xs mt-1">
                {task.status === 'done' ? 'Задача завершена' : 'Это подзадача'} - добавление подзадач недоступно
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-2xl transform hover:scale-110 min-h-[44px] min-w-[44px] flex items-center justify-center ml-2"
          >
            ×
          </button>
        </div>

        {/* Прогресс */}
        <div className="bg-slate-700 rounded-xl p-3 sm:p-4 mb-4 border border-slate-500">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-300 text-sm">Прогресс:</span>
            <span className="text-blue-400 font-semibold">{progress}%</span>
          </div>
          <div className="w-full bg-slate-600 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="text-center text-slate-300 text-sm mt-2">
            {completedSubtasks} из {totalSubtasks} завершено
          </div>
        </div>

        {/* Список подзадач */}
        {loading ? (
          <div className="flex justify-center items-center py-6 sm:py-8">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : subtasks.length === 0 ? (
          <div className="text-center py-6 sm:py-8 text-slate-400">
            <svg className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">Нет подзадач</p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3 mb-4">
            {subtasks.map(subtask => (
              <div 
                key={subtask.id} 
                className={`bg-slate-700 border rounded-xl p-3 sm:p-4 transition-all duration-300 ${
                  subtask.status === 'done' 
                    ? 'border-green-500/50 bg-green-500/10' 
                    : 'border-slate-500'
                }`}
              >
                <div className="flex justify-between items-start gap-2 sm:gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-medium text-sm sm:text-base ${subtask.status === 'done' ? 'text-green-300 line-through' : 'text-white'}`}>
                      {subtask.title}
                    </h4>
                    <div className="flex items-center space-x-3 sm:space-x-4 mt-2 text-xs sm:text-sm text-slate-300">
                      <span className="flex items-center space-x-1">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{subtask.estimated_minutes} мин</span>
                      </span>
                      <span className={`flex items-center space-x-1 ${
                        subtask.difficulty >= 4 ? 'text-red-400' : 
                        subtask.difficulty >= 3 ? 'text-orange-400' : 
                        subtask.difficulty >= 2 ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>{subtask.difficulty}/5</span>
                      </span>
                    </div>
                  </div>
                  {subtask.status !== 'done' && (
                    <button
                      onClick={() => handleCompleteSubtask(subtask.id)}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-2 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-110 shadow border border-green-400/30 flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Кнопки действий */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          {canAddSubtasks && (
            <button
              onClick={() => setShowAddSubtask(true)}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 font-semibold border border-blue-400/30 text-sm sm:text-base min-h-[44px]"
            >
              Добавить подзадачу
            </button>
          )}
          {totalSubtasks > 0 && completedSubtasks === totalSubtasks && (
            <button
              onClick={handleCompleteAll}
              className="px-4 sm:px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105 font-semibold border border-green-400/30 text-sm sm:text-base min-h-[44px]"
            >
              Завершить все
            </button>
          )}
        </div>

        {/* Модальное окно добавления подзадачи */}
        {showAddSubtask && (
          <AddTaskModal
            onAdd={handleAddSubtask}
            onClose={() => setShowAddSubtask(false)}
            title="Новая подзадача"
          />
        )}
      </div>
    </div>
  );
}

// Список задач
function TaskList({ tasks, onComplete, onAddTask, currentUser, onTaskUpdate }) {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showSubtasks, setShowSubtasks] = useState(false);

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

  const handleTaskClick = (task) => {
    if (task.is_parent || task.parent_id) {
      setSelectedTask(task);
      setShowSubtasks(true);
    }
  };

  const handleRefresh = () => {
    if (onTaskUpdate) onTaskUpdate();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Заголовок и кнопка */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl font-bold text-white truncate">Мои задачи</h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1">
            {stats.completed} из {stats.total} завершено ({stats.completionRate}%)
          </p>
        </div>
        <button 
          onClick={onAddTask}
          className="w-full sm:w-auto px-4 py-3 sm:px-6 sm:py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold border border-blue-400/30 text-sm sm:text-base min-h-[44px]"
        >
          Новая задача
        </button>
      </div>

      {/* Поиск и фильтры */}
      <div className="flex flex-col gap-3">
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Поиск задач..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 sm:p-4 bg-slate-700 border border-slate-500 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base min-h-[44px]"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              className={`flex-1 py-2 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 transform hover:scale-105 min-h-[44px] ${
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <div className="bg-slate-700 rounded-xl p-3 sm:p-4 text-center border border-slate-500">
          <div className="text-lg sm:text-xl font-bold text-blue-400">{stats.total}</div>
          <div className="text-slate-300 text-xs sm:text-sm">Всего</div>
        </div>
        <div className="bg-slate-700 rounded-xl p-3 sm:p-4 text-center border border-slate-500">
          <div className="text-lg sm:text-xl font-bold text-yellow-400">{stats.active}</div>
          <div className="text-slate-300 text-xs sm:text-sm">Активные</div>
        </div>
        <div className="bg-slate-700 rounded-xl p-3 sm:p-4 text-center border border-slate-500">
          <div className="text-lg sm:text-xl font-bold text-green-400">{stats.completed}</div>
          <div className="text-slate-300 text-xs sm:text-sm">Завершено</div>
        </div>
        <div className="bg-slate-700 rounded-xl p-3 sm:p-4 text-center border border-slate-500">
          <div className="text-lg sm:text-xl font-bold text-purple-400">{stats.completionRate}%</div>
          <div className="text-slate-300 text-xs sm:text-sm">Прогресс</div>
        </div>
      </div>

      {/* Список задач */}
      <div className="space-y-2 sm:space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-8 sm:py-12 text-slate-400">
            <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div className="text-base sm:text-lg mb-2">
              {searchTerm ? 'Задачи не найдены' : 'Задач пока нет'}
            </div>
            <div className="text-xs sm:text-sm">
              {searchTerm ? 'Попробуйте изменить запрос' : 'Создайте первую задачу'}
            </div>
          </div>
        ) : (
          filteredTasks.map(task => (
            <div 
              key={task.id} 
              className={`group bg-slate-700 border rounded-xl p-3 sm:p-4 transition-all duration-300 transform hover:scale-105 hover:shadow-lg cursor-pointer ${
                task.status === 'done' 
                  ? 'border-green-500/50 bg-green-500/10' 
                  : 'border-slate-500 hover:border-blue-500/50'
              } ${(task.is_parent || task.parent_id) ? 'hover:border-yellow-500/50' : ''}`}
              onClick={() => handleTaskClick(task)}
            >
              <div className="flex justify-between items-start gap-2 sm:gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                    <h3 className={`font-medium text-sm sm:text-base truncate ${
                      task.status === 'done' ? 'text-green-300 line-through' : 'text-white'
                    }`}>
                      {task.title}
                    </h3>
                    {(task.is_parent || task.parent_id) && (
                      <span className="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded text-xs font-medium shrink-0">
                        {task.is_parent ? '🎯 Родительская' : '📋 Подзадача'}
                        {task.status === 'done' && ' ✅'}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-slate-300">
                    <span className="flex items-center space-x-1">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{task.estimated_minutes} мин</span>
                    </span>
                    <span className={`flex items-center space-x-1 ${
                      task.difficulty >= 4 ? 'text-red-400' : 
                      task.difficulty >= 3 ? 'text-orange-400' : 
                      task.difficulty >= 2 ? 'text-yellow-400' : 'text-green-400'
                    }`}>
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>{task.difficulty}/5</span>
                    </span>
                    {task.task_date && (
                      <span className="flex items-center space-x-1 text-blue-400">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="hidden sm:inline">{new Date(task.task_date).toLocaleDateString('ru-RU')}</span>
                        <span className="sm:hidden">{new Date(task.task_date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}</span>
                      </span>
                    )}
                    {task.status === 'done' && (
                      <span className="text-green-400 flex items-center space-x-1">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Завершено</span>
                      </span>
                    )}
                  </div>
                </div>
                {task.status !== 'done' && !task.is_parent && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onComplete(task.id);
                    }}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-2 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-110 shadow border border-green-400/30 flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Панель подзадач */}
      {showSubtasks && selectedTask && (
        <SubtasksPanel
          task={selectedTask}
          onClose={() => {
            setShowSubtasks(false);
            setSelectedTask(null);
          }}
          onRefresh={handleRefresh}
        />
      )}
    </div>
  );
}

// Календарь энергии
function EnergyCalendar({ tasks, onAddTask }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getTasksForDate = (date) => {
    return tasks.filter(task => {
      const taskDate = new Date(task.task_date);
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
            relative p-1 sm:p-2 rounded-lg cursor-pointer transition-all duration-300 transform hover:scale-110 group
            ${isSelected ? 'ring-2 ring-blue-500 scale-110' : ''}
            ${isToday ? 'ring-1 ring-slate-400' : ''}
            ${!isCurrentMonth ? 'opacity-40' : getEnergyColor(energyLevel)}
            min-h-[40px] sm:min-h-[60px] border border-slate-500/30 text-xs sm:text-sm
          `}
          onClick={() => setSelectedDate(date)}
        >
          <div className="text-center">
            <div className={`font-medium mb-1 ${
              isCurrentMonth ? 'text-white' : 'text-slate-400'
            }`}>
              {date.getDate()}
            </div>
            
            {/* Индикаторы задач */}
            {dayTasks.length > 0 && (
              <div className="hidden sm:flex justify-center space-x-1 mb-1">
                {dayTasks.slice(0, 2).map((task, index) => (
                  <div 
                    key={index}
                    className={`w-1 h-1 sm:w-2 sm:h-2 rounded-full ${
                      task.difficulty >= 4 ? 'bg-red-500' : 
                      task.difficulty >= 3 ? 'bg-orange-500' : 
                      task.difficulty >= 2 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                  />
                ))}
                {dayTasks.length > 2 && (
                  <div className="text-[10px] text-white/80">+{dayTasks.length - 2}</div>
                )}
              </div>
            )}
            
            {/* Уровень энергии */}
            {energyLevel > 0 && (
              <div className="hidden sm:block text-[10px] text-white/90 font-semibold">
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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl font-bold text-white">Энергетический календарь</h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 truncate">
            {selectedDate.toLocaleDateString('ru-RU', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="flex bg-slate-700 rounded-xl border border-slate-500 flex-1 sm:flex-none">
            <button 
              onClick={() => navigateMonth(-1)}
              className="px-3 py-2 sm:px-4 text-slate-300 hover:text-white hover:bg-slate-600 rounded-l-xl transition-colors text-sm min-h-[44px]"
            >
              ←
            </button>
            <div className="px-2 sm:px-4 py-2 text-white font-medium text-xs sm:text-sm flex items-center min-w-0 flex-1 justify-center">
              <span className="truncate">
                {currentMonth.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
              </span>
            </div>
            <button 
              onClick={() => navigateMonth(1)}
              className="px-3 py-2 sm:px-4 text-slate-300 hover:text-white hover:bg-slate-600 rounded-r-xl transition-colors text-sm min-h-[44px]"
            >
              →
            </button>
          </div>
          <button 
            onClick={() => onAddTask(selectedDate)}
            className="px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 shadow font-semibold border border-blue-400/30 text-xs sm:text-sm whitespace-nowrap min-h-[44px]"
          >
            Добавить
          </button>
        </div>
      </div>

      {/* Календарная сетка */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-3 sm:mb-4">
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
          <div key={day} className="text-center font-medium text-slate-400 py-1 sm:py-2 text-xs sm:text-sm">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {renderMonthView()}
      </div>

      {/* Задачи выбранного дня */}
      {selectedDayTasks.length > 0 && (
        <div className="bg-slate-700 rounded-xl p-3 sm:p-4 border border-slate-500 mt-4">
          <h3 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3">
            Задачи на {selectedDate.toLocaleDateString('ru-RU')}:
          </h3>
          <div className="space-y-2">
            {selectedDayTasks.map(task => (
              <div key={task.id} className="flex items-center justify-between p-2 sm:p-3 bg-slate-600 rounded-lg border border-slate-500">
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                  <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
                    task.difficulty >= 4 ? 'bg-red-500' : 
                    task.difficulty >= 3 ? 'bg-orange-500' : 
                    task.difficulty >= 2 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}></div>
                  <span className={`text-sm sm:text-base truncate ${
                    task.status === 'done' ? 'text-green-300 line-through' : 'text-white'
                  }`}>
                    {task.title}
                  </span>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm text-slate-300 shrink-0 ml-2">
                  <span>{task.estimated_minutes}м</span>
                  <span className={`px-1 sm:px-2 py-1 rounded ${
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

// Pomodoro таймер
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
    <div className="space-y-6 sm:space-y-8">
      <div className="text-center">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-2">Focus Timer</h2>
        <p className="text-slate-300 text-sm">Метод Pomodoro для максимальной продуктивности</p>
      </div>

      {/* Таймер */}
      <div className={`relative rounded-2xl p-4 sm:p-8 text-center border transition-all duration-300 ${
        mode === 'work' 
          ? 'bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/30' 
          : 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30'
      }`}>
        <div className="text-4xl sm:text-6xl font-bold text-white mb-3 sm:mb-4 font-mono">
          {formatTime(timeLeft)}
        </div>
        <div className={`text-base sm:text-lg font-semibold mb-2 ${
          mode === 'work' ? 'text-red-300' : 'text-green-300'
        }`}>
          {mode === 'work' ? 'Время фокуса' : 'Перерыв'}
        </div>
        <div className="text-slate-300 text-xs sm:text-sm mb-4 sm:mb-6">
          Сессий завершено: <span className="text-blue-400 font-semibold">{sessionsCompleted}</span>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
          {!isRunning ? (
            <button
              onClick={() => selectedTask && setIsRunning(true)}
              disabled={!selectedTask}
              className="px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105 shadow font-semibold disabled:opacity-50 disabled:cursor-not-allowed border border-green-400/30 text-sm sm:text-base min-h-[44px]"
            >
              Старт
            </button>
          ) : (
            <button
              onClick={() => setIsRunning(false)}
              className="px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-xl hover:from-yellow-600 hover:to-amber-600 transition-all duration-300 transform hover:scale-105 shadow font-semibold border border-yellow-400/30 text-sm sm:text-base min-h-[44px]"
            >
              Пауза
            </button>
          )}
          <button
            onClick={() => {
              setIsRunning(false);
              setTimeLeft(mode === 'work' ? 25 * 60 : 5 * 60);
            }}
            className="px-4 py-3 sm:px-6 sm:py-4 bg-slate-600 border border-slate-500 text-white rounded-xl hover:bg-slate-500 transition-all duration-300 transform hover:scale-105 text-sm sm:text-base min-h-[44px]"
          >
            Сброс
          </button>
        </div>
      </div>

      {/* Выбор задачи для фокусировки */}
      <div className="bg-slate-700 rounded-xl p-4 sm:p-6 border border-slate-500">
        <label className="block text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">
          Выберите задачу для фокусировки:
        </label>
        <select
          value={selectedTask?.id || ''}
          onChange={(e) => {
            const task = tasks.find(t => t.id === parseInt(e.target.value));
            setSelectedTask(task);
          }}
          className="w-full p-3 sm:p-4 bg-slate-600 border border-slate-500 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm sm:text-base min-h-[44px]"
          disabled={isRunning}
        >
          <option value="" className="bg-slate-700">-- Выберите задачу --</option>
          {tasks.filter(t => t.status !== 'done').map(task => (
            <option key={task.id} value={task.id} className="bg-slate-700">
              {task.title} ({task.estimated_minutes}мин)
            </option>
          ))}
        </select>

        {selectedTask && (
          <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-white text-sm sm:text-base truncate">{selectedTask.title}</h3>
                <div className="text-blue-300 text-xs sm:text-sm mt-1">
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

// Профиль пользователя с аватаркой из MAX
function UserProfile({ tasks, currentUser }) {
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalMinutes = tasks.reduce((sum, task) => sum + task.estimated_minutes, 0);
  const totalWorkHours = Math.round(totalMinutes / 60);
  
  // Получаем аватарку из MAX или создаем градиентную
  const getAvatarUrl = () => {
    if (currentUser.userData?.photo_url) {
      return currentUser.userData.photo_url;
    }
    
    // Градиентная аватарка на основе ID
    const colors = ['ff6b6b', '4ecdc4', '45b7d1', '96ceb4', 'feca57', 'ff9ff3', '54a0ff'];
    const color = colors[currentUser.id.length % colors.length];
    const name = currentUser.name || 'Пользователь';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${color}&color=fff&size=128&bold=true`;
  };

  const getProductivityLevel = () => {
    if (completionRate >= 80) return { level: '🔥 МАСТЕР', color: 'from-red-500 to-orange-500', description: 'Вы на вершине продуктивности!' };
    if (completionRate >= 60) return { level: '🚀 ПРОФИ', color: 'from-orange-500 to-yellow-500', description: 'Отличные результаты!' };
    if (completionRate >= 40) return { level: '💪 СТАБИЛЬНЫЙ', color: 'from-yellow-500 to-green-500', description: 'Хороший темп работы' };
    if (completionRate >= 20) return { level: '📈 РАСТУЩИЙ', color: 'from-green-500 to-cyan-500', description: 'Продолжайте в том же духе!' };
    return { level: '🌱 НАЧИНАЮЩИЙ', color: 'from-cyan-500 to-blue-500', description: 'Время набирать обороты!' };
  };

  const productivity = getProductivityLevel();

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
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-bold text-white">Мой профиль</h2>
        <p className="text-slate-300 text-sm">Статистика и достижения</p>
      </div>

      {/* Аватар и основная информация */}
      <div className="bg-slate-700 rounded-2xl p-4 sm:p-6 border border-slate-500">
        <div className="flex items-center space-x-4 sm:space-x-6">
          <div className="relative flex-shrink-0">
            <img 
              src={getAvatarUrl()}
              alt={currentUser.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-4 border-blue-500 shadow"
            />
            {currentUser.userData?.photo_url && (
              <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-slate-800">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl font-bold text-white truncate">{currentUser.name}</h3>
            <div className={`inline-block mt-2 px-3 py-1 bg-gradient-to-r ${productivity.color} text-white rounded-full text-xs sm:text-sm font-semibold`}>
              {productivity.level}
            </div>
            <p className="text-slate-300 text-xs sm:text-sm mt-1">{productivity.description}</p>
            {currentUser.maxUserId && (
              <p className="text-blue-400 text-xs mt-2">MAX ID: {currentUser.maxUserId}</p>
            )}
          </div>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <div className="bg-slate-700 rounded-xl p-3 sm:p-4 text-center border border-slate-500">
          <div className="text-lg sm:text-xl font-bold text-blue-400">{totalTasks}</div>
          <div className="text-slate-300 text-xs sm:text-sm">Всего задач</div>
        </div>
        <div className="bg-slate-700 rounded-xl p-3 sm:p-4 text-center border border-slate-500">
          <div className="text-lg sm:text-xl font-bold text-green-400">{completedTasks}</div>
          <div className="text-slate-300 text-xs sm:text-sm">Завершено</div>
        </div>
        <div className="bg-slate-700 rounded-xl p-3 sm:p-4 text-center border border-slate-500">
          <div className="text-lg sm:text-xl font-bold text-purple-400">{completionRate}%</div>
          <div className="text-slate-300 text-xs sm:text-sm">Эффективность</div>
        </div>
        <div className="bg-slate-700 rounded-xl p-3 sm:p-4 text-center border border-slate-500">
          <div className="text-lg sm:text-xl font-bold text-orange-400">{totalWorkHours}ч</div>
          <div className="text-slate-300 text-xs sm:text-sm">Всего времени</div>
        </div>
      </div>

      {/* Тепловая карта активности */}
      <div className="bg-slate-700 rounded-2xl p-4 sm:p-6 border border-slate-500">
        <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">📊 Активность за неделю</h3>
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {weeklyActivity.map((day, index) => (
            <div key={index} className="text-center">
              <div className="text-xs text-slate-400 mb-1">
                {day.date.toLocaleDateString('ru-RU', { weekday: 'short' })}
              </div>
              <div className={`
                w-6 h-6 sm:w-8 sm:h-8 mx-auto rounded-lg flex items-center justify-center text-xs font-semibold
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
      <div className="bg-slate-700 rounded-2xl p-4 sm:p-6 border border-slate-500">
        <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">🏆 Достижения</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div className={`p-3 sm:p-4 rounded-xl border transition-all duration-300 ${
            completedTasks >= 10 ? 'bg-yellow-500/20 border-yellow-400' : 'bg-slate-600 border-slate-500'
          }`}>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-white text-sm sm:text-base">Мастер задач</div>
                <div className="text-slate-300 text-xs sm:text-sm">Завершите 10 задач</div>
                <div className="text-yellow-400 text-xs sm:text-sm mt-1">
                  {completedTasks >= 10 ? '✅ Завершено!' : `${completedTasks}/10 задач`}
                </div>
              </div>
            </div>
          </div>

          <div className={`p-3 sm:p-4 rounded-xl border transition-all duration-300 ${
            totalWorkHours >= 5 ? 'bg-green-500/20 border-green-400' : 'bg-slate-600 border-slate-500'
          }`}>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-white text-sm sm:text-base">Трудоголик</div>
                <div className="text-slate-300 text-xs sm:text-sm">Потратьте 5+ часов</div>
                <div className="text-green-400 text-xs sm:text-sm mt-1">
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

// Ежедневный анализ с AI
function DailyAnalysis({ tasks, currentUser }) {
  const [aiData, setAiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAiAnalytics();
  }, [currentUser]);

  const loadAiAnalytics = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API}/user/ai-analytics?external_id=${currentUser.id}`);
      if (response.ok) {
        const data = await response.json();
        console.log("AI Analytics data:", data);
        setAiData(data);
      } else {
        throw new Error("Failed to load AI analytics");
      }
    } catch (error) {
      console.error("Error loading AI analytics:", error);
      setError("Не удалось загрузить аналитику");
      setAiData(generateFallbackAnalytics(tasks));
    } finally {
      setLoading(false);
    }
  };

  // Fallback аналитика если API недоступно
  const generateFallbackAnalytics = (tasks) => {
    const today = new Date().toDateString();
    const todayTasks = tasks.filter(task => {
      const taskDate = new Date(task.task_date).toDateString();
      return taskDate === today;
    });
    const completedToday = todayTasks.filter(t => t.status === 'done').length;
    const pendingToday = todayTasks.filter(t => t.status !== 'done').length;
    const totalMinutes = todayTasks.reduce((sum, task) => sum + task.estimated_minutes, 0);
    const completedMinutes = todayTasks
      .filter(t => t.status === 'done')
      .reduce((sum, task) => sum + task.estimated_minutes, 0);

    const efficiency = todayTasks.length ? Math.round((completedToday / todayTasks.length) * 100) : 0;
    const timeUtilization = totalMinutes ? Math.round((completedMinutes / totalMinutes) * 100) : 0;

    return {
      completed_today: completedToday,
      pending_today: pendingToday,
      total_today: todayTasks.length,
      total_minutes: totalMinutes,
      completed_minutes: completedMinutes,
      efficiency_rate: efficiency,
      time_utilization: timeUtilization,
      ai_analysis: {
        productivity_score: efficiency,
        insights: [
          completedToday === 0 ? "Начните день с выполнения первой задачи!" : 
          completedToday >= pendingToday ? "Отличный старт дня! Продолжайте в том же духе!" :
          "Сосредоточьтесь на завершении начатых задач",
          timeUtilization > 80 ? "Эффективное использование времени!" :
          timeUtilization > 50 ? "Хороший темп работы" :
          "Попробуйте лучше распределить время между задачами"
        ],
        recommendations: [
          "Используйте технику Pomodoro для лучшей концентрации",
          "Начните с самых сложных задач утром",
          "Делайте регулярные перерывы для поддержания продуктивности"
        ],
        energy_level: efficiency >= 80 ? "high" : efficiency >= 50 ? "medium" : "low",
        mood_analysis: efficiency >= 70 ? "positive" : efficiency >= 40 ? "neutral" : "needs_improvement"
      }
    };
  };

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-white">AI Анализ</h2>
          <p className="text-slate-300 text-sm">Анализируем вашу продуктивность...</p>
        </div>
        <div className="flex justify-center items-center py-8 sm:py-12">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-white text-sm sm:text-base">Загрузка AI анализа...</span>
        </div>
      </div>
    );
  }

  if (error && !aiData) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-white">AI Анализ</h2>
          <p className="text-slate-300 text-sm">Произошла ошибка при загрузке аналитики</p>
        </div>
        <div className="text-center py-8 sm:py-12 text-slate-400">
          <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={loadAiAnalytics}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  const analysis = aiData?.ai_analysis || {};
  const stats = aiData || {};

  const getProductivityColor = (score) => {
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 60) return 'from-yellow-500 to-amber-500';
    if (score >= 40) return 'from-orange-500 to-red-500';
    return 'from-red-500 to-pink-500';
  };

  const getEnergyLevel = () => {
    const level = analysis.energy_level || 'medium';
    switch(level) {
      case 'high': return { label: '🔋 Высокая', color: 'text-green-400' };
      case 'medium': return { label: '⚡ Средняя', color: 'text-yellow-400' };
      case 'low': return { label: '🪫 Низкая', color: 'text-red-400' };
      default: return { label: '⚡ Средняя', color: 'text-yellow-400' };
    }
  };

  const getMoodEmoji = () => {
    const mood = analysis.mood_analysis || 'neutral';
    switch(mood) {
      case 'positive': return '😊';
      case 'neutral': return '😐';
      case 'needs_improvement': return '😔';
      default: return '😐';
    }
  };

  const energyInfo = getEnergyLevel();

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-bold text-white">AI Анализ продуктивности</h2>
        <p className="text-slate-300 text-sm">Умная аналитика вашего дня</p>
      </div>

      {/* Основная статистика */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <div className="bg-slate-700 rounded-xl p-3 sm:p-4 text-center border border-slate-500">
          <div className="text-lg sm:text-xl font-bold text-blue-400">{stats.completed_today || 0}</div>
          <div className="text-slate-300 text-xs sm:text-sm">Завершено</div>
        </div>
        <div className="bg-slate-700 rounded-xl p-3 sm:p-4 text-center border border-slate-500">
          <div className="text-lg sm:text-xl font-bold text-yellow-400">{stats.pending_today || 0}</div>
          <div className="text-slate-300 text-xs sm:text-sm">В процессе</div>
        </div>
        <div className="bg-slate-700 rounded-xl p-3 sm:p-4 text-center border border-slate-500">
          <div className="text-lg sm:text-xl font-bold text-purple-400">{stats.efficiency_rate || 0}%</div>
          <div className="text-slate-300 text-xs sm:text-sm">Эффективность</div>
        </div>
        <div className="bg-slate-700 rounded-xl p-3 sm:p-4 text-center border border-slate-500">
          <div className="text-lg sm:text-xl font-bold text-green-400">
            {Math.round((stats.completed_minutes || 0) / 60)}ч
          </div>
          <div className="text-slate-300 text-xs sm:text-sm">Работа</div>
        </div>
      </div>

      {/* Оценка продуктивности */}
      <div className={`bg-gradient-to-r ${getProductivityColor(analysis.productivity_score || 0)} rounded-2xl p-4 sm:p-6 border`}>
        <div className="text-center">
          <div className="text-2xl sm:text-3xl mb-2">{getMoodEmoji()}</div>
          <div className="text-xl sm:text-2xl font-bold text-white mb-2">
            Оценка продуктивности: {analysis.productivity_score || 0}%
          </div>
          <div className="text-white/80 text-sm sm:text-base">
            Уровень энергии: <span className={energyInfo.color}>{energyInfo.label}</span>
          </div>
        </div>
      </div>

      {/* AI Инсайты и рекомендации */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Инсайты */}
        <div className="bg-slate-700 rounded-xl p-4 sm:p-6 border border-slate-500">
          <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">
            🧠 AI Инсайты
          </h3>
          <div className="space-y-2 sm:space-y-3">
            {(analysis.insights || []).map((insight, index) => (
              <div key={index} className="flex items-start space-x-2 sm:space-x-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-slate-300 text-xs sm:text-sm">{insight}</p>
              </div>
            ))}
            {(!analysis.insights || analysis.insights.length === 0) && (
              <p className="text-slate-400 text-sm">Анализ данных в процессе...</p>
            )}
          </div>
        </div>

        {/* Рекомендации */}
        <div className="bg-slate-700 rounded-xl p-4 sm:p-6 border border-slate-500">
          <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">
            💡 Рекомендации
          </h3>
          <div className="space-y-2 sm:space-y-3">
            {(analysis.recommendations || []).map((recommendation, index) => (
              <div key={index} className="flex items-start space-x-2 sm:space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-slate-300 text-xs sm:text-sm">{recommendation}</p>
              </div>
            ))}
            {(!analysis.recommendations || analysis.recommendations.length === 0) && (
              <p className="text-slate-400 text-sm">Загрузка рекомендаций...</p>
            )}
          </div>
        </div>
      </div>

      {/* Детальная статистика */}
      <div className="bg-slate-700 rounded-xl p-4 sm:p-6 border border-slate-500">
        <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">📊 Детальная статистика</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="text-center p-3 bg-slate-600 rounded-lg">
            <div className="text-blue-400 font-bold text-lg">{stats.total_today || 0}</div>
            <div className="text-slate-300 text-sm">Всего задач</div>
          </div>
          <div className="text-center p-3 bg-slate-600 rounded-lg">
            <div className="text-green-400 font-bold text-lg">{stats.completed_today || 0}</div>
            <div className="text-slate-300 text-sm">Выполнено</div>
          </div>
          <div className="text-center p-3 bg-slate-600 rounded-lg">
            <div className="text-yellow-400 font-bold text-lg">
              {Math.round((stats.total_minutes || 0) / 60)}ч
            </div>
            <div className="text-slate-300 text-sm">Планируемое время</div>
          </div>
          <div className="text-center p-3 bg-slate-600 rounded-lg">
            <div className="text-purple-400 font-bold text-lg">{stats.time_utilization || 0}%</div>
            <div className="text-slate-300 text-sm">Использование времени</div>
          </div>
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={loadAiAnalytics}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-colors text-sm"
        >
          Обновить анализ
        </button>
      </div>
    </div>
  );
}

// Канбан доска
function KanbanBoard({ currentUser }) {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateCard, setShowCreateCard] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState(null);
  const [draggedCard, setDraggedCard] = useState(null);

  const selectedProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  useEffect(() => {
    loadProjects();
  }, [currentUser]);

  const loadProjects = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      console.log("Loading projects for user:", currentUser.id);
      const response = await fetch(`${API}/kanban/projects?external_id=${currentUser.id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Loaded projects:", data);
      
      const projectsData = data.projects || [];
      setProjects(projectsData);
      
      if (projectsData.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projectsData[0].id);
      }
    } catch (error) {
      console.error("Error loading projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (title, description, color) => {
    try {
      const response = await fetch(`${API}/kanban/projects?external_id=${currentUser.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          color
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create project");
      }

      const result = await response.json();
      console.log("Project created successfully:", result);
      
      setShowCreateProject(false);
      await loadProjects();
      
    } catch (error) {
      console.error("Error creating project:", error);
      alert(`Ошибка при создании проекта: ${error.message}`);
    }
  };

  const createCard = async (columnId, title, description, priority, estimatedMinutes, tags) => {
    try {
      console.log("Creating card with data:", {
        columnId, title, description, priority, estimatedMinutes, tags
      });

      const response = await fetch(`${API}/kanban/columns/${columnId}/cards?external_id=${currentUser.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description: description || "",
          priority: parseInt(priority),
          estimated_minutes: parseInt(estimatedMinutes) || 0,
          tags: tags ? tags.split(',').map(t => t.trim()).filter(t => t) : []
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server error:", errorData);
        throw new Error(errorData.detail || "Failed to create card");
      }

      const result = await response.json();
      console.log("Card created successfully:", result);
      
      setShowCreateCard(false);
      await loadProjects();
      
    } catch (error) {
      console.error("Error creating card:", error);
      alert(`Ошибка при создании карточки: ${error.message}`);
    }
  };

  const updateCardPosition = async (cardId, newColumnId, newPosition) => {
    try {
      const response = await fetch(`${API}/kanban/cards/${cardId}?external_id=${currentUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          column_id: newColumnId,
          position: newPosition
        }),
      });

      if (!response.ok) {
        console.error("Error updating card position");
        return false;
      }
      
      await loadProjects();
      return true;
      
    } catch (error) {
      console.error("Error updating card position:", error);
      return false;
    }
  };

  const deleteCard = async (cardId) => {
    try {
      const response = await fetch(`${API}/kanban/cards/${cardId}?external_id=${currentUser.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete card");
      }

      await loadProjects();
      
    } catch (error) {
      console.error("Error deleting card:", error);
      alert(`Ошибка при удалении карточки: ${error.message}`);
    }
  };

  const deleteProject = async (projectId) => {
    try {
      const response = await fetch(`${API}/kanban/projects/${projectId}?external_id=${currentUser.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete project");
      }

      await loadProjects();
      
    } catch (error) {
      console.error("Error deleting project:", error);
      alert(`Ошибка при удалении проекта: ${error.message}`);
    }
  };

  const handleDragStart = (e, card, column) => {
    setDraggedCard({ ...card, sourceColumnId: column.id });
    e.dataTransfer.setData('text/plain', '');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetColumn) => {
    e.preventDefault();
    
    if (draggedCard && draggedCard.sourceColumnId !== targetColumn.id) {
      const targetColumnCards = targetColumn.cards || [];
      const newPosition = targetColumnCards.length > 0 
        ? Math.max(...targetColumnCards.map(c => c.position)) + 1 
        : 0;
      
      await updateCardPosition(draggedCard.id, targetColumn.id, newPosition);
    }
    
    setDraggedCard(null);
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 1: return 'border-l-green-500';
      case 2: return 'border-l-blue-500';
      case 3: return 'border-l-yellow-500';
      case 4: return 'border-l-orange-500';
      case 5: return 'border-l-red-500';
      default: return 'border-l-gray-500';
    }
  };

  const getPriorityLabel = (priority) => {
    switch(priority) {
      case 1: return '🟢 Низкий';
      case 2: return '🔵 Средний';
      case 3: return '🟡 Высокий';
      case 4: return '🟠 Критичный';
      case 5: return '🔴 Срочный';
      default: return '⚪ Без приоритета';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8 sm:py-12">
        <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-2 sm:ml-3 text-white text-sm sm:text-base">Загрузка канбан-доски...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Заголовок и управление проектами */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl font-bold text-white">Канбан доска</h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1">
            Управляйте задачами визуально
          </p>
        </div>
        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
          {projects.length > 0 && (
            <select
              value={selectedProjectId || ''}
              onChange={(e) => setSelectedProjectId(parseInt(e.target.value))}
              className="px-3 py-2 sm:px-4 bg-slate-700 border border-slate-500 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base min-h-[44px] flex-1 sm:flex-none"
            >
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          )}
          <button 
            onClick={() => setShowCreateProject(true)}
            className="px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 shadow font-semibold border border-blue-400/30 text-xs sm:text-sm whitespace-nowrap min-h-[44px]"
          >
            Новый проект
          </button>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <div className="w-16 h-16 sm:w-24 sm:h-24 bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 border border-slate-500">
            <svg className="w-8 h-8 sm:w-12 sm:h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Нет проектов</h3>
          <p className="text-slate-300 text-sm mb-3 sm:mb-4">Создайте свой первый проект для начала работы</p>
          <button 
            onClick={() => setShowCreateProject(true)}
            className="px-4 py-3 sm:px-6 sm:py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 shadow font-semibold border border-blue-400/30 text-sm sm:text-base min-h-[44px]"
          >
            Создать проект
          </button>
        </div>
      ) : selectedProject ? (
        <div className="space-y-4">
          {/* Информация о проекте */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-white truncate">{selectedProject.title}</h3>
              {selectedProject.description && (
                <p className="text-slate-300 text-sm mt-1 truncate">{selectedProject.description}</p>
              )}
            </div>
            <button
              onClick={() => {
                if (confirm(`Удалить проект "${selectedProject.title}"?`)) {
                  deleteProject(selectedProject.id);
                }
              }}
              className="px-3 py-2 bg-red-500/20 text-red-300 border border-red-500/30 rounded-xl hover:bg-red-500/30 transition-all duration-300 text-sm min-h-[44px] w-full sm:w-auto mt-2 sm:mt-0"
            >
              Удалить проект
            </button>
          </div>

          {/* Канбан доска */}
          <div className="flex flex-col lg:flex-row lg:space-x-4 space-y-4 lg:space-y-0 overflow-hidden">
            {selectedProject.columns && selectedProject.columns.map(column => (
              <div 
                key={column.id}
                className="flex-shrink-0 bg-slate-700 rounded-xl border border-slate-500 w-full lg:w-80"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column)}
              >
                {/* Заголовок колонки */}
                <div 
                  className="p-4 rounded-t-xl border-b border-slate-500"
                  style={{ backgroundColor: column.color + '20' }}
                >
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-white text-sm sm:text-base truncate" style={{ color: column.color }}>
                      {column.title}
                    </h3>
                    <span className="text-slate-300 text-xs sm:text-sm bg-slate-600 px-2 py-1 rounded">
                      {column.cards ? column.cards.length : 0}
                    </span>
                  </div>
                </div>

                {/* Карточки в колонке */}
                <div className="p-3 space-y-3 min-h-48 max-h-96 overflow-y-auto">
                  {column.cards && column.cards.map(card => (
                    <div
                      key={card.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, card, column)}
                      className={`bg-slate-600 rounded-lg p-3 border-l-4 cursor-move transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${getPriorityColor(card.priority)}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-white text-sm sm:text-base flex-1 pr-2">{card.title}</h4>
                        <button
                          onClick={() => {
                            if (confirm(`Удалить карточку "${card.title}"?`)) {
                              deleteCard(card.id);
                            }
                          }}
                          className="text-slate-400 hover:text-red-400 transition-colors flex-shrink-0"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      
                      {card.description && (
                        <p className="text-slate-300 text-xs sm:text-sm mb-2 line-clamp-2">{card.description}</p>
                      )}
                      
                      {card.tags && card.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {card.tags.map((tag, index) => (
                            <span 
                              key={index}
                              className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center text-xs text-slate-400">
                        {card.estimated_minutes > 0 && (
                          <span>⏱ {card.estimated_minutes}м</span>
                        )}
                        <span>{getPriorityLabel(card.priority)}</span>
                      </div>
                    </div>
                  ))}
                  
                  {/* Кнопка добавления карточки */}
                  <button
                    onClick={() => {
                      setSelectedColumn(column);
                      setShowCreateCard(true);
                    }}
                    className="w-full p-3 border-2 border-dashed border-slate-500 rounded-lg text-slate-400 hover:text-white hover:border-slate-400 transition-all duration-300 transform hover:scale-105 text-center text-sm sm:text-base min-h-[44px]"
                  >
                    + Добавить карточку
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Модальное окно создания проекта */}
      {showCreateProject && (
        <CreateProjectModal
          onCreate={createProject}
          onClose={() => setShowCreateProject(false)}
        />
      )}

      {/* Модальное окно создания карточки */}
      {showCreateCard && selectedColumn && (
        <CreateCardModal
          column={selectedColumn}
          onCreate={createCard}
          onClose={() => {
            setShowCreateCard(false);
            setSelectedColumn(null);
          }}
        />
      )}
    </div>
  );
}

// Модальное окно для создания проекта
function CreateProjectModal({ onCreate, onClose }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#3b82f6");

  const colors = [
    "#3b82f6", "#ef4444", "#10b981", "#f59e0b", 
    "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"
  ];

  const handleSubmit = () => {
    if (title.trim()) {
      onCreate(title, description, color);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-3 sm:p-4 z-50">
      <div className="bg-slate-800 rounded-2xl p-4 sm:p-6 w-full max-w-md border border-slate-600 shadow-xl mx-2">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h3 className="text-lg font-bold text-white">Новый проект</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-2xl transform hover:scale-110 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Название проекта
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 bg-slate-700 border border-slate-500 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base min-h-[44px]"
              placeholder="Введите название проекта"
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Описание (необязательно)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 bg-slate-700 border border-slate-500 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              placeholder="Описание проекта"
              rows="3"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Цвет проекта
            </label>
            <div className="flex flex-wrap gap-2">
              {colors.map((colorOption) => (
                <button
                  key={colorOption}
                  onClick={() => setColor(colorOption)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform min-h-[32px] ${
                    color === colorOption ? 'border-white scale-110' : 'border-slate-500'
                  }`}
                  style={{ backgroundColor: colorOption }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-6">
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-xl hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 font-semibold text-sm sm:text-base min-h-[44px]"
          >
            Создать проект
          </button>
          <button
            onClick={onClose}
            className="px-4 sm:px-6 py-3 bg-slate-700 border border-slate-500 text-white rounded-xl hover:bg-slate-600 transition-all duration-300 text-sm sm:text-base min-h-[44px]"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}

// Модальное окно для создания карточки
function CreateCardModal({ column, onCreate, onClose }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("3");
  const [estimatedMinutes, setEstimatedMinutes] = useState("30");
  const [tags, setTags] = useState("");

  const handleSubmit = () => {
    if (title.trim()) {
      onCreate(column.id, title, description, priority, estimatedMinutes, tags);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-3 sm:p-4 z-50">
      <div className="bg-slate-800 rounded-2xl p-4 sm:p-6 w-full max-w-md border border-slate-600 shadow-xl mx-2 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h3 className="text-lg font-bold text-white">Новая карточка</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-2xl transform hover:scale-110 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Название карточки
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 bg-slate-700 border border-slate-500 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base min-h-[44px]"
              placeholder="Что нужно сделать?"
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Описание (необязательно)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 bg-slate-700 border border-slate-500 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              placeholder="Подробное описание задачи"
              rows="3"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Приоритет
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full p-3 bg-slate-700 border border-slate-500 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base min-h-[44px]"
              >
                <option value="1">🟢 Низкий</option>
                <option value="2">🔵 Средний</option>
                <option value="3">🟡 Высокий</option>
                <option value="4">🟠 Критичный</option>
                <option value="5">🔴 Срочный</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Время (минут)
              </label>
              <input
                type="number"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
                className="w-full p-3 bg-slate-700 border border-slate-500 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base min-h-[44px]"
                min="0"
                max="480"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Теги (через запятую)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full p-3 bg-slate-700 border border-slate-500 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base min-h-[44px]"
              placeholder="дизайн, разработка, тестирование"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-6">
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-xl hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 font-semibold text-sm sm:text-base min-h-[44px]"
          >
            Создать карточку
          </button>
          <button
            onClick={onClose}
            className="px-4 sm:px-6 py-3 bg-slate-700 border border-slate-500 text-white rounded-xl hover:bg-slate-600 transition-all duration-300 text-sm sm:text-base min-h-[44px]"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}

// Модальное окно добавления задач
function AddTaskModal({ onAdd, onClose, selectedDate, title = "Новая задача" }) {
  const [taskTitle, setTaskTitle] = useState("");
  const [minutes, setMinutes] = useState(25);
  const [difficulty, setDifficulty] = useState(2);
  const [taskDate, setTaskDate] = useState(
    selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [isParentTask, setIsParentTask] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!taskTitle.trim()) {
      alert("Пожалуйста, введите название задачи");
      return;
    }

    setIsSubmitting(true);
    try {
      await onAdd(taskTitle, minutes, difficulty, taskDate, isParentTask);
      onClose();
    } catch (error) {
      console.error("Error in AddTaskModal:", error);
      alert("Произошла ошибка при создании задачи");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isSubmitting) {
      handleSubmit();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-3 sm:p-4 z-50">
      <div className="bg-slate-800 rounded-2xl p-4 sm:p-6 w-full max-w-md border border-slate-600 shadow-xl mx-2 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-white transition-colors text-2xl transform hover:scale-110 min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-50"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-4 sm:space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2 sm:mb-3">
              Название задачи *
            </label>
            <input
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full p-3 sm:p-4 bg-slate-700 border border-slate-500 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base min-h-[44px]"
              placeholder="Что нужно сделать?"
              autoFocus
              disabled={isSubmitting}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 sm:mb-3">
                Время (минут)
              </label>
              <input
                type="number"
                value={minutes}
                onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
                className="w-full p-3 sm:p-4 bg-slate-700 border border-slate-500 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base min-h-[44px]"
                min="0"
                max="480"
                disabled={isSubmitting}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 sm:mb-3">
                Сложность
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(parseInt(e.target.value))}
                className="w-full p-3 sm:p-4 bg-slate-700 border border-slate-500 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base min-h-[44px]"
                disabled={isSubmitting}
              >
                <option value={1}>🟢 Легко</option>
                <option value={2}>🟡 Средне</option>
                <option value={3}>🟠 Сложно</option>
                <option value={4}>🔴 Очень сложно</option>
                <option value={5}>💪 Эксперт</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 sm:mb-3">
                Дата выполнения
              </label>
              <input
                type="date"
                value={taskDate}
                onChange={(e) => setTaskDate(e.target.value)}
                className="w-full p-3 sm:p-4 bg-slate-700 border border-slate-500 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base min-h-[44px]"
                min={new Date().toISOString().split('T')[0]}
                disabled={isSubmitting}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 sm:mb-3">
                Тип задачи
              </label>
              <div className="flex space-x-3 sm:space-x-4 mt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="taskType"
                    checked={!isParentTask}
                    onChange={() => setIsParentTask(false)}
                    className="w-4 h-4 text-blue-500 bg-slate-600 border-slate-500 focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                  <span className="text-slate-300 text-sm">Обычная</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="taskType"
                    checked={isParentTask}
                    onChange={() => setIsParentTask(true)}
                    className="w-4 h-4 text-blue-500 bg-slate-600 border-slate-500 focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                  <span className="text-slate-300 text-sm">С подзадачами</span>
                </label>
              </div>
            </div>
          </div>

          {isParentTask && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 sm:p-4">
              <div className="flex items-center space-x-2 text-blue-300">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs sm:text-sm">Эта задача будет разложена на подзадачи автоматически</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-6 sm:mt-8">
          <button
            onClick={handleSubmit}
            disabled={!taskTitle.trim() || isSubmitting}
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 sm:py-4 rounded-xl hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 font-semibold shadow border border-blue-400/30 text-sm sm:text-base min-h-[44px] flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                Создание...
              </>
            ) : (
              "Создать задачу"
            )}
          </button>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 sm:px-6 py-3 sm:py-4 bg-slate-700 border border-slate-500 text-white rounded-xl hover:bg-slate-600 transition-all duration-300 transform hover:scale-105 text-sm sm:text-base min-h-[44px] disabled:opacity-50"
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
  const [selectedDateForTask, setSelectedDateForTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks');
  const [authState, setAuthState] = useState('checking'); 

  useEffect(() => {
    checkMaxEnvironment();
  }, []);

  useEffect(() => {
    if (currentUser && tasks.length === 0) {
      loadTasks();
    }
  }, [currentUser]);

  const checkMaxEnvironment = () => {
    if (window.WebApp && window.WebApp.initDataUnsafe) {
      setAuthState('auto-login');
    } else {
      setAuthState('error');
    }
  };

  const loadTasks = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API}/tasks/list?external_id=${currentUser.id}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || data || []);
      } else {
        console.error("Failed to load tasks:", response.status);
      }
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData) => {
    setCurrentUser(userData);
    localStorage.setItem("taskbot_user", JSON.stringify({ 
      id: userData.id,
      maxUserId: userData.maxUserId
    }));
  };

  const handleAuthError = (error) => {
    setAuthState('error');
    console.error("Authentication error:", error);
  };

  const handleRetryAuth = () => {
    setAuthState('checking');
    setTimeout(() => checkMaxEnvironment(), 1000);
  };

  // Добавление задач
  const handleAddTask = async (title, minutes, difficulty, taskDate = null, isParentTask = false) => {
    if (!currentUser) {
      console.error("No current user");
      return;
    }

    try {
      let taskData = {
        title: title.trim(),
        estimated_minutes: parseInt(minutes) || 25,
        difficulty: parseInt(difficulty) || 2
      };

      if (taskDate) {
        taskData.task_date = taskDate;
      }

      console.log("Creating task with data:", taskData, "isParentTask:", isParentTask);

      let response;
      
      if (isParentTask) {
        response = await fetch(`${API}/tasks/decompose?external_id=${currentUser.id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(taskData),
        });
      } else {
        response = await fetch(`${API}/tasks/create?external_id=${currentUser.id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(taskData),
        });
      }

      if (response.ok) {
        const result = await response.json();
        console.log("Task created successfully:", result);
        await loadTasks(); 
      } else {
        const errorText = await response.text();
        console.error("Server error:", response.status, errorText);
        throw new Error(`Ошибка сервера: ${response.status}`);
      }
    } catch (error) {
      console.error("Error creating task:", error);
      alert(`Ошибка при создании задачи: ${error.message}`);
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
        await loadTasks(); 
      } else {
        console.error("Failed to complete task:", response.status);
      }
    } catch (error) {
      console.error("Error completing task:", error);
    }
  };

  const handleAddTaskWithDate = (date = null) => {
    setSelectedDateForTask(date);
    setShowAddTask(true);
  };

  useEffect(() => {
    const handleError = (error) => {
      console.error("Global error:", error);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  if (authState === 'checking') {
    return <LoadingScreen />;
  }

  if (authState === 'error') {
    return (
      <ErrorScreen 
        error="MAX Bridge не доступен. Откройте приложение через MAX мессенджер." 
        onRetry={handleRetryAuth}
      />
    );
  }

  if (authState === 'auto-login' && !currentUser) {
    return <AutoLogin onLogin={handleLogin} onError={handleAuthError} />;
  }

  if (!currentUser) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 p-3 sm:p-4">
      <div className="max-w-6xl mx-auto">
        {/* Шапка с аватаркой из MAX */}
        <header className="bg-slate-800 rounded-2xl p-4 sm:p-6 shadow border border-slate-600 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <div className="relative flex-shrink-0">
                <img 
                  src={currentUser.userData?.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=3b82f6&color=fff&size=128&bold=true`}
                  alt={currentUser.name}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl border-2 border-blue-500 shadow"
                />
                {currentUser.userData?.photo_url && (
                  <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-slate-800">
                    <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-bold text-white truncate">Добро пожаловать, {currentUser.name}!</h1>
                <p className="text-slate-300 text-xs sm:text-sm truncate">LevelUp - ваша система продуктивности</p>
                {currentUser.maxUserId && (
                  <p className="text-blue-400 text-xs mt-1">Синхронизировано с MAX • ID: {currentUser.maxUserId}</p>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Навигация */}
        <MobileNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Основной контент */}
        <main className="bg-slate-800 rounded-2xl p-4 sm:p-6 shadow border border-slate-600">
          {loading ? (
            <div className="flex justify-center items-center py-8 sm:py-12">
              <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2 sm:ml-3 text-white text-sm sm:text-base">Загрузка...</span>
            </div>
          ) : (
            <div className="text-white">
              {activeTab === 'tasks' && (
                <TaskList 
                  tasks={tasks} 
                  onComplete={handleCompleteTask}
                  onAddTask={() => handleAddTaskWithDate()}
                  currentUser={currentUser}
                  onTaskUpdate={loadTasks}
                />
              )}
              {activeTab === 'calendar' && (
                <EnergyCalendar 
                  tasks={tasks}
                  onAddTask={handleAddTaskWithDate}
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
                <DailyAnalysis tasks={tasks} currentUser={currentUser} />
              )}
              {activeTab === 'kanban' && (
                <KanbanBoard currentUser={currentUser} />
              )}
            </div>
          )}
        </main>

        {/* Модальное окно добавления задачи */}
        {showAddTask && (
          <AddTaskModal
            onAdd={handleAddTask}
            onClose={() => {
              setShowAddTask(false);
              setSelectedDateForTask(null);
            }}
            selectedDate={selectedDateForTask}
          />
        )}
      </div>
    </div>
  );
}

