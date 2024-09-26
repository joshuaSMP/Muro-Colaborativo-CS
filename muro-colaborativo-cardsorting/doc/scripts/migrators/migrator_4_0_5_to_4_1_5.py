"""
author: Manuel "Nachintoch" Castillo, manuel_castillo_cc@ciencias.unam.mx
Changes in tables:
* public.user
    + last_pw_reset TIMESTAMP WITH TIME ZONE
    +  pw_reset_request_id CHAR(64) UNIQUE
    + last_updated TIMESTAMP WITH TIME ZONE DEFAULT (now() at time zone 'America/Mexico_City'

* public.activity
    - last_users_cursor json
    - available_seats smallint DEFAULT 20

* public.activity_user
    + pin INTEGER NOT NULL REFERENCES public.activity(pin) ON DELETE CASCADE
    + username TEXT NOT NULL
    + cursor INTEGER
    + last_login TIMESTAMP WITH TIME ZONE
    + last_logout TIMESTAMP WITH TIME ZONE

* La migracion de public.user no require manipular los datos. Copia directa.
* La migracion de public.activity omite los valores last_users_cursor y
available_seats, ademas por cada registro en last_users_cursor hay que crear
un regustro en public.activity_user con:
    migrar estos valores en la tabla nueva
    pin = activity.pin
    username = "Sin nombre"
    cursor <- last_users_cursor = {userId : cursor}
* La migracion de public.shared_object no require manupular los datos. Copia
directa.
"""

import psycopg2
from abstract_migrator import Migrator

class Migrator_4_0_5_to_4_1_5(Migrator):

    def __init__(self, user, pswd, host, port, originDbName, destDbName):
        super(Migrator_4_0_5_to_4_1_5, self).__init__(user, pswd, host, port,
            originDbName, destDbName)

    def _doMigration(self, verbose):
        # USER TABLE MIGRATION
        if(verbose):
            print("Migrating users")
        self._oldCursor.execute("SELECT * FROM public.user")
        total = 0
        query = "INSERT INTO public.user(id, name, email, pw, is_deleted) "\
            +"VALUES(%s, %s, %s, %s, %s)"
        for user in self._oldCursor.fetchall():
            values = (user[0], user[1], user[2], user[3], user[4])
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
        user_query = "INSERT INTO public.activity_user(pin, username, cursor) "\
            +"VALUES(%s, %s, %s)"
        activityUsers = {}
        for activity in self._oldCursor.fetchall():
            values = (activity[0], activity[1], activity[2], activity[3],
                activity[4], activity[5], activity[6], activity[7], activity[9],
                activity[10], activity[12], activity[14])
            self._newCursor.execute(query, values)
            total += 1
            # ACTIVITY_USER CREATION
            total_activity_users = 0
            if(not activity[8]): continue
            if(not activity[1] in activityUsers): activityUsers[activity[1]] = 1
            for userId, cursor in activity[8].items():
                values = (activity[1], "Sin nombre " +str(activityUsers[activity[1]]), cursor)
                self._newCursor.execute(user_query, values)
                activityUsers[activity[1]] += 1
                total_activity_users += 1
            if(verbose):
                self._newCursor.execute("SELECT COUNT(*) \
                    FROM public.activity_user WHERE pin = %s", (activity[1],))
                print("\tMigrated %d users for activity %d from a total of %d" %
                    (self._newCursor.fetchone()[0], activity[1], total_activity_users))
        self._newConnection.commit()
        if(verbose):
            self._newCursor.execute("SELECT COUNT(*) FROM public.activity")
            print("Migrated %d activities from a total of %d" % (self._newCursor.fetchone()[0], total))
            print("Migrating Shared Objects")
        # SHARED_OBJECT TABLE MIGRATION
        self._oldCursor.execute("SELECT * FROM public.shared_object")
        total = 0
        query = "INSERT INTO public.shared_object(id, room, percentage_x, "\
            +"percentage_y, type, cursor, text, activity_id, creation_date, owners,"\
            +"public_id, image_path, last_edited_date, edited_times, is_deleted)"\
            +"VALUES(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"
        for obj in self._oldCursor.fetchall():
            values = (obj[0], obj[1], obj[2], obj[3], obj[4], obj[5], obj[6],
                obj[7], obj[8], obj[9], obj[10], obj[11], obj[12], obj[13], obj[14])
            self._newCursor.execute(query, values)
            total += 1
        self._newConnection.commit()
        if(verbose):
            self._newCursor.execute("SELECT COUNT(*) FROM public.shared_object")
            print("Migrated %d shared objects from a total of %d" %
                (self._newCursor.fetchone()[0], total))
