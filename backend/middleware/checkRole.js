/**
 * middleware de verificar roles
 * este middleware verifica que el usuario tenga un rol requerido
 * debe usarse despues de middleware de autenticacion
 */

const esAdministrador = ( req, res, next) => {
    try {
        //Verificar que existe req.usuario (viene de la autenticacion)
        if(!req.usuario) {
            return res.status(401).json({
                success: false,
                message: 'No autorizado, debes iniciar sesion primero'
            });
        }

        //Verificar que el rol es administrador
        if(req.usuario.rol !== 'administrador') {
            return res.status(403).json({
                success: false,
                message: 'acceso denegado requiere permisos de administrador'
            });
        }

        //El usuario es administrador continuar
        next();

    } catch (error) {
        console.error('Error en middleware esAdministrador', error);
        return res.status(500).json({
            success: false,
            message: 'Error al verificar permisos', error: error.message
        });
    }
};

/**
 * Middleware para verificar si el usuario es cliente o administrador
 */
const esCliente = ( req, res, next) => {
    try {
        //Verificar que existe req.usuario (viene de la autenticacion)
        if(!req.usuario) {
            return res.status(401).json({
                success: false,
                message: 'No autorizado, debes iniciar sesion primero'
            });
        }

        //Verificar que el rol es cliente
        if(req.usuario.rol !== 'cliente') {
            return res.status(403).json({
                success: false,
                message: 'acceso denegado requiere permisos de cliente'
            });
        }

        //El usuario es cliente continuar
        next();

    } catch (error) {
        console.error('Error en middleware esCliente', error);
        return res.status(500).json({
            success: false,
            message: 'Error al verificar permisos', error: error.message
        });
    }
};

/**
 * Middleware flexible para verificar multiples roles
 * permite verificar varios roles validos
 * util para cuando una ruta tiene varios roles permitidos
 */
const tieneRol = ( req, res, next) => {
    return (req, res, next) => {
    try {
        //Verificar que existe req.usuario (viene de la autenticacion)
        if(!req.usuario) {
            return res.status(401).json({
                success: false,
                message: 'No autorizado, debes iniciar sesion primero'
            });
        }

        //Verificar que el usuario esta en la lista de roles permitidos
        if(!req.rolesPermitidos.includes(req.usuario.rol)) {
            return res.status(403).json({
                success: false,
                message: `Acceso denegado se requiere uno de los siguientes roles: ${req.rolesPermitidos.join(', ')}`
            });
        }

        //El usuario tiene rol permitido continuar
        next();

    } catch (error) {
        console.error('Error en middleware tieneRol', error);
        return res.status(500).json({
            success: false,
            message: 'Error al verificar permisos',
            error: error.message
        });
    }
    };
};

/**
 * middleware para verificar que el usuario accede a sus propios datos
 * verificar que el usuarioid en los parametros coinciden con el usuario autenticado
 */

const esPropioUsuarioOAdmin = (req , res , next) => {
    try {
        // verificar que existe req.usuario (viene de la autenticacion)
        if (!req.usuario) {
            return res.status(401).json ({
                success: false,
                message: 'no autorizado, debes iniciar sesion primero'
            })
        }

        // los administradores pueden acceder a datos de cualquier usuario
        if (req.usuario.rol === 'administrador') {
            return next ();
        }

        //Obtener el usuarioId de los parametros de la ruta
        const usuarioIdParam = req.param.usuarioId || req.params.id;
        
        // Verificar que el usuarioId coincide con el usuario autenticado
        
        if (parseInt(usuarioIdParam) !== req.usuario.id) {
            return res.status(403).json ({
                success: false,
                message: 'acceso denegado, no puedes acceder a datos de otros usuarios '
            });
        }

        // el usuario accede a sus propios datos continuar
        next();

    } catch (error) {
        console.error('Error en middleware esPropioUsuarioOAdmin', error) ;
        return res.status(500).json({
            success: false,
            message: 'error en la verificacion de permisos ',
            error: error.message
        });
    }
};

/**
 * middleware para verificar que el usuario es administrador o auxuiliar
 * permite el acceso a usuarios con rol de administrador o auxiliar
 */

const esAdminOAuxiliar = (req, res, next) => {
    try {
        //Verificar que existe req.usuario (viene de la autenticacion)
        if (!req.usuario) {
            return res.status(401).json({
                success: false,
                message: 'No autorizado, debes iniciar sesion primero'
            });
        }

        //Verificar que el rol es administrador o auxiliar
        if(!['administrador', 'auxiliar'].includes(req.usuario.rol)) {
            return res.status(403).json({
                success: false,
                message: 'acceso denegado requiere permisos de administrador o auxiliar'
            });
        }

        //El usuario es administrador o auxiliar continuar
        next();

    } catch (error) {
        console.error('Error en middleware esAdminOAuxiliar', error);
        return res.status(500).json({
            success: false,
            message: 'Error al verificar permisos', error: error.message
        });
    }
};

/**
 * Mddleware para verificar que el usuario es solo administrador no auxiliar
 * Bloquea el acceso a operaciones como eliminar
 */

const soloAdministrador = ( req, res, next) => {
    try {
        if(!req.usuario) {
            return res.status(401).json({
                success: false,
                message: 'No autorizado debes iniciar sesion primero'
            });
        }

        //Verificar que el rol es administrador
        if(req.usuario.rol !== 'administrador') {
            return res.status(403).json({
                success: false,
                message: 'acceso denegado requiere administradores para realizar esta operacion'
            });
        }

        //El usuario es administrador continuar
        next();

    } catch (error) {
        console.error('Error en middleware soloAdministrador', error);
        return res.status(500).json({
            success: false,
            message: 'Error al verificar permisos', 
            error: error.message
        });
    }
};

//Exportar los middlewares
module.exports = {
    esAdministrador,
    esCliente,
    esPropioUsuarioOAdmin,
    esAdminOAuxiliar,
    tieneRol,
    soloAdministrador
};



