/**
 * EventTimeline Component
 * Displays a timeline of events for a player
 * 
 * @param {Array} events - Array of event objects
 * @param {Function} onDeleteEvent - Callback to delete an event
 * @param {boolean} loading - Loading state
 */

import React, { useState } from 'react';
import { EVENT_TYPES } from '../../utils/constants';
import './EventTimeline.css';

const EventTimeline = ({ events, onDeleteEvent, loading }) => {
  const [deletingEventId, setDeletingEventId] = useState(null);

  const handleDeleteClick = (eventId) => {
    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      setDeletingEventId(eventId);
      onDeleteEvent(eventId);
    }
  };

  const getEventTypeInfo = (eventTypeId) => {
    return Object.values(EVENT_TYPES).find(et => et.id === eventTypeId) || {
      icon: '📌',
      label: eventTypeId,
      description: ''
    };
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    } catch (e) {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="event-timeline-loading">
        <p>⏳ Loading events...</p>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="event-timeline-empty">
        <p>No events recorded yet</p>
      </div>
    );
  }

  return (
    <div className="event-timeline">
      <h3 className="timeline-header">📜 Event History</h3>
      <div className="timeline-items">
        {events.map((event) => {
          const eventTypeInfo = getEventTypeInfo(event.event_type);
          return (
            <div
              key={event.event_id}
              className={`timeline-item ${deletingEventId === event.event_id ? 'deleting' : ''}`}
            >
              <div className="timeline-icon">
                {eventTypeInfo.icon}
              </div>
              <div className="timeline-content">
                <div className="timeline-title">
                  {eventTypeInfo.label}
                  <span className="timeline-episode">Episode {event.episode_number}</span>
                </div>
                {event.notes && (
                  <p className="timeline-notes">{event.notes}</p>
                )}
                <div className="timeline-meta">
                  <span className="timeline-timestamp">{formatTimestamp(event.timestamp)}</span>
                </div>
              </div>
              <button
                className="timeline-delete"
                onClick={() => handleDeleteClick(event.event_id)}
                aria-label="Delete event"
                title="Delete this event"
                disabled={deletingEventId === event.event_id}
              >
                {deletingEventId === event.event_id ? '⏳' : '🗑️'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EventTimeline;
