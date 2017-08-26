CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    twitch_id bigint,
    display_name VARCHAR,
    lname VARCHAR,
    points bigint,
    channel VARCHAR,
    first_seen timestamp without time zone,
    last_seen timestamp without time zone,
    updated timestamp without time zone
);
