CREATE TABLE temperature (
  temperature_id serial
  , hostname text
  , thermometer_id text -- NORMALIZE
  , pi_id text -- NORMALIZE
  , capture_time timestamp with time zone
  , temperature double precision NOT NULL
  , server_time timestamp with time zone DEFAULT now()
  , owner_id integer -- ADD: contraint to users.user_id
  , uuid uuid UNIQUE -- UNIQUE allows multiply NULL values
);

CREATE INDEX capture_time_idx ON temperature (capture_time);
CREATE INDEX temperature_id_idx ON temperature (temperature_id);

CREATE TABLE roles (
  role_id SERIAL
  , role TEXT
);

INSERT INTO roles (role) VALUES
  ('admin'),
  ('user');

CREATE TABLE users (
  user_id SERIAL
  , email TEXT UNIQUE
  , phone TEXT UNIQUE
  , role_id INTEGER
  , creation_time TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE access_keys (
  key_id SERIAL
  , owner_id INTEGER
  , key TEXT UNIQUE
);
