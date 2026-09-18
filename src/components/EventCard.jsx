import React from 'react';

const EventCard = ({ event, onJoin, onClick, isJoined, isOwner }) => {
  // Показываем точный адрес только участникам/организатору
  const displayLocation = isJoined || isOwner ? event.address : event.district;

  return (
    <div className="event-card" onClick={() => onClick(event)}>
      <div className="event-image-wrapper">
        <img src={event.image} alt={event.title} className="event-image" loading="lazy" />
        <span className={`badge ${event.price === 'Бесплатно' ? 'free' : 'paid'}`}>
          {event.price}
        </span>
        <span className="badge category">{event.category}</span>
        {event.rating > 0 && (
          <span className="badge rating">
            ★ {event.rating} ({event.reviewsCount})
          </span>
        )}
      </div>

      <div className="event-info">
        <h3>{event.title}</h3>
        <p className="description">{event.description}</p>

        <div className="event-meta">
          <span>📅 {event.date}</span>
          <span>📍 {displayLocation}</span>
          <span>👥 {event.participants}/{event.maxParticipants}</span>
        </div>

        <button
          className="join-btn"
          onClick={(e) => {
            e.stopPropagation();
            onJoin(event);
          }}
          disabled={isJoined}
        >
          {isJoined ? '✓ Вы участвуете' : 'Присоединиться'}
        </button>
      </div>
    </div>
  );
};

export default EventCard;