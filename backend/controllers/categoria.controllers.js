/**
 * Controlador de categorias
 * maneja las operaciones CRUD y la activacion/desactivacion de categorias
 * solo accesible ór usuarios con rol administrador
 */

/**
 * Importar modelos
 */
const Categoria = require('../models/Categoria');
const subcategoria = require('../models/subcategoria');
const Producto = require('../models/Producto');

/**
 * Obtener todas las categorias
 * query params:
 * incluir subcategorias true/false (incluir subcategorias relacionadas)
 *
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

const getCategorias = async (req, res) => {
    try {
        const { activo, incluirSubcategorias} = req.query;

        //Opciones de consulta
        const opciones = {
            order: [['nombre', 'ASC']] // Ordenar de manera alfabetica
        };

        //Filtrar por estado activo si es especifica
        if(activo !== undefined) {
            opciones.where = {activo: activo === 'true' };
        }

        //Incluir subcategorias si se solicita
        if(incluirSubcategorias === 'true') {
            opciones.include == [{
                model: subcategoria,
                as: 'subcategorias',
                attributes: ['id', 'nombre','descripcion', 'activo'] // Solo campos necesarios
            }]
    }

        //obtener categorias
        const categorias = await categoria.findAll (Opciones);

        //Respuesta exitosa
        res.json({
            succes: true,
            count: categorias.length,
            data: {
                categorias
            }
        });

    } catch (error) {
        console.error('Error en getCategorias: ', error);
        res.status(500).json({
            succes: false,
            message: 'Error al obtener categorias',
            error: error.message
        })
    }
};

/**
 * Obtener las categorias por id
 * GET /api/categorias/:id
 *
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

const getCategoriasById = async (req, res) => {
    try {
        const { id} = req.query;

        //Buscar categorias con subcategorias y contar productos
        const categoria = await Categoria.findByPk (id, {
            include: [
                {
                    model:subcategoria,
                    as: 'subcategorias',
                    attributes: ['id', 'nombre', 'descripcion', 'activo']
                },
                {
                    model: Producto,
                    as: 'productos',
                    attributes: ['id']
                }
            ]
        });

        if (!categoria) {
            return res.status(404).json({
                succes: false,
                message: 'Categoria no encontrada'
            });
        }

        //agregar contador de productos
        const categoriaJSON = categoria.toJSON();
        categoriaJSON.totalProductos = categoriaJSON.productos.length;
        delete categoriaJSON.productos; //no enviar la lista completa solo el contador

        //respuesta exitosa
        res.json({
            succes: true,
            data: {
                categoria: categoriaJSON
            }
        });

    } catch (error) {
        console.error('Error en getCategoriasById: ', error);
        res.status(500).json({
            succes: false,
            message: 'Error al obtener categoria',
            error: error.message
        })
    }
};

/**
 * Crear una categoria
 * POST /api/admin/categorias
 * Body: {nombre, descripcion}
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

const crearCategoria = async (req, res) => {
    try {
        const { nombre, descripcion} = req.body;

        //Validacion 1 verificar campos requeridos
        if (!nombre) {
            return res.status(400).json ({
                success: false,
                message: 'El nombre de la categoria es requerido'
            });
        }

        //Validacion 2 verificar que el nombre no exista
        const categoriaExistente = await Categoria.findOne({ where: {nombre}
        });

        if (categoriaExistente) {
            returnres.status(400).json({
                success: false,
                message: `Ya existe una categoria con el nombre "${nombre}"`
            });
        }

        //Crear categoria
        const nuevaCategoria = await Categoria.create({
            combre,
            descriocion: descripcion || null, //si no se proporciona la descripcion se establece como null
            activo: true
        });

        //Respuesta exitosa
        res.status(201).json({
            success: true,
            message: 'Categoria creada exitosamente',
            data: {
                categoria: nuevaCategoria
            }
        });
    } catch (error) {
        if(error.name === 'SequelizeValidationError'){
        return res.status(400).json({
            success: false,
            message: 'Error de validacion',
            error: error.errors.map(e => e.message)
        });
    }
    
    res.status(500).json({
        succes: false,
        message: 'Error al crear categoria',
        error: error.message
    })
}
};

/**
 * Actualizar categoria
 * PUT /api/admin/categorias/:id
 * Body: {nombre, descripcion }
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

const actualizarCategoria = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion} = req.body;
        
        //Buscar categoria
        const categoria = await Categoria.findByPk(id);

        if(!categoria) {
            return res.status(404).json({
                success: false,
                message: 'Categoria no encontrada'
            });
        }

        //Validacion 1 si se camvia el nombre verificar que no exista
        if (nombre && nombre !== categoria.nombre) {
            const categoriaConMisNombre = await
            Categoria.findOne({where: {nombre}
            });

            if(categoriaConMisNombre) {
                return res.status(400).json({
                    succes: false,
                    message: `Ya existe una categoria con el nombre "${nombre}"`
                });
            }
        }

        //Actualizar campos
        if (nombre !== undefined) categoria.nombre = nombre;
        if (descripcion !== undefined) categoria.descripcion = descripcion;
        if (activo !== undefined) categoria.activo = activo;

        //guardar cambios
        await categoria.save();

        //Respuesta exitosa
        res.json({
            succes: true,
            message: 'Categoria actualizada exitosamente',
            data: {
                categoria
            }
        });

    } catch (error) {
        console.error('Error en actualizarCategoria:', error);

        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json ({
                succes: false,
                message: 'Error de validacion',
                errors: error.errors.map(e => e. message)
            });
        }

        res.status(500).json({
            succes: false,
            message: 'Error al actualizar categoria',
            error: error.message
        });
    }
};

/**
 * Activar/Desactivar Categoria
 * PATCH /api/admin/categoria/:id/estado
 *
 * Al desactivar una categoria se desactivan todas las subcategorias relacionadas
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
            message: `Categoria ${nuevoEstado ? 'activada' : 'desactivada'} exitosamente`,
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
                message: `No se puede eliminar la categoria porque tiene ${subcategorias} asociadas usa PATCH /api/admin/categorias/:id toggle para desactivarla en lugar de eliminarla`
            });
        }
        //Validacion verificar que no tenga productos
        const productos = await Producto.count({
            where: { categoriaId: id}
        });

        if(productos > 0) {
            return res.status(400).json({
                succes: false,
                message: `No se puede eliminar la categoria porque tiene ${productos} asociadas usa PATCH /api/admin/categorias/:id toggle para desactivarla en lugar de eliminarla`
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
            valorTotalInventario += parseFloat(producto.precio) * producto.stock;
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
                        valorTotal: valorTotalInventario.toFixed(2) //quitar decimales
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
    getCategorias,
    getCategoriasById,
    crearCategoria,
    actualizarCategoria,
    toggleCategoria,
    eliminarCategoria,
    getEstadisticasCategoria
};