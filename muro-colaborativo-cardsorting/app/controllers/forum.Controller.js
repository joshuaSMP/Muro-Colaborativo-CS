const forumService = require('../services/forum.service');

module.exports = {
  createForum: async (req, res) => {
    try {
      const { id_profesor, tema_foro } = req.body;
      const newForum = await forumService.insertForum(id_profesor, tema_foro);
      res.status(201).json(newForum);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al crear el foro' });
    }
  },

  validatePinParam: (req, res, next) => {
    const pin = req.params.pin;
    if (!pin || isNaN(pin)) {
      res.status(400).json({
        message: 'Error de validación',
        details: 'El PIN debe ser un número entero válido en la URL'
      });
    } else {
      next();
    }
  },

  listForums: async (req, res) => {
    try {
      const professorId = req.params.professorId;
      const forums = await forumService.getAllForums(professorId);
      res.json({ forums });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener la lista de foros' });
    }
  },

  getForumByPinHandler: async (req, res) =>{
    const pin = req.params.pin;
    try {
      const forum = await forumService.getForumByPin(pin);
      if (forum.length === 0) {
        res.status(404).json({ error: 'No se encuentra foro con ese pin' });
      } else {
        // Envía los datos directamente dentro de la propiedad "data"
        res.json({
          data: forum[0]
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error interno en el servidor' });
    }
  },
  
  getForum: async (req, res) => {
    try {
      const pin = req.params.pin;
      const forum = await forumService.getForumById(pin);
      if (!forum) {
        res.status(404).json({ message: 'Foro no encontrado' });
      } else {
        res.status(200).json({
          id_foro: forum.id_foro,
          pin: forum.pin,
          tema_foro: forum.tema_foro,
          nombre_profesor: forum.nombre_profesor,
          esta_activa: forum.esta_activa
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al obtener el foro' });
    }
  },

  updateForum: async (req, res) => {
    try {
      const forumId = req.params.forumId;
      const { tema_foro } = req.body;
      const updatedForum = await forumService.updateForum(forumId, tema_foro);
      res.status(200).json({ message: 'Foro actualizado correctamente', updatedForum });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al actualizar el foro' });
    }
  },

  updateForumStatus: async (req, res) => {
    try {
      const forumId = req.params.forumId;
      const { esta_activa } = req.body;
      const updatedForum = await forumService.updateForumStatus(forumId, esta_activa);
      res.status(200).json({ message: 'Estado del foro actualizado correctamente', updatedForum });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al actualizar el estado del foro' });
    }
  },

  deleteForum: async (req, res) => {
    try {
      const forumId = req.params.forumId;
      await forumService.deleteForum(forumId);
      res.status(200).json({ message: 'Foro eliminado correctamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al eliminar el foro' });
    }
  },

  createContribution: async (req, res) => {
    try {
      const { id_foro, id_alumno, id_profesor, id_contribucioncompartida, rama, tipo, contenido, propietario } = req.body;
      const newContribution = await forumService.insertSharedContribution(id_foro, id_alumno, id_profesor, id_contribucioncompartida, rama, tipo, contenido, propietario);
      res.status(201).json(newContribution);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al crear la contribución compartida' });
    }
  },
  
  getContributions: async (req, res) => {
    try {
        const forumId = req.params.pin;
        const contributions = await forumService.getAllContributions(forumId);
        const jsonResponse = contributions.map((contribution) => {
            return {
                id_contribucion: contribution.id_contribucion,
                nombre_alumno: contribution.nombre_alumno,
                nombre_profesor: contribution.nombre_profesor,
                contenido: contribution.contenido, 
                tipo: contribution.tipo,
                rama: contribution.rama,
                propietario: contribution.propietario,
                idForo: contribution.idForo, 
                idAlumno: contribution.idalumno, 
                idProfesor: contribution.idprofesor, 
                fecha: contribution.fecha
            };
        });
        res.json(jsonResponse);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener las contribuciones del foro' });
    }
},

getContributionscompartidas : async (req, res) => {
  try {
    const idContribucionCompartida = req.params.idContribucionCompartida;
    const rama = req.query.rama;
    const contributions = await forumService.getContribucionesCompartidas(idContribucionCompartida, rama);
    const jsonResponse = contributions.map((contribution) => {
        return {
            id_contribucion: contribution.id_contribucion,
            id_contribucion_compartida: idContribucionCompartida, // Añadir id_contribucioncompartida
            nombre_alumno: contribution.nombre_alumno,
            nombre_profesor: contribution.nombre_profesor,
            contenido: contribution.contenido, // Solo el contenido simplificado
            tipo: contribution.tipo,
            rama: contribution.rama,
            propietario: contribution.propietario,
            idForo: contribution.idforo, 
            idAlumno: contribution.idalumno, 
            idProfesor: contribution.idprofesor, 
            fecha: contribution.fecha
        };
    });
    res.json(jsonResponse);
} catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener las contribuciones compartidas del foro' });
}
},

getContribucionesPorId : async (req, res) => {
    try {
      const idContribucion = req.params.idContribucion;
      const rama = req.params.rama;
      const contributions = await forumService.getContribucionesPorId(idContribucion, rama);
      
      const jsonResponse = contributions.map((contribution) => ({
        id_contribucion: contribution.id_contribucion,
        nombre_alumno: contribution.nombre_alumno,
        nombre_alumno_contribucion_compartida: contribution.nombre_alumno_contribucion_compartida,
        nombre_profesor: contribution.nombre_profesor,
        contenido: contribution.contenido,
        tipo: contribution.tipo,
        rama: contribution.rama,
        propietario: contribution.propietario,
        idForo: contribution.idforo,
        idAlumno: contribution.idalumno,
        idProfesor: contribution.idprofesor,
        fecha: contribution.fecha,
        id_contribucion_compartida: contribution.id_contribucion_compartida
      }));
      
      res.json(jsonResponse);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al obtener las contribuciones compartidas por id_contribucion y rama' });
    }
  },
  
  deleteContribution: async (req, res) => {
    try {  
      const contributionId = req.params.contribucionId;
      await forumService.deleteContribution(contributionId);
      res.status(200).json({ message: 'Contribución eliminada correctamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al eliminar la contribución' });
    }
  },

  updateContribution: async (req, res) => {
    try {
      const contributionId = req.params.contribucionId;
      const { tipo, contenido } = req.body;
      
      const updatedContribution = await forumService.updateContribution(contributionId, tipo, contenido);
            
      res.status(200).json({ message: 'Contribución actualizada correctamente', updatedContribution });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al actualizar la contribución' });
    }
  },

  copyContribution: async (req, res) => {
    try {
      const { contributionId } = req.params;
      const { userId, nombreAlumno } = req.body; // Asegúrate de que el userId y el nombreAlumno se envíen desde el frontend
  
      const newContribution = await forumService.copyContribution(contributionId, userId, nombreAlumno);
         
      res.status(201).json(newContribution);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al copiar la contribución' });
    }
  },
  
  createReaction: async (req, res) => {
    try {
      const { id_contribucion, emoji, id_alumno, id_profesor, propietario } = req.body;
      const newReaction = await forumService.insertReaction(id_contribucion, emoji, id_alumno, id_profesor, propietario);
      res.status(201).json(newReaction);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al añadir reacción' });
    }
  },  

  getReaction: async (req, res) => {
    try {
      const contribucionId = req.params.contribucionId;
      const reactions = await forumService.getReactionsByContributionId(contribucionId);
      res.json(reactions);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al obtener las reacciones' });
    }
  },  

  deleteReaction: async (req, res) => {
    try {
      const id_reaccion = req.params.id_reaccion;
      const deletedReaction = await forumService.deleteReaction(id_reaccion);
      res.status(200).json({ message: 'Reacción eliminada correctamente', deletedReaction });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al eliminar la reacción' });
    }
  },  

  updateReaction: async (req, res) => {
    try {
      const id_reaccion = req.params.id_reaccion;
      const { emoji } = req.body;
      const updatedReaction = await forumService.updateReaction(id_reaccion, emoji);
      res.status(200).json({ message: 'Reacción actualizada correctamente', updatedReaction });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al actualizar la reacción' });
    }
  }

}  
