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

const getProductoById = async (req, res) => {
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
 * body: {nombre, descripcion, precio, stock, categoriaId, subcategoriaId}
 * @param {Object} req request express
 * @param {Object} res response express
 */

const actualizarProducto = async (req, res) => {
    try {
        const {id} = req.params;
        const {nombre, descripcion, stock, precio, categoriaId, SubcategoriaId, activo } = req.body;

        //Buscar producto
        const producto = await Producto.findByPk(id);

        if (!producto) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

         // Validar si cambia la| categoria y subcategoria
            if (categoriaId && SubcategoriaId !== producto.categoriaId) {
            const categoria = await Categoria.findByPk(categoriaId);

            if (categoria || !categoria.activo) {
                return res.status(404).json({
                    success: false,
                    message: 'categoria invalida o inactiva'
                })
            }
        }

        if (SubcategoriaId && SubcategoriaId !== producto.SubcategoriaId) {
            const Subcategoria = await subcategoria.findByPk(SubcategoriaId);

            if (Subcategoria || !Subcategoria.activo) {
                return res.status(404).json({
                    success: false,
                    message: 'subcategoria invalida o inactiva'
                })
            }

            const catId = categoriaId || producto.categoriaId

            if (!Subcategoria.categoriaId !== parseInt(catId)) {
                return res.status(404).json({
                    success: false,
                    message: 'La subcategoria no pertenece a la categoria seleccionada'
                });
            }
        }

    

        //validar precio y stock
        if (precio !== undefined && parseFloat(precio) < 0) {
            return res.status(400).json({
                success: false,
                message: 'el precio no puede ser negativo'
            });
        }

        if (stock !== undefined && parseInt(stock) < 0) {
            return res.status(400).json({
                success: false,
                message: 'el stock no puede ser negativo'
            });
        }

        //manejar imagen
        if (req.file) {
            //eliminar imagen anterior si existe
            if (producto.imagen) {
                const rutaImagenAnterior = path.join(__dirname, '../uploads/', producto.imagen);
                try {
                    await fs.unlink(rutaImagenAnterior);
                } catch (err) {
                    console.error('error al eliminar la imagen anterior', err);
                }
            }

            //asignar nueva imagen
            producto.imagen = req.file.filename;
        }

            

        //Actualizar campos

        if (nombre !== undefined) producto.nombre = nombre;
        if (descripcion !== undefined) producto.descripcion = descripcion;
        if (stock !== undefined) producto.stock = parseInt(stock);
        if (precio !== undefined) producto.precio = parseFloat(precio);
        if (categoriaId !== undefined) producto.categoriaId = parseInt(categoriaId);
        if (SubcategoriaId !== undefined) producto.SubcategoriaId = parseInt(SubcategoriaId);
        if (activo !== undefined) producto.activo = activo;

        //guardar cambios
        await Producto.save();

        //respuesta exitosa
        res.json({
            success: true,
            message: 'producto actualizado exitosamente',
            data: {
                producto,
            }
        });

    } catch (error) {
        console.error('error en actualizarProducto: ', error);
        
        if (req.file) {
            const rutaImagen = path.join(__dirname, '../uploads/', req.file.filename);
            try {
                await fs.unlink(rutaImagen);
            } catch (err) {
                console.error('error al eliminar la imagen', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error al actualizar producto, no se pudo eliminar la imagen',
                    error: err.message
                });
    }



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
};

// HASTA AQUI SE HA CORREGIDO EL CONTROLLER DE PRODUCTO

/**
 * activar/desactivar producto
 * PATCH /api/admin/productos/:id/estado
 *
 * 
 * @param {Object} req request express
 * @param {Object} res response express
 */

const toggleProducto = async (req, res) => {
    try {
        const {id} = req.params;

        //buscar producto
        const producto = await Producto.findByPk (id);

        if (!producto) {
            return res.status(404).json({
                success: false,
                message: 'producto no encontrado'
            });
        }

        //alternar estado activo
        const nuevoEstado = !producto.activo;
        producto.activo = nuevoEstado;

        //guardar cambios
        await Producto.save();


        //respuesta exitosa
        res.json({
            success: true,
            message: `producto ${producto.activo ? 'activado' : 'desactivado'} exitosamente`,
            data: {
                producto
                }
        });

    } catch (error) {
        console.error('error en toggleProducto:', error);
        res.status(500).json({
            success: false,
            message: 'error al cambiar estado del producto',
            error: error.message
        });
    }
};

/**
 * eliminar producto
 * DELETE /api/admin/productos/:id
 * Solo permite eliminar si no tiene productos relacionados
 * @param {Object} req request express
 * @param {Object} res request express
 */
const eliminarProducto = async (req, res) => {
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

        //el hook beforeDestroy se encarga de eliminar la imagen

        //eliminar producto
        await Producto.destroy();

        //respuesta exitosa
        res.json({
            success: true,
            message: 'Producto eliminado exitosamente'
        });



            
    }catch (error) {
        console.error('error en eliminar Producto:', error);
        res.status(500).json({
            success: false,
            message: 'error al eliminar producto',
            error: error.message
        });
};
};


/**
 * Actualizar stock de un producto
 * 
 * PATCH /api/admin/productos/:id/stock
 * body: {cantidad, operacion: 'aumentar' | 'reducir' | 'establecer'}
 * 
 * @param {Object} req request express
 * @param {Object} res response express
 */


const actualizarStock = async (req, res) => {
    try{
        const {id} = req.params;
        const {cantidad, operacion} = req.body;

        if (!cantidad || !operacion) {
            return res.status(400).json({
                success: false,
                message: 'Cantidad y operación son requeridos'
            });
        }

        const cantidadNUm = parseInt(cantidad);
            if (cantidadNUm < 0) {
            return res.status(400).json({
                success: false,
                message: 'La cantidad no puede ser negativa'
            });
        }

        const producto = await Producto.findByPk(id);

        if (!producto) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        let nuevoStock;

        switch (operacion) {
            case 'aumentar':
                nuevoStock = producto.aumentarStock(cantidadNUm);
                break;
                case 'reducir':
                    if (cantidadNUm > producto.stock) {
                        return res.status(400).json({
                            success: false,
                            message: `No hay suficiente stock. stock actual: ${producto.stock}`
                        });
                    }

                    nuevoStock = producto.reducirStock(cantidadNUm);
                    break;
                    case 'establecer':
                        nuevoStock = cantidadNUm;
                        break;
                        default:
                            return res.status(400).json({
                                success: false,
                                message: 'operacion invalida. debe ser aumentar, reducir o establecer'
                            }); 
                        

                producto.stock = nuevoStock;
                await Producto.save();

                res.json({
                    success: true,
                    message: `Stock ${operacion === 'aumentar' ? 'aumentado' : operacion === 'reducir' ? 'reducido' : 'establecido'} exitosamente`,
                    data: {
                        productoId: producto.id,
                        nombre: producto.nombre,
                        stockAnterior: operacion === 'establecer' ? null : (operacion === 'aumentar' ? producto.stock - cantidadNUm : producto.stock + cantidadNUm),
                        stockNuevo: producto.stock
                    }
                });

        }
    }catch (error){
        console.error('error en actualizarStock:', error);
        res.status(500).json({
            success: false,
            message: 'error al actualizar stock',
            error: error.message
        });
    }
}



//exportar todos los controladores
module.exports = {
    getProductos,
    getProductoById,
    crearProducto,
    actualizarProducto,
    toggleProducto,
    eliminarProducto,
    actualizarStock

};