import React, { useState, useEffect, useMemo } from 'react';
import DesktopSidebar from './components/DesktopSidebar';
import SearchBar from './components/SearchBar';
import EventFeed from './components/EventFeed';
import EventMap from './components/EventMap';
import EventDetailModal from './components/EventDetailModal';
import FiltersModal from './components/FiltersModal';
import CreateEventForm from './components/CreateEventForm';
import MyEvents from './components/MyEvents';
import Profile from './components/Profile';
import Icon from './components/Icon';
import { EventSkeletonList } from './components/EventSkeleton';
import CityPickerModal from './components/CityPickerModal';
import OrganizerModal from './components/OrganizerModal';
import {
  fetchEvents,
  createEvent,
  joinEvent,
  leaveEvent,
  deleteEvent
} from './api/events';
import { isEventOwner } from './utils/eventOwnership';
import DeleteEventDialog from './components/DeleteEventDialog';
import { maxBridge } from './utils/maxBridge';
import { haversineDistance, formatDistance } from './utils/distance';
import './App.css';

// Город по умолчанию — Казань
const DEFAULT_CITY = {
  name: 'Казань',
  lat: 55.796,
  lng: 49.108,
  country: 'Россия'
};

const CITY_STORAGE_KEY = 'max_events_selected_city';

