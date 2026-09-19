import React from 'react';
import Icon from './Icon';

const EventCard = ({
  event,
  onJoin,
  onLeave,
  onClick,
  isJoined,
  isLiked,
  onToggleLike
}) => {
  const displayLocation = isJoined ? event.address : event.district;

  return (
    <div className="event-card-horizontal" onClick={() => onClick(event)}>
      <div className="event-card-image">
        <img src={event.image} alt={event.title} loading="lazy" />
        <span className={`badge ${event.price === 'Бесплатно' ? 'free' : 'paid'}`}>
          {event.price}
        </span>
      </div>

      <div className="event-card-body">
        <div className="event-card-top">
          <span className="category-tag">{event.category}</span>
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
          <span><Icon name="pin" size={15} /> {event.distance}</span>
          <span><Icon name="people" size={15} /> {event.participants} участников</span>
        </div>

        <button
          className={`join-btn-small ${isJoined ? 'leave' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            if (isJoined) onLeave?.(event);
            else onJoin(event);
          }}
        >
          {isJoined ? 'Отказаться' : 'Присоединиться'}
        </button>
      </div>
    </div>
  );
};

export default EventCard;
