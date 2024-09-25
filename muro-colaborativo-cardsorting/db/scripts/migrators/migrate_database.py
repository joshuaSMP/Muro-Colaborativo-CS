import sys
import getpass
from migrator_4_0_5_to_4_1_5 import Migrator_4_0_5_to_4_1_5
from migrator_4_1_5_to_4_2_5 import Migrator_4_1_5_to_4_2_5
from migrator_4_2_5_to_4_3_5 import Migrator_4_2_5_to_4_3_5
from migrator_4_3_5_to_5_0 import Migrator_4_3_5_to_5_0
from migrator_foro import Migrator_foro

def main():
    fromVersion, verbose = validateArgs()
    user = input("Enter DB username\n")
    pswd = getpass.getpass("Enter DB user's password\n")
    host = input("Enter DB host\n")
    port = input("Enter port\n")
    fromDbName = input("Enter DB name for original version %s\n" % (fromVersion))
    toDbName = input("Enter DB name for destination [muroc Por defecto]\n") or "muroc"
    if fromVersion == "2.9.9":
        raise Exception("Unsupported upgrade for version 2.9.9 into 4.0.5")
    elif fromVersion == "4.0.5":
        migrator = Migrator_4_0_5_to_4_1_5(user, pswd, host, port, fromDbName,
            toDbName)
    elif fromVersion == "4.1.5":
        migrator = Migrator_4_1_5_to_4_2_5(user, pswd, host, port, fromDbName,
            toDbName)
    elif fromVersion == "4.2.5":
        migrator = Migrator_4_2_5_to_4_3_5(user, pswd, host, port, fromDbName,
            toDbName)
    elif fromVersion == "4.3.5" or fromVersion == "4.4":
        migrator = Migrator_4_3_5_to_5_0(user, pswd, host, port, fromDbName,
            toDbName)
    elif fromVersion == "4.4.5" or fromVersion == "4.5":
        migrator = Migrator_foro(user, pswd, host, port, fromDbName,
            toDbName)
    else:
        showUsageAndDie()
    migrator.migrate(verbose)

def validateArgs():
    if len(sys.argv) < 2:
        showUsageAndDie()
    return (sys.argv[1], sys.argv[2]) if len(sys.argv) > 2 else (sys.argv[1], True)

def showUsageAndDie():
    raise Exception("Usage:\n\
        python migrate_database <fromVersion> [toVersion] [verbose]\n\
        Unpgrades a database for a given version of the Muro Colaborativo\
        into the next version of the database\n\n\
        Current valid versions:\n\
        - 2.9.9 (Unsuported)\n\
        - 4.0.5\n\
        - 4.1.5\n\
        - 4.2.5\n\
        - 4.3.5 or 4.4\n\
        - 4.4.5 or 4.5\n\
        Any pair of versions has to be contiguos\n\n\
        verbose - true|false - default: true")

if __name__ == "__main__":
    main()
