/**
 * controlador de Producto
 * maneja las operaciones crud y activar y desactivar subcategorias
 * solo accesible por admins
 */

/**
 * importar modelos
 */

const subcategoria = require('../models/subcategoria');
const Categoria = require('../models/Categoria');
const Producto = require('../models/Producto');

//Importar path y fs para manejo de imagenes
const path = require('path');
const fs = require('fs');


/**
 * obtener todos los productos
 * query params:
 * categoriaId: Id de la categoria para filtrar por categoria
 * subcategoriaId: Id de la subcategoria para filtrar por subcategoria
 * activo true/false (filtrar por estado activo/inactivo)
 *
 * @param {Object} req request express
 * @param {Object} res response express
 */

const getProductos = async (req, res) => {
    try {
        const {categoriaId,
            SubcategoriaId,
            activo,
            conStock,
            buscar,
            pagina = 1,
            limite = 100
            } = req.query;

            //Construir filtros
        const where = {};
        if (categoriaId) where.categoriaId = categoriaId;
        if (SubcategoriaId) where.SubcategoriaId =
        SubcategoriaId;
        if (activo !== undefined) where.activo = activo === 'true';
        if (conStock === 'true') where.stock = {[require('sequelize').Op.gt]: 0};

        //paginacion
        const offset = (parseInt(pagina) -1) * parseInt(limite);




        //opciones de consulta
        const opciones = {
            where,
            include: [
                {
                    model: Categoria,
                    as: 'categoria',
                    attributes: ['id', 'nombre']
                }
            ],
                include: [
                {
                    model: subcategoria,
                    as: 'subcategoria',
                    attributes: ['id', 'nombre']
                }
            ],
            limit: parseInt(limite),
            offset,
            order: [['nombre', 'ASC']]
        
        };

        //obtener productos y total
        const {count, rows: productos } = await Producto.findAndCountAll(opciones);


        //respuesta exitosa
        res.json({
            success: true,
            data: {
                productos,
                paginacion: {
                    total: count,
                    pagina: parseInt(pagina),
                    limite: parseInt(limite),
                    totalPaginas: Math.ceil(count / parseInt(limite))
                }
            }
        });

    } catch (error) {
        console.error('error en getProductos:', error);
        res.status (500).json({
            success: false,
            message: 'error al obtener productos', error: error.message
        })
    }
};

/**
 * obtener los productos por id
 * GET /api/admin/productos/:id
 *
 * @param {Object} req request express
 * @param {Object} res response express
 */

const getProductosById = async (req, res) => {
    try {
        const {id} = req.params;

        //buscar productos con relacion
        const producto = await Producto.findByPk(id, {
            include: [{
                model: Categoria,
                as: 'categoria',
                attributes: ['id', 'nombre', 'activo']
            }],

            include: [{
                model: subcategoria,
                as: 'subcategoria',
                attributes: ['id', 'nombre', 'activo']
            }]
        });

        //filtrar por estado activo si es especifico
        if (!producto) {
            return res.status(404).json({
                success: false,
                message: 'producto no encontrado'
            });
        }

    

        //Respuesta exitosa
        res.json({
            success: true,
            data: {
                producto
            }
        });

    } catch (error) {
        console.error('error en getProductoById:', error);
        res.status (500).json({
            success: false,
            message: 'error al obtener producto', error: error.message
        })
    }
};

/**
 * crear un producto
 * POST /api/admin/productos
 * body: {nombre, descripcion}
 * @param {Object} req request express
 * @param {Object} res response express
 */

