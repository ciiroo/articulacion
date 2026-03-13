/**
 * Controlador de autenticacion
 * maneja el registro login y obtencion del perfil de usuario
 * Lista de usuarios
 */

/**
 * Importar modelos
 */
const Usuario = require ('../models/Usuario');
const { generateTokens } = require ('../config/jwt');


/**
 * Obtener todos los usuarios
 * GET / api / usuarios
 * query params:
 * activo true/false (filtrar por estado)
 *
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

const registrar = async (req, res) => {
    try {
        const { nombre, apellido, email, password, telefono, direccion } = req.body;

        // validacion 1 verificar que todos los campos requeridos esten presentes
        if (!nombre || !apellido ||!email || !password ) {
            return res.status (400).json ({
                success: false,
                message: 'Faltan campos requeridos nombre, apellido, email, password'
            })
        }

        // validacion 2 verificar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json ({
                success: false,
                message: 'Formato de email invalido'
            });
        }

        //validacion 3 verificar la longitud de la contraseña
        if (password.length < 6 ) {
            return res.status(400).json ({
                success: false,
                message: 'La contraseña debe tener al menos 6 caracteres'
            });
        }

        // validacion 4 verificar que el email este registrado
        const usuarioExistente = await Usuario.findOne ({
            where : {email}
        });
        if (usuarioExistente) {
            return res.status(400).json ({
                success: false,
                message: 'El email ya esta registrado'
            });
        }
        

/**
 * Crear nuevo usuario
 * el hook beforeCreate en el modelo se encarga de hashear la contraseña antes de guardarla
 * en el rol por defecto es cliente
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

        //Crear usuario
        const nuevoUsuario = await Usuario.create({
            nombre,
            apellido,
            email,
            password,
            telefono: telefono || null, //si no se proporciona se establece como null
            direccion: direccion || null, //si no se proporciona se establece como null
            rol: 'cliente' // rol por defecto
        });

        // generar Token JWT con datos del usuario
        const token = generateTokens ({
            id: nuevoUsuario.id,
            email: nuevoUsuario.email,
            rol: nuevoUsuario.rol
        })

        //preparar respuesta si password
        const usuarioRespuesta = nuevoUsuario.toJSON();
        delete usuarioRespuesta.password; //elimina el campo de contraseña


        //Respuesta exitosa
        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            data: {
                usuario: usuarioRespuesta,
                token
            }
        });

    } catch (error) {
        console.error('Error en registrar', error)
        return res.status(400).json({
            success: false,
            message: 'Error al resgistrar usuario',
            error: error.message
        });
    }
};

/**
 * iniciar sesion login
 * Autentica un usuario con email y contraseña
 * retorna el usuario y un token JWT si las credenciales son correctas
 * POST / api / auth / login
 * body {email, password}
 */

const login = async (req , res) => {
    try{
        // Extraer credenciales del body
        const {email, password, } = req.body;

        //validacion 1: verificar que se proporcionaron email y password
        if  (!email || !password) {
            return res.status (400).json ({
                success: false,
                message: 'El email y contraseña son requeridos'
            });
        }

        // validacion 2: buscar usuario por email
        // necesitamos incluir el password aqui normalmente se excluye por seguridad
        const usuario = await Usuario.scope ('withPassword').findOne ({
            where: {email}
        });

        if (!usuario) {
            return res.status(401).json ({
                success: false,
                message: 'Credenciales invalidas'
            });
        }

        // validacion 3 verificar que el usuario esta activado
        if (!usuario.activo) {
            return res.status(401).json({
                success: false,
                message: 'Usuario inactivo, contacte el administrador'
            });
        }

        // validacion 4: verificar la contraseña
        // usamps el metodo compararPassword del modelo usuario

        const passwordValida = await usuario.compararPassword (password);

        if (!passwordValida) {
            return res.status(401).json({
                success: false,
                message: 'credenciales imvalidas'
            });

        }

        // Generar token JWT con datos basicos del usuario
        const token = generateTokens({
            id: usuario.id,
            email: usuario.email,
            rol: usuario.rol
        });

        // preparar respuesta sin password
        const usuarioSinPassword = usuario.toJSON();
        delete usuarioSinPassword.password;

        //respuesta exitosa
        res.json ({
            success: true,
            message: 'inicio de sesion exitoso',
            data: {
                usuario: usuarioSinPassword,
                token
            }
        });

    } catch (error) {
        console.error ('Error en el login', error);
        res.status(500).json({
            success: false,
            message: 'error al iniciar sesion',
            error: error.message
        })
    }
};

