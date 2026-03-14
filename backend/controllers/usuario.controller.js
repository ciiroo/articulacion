/**
 * Controlador de usuarios
 * maneja la gestion de usuarios por administrador
 * Lista de usuarios
 */

/**
 * Importar modelos
 */
const Usuario = require('../models/Usuario');


/**
 * Obtener todos los usuarios
 * GET / api / usuarios
 * query params:
 * activo true/false (filtrar por estado)
 *
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

const getUsuarios = async (req, res) => {
    try {
        const { rol, activo, buscar, pagina = 1, limite = 10} = req.query;

        //Construir los filtros
        const where = {};
        if (rol) where.rol = rol;
        if (activo !== undefined) where.activo = activo === 'true';

        //Busqueda por texto
        if (buscar) {
            const {Op} = require('sequelize');
            where [Op.or] = [
                {nombre: { [Op.like]: `%${buscar}%` } },
                {apellido: { [Op.like]: `%${buscar}%` } },
                {email: { [Op.like]: `%${buscar}%` } },
            ];
        }

        //Paginacion
        const offset = (parseInt(pagina) -1) * parseInt(limite);

        //obtener usuarios sin password
        const {count, rows: usuarios } = await Usuario.findAndCountAll ({
            where,
            attributes: { exclude: ['password' ] },
            limit: parseInt(limite),
            offset,
            order: [['createdAt', 'DESC']]
        });

        // respuesta exitosa
        res.json({
            success: true,
            data: {
                usuarios,
                paginacion: {
                    total: count,
                    pagina: parseInt(pagina),
                    limite: parseInt(limite),
                    totalPaginas: Math.ceil(count / parseInt(limite))
                }
            }
        });

    } catch (error) {
        console.error('Error en getUsuarios:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener usuarios',
            error: error.message
            });
        }
    };


/**
 * Obtener un usuario por id
 * GET /api/admin/usuarios/:id
 *
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

const getUsuariosById = async (req, res) => {
    try {
        const { id } = req.params;

        //Buscar usuarios
        const usuario = await Usuario.findByPk(id, {
            attributes: { exclude: ['password'] },

        });


        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }


        //respuesta exitosa
        res.json({
            success: true,
            data: {
                usuario
            }
        });

    } catch (error) {
        console.error('Error en getUsuariosById: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener usuario',
            error: error.message
        })
    }
};

/**
 * Crear nuevo usuario
 * POST /api/admin/usuario
 * Body: {nombre, apellido, email, password, rol, telefono, direccion }
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

const crearUsuario = async (req, res) => {
    try {
        const { nombre, apellido, email, password, rol, telefono, direccion } = req.body;

        //Validaciones
        if (!nombre || !apellido || !email || !password || !rol ) {
            return res.status(400).json ({
                success: false,
                message: 'Faltan campos requeridos nombre, apellido, email, password, rol, telefono, direccion'
            });
        }

        //Validar rol
        if (!['cliente', 'auxiliar', 'administrador'].includes(rol)) {
            return res.status(400).json({
                success: false,
                message: 'Rol invalido. Debe ser: cliente, auxiliar o administrador'
            });
        }

        //Validar email unico
        const usuarioExistente = await Usuario.findOne({ where: { email }
        });

        if (usuarioExistente) {
            return res.status(400).json({
                success: false,
                message: 'El email ya esta registrado'
            });
        }

        //Crear usuario
        const nuevoUsuario = await Usuario.create({
            nombre,
            apellido,
            email,
            password,
            rol,
            telefono: telefono || null, //si no se proporciona se establece como null
            direccion: direccion || null, //si no se proporciona se establece como null
            activo: true
        });

        //Respuesta exitosa
        res.status(201).json({
            success: true,
            message: 'Usuario creado exitosamente',
            data: {
                usuario: nuevoUsuario.toJSON() //convertir a json para excluir campos sensibles
            }
        });
    } catch (error) {
        console.error('Error al crearUsuario')
        if(error.name === 'SequelizeValidationError'){
        return res.status(400).json({
            success: false,
            message: 'Error de validacion',
            error: error.errors.map(e => e.message)
        });
    }

    res.status(500).json({
        success: false,
        message: 'Error al crear usuario',
        error: error.message
    })
}
};

/**
 * Actualizar usuario
 * PUT /api/admin/usuarios/:id
 * Body: {nombre, apellido, email, password, rol, telefono, direccion }
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

const actualizarUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, apellido, email, password, rol, telefono, direccion} = req.body;

        //Buscar usuario
        const usuario = await Usuario.findByPk(id);

        if(!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        //Validar rol si se proporciona
        if (rol && !['cliente', 'auxiliar', 'administrador'].includes(rol)) {
            return res.status(400).json({
                success: false,
                message: 'rol invalido'
            });
        }

        //Actualizar campos
        if (nombre !== undefined) usuario.nombre = nombre;
        if (apellido !== undefined) usuario.apellido = apellido;
        if (email !== undefined) usuario.email = email;
        if (direccion !== undefined) usuario.direccion = direccion;
        if (rol !== undefined) usuario.rol = rol;
        if (password !== undefined) usuario.password = password;
        if (telefono !== undefined) usuario.telefono = telefono;

    

        //guardar cambios
        await usuario.save();

        //Respuesta exitosa
        res.json({
            success: true,
            message: 'Usuario actualizado exitosamente',
            data: {
                usuario: usuario.toJson()
            }
        });

    } catch (error) {
        console.error('Error en actualizarUsuario:', error);
            return res.status(500).json ({
                success: false,
                message: 'Error al actualizar usuario',
                errors: error.message
            });
        }
    };


/**
 * Activar/Desactivar Usuario
 * PATCH /api/admin/usuarios/:id/estado
 *
 * Al desactivar un usuario
 * @param {Object} req request Express
 * @param {Object} res response Express
 */
