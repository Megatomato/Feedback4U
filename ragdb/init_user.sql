-- Create application user for external connections
CREATE USER app_user WITH PASSWORD 'super_secure_pw' SUPERUSER;
GRANT ALL PRIVILEGES ON DATABASE rag_db TO app_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO app_user;
