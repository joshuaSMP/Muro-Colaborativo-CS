const pool = require('../config/database');
const pinUtil = require('../util/pin');

async function insertForum(idProfesor, temaForo) {
  const client = await pool.connect();
  try {
    const pin = pinUtil.createPin();
    const queryText =
      'INSERT INTO public.foro (id_profesor, pin, tema_foro) ' +
      'VALUES ($1, $2, $3) RETURNING *;';
    const params = [idProfesor, pin, temaForo];
    const result = await client.query(queryText, params);
    return result.rows[0];
  } finally {
    client.release();
  }
}

async function getAllForums(professorId) {
  const client = await pool.connect();
  try {
    const queryText = 'SELECT * FROM public.foro WHERE id_profesor = $1';
    const params = [professorId];
    const result = await client.query(queryText, params);
    return result.rows;
  } finally {
    client.release();
  }
}

async function getForumByPin(pin) {
  const client = await pool.connect();
  try {
    const queryText = `
      SELECT 
        f.*,
        u.name AS nombre_profesor
      FROM 
        public.foro AS f
      INNER JOIN 
        public.user AS u ON f.id_profesor = u.id
      WHERE 
        f.pin = $1
    `;
    const params = [pin];
    const result = await client.query(queryText, params);
    return result.rows;
  } finally {
    client.release();
  }
}

async function getForumById(pin) {
  const client = await pool.connect();
  try {
    const queryText = `
      SELECT foro.id_foro, foro.pin, foro.tema_foro, u.name AS nombre_profesor, foro.esta_activa
      FROM public.foro AS foro
      INNER JOIN public.user AS u ON foro.id_profesor = u.id
      WHERE foro.pin = $1
    `;
    const params = [pin];
    const result = await client.query(queryText, params);
    return result.rows[0];
  } finally {
    client.release();
  }
}

async function updateForum(forumId, temaForo) {
  const client = await pool.connect();
  try {
    const queryText =
      'UPDATE public.foro SET tema_foro = $1 WHERE id_foro = $2 RETURNING *;';
    const values = [temaForo, forumId];
    const result = await client.query(queryText, values);
    return result.rows[0];
  } finally {
    client.release();
  }
}

async function updateForumStatus(forumId, estaActiva) {
  const client = await pool.connect();
  try {
    const queryText = 'UPDATE public.foro SET esta_activa = $1 WHERE id_foro = $2 RETURNING *;';
    const values = [estaActiva, forumId];
    const result = await client.query(queryText, values);
    return result.rows[0];
  } finally {
    client.release();
  }
}

async function deleteForum(forumId) {
  const client = await pool.connect();
  try {
    const queryText = 'DELETE FROM public.foro WHERE id_foro = $1 RETURNING *;';
    const params = [forumId];
    const result = await client.query(queryText, params);
    return result.rows[0];
  } finally {
    client.release();
  }
}

async function insertSharedContribution(idForo, idAlumno, idProfesor, idcontribucioncompartida, rama, tipo, contenido, propietario) {
  const client = await pool.connect();
  try {
    const queryText =
      `INSERT INTO public.contribucion_compartida 
      (id_foro, id_alumno, id_profesor, id_contribucioncompartida, rama, tipo, contenido, propietario) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *`;
    const params = [idForo, idAlumno, idProfesor, idcontribucioncompartida, rama, tipo, contenido, propietario];
    const result = await client.query(queryText, params);
    return result.rows[0];
  } finally {
    client.release();
  }
}

async function getAllContributions(forumId) {
  const client = await pool.connect();
  try {
    const queryText = `
    SELECT 
    c.id_contribucion, 
    COALESCE(au.username, 'VACIO') AS nombre_alumno,
    u.name AS nombre_profesor,
    c.tipo, 
    c.propietario, 
    c.fecha_creacion AS fecha,
    c.contenido,
    c.rama,
    c.id_foro AS idForo,    
    COALESCE(c.id_alumno, 'VACIO') AS idAlumno, 
    c.id_profesor AS idProfesor
FROM 
    public.contribucion_compartida AS c
LEFT JOIN 
    public.activity_user AS au ON c.id_alumno = au.id
LEFT JOIN 
    public.user AS u ON c.id_profesor = u.id 
JOIN
    public.foro AS f ON c.id_foro = f.id_foro
WHERE 
    f.pin = $1
ORDER BY
    c.fecha_creacion ASC;
      `;
    const params = [forumId];
    const result = await client.query(queryText, params);
    return result.rows;
  } finally {
    client.release();
  }
}


