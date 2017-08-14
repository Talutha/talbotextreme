CREATE TABLE IF NOT EXISTS commands (
    id SERIAL PRIMARY KEY,
    command_name character varying NOT NULL,
    command_output character varying NOT NULL,
    channel character varying NOT NULL,
    creator integer NOT NULL,
    created_on timestamp without time zone NOT NULL,
    times_used integer,
    last_used timestamp without time zone,
    last_used_by integer
);
