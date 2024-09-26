/*
 * Limit time to change a password is 1 hour from request issuing.
 */
CREATE FUNCTION validate_password_change()
RETURNS TRIGGER AS $validate_password_change$
DECLARE
  elapsed_time DOUBLE PRECISION;
BEGIN
  SELECT(EXTRACT(
    EPOCH FROM (now() at time zone 'America/Mexico_City') - OLD.last_pw_reset) /3600)
    INTO elapsed_time;
  IF NEW.pw <> OLD.pw AND elapsed_time > 1 THEN
    RAISE EXCEPTION 'Its too late now to change the user % password', OLD.email;
  END IF;
  NEW.last_updated =  now() at time zone 'America/Mexico_City';
  RETURN NEW;
END;
$validate_password_change$ LANGUAGE plpgsql;

CREATE TRIGGER user_update_validator
BEFORE UPDATE ON public.user FOR EACH ROW
EXECUTE PROCEDURE validate_password_change();

CREATE FUNCTION update_activity_times()
RETURNS TRIGGER AS $update_activity_times$
BEGIN
  NEW.edited_date = now() at time zone 'America/Mexico_City';
  RETURN NEW;
END;
$update_activity_times$ LANGUAGE plpgsql;

CREATE TRIGGER activity_time_updater
BEFORE UPDATE ON public.activity FOR EACH ROW
EXECUTE PROCEDURE update_activity_times();

CREATE FUNCTION update_subject_times()
RETURNS TRIGGER AS $update_subject_times$
BEGIN
    NEW.edited_date = now() at TIME ZONE 'America/Mexico_City';
    RETURN NEW;
END;
$update_subject_times$ LANGUAGE plpgsql;

CREATE TRIGGER subject_time_updater
BEFORE UPDATE ON public.subject FOR EACH ROW
EXECUTE PROCEDURE update_subject_times();

CREATE FUNCTION assign_seat()
RETURNS TRIGGER AS $assign_seat$
  DECLARE
    occuped_seats INTEGER;
  BEGIN
    IF TG_OP = 'UPDATE' THEN
      IF NEW.last_login IS NULL THEN
        NEW.last_login = OLD.last_login;
      END IF;
      IF NEW.last_logout IS NULL THEN
        NEW.last_logout = OLD.last_logout;
      END IF;
    END IF;
    IF NEW.cursor IS NOT NULL THEN
      RETURN NEW;
    END IF;
    SELECT COUNT(*) INTO occuped_seats FROM public.activity_user
      WHERE pin = NEW.pin;
    SELECT MOD(occuped_seats, 20) INTO occuped_seats;
    NEW.cursor = occuped_seats +1;
    RETURN NEW;
  END;
$assign_seat$ LANGUAGE plpgsql;

CREATE TRIGGER seat_assigner
BEFORE INSERT OR UPDATE ON public.activity_user FOR EACH ROW
EXECUTE PROCEDURE assign_seat();

CREATE FUNCTION update_shared_object_times()
RETURNS TRIGGER AS $update_shared_object_times$
BEGIN
  NEW.last_edited_date = now() at time zone 'America/Mexico_City';
  NEW.edited_times = NEW.edited_times +1;
  RETURN NEW;
END;
$update_shared_object_times$ LANGUAGE plpgsql;

CREATE TRIGGER shared_object_edited_time_updater
BEFORE UPDATE ON public.shared_object FOR EACH ROW
EXECUTE PROCEDURE update_shared_object_times();

CREATE FUNCTION issue_shared_object_public_id()
RETURNS TRIGGER AS $issue_shared_object_public_id$
DECLARE
  new_public_id CHAR(16);
  objects_with_same_id INTEGER;
BEGIN
  LOOP
    SELECT generateRandomWebSafeString(16) INTO new_public_id;
    SELECT COUNT(*) INTO objects_with_same_id
      FROM public.shared_object AS object WHERE object.room = NEW.room
        AND object.public_id = new_public_id;
    EXIT WHEN objects_with_same_id = 0;
  END LOOP;
  NEW.public_id = new_public_id;
  RETURN NEW;
END;
$issue_shared_object_public_id$ LANGUAGE plpgsql;

CREATE TRIGGER generate_shared_object_public_id
BEFORE INSERT ON public.shared_object FOR EACH ROW
EXECUTE PROCEDURE issue_shared_object_public_id();

-- Trigger para insertar una nueva contribución con valores predeterminados
CREATE OR REPLACE FUNCTION insertar_contribucion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_creacion := CURRENT_TIMESTAMP;
    NEW.ultima_fecha_edicion := CURRENT_TIMESTAMP;
    NEW.tiempo_editando := CURRENT_TIMESTAMP;
    NEW.esta_eliminada := FALSE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_insertar_contribucion
AFTER INSERT ON public.contribucion_compartida
FOR EACH ROW
EXECUTE FUNCTION insertar_contribucion();