/**
 * Obtener perfil del usuario autenticado
 * require middleware verificarAuth
 * get / api / auth / me
 * headers: { Authorization: 'Bearer TOKEN '}
 */

const getMe = async (req, res) => {
    try {
        // El usuario ya esta en req.usuario
        const usuario = await Usuario.findByPk(req.usuario.id,
        {
            attributes: { exclude: ['password'] }
        });

        if (!usuario) {
            return res.status(404).json ({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Respuesta exitosa
        res.json ({
            success: true,
            data: {
                usuario
            }
        });
    }catch (error) {
        console.error('error en getMe' , error);
        res.status(500).json ({
            success: false,
            message: 'Error al obtener perfil',
            error: error.message
        })
    }
};


/**
 * Actualizar perfil de usuario autenticado
 * permite al usuario actualizar su iformacion personal
 * PUT /api/auth/me
 * Body: {nombre, apellido, email, password, rol, telefono, direccion }
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

const updateMe = async (req, res) => {
    // Renombrado correctamente a updateMe
    try {
        const { nombre, apellido, telefono, direccion} = req.body;

        //Buscar usuario
        const usuario = await Usuario.findByPk(req.usuario.id);

        if(!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }


        //Actualizar campos
        if (nombre !== undefined) usuario.nombre = nombre;
        if (apellido !== undefined) usuario.apellido = apellido;
        if (telefono !== undefined) usuario.telefono = telefono;
        if (direccion !== undefined) usuario.direccion = direccion;

    

        //guardar cambios
        await usuario.save();

        //Respuesta exitosa
        res.json({
            success: true,
            message: 'Perfil actualizado exitosamente',
            data: {
                usuario: usuario.toJSON()
            }
        });

    } catch (error) {
        console.error('Error en updateMe', error);
        return res.status(500).json ({
            success: false,
            message: 'Error al actualizar perfil',
            errors: error.message
        });
        }
    };

    /**
     * Camiar la contraseña del usuario autenticado
     * permite al usuario cambiar su contraseña
     * requiere su contraseña actual por seguridad
     * PUT / api / auth / change - password
     */

    const changePassword = async (req , res) => {
        try {
            const { passwordActual, passwordNueva } = req.body;

            // validacion 1 verificar que se proporcionen ambas contraseñas
            if (!passwordActual || !passwordNueva) {
                return res.status(400).json ({
                    success: false,
                    message: 'Se requiere contraseña actual y nueva contraseña'
                });
            }

            // validacion 2 verificar la longitud de ambas contraseñas
            if (passwordActual.length < 6 ) {
                return res.status(400).json ({
                    success: false,
                    message: 'La contraseña actual debe tener minimo 6 caracteres '
                });
            }
            if (passwordNueva.length < 6 ) {
                return res.status(400).json ({
                    success: false,
                    message: 'La nueva contraseña debe tener minimo 6 caracteres '
                });
            }

            // validacion 3 buscar usuario con password incluido
            const usuario = await Usuario.scope('withPassword').findByPk(req.usuario.id)
            if (!usuario) {
                return res.status(400).json ({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }

            // validacion 4 verificar que la contraseña actual sea correcta
            if (typeof usuario.compararPassword !== 'function') {
                return res.status(500).json({
                    success: false,
                    message: 'Error interno: compararPassword no está definido en el modelo Usuario'
                });
            }
            const passwordValida = await usuario.compararPassword(passwordActual);
            if (!passwordValida) {
                return res.status(400).json ({
                    success: false,
                    message: 'Contraseña actual incorrecta'
                });
            }

            // actualizar contraseña
            usuario.password = passwordNueva;
            await usuario.save();

            // respuesta exitosa
            res.json ({
                success: true,
                message: 'Contraseña actualizada exitosamente'
            })

            

    } catch (error) {
        console.error('error en changePassword', error);
        res.status(500).json({
            success: false,
            message: 'error al cambiar contraseña',
            error: error.message
        });
    }
};

//exportar todos los controladores
module.exports = {
    registrar,
    login,
    getMe,
    updateMe: updateMe,
    changePassword
};