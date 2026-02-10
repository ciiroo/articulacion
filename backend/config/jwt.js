/**
 * CONFIGURACION DE JWT
 * Este archivo contiene funviones para generar y verificar tokens jwt
 * Los jwt se usan para autenticar usuarios sin necesidad de sesiones
 */

//importar jsonwebtoken para manejar los tokens
const jwt = require('jsonwebtoken');

//Importar dotenv para acceder a las variables de entorno
required('dotenv').config();

/**
 * Generar un token JWT para un usuario
 * @param {object} payload - Datos que se incluiran en el token (id, email, rol)
 * @returns {string} - Token JWT generado
 */

const generateTokens = (payload) => {
    try{
        //jwt.sign() crea y firma un token
        //Parametros:
        //1. payload: datos a incluir en token
        //2. secret: clave secreta para firmar (desde .env)
        //3. options: opciones adicionales como tiempo de expiracion
        const token = jwt.sign(
            payload, //Datos de usuario
            process.env.JWT_SECRET, //Clave secreta desde .env
            {expiresIn: process.env.JWT_EXPIRES_IN} //Tiempo de expiracion
        );
        return token; //Retorna el token generado
    } catch (error) {
        console.error('Error al generar token JWT:', error.message);
        throw new Error('Error al generar el token de autenticacion');
}
};

/**
 * Verificar si un token es valido
 *
 * @param {string} token - Token JWT a verificar
 * @returns {object} - Payload decodificados del token si es valido
 * @throws {Error} - Si el token es invalido o ha expirado
 */

const verifyToken = (tokenHeader) => {
    try{
        //jwt.verify() verifica la firma del token y decodifica
        //paraemetros:
        //1. token: token jwt a verificar
        //2. secret: clave secreta usada para firmarlo
        const decoded = jwt.verify(tokenHeader, process.env.JWT_SECRET);
        
        return decoded;
    } catch (error) {
        //diferentes tipos de errores
        if(error.name === 'TokenExpiredError'){
            throw new Error('El token ha expirado');
            } else if (error.name === 'JsonWebTokenError') {
            throw new Error('Token invalido');
            }else {
                throw new Error('Error al verificar el token');
            }
    }
};
/** extraer el token de un header de autorizacion
 * el token viene en formato 'Bearer <token'
 * 
 * @param {string} authHeader - header de autorizacion de la peticion
 * @returns {string|null} - el token extraido o null si no existe 
 */

const extractToken = (authHeader) => {
    //verifica que el header existe y empieza con "Bearer "
    if(authHeader && authHeader.startsWith('Bearer')){
        //Extraer solo el token (remover "Bearer ")
        return authHeader.substring(7);
    }
    return null; //no se encontro un token valido 
};

//Exportar las funciones para usarlas en otras partes del proyecto
module.exports = {
    generateTokens,
    verifyToken,
    extractToken
};