SELECT discord_guild_id, discord_channel_id
FROM discord_announcers
WHERE twitch_channel_name = $1