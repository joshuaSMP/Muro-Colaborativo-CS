"""
author: Manuel "Nachintoch" Castillo, manuel_castillo_cc@ciencias.unam.mx
Changes in tables:

* public.shared_object
    - public_id text
    + public_id CHAR(16) NOT NULL

* La migracion no require manipular los datos; si contamos con los triggers
  los datos se completarian automaticamente omitiendo public_id
"""

import psycopg2
from abstract_migrator import Migrator

class Migrator_4_1_5_to_4_2_5(Migrator):

    def __init__(self, user, pswd, host, port, originDbName, destDbName):
        super(Migrator_4_1_5_to_4_2_5, self).__init__(user, pswd, host, port,
            originDbName, destDbName)

    def _doMigration(self, verbose):
        # USER TABLE MIGRATION
        if(verbose):
            print("Migrating users")
        self._oldCursor.execute("SELECT * FROM public.user")
        total = 0
        query = "INSERT INTO public.user(id, name, email, pw, last_pw_reset, "\
            +"pw_reset_request_id, last_updated, is_deleted) "\
            +"VALUES(%s, %s, %s, %s, %s, %s, %s, %s)"
        for user in self._oldCursor.fetchall():
            values = (user[0], user[1], user[2], user[3], user[4], user[5],
                user[6], user[7])
            self._newCursor.execute(query, values)
            total += 1
        self._newConnection.commit()
        if(verbose):
            self._newCursor.execute("SELECT COUNT(*) FROM public.user")
            print("Migrated %d users from a total of %d" % (self._newCursor.fetchone()[0], total))
            print("Migrating activities")
        # ACTIVITY TABLE MIGRATION
        self._oldCursor.execute("SELECT * FROM public.activity")
        total = 0
        query = "INSERT INTO public.activity(id, pin, background_image, owner_id, "\
            +"is_deleted, edited_date, creation_date, name, is_paused, "\
            +"activation_date, is_active, max_number_users) VALUES(%s, %s, %s, %s,"\
            +"%s, %s, %s, %s, %s, %s, %s, %s)"
        for activity in self._oldCursor.fetchall():
            values = (activity[0], activity[1], activity[2], activity[3],
                activity[4], activity[5], activity[6], activity[7], activity[8],
                activity[9], activity[10], activity[11])
            self._newCursor.execute(query, values)
            total += 1
        self._newConnection.commit()
        if(verbose):
            self._newCursor.execute("SELECT COUNT(*) FROM public.activity")
            print("Migrated %d activities from a total of %d" % (self._newCursor.fetchone()[0], total))
            print("Migrating activity users")
        # ACTIVITY_USER CREATION
        self._oldCursor.execute("SELECT * FROM public.activity_user")
        total = 0
        query = "INSERT INTO public.activity_user(pin, username, cursor, "\
            +"last_login, last_logout) VALUES(%s, %s, %s, %s, %s)"
        for user in self._oldCursor.fetchall():
            values = (user[0], user[1], user[2], user[3], user[4])
            self._newCursor.execute(query, values)
            total += 1
        self._newConnection.commit()
        if(verbose):
            self._newCursor.execute("SELECT COUNT(*) FROM public.activity_user")
            print("Migrated %d users rom a total of %d" %
                (self._newCursor.fetchone()[0], total))
            print("Migrating Shared Objects")
        # SHARED_OBJECT TABLE MIGRATION
        self._oldCursor.execute("SELECT * FROM public.shared_object")
        total = 0
        query = "INSERT INTO public.shared_object(id, room, percentage_x, "\
            +"percentage_y, type, cursor, text, activity_id, creation_date, owners,"\
            +"image_path, last_edited_date, edited_times, is_deleted)"\
            +"VALUES(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) "\
            +"ON CONFLICT DO NOTHING"
        public_id_q = "SELECT "
        for obj in self._oldCursor.fetchall():
            values = (obj[0], obj[1], obj[2], obj[3], obj[4], obj[5], obj[6],
                obj[7], obj[8], obj[9], obj[11], obj[12], obj[13], obj[14])
            self._newCursor.execute(query, values)
            total += 1
        self._newConnection.commit()
        if(verbose):
            self._newCursor.execute("SELECT COUNT(*) FROM public.shared_object")
            print("Migrated %d shared objects from a total of %d" %
                (self._newCursor.fetchone()[0], total))