function App() {
  const [activeTab, setActiveTab] = useState('feed');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickFilter, setQuickFilter] = useState(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filters, setFilters] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [joinedIds, setJoinedIds] = useState([]);
  const [likedIds, setLikedIds] = useState([]);
  const [user, setUser] = useState(null);
  const [userCoords, setUserCoords] = useState(null);
  const [toast, setToast] = useState(null);
  const [lastCreatedEventId, setLastCreatedEventId] = useState(null);
  const [selectedCity, setSelectedCity] = useState(() => {
    try {
      const saved = localStorage.getItem(CITY_STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_CITY;
    } catch (e) {
      return DEFAULT_CITY;
    }
  });
  const [isCityOpen, setIsCityOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [organizerToShow, setOrganizerToShow] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const userId = user?.id ?? 'guest';

  // ============================================
  // Сохранение выбранного города
  // ============================================
  useEffect(() => {
    try {
      localStorage.setItem(CITY_STORAGE_KEY, JSON.stringify(selectedCity));
    } catch (e) {
      // ignore
    }
  }, [selectedCity]);

  const requestDelete = (event) => {
    if (!isEventOwner(event, userId)) return;
    setDeleteError('');
    setPendingDelete(event);
  };

  const confirmDelete = async () => {
    if (!pendingDelete || deleting || !isEventOwner(pendingDelete, userId)) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteEvent(pendingDelete.id, userId);
      const id = pendingDelete.id;
      setEvents((items) => items.filter((item) => item.id !== id));
      setJoinedIds((ids) => ids.filter((item) => item !== id));
      setLikedIds((ids) => ids.filter((item) => item !== id));
      setSelectedEvent((event) => (event?.id === id ? null : event));
      setLastCreatedEventId((previous) => (previous === id ? null : previous));
      setPendingDelete(null);
      setToast('Событие удалено');
    } catch (error) {
      setDeleteError(
        error.message || 'Не удалось удалить событие. Попробуйте ещё раз.'
      );
    } finally {
      setDeleting(false);
    }
  };

  const quickFilters = ['Сегодня', 'Бесплатно', 'Спорт', 'Культура', 'Онлайн'];

  const track = (eventName, payload = {}) => {
    console.info('[MVP analytics]', eventName, payload);
  };

  // ============================================
  // Инициализация MAX Bridge + геолокация
  // ============================================
  useEffect(() => {
    maxBridge.init();
    const u = maxBridge.getUser();
    if (u) setUser(u);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setUserCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          }),
        () => console.log('Геолокация недоступна')
      );
    }

    track('feed_opened');
  }, []);

  // ============================================
  // Загрузка событий при смене города
  // ============================================
  useEffect(() => {
    loadEvents(selectedCity.name);
  }, [selectedCity.name]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const loadEvents = async (cityName) => {
    try {
      setLoading(true);
      const data = await fetchEvents({ city: cityName });
      setEvents(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // Фильтрация событий
  // ============================================
  const filteredEvents = useMemo(() => {
    let result = [...events];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q)
      );
    }

    if (quickFilter === 'Сегодня') {
      result = result.filter((e) => e.date.includes('Сегодня'));
    } else if (quickFilter === 'Бесплатно') {
      result = result.filter((e) => e.price === 'Бесплатно');
    } else if (quickFilter === 'Онлайн') {
      result = result.filter((e) => e.district === 'Онлайн');
    } else if (quickFilter) {
      result = result.filter((e) => e.category === quickFilter);
    }

    if (filters) {
      const isOnline = (event) =>
        event.format === 'Онлайн' || event.district === 'Онлайн';
      const parseDistance = (distance) => {
        const value = Number.parseFloat(String(distance).replace(',', '.'));
        return Number.isFinite(value) ? value : Infinity;
      };
      if (filters.category?.length) {
        result = result.filter((e) => filters.category.includes(e.category));
      }
      if (filters.price) {
        result = result.filter((e) =>
          filters.price === 'Платно'
            ? e.price !== 'Бесплатно'
            : e.price === filters.price
        );
      }
      if (filters.format === 'Онлайн') {
        result = result.filter(isOnline);
      } else if (filters.format === 'Офлайн') {
        result = result.filter((e) => !isOnline(e));
      }
      if (filters.time) {
        result = result.filter((e) => e.date.includes(filters.time));
      }
      if (filters.distance) {
        const maxDistance = Number.parseFloat(
          filters.distance.replace(/[^0-9.]/g, '')
        );
        result = result.filter((e) => parseDistance(e.distance) <= maxDistance);
      }
      if (filters.pushkinCard) {
        result = result.filter((e) => e.price === 'Пушкинская карта');
      }
    }

    if (userCoords) {
      result = result.map((e) => {
        if (e.lat && e.lng) {
          const dist = haversineDistance(
            userCoords.lat,
            userCoords.lng,
            e.lat,
            e.lng
          );
          return { ...e, distance: formatDistance(dist), _distanceValue: dist };
        }
        return { ...e, _distanceValue: 999 };
      });
      result.sort((a, b) => a._distanceValue - b._distanceValue);
    }

    return result;
  }, [events, searchQuery, quickFilter, filters, userCoords]);

  // ============================================
  // Обработчики
  // ============================================
  const handleJoinEvent = async (event) => {
    if (isEventOwner(event, userId) || joinedIds.includes(event.id)) return;

    try {
      maxBridge.haptic('medium');
      await joinEvent(event.id, user?.id || 'guest');
      setJoinedIds((prev) => [...prev, event.id]);
      setEvents((prev) =>
        prev.map((e) =>
          e.id === event.id ? { ...e, participants: e.participants + 1 } : e
        )
      );
      setSelectedEvent((prev) =>
        prev?.id === event.id
          ? { ...prev, participants: prev.participants + 1 }
          : prev
      );
      maxBridge.sendData({
        action: 'join_event',
        eventId: event.id,
        eventTitle: event.title,
        eventTime: event.eventTime || null
      });
      setToast(`Вы участвуете: «${event.title}»`);
    } catch (e) {
      maxBridge.showAlert('Не удалось присоединиться');
    }
  };

  const handleToggleLike = (eventId) => {
    setLikedIds((prev) =>
      prev.includes(eventId)
        ? prev.filter((id) => id !== eventId)
        : [...prev, eventId]
    );
  };

  const handleCreateEvent = async (newEvent) => {
    const created = await createEvent(newEvent);
    setEvents((prev) => [created, ...prev]);
    setLastCreatedEventId(created.id);
    setActiveTab('my');
    maxBridge.haptic('success');
    maxBridge.sendData({ action: 'create_event', title: created.title });
    setToast(`Событие «${created.title}» создано`);
  };

  const handleLeaveEvent = async (event) => {
    if (isEventOwner(event, userId) || !joinedIds.includes(event.id)) return;
    try {
      await leaveEvent(event.id, user?.id || 'guest');
      setJoinedIds((prev) => prev.filter((id) => id !== event.id));
      setEvents((prev) =>
        prev.map((item) =>
          item.id === event.id
            ? { ...item, participants: Math.max(0, item.participants - 1) }
            : item
        )
      );
      setSelectedEvent((prev) =>
        prev?.id === event.id
          ? { ...prev, participants: Math.max(0, prev.participants - 1) }
          : prev
      );
      setToast(`Вы отменили участие: «${event.title}»`);
    } catch (e) {
      setToast('Не удалось отменить участие. Попробуйте ещё раз.');
    }
  };

  const handleEventClick = (event) => {
    track('event_opened', { eventId: event.id });
    setSelectedEvent(event);
  };

  const handleApplyFilters = (f) => {
    setFilters(f);
    setQuickFilter(null);
  };

  const handleOpenChat = (event) => {
    track('chat_opened', { eventId: event.id });
    setToast(`Чат «${event.title}» откроется в MAX после подключения бота`);
  };

  const isExploreTab = activeTab === 'feed' || activeTab === 'map';

  return (
    <div className="app-container">
      <DesktopSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="main-content">
        {isExploreTab && (
          <>
            <div className="mobile-header">
              <div className="mobile-title-row">
                <h1>
                  События рядом{' '}
                  <button
                    className="header-location"
                    onClick={() => setIsCityOpen(true)}
                  >
                    <span className="pin">
                      <Icon name="pin" size={17} filled />
                    </span>
                    {selectedCity.name}
                    <span className="chevron">
                      <Icon name="chevronDown" size={14} />
                    </span>
                  </button>
                </h1>
                <button
                  className={`header-more ${isMenuOpen ? 'active' : ''}`}
                  onClick={() => setIsMenuOpen((value) => !value)}
                  aria-label="Меню"
                >
                  <Icon name="more" size={24} />
                </button>
              </div>
              {user && <p className="greeting">Больше, чем просто планы</p>}
            </div>

            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onOpenFilters={() => setIsFiltersOpen(true)}
            />

            <div className="tabs-row">
              <button
                className={`tab-btn ${activeTab === 'feed' ? 'active' : ''}`}
                onClick={() => setActiveTab('feed')}
              >
                <span className="tab-icon">
                  <Icon name="calendar" size={21} />
                </span>{' '}
                Лента
              </button>
              <button
                className={`tab-btn ${activeTab === 'map' ? 'active' : ''}`}
                onClick={() => setActiveTab('map')}
              >
                <span className="tab-icon">
                  <Icon name="map" size={21} />
                </span>{' '}
                Карта
              </button>
            </div>

            <div
              className="quick-filters"
              tabIndex="0"
              onWheel={(event) => {
                if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
                  event.preventDefault();
                  event.currentTarget.scrollLeft += event.deltaY;
                }
              }}
            >
              {quickFilters.map((f) => (
                <button
                  key={f}
                  className={`chip ${quickFilter === f ? 'active' : ''}`}
                  onClick={() => setQuickFilter(quickFilter === f ? null : f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="content-area">
          {loading ? (
            <EventSkeletonList count={3} />
          ) : (
            <>
              {activeTab === 'feed' && (
                <EventFeed
                  userId={userId}
                  onDelete={requestDelete}
                  events={filteredEvents}
                  onJoin={handleJoinEvent}
                  onLeave={handleLeaveEvent}
                  onEventClick={handleEventClick}
                  joinedIds={joinedIds}
                  likedIds={likedIds}
                  onToggleLike={handleToggleLike}
                  onCreate={() => {
                    track('create_started', { source: 'empty_feed' });
                    setActiveTab('create');
                  }}
                />
              )}

              {activeTab === 'map' && (
                <EventMap
                  userId={userId}
                  onDelete={requestDelete}
                  events={filteredEvents}
                  onJoin={handleJoinEvent}
                  onLeave={handleLeaveEvent}
                  onEventClick={handleEventClick}
                  joinedIds={joinedIds}
                  likedIds={likedIds}
                  onToggleLike={handleToggleLike}
                  city={selectedCity.name}
                />
              )}

              {activeTab === 'create' && (
                <CreateEventForm
                  onCreate={handleCreateEvent}
                  onCancel={() => setActiveTab('feed')}
                  userId={user?.id || 'guest'}
                  userName={user?.first_name || user?.name}
                  city={selectedCity.name}
                />
              )}

              {activeTab === 'my' && (
                <MyEvents
                  onDelete={requestDelete}
                  events={events}
                  onJoin={handleJoinEvent}
                  onLeave={handleLeaveEvent}
                  onEventClick={handleEventClick}
                  joinedIds={joinedIds}
                  likedIds={likedIds}
                  onToggleLike={handleToggleLike}
                  userId={user?.id || 'guest'}
                  showCreatedInitially={Boolean(lastCreatedEventId)}
                />
              )}

              {activeTab === 'profile' && (
                <Profile
                  user={user}
                  joinedIds={joinedIds}
                  createdCount={
                    events.filter(
                      (e) =>
                        e.organizer && e.organizer.id === (user?.id || 'guest')
                    ).length
                  }
                  onLogout={() =>
                    setToast('Профиль гостя остаётся активным в MVP')
                  }
                />
              )}
            </>
          )}
        </div>

        <div className="bottom-nav">
          <button
            onClick={() => setActiveTab('feed')}
            className={activeTab === 'feed' ? 'active' : ''}
          >
            <span className="icon">
              <Icon name="home" size={23} filled />
            </span>
            <span>Главная</span>
          </button>
          <button
            onClick={() => setActiveTab('create')}
            onClickCapture={() =>
              track('create_started', { source: 'navigation' })
            }
            className={`create-btn ${activeTab === 'create' ? 'active' : ''}`}
          >
            <span className="icon-plus">
              <Icon name="plus" size={34} />
            </span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={activeTab === 'profile' ? 'active' : ''}
          >
            <span className="icon">
              <Icon name="user" size={23} />
            </span>
            <span>Профиль</span>
          </button>
        </div>
      </div>

      {isFiltersOpen && (
        <FiltersModal
          onClose={() => setIsFiltersOpen(false)}
          onApply={handleApplyFilters}
          initialFilters={filters}
        />
      )}

      {selectedEvent && (
        <EventDetailModal
          onDelete={requestDelete}
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onJoin={handleJoinEvent}
          onLeave={handleLeaveEvent}
          onOpenChat={handleOpenChat}
          onOpenOrganizer={(org) => setOrganizerToShow(org)}
          isJoined={joinedIds.includes(selectedEvent.id)}
          isLiked={likedIds.includes(selectedEvent.id)}
          onToggleLike={handleToggleLike}
          userId={user?.id || 'guest'}
        />
      )}

      {organizerToShow && (
        <OrganizerModal
          isOpen={Boolean(organizerToShow)}
          onClose={() => setOrganizerToShow(null)}
          organizer={organizerToShow}
          eventsCount={
            events.filter((e) => e.organizer?.id === organizerToShow.id).length
          }
        />
      )}

      {pendingDelete && (
        <DeleteEventDialog
          event={pendingDelete}
          busy={deleting}
          error={deleteError}
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
        />
      )}

      {toast && (
        <button className="toast" onClick={() => setToast(null)}>
          <span>✓</span> {toast}
        </button>
      )}

      <CityPickerModal
        isOpen={isCityOpen}
        onClose={() => setIsCityOpen(false)}
        onSelect={(city) => setSelectedCity(city)}
        currentCity={selectedCity.name}
      />

      {isMenuOpen && (
        <div className="header-menu">
          <button
            onClick={() => {
              setActiveTab('my');
              setIsMenuOpen(false);
            }}
          >
            <Icon name="user" size={19} />
            Мои события
          </button>
          <button
            onClick={() => {
              setActiveTab('profile');
              setIsMenuOpen(false);
            }}
          >
            <Icon name="grid" size={19} />
            Профиль
          </button>
          <button
            onClick={() => {
              setIsCityOpen(true);
              setIsMenuOpen(false);
            }}
          >
            <Icon name="pin" size={19} />
            Выбрать город
          </button>
          <button onClick={() => setIsMenuOpen(false)}>
            <Icon name="close" size={19} />
            Закрыть
          </button>
        </div>
      )}
    </div>
  );
}

export default App;