CREATE TABLE roles (
  role_id SERIAL UNIQUE
  , role TEXT
);

CREATE TABLE users (
  user_id SERIAL UNIQUE
  , email TEXT UNIQUE
  , phone TEXT UNIQUE
  , role_id INTEGER REFERENCES roles (role_id)
  , creation_time TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE temperature (
  temperature_id serial
  , hostname text
  , thermometer_id text -- NORMALIZE
  , pi_id text -- NORMALIZE
  , capture_time timestamp with time zone
  , temperature double precision NOT NULL
  , server_time timestamp with time zone DEFAULT now()
  , owner_id integer REFERENCES users (user_id)
  , uuid uuid UNIQUE -- UNIQUE allows multiply NULL values
);

CREATE INDEX capture_time_idx ON temperature (capture_time);
CREATE INDEX temperature_id_idx ON temperature (temperature_id);

INSERT INTO roles (role) VALUES
  ('admin'),
  ('user');


CREATE TABLE access_keys (
  key_id SERIAL
  , owner_id INTEGER REFERENCES users (user_id)
  , key TEXT UNIQUE
);
