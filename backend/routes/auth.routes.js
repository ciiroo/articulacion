/**
 * Rutas de autenticacion
 * define los endpoints para registro login y gestion de perfil
 */

//importar Router de express
const express = require('express');
const router = express.Router();

//importar controlladores de autenticacion
const {
    registrar,
    login,
    getMe,
    uptadeMe,
    changePassword,
} = require('../controllers/auth.controller');

//importar middleware
const { verificarAuth } = require('../middleware/auth');

//Rutas publicas
router.post('/register', registrar);
router.post('/login', login);

//Rutas protegidas
router.get('/me', verificarAuth, getMe);
router.put('/me', verificarAuth, uptadeMe);
router.put('/change-password', verificarAuth, changePassword);

//Exportar router
module.exports = router;

