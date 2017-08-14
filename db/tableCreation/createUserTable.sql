CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    twitch_id bigint,
    display_name character varying,
    points bigint,
    channel character varying,
    first_seen timestamp without time zone,
    last_seen timestamp without time zone
);
