import psycopg2
import traceback
import sys

class Migrator(object):

    def __init__(self, user, pswd, host, port, originDbName, destDbName):
        self._oldConnection = psycopg2.connect(user = user, password = pswd,
            host = host, port = port, database = originDbName)
        self._newConnection = psycopg2.connect(user = user, password = pswd,
            host = host, port = port, database = destDbName)
        self._oldCursor = self._oldConnection.cursor()
        self._newCursor = self._newConnection.cursor()

    def migrate(self, verbose = True):
        try:
            self._doMigration(verbose)
        except(Exception, psycopg2.DatabaseError) as error:
            print(error)
            traceback.print_exception(*sys.exc_info())
        finally:
            if(self._oldConnection):
                self._oldCursor.close()
                self._oldConnection.close()
            if(self._newConnection):
                self._newCursor.close()
                self._newConnection.close()

    def _doMigration(self, verbose):
        pass
