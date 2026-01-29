-- Migration: 0012_performance_indexes
-- Adds indexes for common read patterns

CREATE INDEX IF NOT EXISTS photos_event_status_created_idx
  ON photos (event_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS photos_event_created_idx
  ON photos (event_id, created_at DESC);

CREATE INDEX IF NOT EXISTS events_organizer_created_idx
  ON events (organizer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS winners_event_drawn_idx
  ON winners (event_id, drawn_at DESC);
