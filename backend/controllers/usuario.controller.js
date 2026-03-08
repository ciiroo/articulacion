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
            succes: true,
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
        const {id} = req.query;

        //Buscar usuarios
        const usuario = await Usuario.findByPk (id, {
            attributes: { exclude: ['password'] },

        });


        if (!usuario) {
            return res.status(404).json({
                succes: false,
                message: 'Usuario no encontrado'
            });
        }


        //respuesta exitosa
        res.json({
            succes: true,
            data: {
                usuario
            }
        });

    } catch (error) {
        console.error('Error en getUsuariosById: ', error);
        res.status(500).json({
            succes: false,
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
            return res.status(400).json(400).json({
                success: false,
                message: 'Rol invalido. Debe ser: cliente, auxiliar o administrador'
            });
        }

        //Validar email unico
        const usuarioExistente = await Usuario.findOne({ where: { email }
        });

        if (usuarioExistente) {
            returnres.status(400).json({
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
                usuario: nuevoUsuario.toJson() //convertit a json para excluir campos sensibles
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
        succes: false,
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
        if (rol && ['cliente', 'administrador'].includes(rol)) {
                return res.status(400).json({
                    succes: false,
                    message: 'rol invalido'
                });
            }

        //Actualizar campos
        if (nombre !== undefined) usuario.nombre = nombre;
        if (apellido !== undefined) usuario.apellido = apellido;
        if (email !== undefined) usuario.email = email;
        if (direccion !== undefined) usuario.direccion = direccion;
        if (rol !== undefined) usuario.rol = rol;

    

        //guardar cambios
        await usuario.save();

        //Respuesta exitosa
        res.json({
            succes: true,
            message: 'Usuario actualizado exitosamente',
            data: {
                usuario: usuario.toJson()
            }
        });

    } catch (error) {
        console.error('Error en actualizarUsuario:', error);
            return res.status(500).json ({
                succes: false,
                message: 'Error al actualizar usuario',
                errors: error.message
            });
        }
    };


/**
 * Activar/Desactivar Categoria
 * PATCH /api/admin/categoria/:id/estado
 *
 * Al desactivar una categoria se desactivan todas las subcategorias
relacionadas
 * Al desactivar una subcategoria se desactivan todos los productos relacionados
 * @param {Object} req request Express
 * @param {Object} res response Express
 */
const toggleCategoria = async (req, res) => {
    try {
        const {id} = req.params;

        //Buscar categoria
        const categoria = await Categoria.findByPk(id);

        if (!categoria) {
            return res.status(404).json({
                succes: false,
                message: 'Categoria no encontrada'
            });
        }

        //Allternar estado activo
        const nuevoEstado = !categoria.activo;
        categoria.activo = nuevoEstado;

        //Guardar cambios
        await categoria.save();

        //Contar cuantos registros se afectaron
        const subcategoriasAfectadas = await
        subcategoria.count({ where: {categoriaId: id}
        });

        const productosAfectados = await
        Producto.count({ where: {categoriaId: id}
        });

        //Respuesta exitosa
        res.json({
            succes: true,
            message: `Categoria ${nuevoEstado ? 'activada' :
'desactivada'} exitosamente`,
            data:{
                categoria,
                afectados: {
                    subcategorias:
                    subcategoriasAfectadas,
                    productos: productosAfectados
                }
            }
        });

    } catch (error) {
        console.error('Error en toggleCategoria:', error);
        res.status(500).json({
            succes: false,
            message: 'Error al cambiar estado de la categoria',
            error: error.message
        });
    }
};

/**
 * Eliminar categoria
 * DELETE /api/admin/categorias/:id
 * Solo permite eliminar si no tiene subcategorias ni productos relacionados
 * @param {Object} req request Express
 * @param {Object} res response Express
 */
const eliminarCategoria = async (req, res) =>{
    try {
        const {id} = req.params;

        //Buscar categoria
        const caegoria = await Categoria.findByPk(id);

            if(!categoria) {
                return res.status(404).json({
                    succes: false,
                    message: 'Categoria no encontrada'
            });
        }

        //Validacion verificar que no tenga subcategorias
        const subcatgorias = await subcategoria.count({
            where: { categoriaId: id}
        });

        if(subcategorias > 0) {
            return res.status(400).json({
                succes: false,
                message: `No se puede eliminar la categoria porque
tiene ${subcategorias} asociadas usa PATCH /api/admin/categorias/:id
toggle para desactivarla en lugar de eliminarla`
            });
        }
        //Validacion verificar que no tenga productos
        const productos = await Producto.count({
            where: { categoriaId: id}
        });

        if(productos > 0) {
            return res.status(400).json({
                succes: false,
                message: `No se puede eliminar la categoria porque
tiene ${productos} asociadas usa PATCH /api/admin/categorias/:id
toggle para desactivarla en lugar de eliminarla`
            });
        }

        //Eliminar categoria
        await categoria.destroy();

        //Respuesta exitosa
        res.json({
            succes: true,
            message: 'Categoria eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar la categoria' ,error);
        res.status(500).json({
            succes: false,
            message:'Error al eliminar la categoria',
            error: error.message
        });
    }
};

/**
 * Obtener estadisticas de una categoria
 * GET /api/admin/categorias/:id/estadisticas
 * retorna
 * Total de subcategorias activas / inactivas
 * Total de productos activos / inactivos
 * Valor del inventario
 * Stock total
 * @param {Object} req request Express
 * @param {Object} res response Express
 */
const getEstadisticasCategoria = async (req, res) =>{
    try {
        const {id} = req.params;

        //Verificar que la categoria exista
        const categoria = await Categoria.findByPk (id);

        if (!categoria) {
            return res.status(404).json({
                succes: false,
                message: 'Categoria no encontrada'
            });
        }

        //Contar subcategorias
        const totalSubcategorias = await subcategoria.count({
            where: { categoriaId: id}
        });

        const subcategoriasActivas = await subcategoria.count({
            where: { categoriaId: id, activo: true }
        });

        //Contar productos
        const totalProductos = await Producto.count({
            where: { categoriaId: id}
        });

        const productosActivos = await Producto.count({
            where: { categoriaId: id, activo: true }
        });

        //Obtener productos para calcular estadisticas
        const productos = await Producto.findAll({
            where: { categoriaId: id},
            attributes: ['precio', 'stock']
        });

        //Calcular estadisticas de inventario
        let valorTotalInventario = 0;
        let stockTotal = 0;

        productos.forEach(producto => {
            valorTotalInventario += parseFloat(producto.precio) *
producto.stock;
            stockTotal += producto.stock;
        });

//respuesta exitosa
        res.json({
            success: true,
            data: {
                categoria: {
                id: categoria.id,
                nombre: categoria.nombre,
                activo: categoria.activo,
                },
                estadisticas: {
                    Subcategorias: {
                        total: totalSubcategorias,
                        activas: subcategoriasActivas
                    },
                    productos: {
                        total: totalProductos,
                        activas: productosActivos,
                        inactivas: totalProductos - productosActivos
                    },
                    inventario: {
                        stockTotal,
                        valorTotal: valorTotalInventario.toFixed(2)
//quitar decimales
                    }
                }
            },
        });

    } catch (error) {
        console.error('error en getEstadisticasCategoria', error);
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
    toggleCategoria,
    eliminarCategoria,
    getEstadisticasCategoria
};
