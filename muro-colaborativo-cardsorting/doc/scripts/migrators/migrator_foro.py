"""
author: Angel Jared Solano Sandoval, jaredsolanosandoval@gmail.com
        Joaly Guadalupe Morales Amaya, joalymorales06@gmail.com
Changes in tables:
        * Adds table public.foro to DB
        * Adds table public.contribuciones to DB
        * Adds table public.reacciones to DB
        * Adds table public.contribucion_compartida        
"""
import psycopg2
from abstract_migrator import Migrator

class Migrator_foro(Migrator):

    def __init__(self, user, pswd, host, port, originDbName, destDbName):
        super(Migrator_foro, self).__init__(user, pswd, host, port,
            originDbName, destDbName)

    def _doMigration(self, verbose):
        # CREATION OF TABLE FORO
        if verbose:
            print("Creating TABLE 'foro'")

        self._newCursor.execute('CREATE TABLE public.foro ('
            + 'id_foro uuid DEFAULT public.uuid_generate_v1() PRIMARY KEY,'
            + 'id_profesor uuid NOT NULL,'
            + 'pin INTEGER NOT NULL UNIQUE,'
            + 'tema_foro character varying(100),'
            + 'fecha_editada TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,'
            + 'fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,'
            + 'esta_activa BOOLEAN DEFAULT TRUE NOT NULL,'
            + 'num_usuarios smallint DEFAULT 20,'
            + 'CONSTRAINT fk_profesor FOREIGN KEY (id_profesor) REFERENCES public."user"(id) ON DELETE CASCADE'
            + ')')

        # CREATION OF TABLE CONTRIBUCIONES
        if verbose:
            print("Creating TABLE 'contribucion_compartida'")

        self._newCursor.execute('CREATE TABLE public.contribucion_compartida ('
            + 'id_contribucion uuid DEFAULT public.uuid_generate_v1() PRIMARY KEY,'
            + 'id_foro uuid NOT NULL,'
            + 'id_alumno character(36),'
            + 'id_profesor uuid NOT NULL,'
            + 'id_contribucioncompartida uuid NULL,'
            + 'rama INTEGER,' #1:Primaria, #2:Secundaria, ...,
            + 'tipo INTEGER,' #1:Texto, 2:Imagen, 3:Enlace
            + 'contenido text,'  
            + 'propietario INTEGER,' #1 si alumno, 2 si es profe
            + 'fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,'
            + 'ultima_fecha_edicion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,'
            + 'tiempo_editando TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,'
            + 'esta_activa BOOLEAN DEFAULT TRUE NOT NULL,'
            + 'CONSTRAINT fk_contribucion FOREIGN KEY (id_contribucioncompartida) REFERENCES public.contribucion_compartida (id_contribucion) ON DELETE CASCADE,' #NULL: Principal y si ID de otra es respuesta 
            + 'CONSTRAINT fk_foro FOREIGN KEY (id_foro) REFERENCES public.foro (id_foro) ON DELETE CASCADE,'
            + 'CONSTRAINT fk_alumno FOREIGN KEY (id_alumno) REFERENCES public.activity_user(id) ON DELETE CASCADE,'
            + 'CONSTRAINT fk_profesor FOREIGN KEY (id_profesor) REFERENCES public."user"(id) ON DELETE CASCADE'
            + ')')

        # CREATION OF TABLE REACCIONES
        if verbose:
            print("Creating TABLE 'reacciones'")

        self._newCursor.execute('CREATE TABLE IF NOT EXISTS public.reacciones ('
            + 'id_reaccion uuid DEFAULT public.uuid_generate_v1() PRIMARY KEY,'
            + 'id_contribucion uuid NOT NULL,'           
            + 'emoji text NOT NULL,'  
            + 'id_alumno character(36),'
            + 'id_profesor uuid NOT NULL,'     
            + 'propietario INTEGER,' #1 si alumno, 2 si es profe    
            + 'CONSTRAINT fk_contribucion FOREIGN KEY (id_contribucion) REFERENCES public.contribucion_compartida(id_contribucion) ON DELETE CASCADE,'    
            + 'CONSTRAINT fk_alumno FOREIGN KEY (id_alumno) REFERENCES public.activity_user(id) ON DELETE CASCADE,'
            + 'CONSTRAINT fk_profesor FOREIGN KEY (id_profesor) REFERENCES public."user"(id) ON DELETE CASCADE'       
            + ')')

        if verbose:
            print("Creating FUNCION 'insertar_foro'")

        self._newCursor.execute("""
            CREATE OR REPLACE FUNCTION insertar_foro()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.fecha_creacion := CURRENT_TIMESTAMP;
                NEW.fecha_editada := CURRENT_TIMESTAMP;
                NEW.esta_activa := TRUE;
                NEW.num_usuarios := 20;
                RETURN NEW; 
            END;
            $$ LANGUAGE plpgsql;
        """)

        if verbose:
            print("Creating TRIGGER 'trigger_insertar_foro'")

        self._newCursor.execute("""
            CREATE TRIGGER trigger_insertar_foro
            AFTER INSERT ON public.foro
            FOR EACH ROW
            EXECUTE FUNCTION insertar_foro();
        """)

        if verbose:
            print("Creating FUNCION 'actualizar_foro'")

        self._newCursor.execute("""
            CREATE OR REPLACE FUNCTION actualizar_foro()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.fecha_editada := CURRENT_TIMESTAMP;
                RETURN NEW; 
            END;
            $$ LANGUAGE plpgsql;
        """)

        if verbose:
            print("Creating TRIGGER 'trigger_actualizar_foro'")

        self._newCursor.execute("""
            CREATE TRIGGER trigger_actualizar_foro
            BEFORE UPDATE ON public.foro
            FOR EACH ROW
            EXECUTE FUNCTION actualizar_foro();
        """)

        
        if verbose:
            print("Creating FUNCION 'insertar_contribuciones'")

        self._newCursor.execute("""
            CREATE OR REPLACE FUNCTION insertar_contribuciones()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.fecha_creacion := CURRENT_TIMESTAMP;
                NEW.ultima_fecha_edicion := CURRENT_TIMESTAMP;
                NEW.tiempo_editando := CURRENT_TIMESTAMP;
                RETURN NEW; 
            END;
            $$ LANGUAGE plpgsql;
        """)

        if verbose:
            print("Creating TRIGGER 'trigger_insertar_contribuciones'")

        self._newCursor.execute("""
            CREATE TRIGGER trigger_insertar_contribuciones
            AFTER INSERT ON public.contribucion_compartida
            FOR EACH ROW
            EXECUTE FUNCTION insertar_contribuciones();
        """)

        if verbose:
            print("Creating permisos para insertar_contribuciones'")

        self._newCursor.execute("""
            GRANT INSERT, SELECT, UPDATE, DELETE ON TABLE public.contribucion_compartida TO adef;
        """)

        if verbose:
            print("Creating permisos para insertar_reacciones'")

        self._newCursor.execute("""
            GRANT INSERT, SELECT, UPDATE, DELETE ON TABLE public.reacciones TO adef;
        """)
        
        if verbose:
            print("Creating FUNCION 'actualizar_contribucion'")

        self._newCursor.execute("""
            CREATE OR REPLACE FUNCTION actualizar_contribucion()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.ultima_fecha_edicion  := CURRENT_TIMESTAMP;
                RETURN NEW; 
            END;
            $$ LANGUAGE plpgsql;
        """)

        if verbose:
            print("Creating TRIGGER 'trigger_actualizar_contribucion'")

        self._newCursor.execute("""
            CREATE TRIGGER trigger_actualizar_contribucion
            BEFORE UPDATE ON public.contribucion_compartida
            FOR EACH ROW
            EXECUTE FUNCTION actualizar_contribucion();
        """)

        if verbose:
            print("Modificando la restricción de clave externa 'activity_user_pin_fkey'")

        self._newCursor.execute("""
            ALTER TABLE public.activity_user
            DROP CONSTRAINT IF EXISTS activity_user_pin_fkey;

            ALTER TABLE public.activity_user
            ADD CONSTRAINT activity_user_pin_fkey
            FOREIGN KEY (pin)
            REFERENCES public.foro (pin)
            ON UPDATE NO ACTION
            ON DELETE CASCADE;
        """)

        self._newConnection.commit()
