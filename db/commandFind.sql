SELECT *
FROM commands
WHERE command_name = $1
AND channel = $2;
