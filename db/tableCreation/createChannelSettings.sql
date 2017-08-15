CREATE TABLE IF NOT EXISTS channel_settings (
    id SERIAL PRIMARY KEY,
    channel VARCHAR,
    broadcaster VARCHAR,
    broadcaster_id bigint,
    points_command VARCHAR,
    points_name VARCHAR,
    points_activated BOOLEAN,
    joined BOOLEAN
);
