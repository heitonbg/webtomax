import React from 'react';
import EventCard from './EventCard';
import Icon from './Icon';

const EventFeed = ({
  events,
  onJoin,
  onLeave,
  onEventClick,
  joinedIds,
  likedIds,
  onToggleLike,
  onCreate
}) => {
  if (!events.length) {
    return (
      <div className="empty-state">
        <div className="empty-icon"><Icon name="search" size={44} /></div>
        <h3>Событий не найдено</h3>
        <p>Рядом пока нет подходящих встреч. Возможно, кто-то ищет компанию так же, как и вы.</p>
        <button className="empty-create-btn" onClick={onCreate}>
          Создать событие
        </button>
      </div>
    );
  }

  return (
    <div className="event-feed">
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          onJoin={onJoin}
          onLeave={onLeave}
          onClick={onEventClick}
          isJoined={joinedIds.includes(event.id)}
          isLiked={likedIds.includes(event.id)}
          onToggleLike={onToggleLike}
        />
      ))}
    </div>
  );
};

export default EventFeed;
