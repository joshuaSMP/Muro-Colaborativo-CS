/*
 * Script to create the user and database for the Muro Colaborativo.
 * This script is meant to be as an administrator user in PostgreSQL.
 *
 * It will creathe the Muro Colaborativo's DB user and the DB itself.
 * It will change all permissions properly so no other user can mess with the DB
 */

CREATE USER adef WITH ENCRYPTED PASSWORD 'adef2018';

CREATE DATABASE muroc ENCODING = 'UTF8';

ALTER DATABASE muroc OWNER TO adef;

\connect muroc

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;
COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;
COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';

SET default_tablespace = '';

CREATE FUNCTION generateRandomWebSafeString(length INTEGER)
RETURNS VARCHAR AS $generateRandomWebSafeString$
DECLARE
  random_string VARCHAR;
BEGIN
  SELECT regexp_replace(array_to_string(ARRAY(SELECT chr((48 +round(random() *59)) :: INTEGER)
    FROM generate_series(1,length)), ''), '[^a-zA-Z0-9]', '-','g') INTO random_string;
  RETURN random_string;
END;
$generateRandomWebSafeString$ LANGUAGE plpgsql;

CREATE TABLE public."user" (
  id uuid DEFAULT public.uuid_generate_v1() PRIMARY KEY,
  name text,
  email text NOT NULL UNIQUE,
  pw character varying(100),
  last_pw_reset TIMESTAMP WITH TIME ZONE,
  pw_reset_request_id CHAR(64) UNIQUE,
  last_updated TIMESTAMP WITH TIME ZONE  DEFAULT (now() at time zone 'America/Mexico_City'),
  -- TODO keep, but in a different table/database Issue #16
  is_deleted boolean DEFAULT false NOT NULL
);

CREATE FUNCTION requestPasswordReset(user_email TEXT)
RETURNS CHAR(64) AS $$
DECLARE
  request_id CHAR(64);
  requests_with_same_id INTEGER;
BEGIN
  LOOP
    SELECT generateRandomWebSafeString(64) INTO request_id;
    SELECT COUNT(*) INTO requests_with_same_id FROM public.user
      WHERE pw_reset_request_id = request_id;
    EXIT WHEN requests_with_same_id = 0;
  END LOOP;
  UPDATE public.user SET last_pw_reset = now() at time zone 'America/Mexico_City',
    pw_reset_request_id = request_id WHERE email = user_email;
  IF NOT FOUND THEN RAISE EXCEPTION 'No user given email %', user_email;
  END IF;
  RETURN request_id;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE public."user" OWNER TO adef;

CREATE TABLE public.subject (
  id uuid DEFAULT public.uuid_generate_v1() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  creation_date TIMESTAMP WITH TIME ZONE DEFAULT (now() at time zone 'America/Mexico_City'),
  edited_date TIMESTAMP WITH TIME ZONE DEFAULT (now() at time zone 'America/Mexico_City')
);

ALTER TABLE public."subject" OWNER TO adef;

CREATE TABLE public.activity (
  id uuid DEFAULT public.uuid_generate_v1() PRIMARY KEY,
  pin INTEGER NOT NULL UNIQUE,
  background_image TEXT,
  owner_id uuid REFERENCES public."user"(id),
  is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
  edited_date timestamp with time zone DEFAULT (now() at time zone 'America/Mexico_City'),
  creation_date timestamp with time zone DEFAULT (now() at time zone 'America/Mexico_City'),
  name character varying(100),
  is_paused boolean DEFAULT false,
  activation_date timestamp with time zone DEFAULT (now() at time zone 'America/Mexico_City'),
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  -- FIXME remove user limit Issue #3
  max_number_users smallint DEFAULT 20,
  subject_id uuid REFERENCES public."subject"(id) NULL
);

CREATE FUNCTION toggleActivityActiveState(activity_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_state BOOLEAN;
BEGIN
  SELECT is_active INTO current_state FROM public.activity
    WHERE id = activity_id;
  UPDATE public.activity SET is_active = NOT current_state,
    activation_date = now() at time zone 'America/Mexico_City'
    WHERE id = activity_id RETURNING is_active INTO current_state;
  RETURN current_state;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION toggleActivityPause(activity_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_state BOOLEAN;
BEGIN
  SELECT is_paused INTO current_state FROM public.activity
    WHERE id = activity_id;
  UPDATE public.activity SET is_paused = NOT current_state,
    edited_date = now() at time zone 'America/Mexico_City'
    WHERE id = activity_id RETURNING is_paused INTO current_state;
  RETURN current_state;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE public.activity OWNER TO adef;

CREATE TABLE public.activity_user (
  id CHAR(8) NOT NULL UNIQUE,
  pin INTEGER NOT NULL REFERENCES public.activity(pin) ON DELETE CASCADE,
  username TEXT NOT NULL,
  cursor INTEGER,
  last_login TIMESTAMP WITH TIME ZONE,
  last_logout TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY(pin, username)
);

CREATE FUNCTION generateActivityUserId()
RETURNS TRIGGER AS $generateActivityUserId$
DECLARE
  newUserId CHAR(8);
  usersWithSameId INTEGER;
BEGIN
  LOOP
    SELECT generateRandomWebSafeString(8) INTO newUserId;
    SELECT COUNT(*) INTO usersWithSameId FROM public.activity_user AS act_user
      WHERE act_user.id = newUserId AND act_user.pin = NEW.pin
        AND act_user.username = NEW.username;
    EXIT WHEN usersWithSameId = 0;
  END LOOP;
  NEW.id = newUserId;
  RETURN NEW;
END;
$generateActivityUserId$ LANGUAGE plpgsql;

CREATE TRIGGER generate_activity_userId
BEFORE INSERT ON public.activity_user FOR EACH ROW
EXECUTE PROCEDURE generateActivityUserId();

ALTER TABLE public.activity_user OWNER TO adef;

CREATE TABLE public.shared_object (
  id uuid DEFAULT public.uuid_generate_v1() PRIMARY KEY,
  room integer,
  percentage_x NUMERIC NOT NULL,
  percentage_y NUMERIC NOT NULL,
  type CHARACTER VARYING(50) NOT NULL,
  cursor integer,
  text text,
  creation_date TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  owners text[],
  public_id CHAR(16) NOT NULL,
  image_path text,
  last_edited_date timestamp with time zone DEFAULT (now() at time zone 'America/Mexico_City'),
  edited_times integer DEFAULT 0,
  activity_id uuid REFERENCES public.activity(id),
  UNIQUE(room, public_id),
  UNIQUE(room, cursor, text),
  UNIQUE(room, cursor, image_path),
  -- TODO keep but in a different table/database Issue #16
  is_deleted boolean DEFAULT false NOT NULL
);

ALTER TABLE public.shared_object OWNER TO adef;

REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO adef;
GRANT ALL ON SCHEMA public TO PUBLIC;
