/**
 * controlador de subcategorias
 * maneja las operaciones crud y activar y desactivar subcategorias
 * solo accesible por admins
 */

/**
 * importar modelos
 */

const subcategoria = require('../models/subcategoria');
const Categoria = require('../models/Categoria');
const Producto = require('../models/Producto');

/**
 * obtener todas las subcategorias
 * query params:
 * categoriaId: Id de la categoria para filtrar por categoria
 * activo true/false (filtrar por estado)
 * incluir catrgoria true/false (incluir categoria relacionada)
 *
 * @param {Object} req request express
 * @param {Object} res response express
 */

const getSubcategorias = async (req, res) => {
    try {
        const {categoriaId, activo, incluirCategoria} = req.query;

        //opciones de consulta
        const opciones = {
            order: [['nombre', 'ASC']] // ordenar de manera alfabetica
        };

        //filtros
        const where = {};
        if (categoriaId) where.categoriaId = categoriaId;
        if (activo !== undefined) where.activo = activo === 'true';

        if (Object.keys(where).length > 0) {
            opciones.where = where;
        }

        //incluir categoria si se solicita
        if (incluirCategoria === 'true') {
            opciones.include = [{
                model: Categoria,
                as: 'categoria', // campo del alias para la relacion
                attributes: ['id', 'nombre', 'activo'] //campos a incluir de la categoria
            }]
        }

        //obtener subcategoria
        const subcategorias = await subcategoria.findAll (opciones);

        //respuesta exitosa
        res.json({
            success: true,
            count: subcategorias.length,
            data: {
                subcategorias
            }
        });

    } catch (error) {
        console.error('error en getSubcategorias:', error);
        res.status (500).json({
            success: false,
            message: 'error al obtener subcategorias', error: error.message
        })
    }
};

/**
 * Obtener todas las subcategorias por id
 * GET /api/subcategorias/:id
 *
 * @param {Object} req request express
 * @param {Object} res response express
 */

const getSubcategoriaById = async (req, res) => {
    try {
        const {id} = req.params;

        //buscar subcategorias con categoria y contar productos
        const subcategoria = await subcategoria.findByPk(
            id, {
                include: [{
                model: categoria,
                as: 'categorias',
                attributes: ['id', 'nombre', 'activo']
            },
            {
                model: producto,
                attributes: ['id']
            }]
        });

        //filtrar por estado activo si es especifico
        if (!subcategoria) {
            return res.status(404).json({
                success: false,
                message: 'subcategoria no encontrada'
            });
        }

        //agregar contador de productos
        const subcategoriaJSON = subcategoria.toJSON();
        subcategoriaJSON.totalProductos = subcategoriaJSON.productos.length;
        delete subcategoriaJSON.productos; //no enviar lista completa solo el contador

        //respuesta exitosa
        res.json({
            success: true,
            data: {
                subcategoria: subcategoriaJSON
            }
        });

    } catch (error) {
        console.error('error en getSubcategoriaById:', error);
        res.status (500).json({
            success: false,
            message: 'Error al obtener subcategoria',
            error: error.message,
        });
    }
};

/**
 * crear una subcategoria
 * POST /api/admin/subcategorias
 * body: {nombre, descripcion}
 * @param {Object} req request express
 * @param {Object} res response express
 */

