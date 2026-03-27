-- Ensure each event has at most one scheduled Lucky Draw config.
-- If older duplicate scheduled configs exist, keep the most recently updated one.

WITH ranked_configs AS (
  SELECT
    id,
    event_id,
    ROW_NUMBER() OVER (
      PARTITION BY event_id
      ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
    ) AS row_num
  FROM lucky_draw_configs
  WHERE status = 'scheduled'
)
UPDATE lucky_draw_configs AS config
SET
  status = 'cancelled',
  completed_at = COALESCE(config.completed_at, NOW()),
  updated_at = NOW()
FROM ranked_configs AS ranked
WHERE config.id = ranked.id
  AND ranked.row_num > 1;

CREATE UNIQUE INDEX IF NOT EXISTS draw_config_scheduled_per_event_unique
  ON lucky_draw_configs (event_id)
  WHERE status = 'scheduled';
