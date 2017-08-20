CREATE TABLE IF NOT EXISTS channel_settings (
    id SERIAL PRIMARY KEY,
    channel VARCHAR,
    broadcaster bigint,
    points_command VARCHAR,
    points_name VARCHAR,
    points_activated BOOLEAN,
    points_offline_interval bigint,
    points_online_interval bigint,
    points_per_iteration bigint,
    joined BOOLEAN
);
