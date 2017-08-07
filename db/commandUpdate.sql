UPDATE commands
SET last_used = $1,
    last_used_by = $2,
    times_used = $3
WHERE id = $4;
