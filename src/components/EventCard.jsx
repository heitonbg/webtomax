import React from 'react';
import Icon from './Icon';
import EventOwnerMenu from './EventOwnerMenu';

const EventCard = ({
  event,
  onJoin,
  onLeave,
  onClick,
  isJoined,
  isLiked,
  onToggleLike,
  isOwner = false,
  onDelete
}) => {
  const actionButton = (
    <button
      type="button"
      className={`join-btn-small ${!isOwner && isJoined ? 'leave' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        if (isOwner) onClick(event);
        else if (isJoined) onLeave?.(event);
        else onJoin(event);
      }}
    >
      {isOwner ? 'Открыть событие' : isJoined ? 'Отказаться' : 'Присоединиться'}
    </button>
  );

  return (
    <div
      className={`event-card-horizontal ${isOwner ? 'event-card-owned' : ''}`}
      onClick={() => onClick(event)}
    >
      <div className="event-card-image">
        <img src={event.image} alt={event.title} loading="lazy" />
        <span className={`badge ${event.price === 'Бесплатно' ? 'free' : 'paid'}`}>
          {event.price}
        </span>
      </div>

      <div className="event-card-body">
        <div className="event-card-top">
          <span className="category-tag">{event.category}</span>
          {isOwner && <EventOwnerMenu event={event} onDelete={onDelete} />}
          <button
            className={`like-btn ${isLiked ? 'liked' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleLike?.(event.id);
            }}
            aria-label="Нравится"
          >
            <Icon name="heart" size={22} filled={isLiked} />
          </button>
        </div>

        <h3>{event.title}</h3>
        <p className="event-card-description">{event.description}</p>

        <div className="event-card-meta">
          <span><Icon name="calendar" size={15} /> {event.date}</span>
          {event.duration && (
            <span><Icon name="clock" size={15} /> {event.duration}</span>
          )}
          <span><Icon name="pin" size={15} /> {event.distance}</span>
          <span>
            <Icon name="people" size={15} /> {event.participants} участников
          </span>
        </div>

        {!isOwner && actionButton}
      </div>
      {isOwner && (
        <div className="event-card-footer">
          <span className="event-owner-badge">Вы организатор</span>
          {actionButton}
        </div>
      )}
    </div>
  );
};

export default EventCard;