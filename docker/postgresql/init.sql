-- ============================================
-- Gatherly - PostgreSQL Initialization
-- ============================================
-- This script runs automatically when the PostgreSQL container is first created.
-- It sets up essential extensions and configuration.

-- Set database timezone to UTC for consistency
ALTER DATABASE momentique SET timezone TO 'UTC';

-- ============================================
-- EXTENSIONS
-- ============================================

-- UUID generation functions (used by drizzle schema for default IDs)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Full-text search and trigram matching (for search functionality)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Query performance monitoring (optional, for development)
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ============================================
-- CONFIGURATION
-- ============================================

-- Increase shared memory for better performance (optional)
-- ALTER SYSTEM SET shared_buffers = '256MB';
-- ALTER SYSTEM SET effective_cache_size = '1GB';
-- ALTER SYSTEM SET maintenance_work_mem = '64MB';
-- ALTER SYSTEM SET checkpoint_completion_target = 0.9;

-- Log slow queries for development (disable in production)
-- ALTER SYSTEM SET log_min_duration_statement = 1000;  -- Log queries taking > 1s

-- ============================================
-- NOTES
-- ============================================
-- Tables and RLS policies are created by Drizzle migrations.
-- This file is for database-level configuration only.
--
-- To connect to the database after startup:
--   docker exec -it momentique-postgres psql -U momentique -d momentique
--
-- To view all tables:
--   \dt
--
-- To check RLS policies:
--   \d+ users