const crearProducto =async (req, res) => {
    try {
        const {nombre, descripcion, precio, stock, categoriaId, SubcategoriaId} = req.body;

        //validcion 1 verificar campos requeridos
        if (!nombre || !precio || !categoriaId|| !SubcategoriaId){
            return res.status(400).json({
                success: false,
                message: 'el nombre, precio, categoriaId y subcategoriaId son requeridos'
            });
        }
    
        /** validacion 2 si el producto existe
        const producto = await Producto.findByPk(ProductoId);
        if (!producto) {
            return res.status(404).json({
                success: false,
                message: `no existe el producto con id ${ProductoId}`
            });
        } */

      // validacion 2 verifica si la categoria esta activa

    const categoria = await Categoria.findByPk(categoriaId);

        if (!categoria) {
            return res.status(400).json({
        success: false,
        message: `No existe una categoria con Id ${categoriaId}`
    });
}

        if (!categoria.activo) {
            return res.status(400).json({
        success: false,
        message: `la categoria "${categoria.nombre}" esta inactiva`
    });
}




        //validacion 3 verificar que la subcategoria existe y pertenece a una categoria


        const Subcategoria = await subcategoria.findByPk(SubcategoriaId);

        if (!Subcategoria) {
            return res.status(404).json({
                success: false,
                message: `no existe una subcategoria con id ${SubcategoriaId}`
            });
        }
        if (!Subcategoria.activo) {
            return res.status(400).json({
                success: false,
                message: `la subcategoria "${Subcategoria.nombre}" esta inactiva`
            });
        }
        if (Subcategoria.categoriaId !== parseInt(categoriaId)) {
            return res.status(400).json({
                success: false,
                message: `la subcategoria "${Subcategoria.nombre}" no pertenece a la categoria con id ${categoriaId}`
            });
        }


        //validacion 4 validar precio y stock

        if (parseFloat(precio) < 0){
            return res.status(400).json({
                success: false,
                message: 'el precio no puede ser negativo'
            });
        }

        if (parseInt(stock) < 0){
            return res.status(400).json({
                success: false,
                message: 'el stock no puede ser negativo'
            });
        }


        //obtener imagen}
        const imagen = req.file ? req.file.filename : null;

        //crear Producto
        const nuevoProducto = await Producto.create({
            nombre,
            descripcion: descripcion || null, //si no se proporciona la desccripcion se establece como null
            precio: parseFloat(precio),
            stock: parseInt(stock),
            categoriaId: parseInt(categoriaId),
            SubcategoriaId: parseInt(SubcategoriaId),
            imagen,
            activo: true,
        });


        //recargar con relaciones
        await nuevoProducto.reload({
            include: [
                {model: Categoria, as: 'categoria', attributes: ['id', 'nombre']},
                {model: subcategoria, as: 'subcategoria', attributes: ['id', 'nombre']},
            ]
        })

        //respuesta exitosa
        res.status(201).json({
            success: true,
            message: 'Producto creado exitosamente',
            data: {
                producto: nuevoProducto
            }
        });

        } catch (error) {
            console.error('Error en crearProducto',error);
            
            //si hubo un error eliminar la imagen subida
            if (req.file){
                const rutaImagen = path.join(__dirname, '../uploads/', req.file.filename);
                try {
                    await fs.unlink(rutaImagen);
                }catch (err){
                    console.error('error al eliminar la imagen', err);
                }
            
            
            }
                if (error.name === 'SequelizeValidationError') {
                    return res.status(400).json({
                        success: false,
                        message: 'Error de validacion',
                        errors: error.errors.map(e => e.message)
                    });
                }
            }
        res.status(500).json({
            success: false,
            message: 'Error al crear producto',
            error: error.message
        });
    }

// HASTA AQUI  CORRECCION PROFE
/**
 * actualizar producto
 * PUT /api/admin/productos/:id
 * body: {nombre, descripcion, subcategoriaId}
 * @param {Object} req request express
 * @param {Object} res response express
 */