const crearSubcategoria =async (req, res) => {
    try {
        const {nombre, descripcion, categoriaId} = req.body;

        //validcion 1 verificar campos requeridos
        if (!nombre || !categoriaId){
            return res.status(400).json({
                success: false,
                message: 'el nombre y categoriaId es requerido'
            });
        }

        //Validacion 2 verificar si la categoria exista
        const categoria = await categoria.findByPk(categoriaId);
        if (!categoria) {
            return res.status(404).json({
                success: false,
                message: `no existe la categoria con id ${categoriaId}`
            });
        }

        //Validacion 3 verifica si la categoria esta activa
        if (!categoria.activa){
            return res.status(400).json({
                success: false,
                message: `La categoria con id ${categoria.nombre} no se encuantra activa debe activarla`
            });
        }

        //validacion 4 verificar que no exista una subcategoria con el mismo nombre
        const subcategoriaExistente = await subcategoria.findOne({where: {nombre, categoriaId}
        });
        if (subcategoriaExistente) {
            return res.status(400).json({
                success: false,
                message: `ya existe una subcategoria con el nombre "${nombre}" en esta categoria`
            });
        }

        //crear subcategoria
        const nuevaSubcategoria = await subcategoria.create({
            nombre,
            descripcion: descripcion || null, //si no se proporciona la desccripcion se establece como null
            categoriaId,
            activo: true
        });

        //obtener subcategoria con los datos de la categoria

        const subcategoriaConCategoria = await subcategoria.findByPk(nuevaSubcategoria.id, {
            include: [{
                model: Categoria,
                as: 'categoria',
                attributes: ['id', 'nombre', 'activo'],
            }],
        });

        //respuesta exitosa
        res.status(201).json({
            success: true,
            message: 'Subcategoria creada exitosamente',
            data: {
                subcategoria: subcategoriaConCategoria
            }
        });

        } catch (error) {
            console.error('Error en crearSubcategoria', error);
            if (error.name === 'swquelizeValidationError'){
            return res.status (400).json({
                success: false,
                message: 'error de validacion', errors: error.errors.map(e => e.message)
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al crear subcategoria',
            error: error.message
        });
    }
};

/**
 * actualizar subcategoria
 * PUT /api/admin/subcategorias/:id
 * body: {nombre, decripcion, categoriaId}
 * @param {Object} req request express
 * @param {Object} res response express
 */

const actualizarSubcategoria = async (req, res) => {
    try {
        const {id} = req.params;
        const {nombre, descripcion, categoriaId } = req.body;

        //Buscar subcategoria
        const Subcategoria = await subcategoria.findByPk(id);

        if (!Subcategoria) {
            return res.status(404).json({
                success: false,
                message: 'Subcategoria no encontrada'
            });
        }

        //Validacion 1 si se cambia el nombre verificar que no exista
        if (categoriaId && categoriaId !== Subcategoria.categoriaId) {
            const nuevaCategoria = await Categoria.findByPk(categoriaId);
            if (!nuevaCategoria) {
                return res.status(404).json({
                    success: false,
                    message: `No existe la categoria con id ${categoriaId}`
                });
            }
        }

        if (!nuevaCategoria.activo) {
            return res.status(400).json({
                success: false,
                message: `la categoria "${nuevaCategoria.nombre}" esta inactiva`
            });
        }

        //validacion si se cambia el nombre verificar que no exista la categoria
        if (nombre && nombre !== Subcategoria.nombre) {
            const categoriaFinal = categoriaId || Subcategoria.categoriaId; //si no se cambia la categoria usar la categoria actual
            const subcategoriaConMismoNombre = await subcategoria.findOne({
                where: {
                    nombre,
                    categoriaId: categoriaFinal
                }
            });

            if (subcategoriaConMismoNombre) {
                return res.status(400).json({
                    success: false,
                    message: `ya existe una subcategoria con el nombre "${nombre}" en esta categoria`
                });
            }
        }

        //actualizar campos
        if (nombre !== undefined) Subcategoria.nombre = nombre;
        if (descripcion !== undefined) Subcategoria.descripcion = descripcion;
        if (categoriaId !== undefined) Subcategoria.categoriaId = categoriaId;
        if (activo !== undefined) Subcategoria.activo = activo;

        //guardar cambios
        await subcategoria.save();

        //respuesta exitosa
        res.json({
            success: true,
            message: 'subcategoria actualizada exitosamente',
            data: {
                Subcategoria,
            }
        });

    } catch (error) {
        console.error('error en actualizarSubcategoria: ', error);
        if (error.name === 'sequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Error de validacion',
                errors: error.errors.map(e => e.message)
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al actualizar subcategoria',
            error: error.message
        });
    }
};
/**
 * activar/desactivar subcategorias
 * PATCH /api/admin/subcategorias/:id/estado
 *
 * al desactivar una subcategoria se desactivan todos los productos relacionados
 * @param {Object} req request express
 * @param {Object} res response express
 */
const toggleSubcategoria = async (req, res) => {
    try {
        const {id} = req.params;

        //buscar subcategoria
        const Subcategoria = await subcategoria.findByPk (id);

        if (!Subcategoria) {
            return res.status(404).json({
                success: false,
                message: 'subcategoria no encontrada'
            });
        }

        //alternar estado activo
        const nuevoEstado = !Subcategoria.activo;
        Subcategoria.activo = nuevoEstado;
        
        //guardar cambios
        await subcategoria.save();

        //contar cuantos registros se afectaron
        const productosAfectados = await Producto.count({where: {categoriaId: id}
        });

        //respuesta exitosa
        res.json({
            success: true,
            message: `subcategoria ${nuevoEstado ? 'activada' : 'desactivada'} exitosamente`,
            data: {
                subcategoria,
                productosAfectados
            }
        });

    } catch (error) {
        console.error('error en togglesubategoria:', error);
        res.status(500).json({
            success: false,
            message: 'error al cambiar estado de la subcategoria',
            error: error.message
        });
    }
};

/**
 * eliminar subcategoria
 * DELETE /api/admin/subcategorias/:id
 * Solo permite eliminar si no tiene productos relacionados
 * @param {Object} req request express
 * @param {Object} res request express
 */
const eliminarSubcategoria = async (req, res) => {
    try {
        const {id} = req.params;

        //buscar subcategoria
        const Subcategoria = await subcategoria.findByPk(id);
            if (!Subcategoria) {
                return res.status(404).json({
                    success: false,
                    message: 'subcategoria no encontrada'
                });
            }

            //validacion verificar que no tenga productos
            const producto = await Producto.count({
                where: {subcategoriaId: id}
            });

            if (productos > 0) {
                return res.status(400).json({
                    success: false,
                    message: `no se puede eliminar la subcategoria porque tiene ${productos} subcategorias asociadas usa PATCH /api/admin/subcategorias/:id togle para desactivarla en lugar de eliminar `
                });
            }

            //eliminar subcategoria
            await Subcategoria.destroy();

            //respuesta exitosa
            res.json({
                success: true,
                message: 'subcategoria eliminada exitosamente'
            });

    } catch (error) {
        console.error('error al eilminar subcategoria', error);
        res.status(500).json({
            success: false,
            message: 'error al eliminar subcategoria',
            error: error.message
        });
    }
};

/**
 * Obtener estadisticas de una subcategoria
 * GET /api/admin/subcategorias/:id/estadisticas
 * retorna
 * total de subcategorias activas / inactivas
 * total de productos activos / inactivos
 * valor total del inventario
 * stock total
 * @param {Object} req request express
 * @param {Object} res request express
 */
const getEstadisticasSubcategoria = async (req, res) => {
    try {
        const {id} = req.params;

        //verificar que la subcategoria exista
        const Subcategoria = await subcategoria.findByPk(id [{
            include: [{
                model: Categoria,
                as: 'categoria',
                attributes: ['id', 'nombre']
            }]
        }]);

        if (!Subcategoria) {
            return res.status(404).json({
                success: false,
                message: 'subcategoria no encontrada'
            });
        }

        //contar productos
        const totalProductos = await producto.count({
            where: {subcategoriaId: id}
        });
        const productosActivos = await producto.count({
            where: { subcategoriaId:  id, activo: true}
        });

        //obtener productos para calcular estadisticas
        const productos = await Producto.findAll({
            where: {Subcategoria: id},
            attributes: ['precio', 'stock']
        });

        //calcular estadisticas de inventario
        let valorTotalInventario = 0;
        let stockTotal = 0;

        productos.forEach(producto => {
            valorTotalInventario += parseFloat(producto.precio) * producto.stock;
        });

        //respuesta exitosa
        res.json({
            success: true,
            data: {
                Subcategoria: {
                id: Subcategoria.id,
                nombre: Subcategoria.nombre,
                activo: Subcategoria.activo,
                categoria: Subcategoria.categoria,
                },
                estadisticas: {
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
        console.error('error en getEstadisticasSubcategoria', error);
        res.status(500).json({
            success: false,
            message: 'error al obtener estadisticas',
            error: error.message
        });
    }
};

//exportar todos los controladores
module.exports = {
    getSubcategorias,
    getSubcategoriaById,
    crearSubcategoria,
    actualizarSubcategoria,
    toggleSubcategoria,
    eliminarSubcategoria,
    getEstadisticasSubcategoria
};