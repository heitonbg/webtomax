import React, { useEffect, useState } from 'react';
import Icon from './Icon';
import EventOwnerMenu from './EventOwnerMenu';
import EventLocationMap from './EventLocationMap';
import { isEventOwner } from '../utils/eventOwnership';
import { resolveImageUrl } from '../api/events';

const EventDetailModal = ({
  event,
  onClose,
  onJoin,
  onLeave,
  onDelete,
  onOpenChat,
  onOpenOrganizer,
  isJoined,
  isLiked,
  onToggleLike,
  userId
}) => {
  const isOwner = isEventOwner(event, userId);
  const [photoIndex, setPhotoIndex] = useState(0);

  const gallery = event.images?.length
    ? event.images.map(resolveImageUrl)
    : [resolveImageUrl(event.image)];

  useEffect(() => setPhotoIndex(0), [event.id]);

  const showPhoto = (direction) =>
    setPhotoIndex((index) => (index + direction + gallery.length) % gallery.length);

  const share = async () => {
    const text = `${event.title}\n${event.date}\n${
      isJoined ? event.address : event.district
    }`;
    if (navigator.share) {
      try {
        await navigator.share({ title: event.title, text });
        return;
      } catch (_) {}
    }
    if (navigator.clipboard) await navigator.clipboard.writeText(text);
  };

  const organizerInitials =
    event.organizer?.name
      ?.split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('') || 'С';

  return (
    <div className="modal-overlay detail-overlay" onClick={onClose}>
      <div className="modal-content detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className={`detail-hero ${isOwner ? 'is-owner' : ''}`}>
          {isOwner && <EventOwnerMenu event={event} onDelete={onDelete} />}
          <img
            src={gallery[photoIndex]}
            alt={`${event.title}, фото ${photoIndex + 1}`}
            className="detail-image"
          />
          <button
            onClick={onClose}
            className="hero-round-btn hero-back"
            aria-label="Назад"
          >
            <Icon name="arrowLeft" size={24} />
          </button>
          <button
            className={`hero-round-btn hero-like ${isLiked ? 'active' : ''}`}
            onClick={() => onToggleLike(event.id)}
            aria-label={isLiked ? 'Убрать из избранного' : 'В избранное'}
          >
            <Icon name="heart" size={23} filled={isLiked} />
          </button>
          {gallery.length > 1 && (
            <>
              <button
                className="gallery-arrow gallery-prev"
                onClick={() => showPhoto(-1)}
                aria-label="Предыдущее фото"
              >
                <Icon name="chevronRight" size={25} />
              </button>
              <button
                className="gallery-arrow gallery-next"
                onClick={() => showPhoto(1)}
                aria-label="Следующее фото"
              >
                <Icon name="chevronRight" size={25} />
              </button>
            </>
          )}
          <span
            className={`badge ${
              event.price === 'Бесплатно' ? 'free' : 'paid'
            } hero-price`}
          >
            {event.price}
          </span>
          <span className="hero-counter">
            {photoIndex + 1} / {gallery.length}
          </span>
        </div>

        <div className="detail-body">
          <span className="category-tag">{event.category}</span>
          <h2>{event.title}</h2>
          <p className="detail-description">{event.description}</p>

          <div className="detail-top-facts">
            <div>
              <Icon name="calendar" size={26} />
              <strong>{event.date}</strong>
              <small>Встреча</small>
            </div>
            <div>
              <Icon name="clock" size={26} />
              <strong>{event.duration || '—'}</strong>
              <small>Длительность</small>
            </div>
            <div>
              <Icon name="people" size={26} />
              <strong>{event.participants} участника</strong>
              <small>Уже идут</small>
            </div>
          </div>

          <button className="venue-card" type="button">
            <img src={gallery[0]} alt="" />
            <span>
              <strong>{event.organizer?.name || 'Организатор'}</strong>
              <small>{isOwner || isJoined ? event.address : event.district}</small>
            </span>
            <Icon name="chevronRight" size={21} />
          </button>

          <EventLocationMap event={event} />

          <section className="detail-section">
            <h3>О событии</h3>
            <p>
              Встречаемся в дружелюбной атмосфере, чтобы интересно провести время
              и познакомиться с новыми людьми.
            </p>
          </section>

          <section className="detail-section expectations">
            <h3>Что вас ждёт</h3>
            <p>Большой выбор активностей и новых впечатлений</p>
            <p>Дружелюбная компания и помощь организатора</p>
            <p>Уютная атмосфера и общение</p>
          </section>

          {/* Кликабельная карточка организатора */}
          <button
            className="organizer-card"
            type="button"
            onClick={() => onOpenOrganizer?.(event.organizer)}
          >
            <span className="organizer-mark">{organizerInitials}</span>
            <span>
              <strong>{event.organizer?.name || 'Организатор'}</strong>
              <small>Организатор события · Посмотреть профиль</small>
            </span>
            <Icon name="chevronRight" size={21} />
          </button>

          <div className="detail-actions">
            {isOwner ? (
              <div className="joined-status">
                Вы организатор этого события.
              </div>
            ) : isJoined ? (
              <>
                <div className="joined-status">Вы участвуете</div>
                <button className="primary-btn" onClick={() => onOpenChat(event)}>
                  Перейти в чат
                </button>
                <button className="leave-btn" onClick={() => onLeave(event)}>
                  Отказаться
                </button>
              </>
            ) : (
              <button className="primary-btn" onClick={() => onJoin(event)}>
                Присоединиться
              </button>
            )}
            <button className="share-btn" onClick={share}>
              <Icon name="share" size={20} /> Поделиться
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailModal;