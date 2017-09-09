CREATE TABLE IF NOT EXISTS discord_announcers (
    id SERIAL PRIMARY KEY,
    discord_guild_id BIGINT,
    discord_channel_id BIGINT,
    twitch_channel_name VARCHAR,
    announce_sent BOOLEAN,
    last_announce TIMESTAMP WITHOUT TIME ZONE
);
