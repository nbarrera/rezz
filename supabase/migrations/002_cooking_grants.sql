-- Grant PostgREST roles access to the cooking schema and its objects
GRANT USAGE ON SCHEMA cooking TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA cooking TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA cooking TO anon, authenticated;

-- Ensure future tables created in this schema are also accessible
ALTER DEFAULT PRIVILEGES IN SCHEMA cooking
  GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA cooking
  GRANT ALL ON SEQUENCES TO anon, authenticated;
