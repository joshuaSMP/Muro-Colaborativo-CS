"""
author: Manuel "Nachintoch" Castillo, manuel_castillo_cc@ciencias.unam.mx
Changes in tables:

* public.activity
    + subject_id uuid REFERENCES public."subject"(id) NULL

* Adds table public.subject to DB
"""
import psycopg2
from abstract_migrator import Migrator

class Migrator_4_3_5_to_5_0(Migrator):

    def __init__(self, user, pswd, host, port, originDbName, destDbName):
        super(Migrator_4_3_5_to_5_0, self).__init__(user, pswd, host, port,
            originDbName, destDbName)

    def _doMigration(self, verbose):
        # CREATION OF TABLE subject
        if (verbose):
            print("Creating TABLE 'subject'")
        self._newCursor.execute('CREATE TABLE public.subject ('
            + 'id uuid DEFAULT public.uuid_generate_v1() PRIMARY KEY,'
            + 'name TEXT UNIQUE NOT NULL, creation_date TIMESTAMP WITH TIME '
            + "ZONE DEFAULT (now() at time zone 'America/Mexico_City'), "
            + 'edited_date TIMESTAMP WITH TIME ZONE DEFAULT (now() at time zone'
            + "'America/Mexico_City'))")
        self._newCursor.execute('CREATE FUNCTION update_subject_times() '
            + 'RETURNS TRIGGER AS $update_subject_times$ BEGIN '
            + "NEW.edited_date = now() at TIME ZONE 'America/Mexico_City'; "
            + 'RETURN NEW; END; $update_subject_times$ LANGUAGE plpgsql;')
        self._newCursor.execute('CREATE TRIGGER subject_time_updater '
            + 'BEFORE UPDATE ON public.subject FOR EACH ROW EXECUTE PROCEDURE '
            + 'update_subject_times();')
        # ACTIVITY TABLE MIGRATION
        if (verbose):
            print("Migrating activities")
        self._newCursor.execute('ALTER TABLE public.activity ADD COLUMN '
            + 'subject_id UUID REFERENCES public."subject"(id) NULL')
        self._newConnection.commit()
