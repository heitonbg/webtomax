import React from 'react';
import EventCard from './EventCard';

const EventFeed = ({ events, onJoin, onEventClick, joinedIds }) => {
  if (!events.length) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🔍</div>
        <h3>Событий не найдено</h3>
        <p>Попробуйте изменить фильтры или создать своё событие</p>
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
          onClick={onEventClick}
          isJoined={joinedIds.includes(event.id)}
        />
      ))}
    </div>
  );
};

export default EventFeed;