const toggleUsuario = async (req, res) => {
    try {
        const {id} = req.params;

        //Buscar usuario
        const usuario = await Usuario.findByPk(id);

        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrada'
            });
        }

        // No permitir desactivar el propio admin
        if (usuario.id === req.usuario.id) {
            return res.status(400).json ({
                success: false,
                message: 'No puedes desactivar tu propia cuenta'
            });
        }

        usuario.activo = !usuario.activo;
        await usuario.save();
        
        res.json ({
            success: true,
            message: `Usuario ${usuario.activo ? 'activado': 'desactivado'} exitosamente`, 
            data: {
                usuario: usuario.toJSON()
            }
        });

    } catch (error) {
        console.error('Error en toggleUsuario: ', error);
        res.status(500).json ({
            success: false,
            message: 'Error al cambiar estado del usuario',
            error: error.message
            });
        }

    };

/**
 * Eliminar usuario
 * DELETE /api/admin/usuarios/:id
 * @param {Object} req request Express
 * @param {Object} res response Express
 */
const eliminarUsuario = async (req, res) =>{
    try {
        const {id} = req.params;

        //Buscar usuario
        const usuario = await Usuario.findByPk(id);

            if(!usuario) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuario no encontrado'
            });
        }

        // no permitir eliminar el propio admin

        if (usuario.id === req.usuario.id){
            return res.status(400).json ({
                success: false,
                message: 'no puedes eliminar tu propia cuenta!'
            });
        }
        await usuario.destroy();


        //Respuesta exitosa
        res.json({
            success: true,
            message: 'Usuario eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar el usuario' ,error);
        res.status(500).json({
            success: false,
            message:'Error al eliminar el usuario',
            error: error.message
        });
    }
};

/**
 * Obtener estadisticas de usuarios
 * GET /api/admin/usuarios/:id/estadisticas
 * @param {Object} req request Express
 * @param {Object} res response Express
 */
const getEstadisticasUsuarios = async (req, res) =>{
    try {
        //datos de usuarios
        const totalUsuarios = await Usuario.count ();
        const totalClientes = await Usuario.count ({ where: { rol: 'cliente' }});
        const totalAdmins = await Usuario.count ({ where : { rol: 'administrador'}});
        const usuariosActivos = await Usuario.count ({ where : {activo : true}});
        const usuariosInactivos = await Usuario.count ( { where: {activo : false}});

        //respuesta exitosa

        res.json({
            success: true,
            data: {
                total: totalUsuarios,
                porRol : {
                clientes: totalClientes,
                administrador: totalAdmins
                },
                porEstado: {
                        activas: usuariosActivos,
                        inactivas: usuariosInactivos
                    },
                    
                    }
                });
            

    } catch (error) {
        console.error('error en getEstadisticasUsuarios', error);
        res.status(500).json({
            success: false,
            message: 'error al obtener estadisticas',
            error: error.message
        });
    }
};

//exportar todos los controladores
module.exports = {
    getUsuarios,
    getUsuariosById,
    crearUsuario,
    actualizarUsuario,
    toggleUsuario,
    eliminarUsuario,
    getEstadisticasUsuarios
};