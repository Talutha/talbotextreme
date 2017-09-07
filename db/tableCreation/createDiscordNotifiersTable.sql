CREATE TABLE IF NOT EXISTS discord_notifiers (
    id SERIAL PRIMARY KEY,
    discord_guild_id BIGINT,
    discord_channel_id BIGINT,
    twitch_channel_name VARCHAR,
    twitch_channel_id INT,
    last_online TIMESTAMP WITHOUT TIME ZONE,
    notify_enabled BOOLEAN
);
