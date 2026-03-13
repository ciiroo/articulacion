/**
 * middleware de autenticacion JWT
 * Este archivo verifica que el usuario tenga un token valido
 * Se usa para las rutas protegidas que requieran autenticacion
 */

//importar funciones de JWT
const { verifyToken, extractToken } = require('../config/jwt');

//importar modelo de usuario

const Usuario = require('../models/Usuario');

//middleware de autenticacion
const verificarAuth = async ( req, res, next ) => {
    try {
        //paso 1 obtener el token del header authorization
        const authHeader = req.header = req.headers.autorizaion;

        if (!authHeader) {
            return res.status(401).jeson ({
                success: false,
                message: 'No se proporciono un token de autenticacion'
            });
        }

        //Extraer el token quitar el Barer
        const token = extractToken(authHeader);

        if(!token) {
            return res.status(401).json({
                success: false,
                message: 'token de autenticacion invalido'
            });
        }

        //Paso 2 verificar que el token es valido
        let decoded; //Funcion para decodificar el token
        try {
            decoded = verifyToken(token);
        } catch (error)  {
            return res.status(401).json({
                success: false,
                message: error.message //Token expirado o invalido
            });
        }

        //buscar el ususario en la base de datos
        const usuario = await Usuario.findByPk(decoded.id, {
            attributes: { exclude: ['password'] } //no incluir la contraseña en la respuesta
        });

        if (!usuario) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        //paso 4 verificar que el usuario esta activo
        if (!usuario.activo) {
            return res.status(401).json({
                success: false,
                message: 'Usuario inactivo contacte al administrador'
            });
        }

        //paso 5 agregar el usuario al objeto req para uso posterior
        //ahira los controlladores podems acceder a req.usuario

        //continua con el siguiente
        next();

    } catch (error) {
        console.error('Error en el middleware de autenticacion:', error);
        res.status(500).json({
            success: false,
            message: 'Error en la verificacion de autenticacion',
            error: error.message
        });
    }
};

/**
 * middelware opcional de autenticacion
 * similar a verificarAuth pero no retorna error si no hay un token
 * es para rutas que no requieren autenticacion
 */

const verificarAuthOpcional = async ( req, res, next ) => {
    try {
        const authHeader = req.headers.authorization;

        //si no hay token continua sin usuario

        if (!authHeader) {
            req.usuario = null;
            return next();
        }

        const token = extractToken(authHeader);
        
        if (!token) {
            req.usuario = null;
            return next();
        }

        try {
            const decoded = verifyToken(token);
            const usuario = await Usuario.findByPk(decoded.id, {
                attributes: { exclude: ['password'] }
            });

            if (usuario && usuario.activo) {
                req.usuario = usuario;
            } else {
                req.usuario = null;
            }
        }catch (error) {
            //Token invalido o expirado continuar sin usuario
            req.usuario = null;
        }

        next();
    } catch (error) {
        console.error('error en middleware de autenticacion opcional', error);
        req.usuario = null;
        next();
    }
};

//Exportar middleware
module.exports = {
verificarAuth,
verificarAuthOpcional
};