const actualizarProducto = async (req, res) => {
    try {
        const {id} = req.params;
        const {nombre, descripcion, stock, precio, categoriaId, SubcategoriaId } = req.body;

        //Buscar producto
        const producto = await Producto.findByPk(id);

        if (!producto) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

         // Validar si el producto esta activo para permitir cambios
        if (!producto.activo) {
            return res.status(400).json({
                success: false,
                message: `el producto "${producto.nombre}" está inactivo`
            });
        }

        //Validacion que no tenga el mismo nombre que otro producto
        if (nombre && nombre !== producto.nombre) {
            const productoIgualNombre = await Producto.findOne({
                where: {nombre}
            });

            if (productoIgualNombre) {
                return res.status(400).json({
                    success: false,
                    message: `ya existe un producto con el nombre "${nombre}"`
                });
            }
        }

        //actualizar campos
        if (nombre !== undefined) producto.nombre = nombre;
        if (descripcion !== undefined) producto.descripcion = descripcion;
        if (stock !== undefined) producto.stock = stock;
        if (precio !== undefined) producto.precio = precio;
        if (SubcategoriaId !== undefined) producto.SubcategoriaId = SubcategoriaId;
        if (categoriaId !== undefined) producto.categoriaId = categoriaId;
        if (activo !== undefined) producto.activo = activo;

        //guardar cambios
        await producto.save();

        //respuesta exitosa
        res.json({
            success: true,
            message: 'producto actualizado exitosamente',
            data: {
                producto,
            }
        });

    } catch (error) {
        console.error('Error en actualizarProducto: ', error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Error de validacion',
                errors: error.errors.map(e => e.message)
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al actualizar producto',
            error: error.message
        });
    }
};

// HASTA AQUI SE HA CORREGIDO EL CONTROLLER DE PRODUCTO

/**
 * activar/desactivar subcategoria
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
        const Subcategoria = await Subcategoria.findByPk (id);

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
        await Subcategoria.save();

        //contar cuantos registros se afectaron
        const productosAfectados = await Producto.count({where: {SubcategoriaId: id}
        });

        //respuesta exitosa
        res.json({
            success: true,
            message: `subcategoria ${nuevoEstado ? 'activada' : 'desactivada'} exitosamente`,
            data: {
                Subcategoria,
                productosAfectados
                }
        });

    } catch (error) {
        console.error('error en toggleSubcategoria:', error);
        res.status(500).json({
            success: false,
            message: 'error al cambiar estado de la subcategoria',
            error: error.message
        });
    }
};

/**
 * eliminar producto
 * DELETE /api/admin/prducto/:id
 * @param {Object} req request express
 * @param {Object} res request express
 */
const eliminarSubategoria = async (req, res) => {
    try {
        const {id} = req.params;

        //buscar producto
        const producto = await Producto.findByPk(id);
            if (!producto) {
                return res.status(404).json({
                    success: false,
                    message: 'Producto no encontrado'
                });
            }

            /**validacion verificar que no tenga productos
            const productos = await producto.count({
                where: {SubcategoriaId: id}
            });

            if (productos > 0) {
                return res.status(400).json({
                    success: false,
                    message: `no se puede eliminar la subcategoria porque tiene ${productos} productos asociados usa PATCH/api/admin/subcategorias/:id
                    togle para desactivarla en lugar de eliminar
`
                });
            }
            */

            //eliminar subcategoria
            await Producto.destroy();

            //respuesta exitosa
            res.json({
                success: true,
                message: 'producto eliminado exitosamente'
            });

    } catch (error) {
        console.error('error al eilminar el producto', error);
        res.status(500).json({
            success: false,
            message: 'error al eliminar el producto',
            error: error.message
        });
    }
};

/**
 * obtener estadisticas de una subcategoria
 * GET /api/admin/subcategorias/:id/estadisticas
 * retorna
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
            include:[{
                model: Categoria,
                as: 'categoria',
                attributes: ['id','nombre']
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
            where: {SubcategoriaId: id}
        });
        const productosActivos = await producto.count({
            where: {SubcategoriaId:  id, activo: true}
        });

        //obtener productos para calcular estadisticas
        const productos = await Producto.findAll({
            where: {SubcategoriaId: id},
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
                categoria: Subcategoria.categoria
                },
                estadisticas: {
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
    getSubcategoriasById,
    crearSubcategoria,
    actualizarSubcategoria,
    toggleSubcategoria,
    eliminarSubategoria,
    getEstadisticasSubcategoria
};