async function getContribucionesCompartidas(idContribucionCompartida, rama) {
  try {
      const queryText = `
          SELECT 
              c.id_contribucion, 
              COALESCE(au.username, 'VACIO') AS nombre_alumno,
              u.name AS nombre_profesor,
              c.tipo, 
              c.propietario, 
              c.fecha_creacion AS fecha,
              c.contenido,
              c.rama,
              c.id_foro AS idForo,    
              COALESCE(c.id_alumno, 'VACIO') AS idAlumno, 
              c.id_profesor AS idProfesor
          FROM 
              public.contribucion_compartida AS c
          LEFT JOIN  
              public.activity_user AS au ON c.id_alumno = au.id
          LEFT JOIN  
              public.user AS u ON c.id_profesor = u.id 
          JOIN
              public.foro AS f ON c.id_foro = f.id_foro
          WHERE 
              c.id_contribucioncompartida = $1
              AND c.rama = $2
          ORDER BY
              c.fecha_creacion DESC;
      `;
      const params = [idContribucionCompartida, rama];
      const result = await pool.query(queryText, params);
      return result.rows;
  } catch (error) {
      throw new Error(`Error al obtener las contribuciones compartidas: ${error.message}`);
  }
}

async function getContribucionesPorId(idContribucion, rama){
  try {
    const queryText = `
SELECT 
    c.id_contribucion, 
    COALESCE(au1.username, 'VACIO') AS nombre_alumno,
    COALESCE(au2.username, 'VACIO') AS nombre_alumno_contribucion_compartida,
    u.name AS nombre_profesor,
    c.tipo, 
    c.propietario, 
    c.fecha_creacion AS fecha,
    c.contenido,
    c.rama,
    c.id_foro AS idForo,    
    COALESCE(c.id_alumno, 'VACIO') AS idAlumno, 
    c.id_profesor AS idProfesor,
    COALESCE(c.id_contribucioncompartida::text, 'VACIO') AS id_contribucion_compartida
FROM 
    public.contribucion_compartida AS c
LEFT JOIN  
    public.activity_user AS au1 ON c.id_alumno = au1.id
LEFT JOIN  
    public.activity_user AS au2 ON (SELECT cc.id_alumno FROM public.contribucion_compartida AS cc WHERE cc.id_contribucion = c.id_contribucioncompartida) = au2.id
LEFT JOIN  
    public.user AS u ON c.id_profesor = u.id 
JOIN
    public.foro AS f ON c.id_foro = f.id_foro
WHERE 
    c.id_contribucion =$1
    AND c.rama = $2
ORDER BY
    c.fecha_creacion ASC;

    `;
    const params = [idContribucion, rama];
    const result = await pool.query(queryText, params);
    return result.rows;
  } catch (error) {
    throw new Error(`Error al obtener las contribuciones compartidas por id_contribucion: ${error.message}`);
  }
}




async function deleteContribution(conId) {
  const client = await pool.connect();
  try {
    const queryText = 'DELETE FROM public.contribucion_compartida WHERE id_contribucion = $1';
    const params = [conId];
    const result = await client.query(queryText, params);
    return result.rows[0];
  } finally {
    client.release();
  }
}

async function updateContribution(contributionId, tipo, contenido) {
  const client = await pool.connect();
  try {
    const queryText =
      `UPDATE public.contribucion_compartida 
      SET tipo = $1, contenido = $2 
      WHERE id_contribucion = $3 
      RETURNING *`;
    const values = [tipo, contenido, contributionId];
    const result = await client.query(queryText, values);
    return result.rows[0];
  } finally {
    client.release();
  }
}

async function getContributionDetailsForSocket(contributionId) {
  const client = await pool.connect();
  try {
    const queryText = 'SELECT id_foro, rama, id_contribucioncompartida FROM public.contribucion_compartida WHERE id_contribucion = $1';
    const params = [contributionId];
    const result = await client.query(queryText, params);
    return result.rows[0];
  } catch (error) {
    console.error(`Error al obtener detalles de la contribución: ${error.message}`);
    throw error;
  } finally {
    client.release();
  }
}

