CREATE TABLE roles (
  role_id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY
  , role TEXT
);

CREATE TABLE users (
  user_id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY
  , email TEXT UNIQUE
  , phone TEXT UNIQUE
  , role_id INTEGER REFERENCES roles (role_id)
  , creation_time TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE temperature (
  temperature_id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY
  , hostname TEXT
  , thermometer_id TEXT -- NORMALIZE
  , pi_id TEXT -- NORMALIZE
  , capture_time TIMESTAMP WITH TIME ZONE
  , temperature DOUBLE PRECISION NOT NULL
  , server_time TIMESTAMP WITH TIME ZONE DEFAULT now()
  , owner_id INTEGER REFERENCES users (user_id)
  , uuid UUID UNIQUE -- UNIQUE allows multiply NULL values
);

CREATE INDEX capture_time_idx ON temperature (capture_time);
CREATE INDEX temperature_id_idx ON temperature (temperature_id);

INSERT INTO roles (role) VALUES
  ('admin'),
  ('user');


CREATE TABLE access_keys (
  key_id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY
  , owner_id INTEGER REFERENCES users (user_id)
  , key TEXT UNIQUE
);
