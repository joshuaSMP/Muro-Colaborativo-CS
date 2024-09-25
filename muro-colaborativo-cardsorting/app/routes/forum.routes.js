const express = require('express');
const router = express.Router();
const forumController = require('../controllers/forum.Controller');

// Ruta para obtener todos los foros
router.get('/:professorId', forumController.listForums);

// Ruta para obtener un foro específico por su ID
router.get('/obtener/:pin', forumController.getForum);

// Ruta para obtener todos los foros
router.get('/pin/:pin', forumController.getForumByPinHandler);

// Ruta para crear un nuevo foro
router.post('/crearForo', forumController.createForum);

// Ruta para actualizar un foro específico por su ID
router.put('/:forumId', forumController.updateForum);

// Ruta para actualizar el estado de activación de un foro específico por su ID
router.put('/:forumId/status', forumController.updateForumStatus);

// Ruta para eliminar un foro específico por su ID
router.delete('/:forumId', forumController.deleteForum);

// Ruta para crear una contribución
router.post('/crearcontribucion', forumController.createContribution);

// Ruta para obtener todas las contribuciones de un foro por PIN
router.get('/contribuciones/:pin', forumController.getContributions);

router.get('/contribucionescompartidas/:idContribucionCompartida', forumController.getContributionscompartidas);

// Ruta para obtener contribuciones compartidas por id_contribucion
router.get('/contribuciones/:idContribucion/:rama', forumController.getContribucionesPorId);

// Ruta para eliminar una contribución por su ID
router.delete('/contribuciones/:contribucionId', forumController.deleteContribution);

// Ruta para actualizar una contribución por su ID
router.put('/contribuciones/:contribucionId', forumController.updateContribution);

// Ruta para copiar una contribución por su ID
router.post('/contribuciones/copiarcontribucion/:contributionId', forumController.copyContribution);

// Ruta para añadir una reacción
router.post('/nuevareaccion', forumController.createReaction); 

// Ruta para consultar las reacciones de una contribución
router.get('/reacciones/:contribucionId', forumController.getReaction);

// Ruta para eliminar una reacción por id_reaccion
router.delete('/reaccion/:id_reaccion', forumController.deleteReaction);

// Ruta para modificar una reacción por id_reaccion
router.put('/reaccion/:id_reaccion', forumController.updateReaction);

module.exports = router;