async function copyContribution(contributionId, userId, nombreAlumno) {
  const client = await pool.connect();
  try {
    const queryText = 'SELECT * FROM public.contribucion_compartida WHERE id_contribucion = $1';
    const result = await client.query(queryText, [contributionId]);
    const originalContribution = result.rows[0];

    // Agregar el nombre del alumno como una indicación en la copia
    const contenido = `<p>Copiado de ${nombreAlumno}</p>\n${originalContribution.contenido}`;

    const insertQuery = `
      INSERT INTO public.contribucion_compartida 
      (id_foro, id_alumno, id_profesor, id_contribucioncompartida, rama, tipo, contenido, propietario, 
      fecha_creacion, ultima_fecha_edicion, tiempo_editando, esta_eliminada) 
      VALUES ($1, $2, $3, $4, $5, $6, $7,$8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, FALSE) 
      RETURNING *
    `;
    const insertValues = [
      originalContribution.id_foro,
      userId, // Aquí se utiliza userId en lugar de originalContribution.id_alumno
      originalContribution.id_profesor,
      originalContribution.id_contribucioncompartida,
      originalContribution.rama,
      originalContribution.tipo,
      contenido, // Usamos el contenido modificado con la indicación de copia
      originalContribution.propietario
    ];
    const insertResult = await client.query(insertQuery, insertValues);

    return insertResult.rows[0];
  } finally {
    client.release();
  }
}



async function insertReaction(id_contribucion, emoji, id_alumno, id_profesor, propietario) {
  const client = await pool.connect();
  try {
    const queryText = `
      INSERT INTO public.reacciones 
      (id_contribucion, emoji, id_alumno, id_profesor, propietario)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`;
    const params = [id_contribucion, emoji, id_alumno, id_profesor, propietario];
    const result = await client.query(queryText, params);
    return result.rows[0];
  } finally {
    client.release();
  }
}


async function getReactionsByContributionId(contribucionId) {
  const client = await pool.connect();
  try {
    const queryText = `
      SELECT 
      r.id_reaccion,
      r.id_contribucion,
      r.emoji,
      COALESCE( r.id_alumno, 'VACIO') as id_alumno,
      r.id_profesor,
      r.propietario
      FROM public.reacciones r
      WHERE r.id_contribucion = $1;
    `;
    const params = [contribucionId];
    const result = await client.query(queryText, params);
    return result.rows; 
  } finally {
    client.release();
  }
}


async function deleteReaction(id_reaccion) {
  const client = await pool.connect();
  try {
    const queryText = 'DELETE FROM public.reacciones WHERE id_reaccion = $1 RETURNING *';
    const params = [id_reaccion];
    const result = await client.query(queryText, params);
    return result.rows[0]; 
  } finally {
    client.release();
  }
}


async function updateReaction(id_reaccion, emoji) {
  const client = await pool.connect();
  try {
    const queryText = `
      UPDATE public.reacciones
      SET emoji = $2
      WHERE id_reaccion = $1
      RETURNING *`;
    const params = [id_reaccion, emoji];
    const result = await client.query(queryText, params);
    return result.rows[0]; 
  } finally {
    client.release();
  }
}

async function getPinByIdForo(idForo) {
  const client = await pool.connect();
  try {
    const queryText = 'SELECT pin FROM public.foro WHERE id_foro = $1';
    const params = [idForo];
    const result = await client.query(queryText, params);
    return result.rows[0];
  } catch (error) {
    console.error(`Error al obtener el PIN del foro: ${error.message}`);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  insertForum: insertForum,
  getAllForums: getAllForums,
  getForumById: getForumById,
  getForumByPin: getForumByPin,
  updateForum: updateForum,
  deleteForum: deleteForum,
  insertSharedContribution: insertSharedContribution,
  getAllContributions: getAllContributions,
  deleteContribution: deleteContribution,
  updateContribution: updateContribution,
  copyContribution: copyContribution,
  getContribucionesCompartidas: getContribucionesCompartidas,
  insertReaction: insertReaction,
  getReactionsByContributionId: getReactionsByContributionId,
  deleteReaction: deleteReaction,
  updateReaction: updateReaction,
  updateForumStatus: updateForumStatus,
  getContribucionesPorId:getContribucionesPorId,
  getPinByIdForo: getPinByIdForo,
  getContributionDetailsForSocket: getContributionDetailsForSocket
}
