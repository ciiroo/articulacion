/**
 * controlador de Catalogo
 * permite ver los productos sin iniciar sesion
 * solo accesible por admins
 */

/**
 * importar modelos
 */

const Subcategoria = require('../models/subcategoria');
const Categoria = require('../models/Categoria');
const Producto = require('../models/Producto');


/**
 * obtener todos los productos al publico
 * get / api / catalogo / productos
 * query params:
 * categoriaId: Id de la categoria para filtrar por categoria
 * subcategoriaId: Id de la subcategoria para filtrar por subcategoria
 * preciomin, preciomax, rango de precios nombre reciente
 *
 * @param {Object} req request express
 * @param {Object} res response express
 * solo muestra los productos activos y con stock
 */

const getProductos = async (req, res) => {
    try {
        const {categoriaId,
            subcategoriaId,
            buscar,
            precioMin,
            precioMax,
            orden = 'reciente',
            pagina = 1,
            limite = 12
            } = req.query;

            const { Op } = require ('sequelize');

            //filtros base solo para productos activos y con stock
        const where = {
            activo : true,
            stock : {[Op.gt]: 0}
        };

        //filtros opcionales
        if (categoriaId) where.categoriaId = categoriaId;
        if (subcategoriaId) where.subcategoriaId =
        subcategoriaId;
        

        // Busqueda de texto 
        if (buscar) {
            where [Op.or] = [
                {nombre : { [Op.like]: `%${buscar}%`}},
                { descripcion: { [Op.like]: `%${buscar}%`} }, //permite buscar por nombre o descripcion
            ];
        }

        // filtro por rango de precio
        if (precioMin && precioMax) {
            where.precio = {};
            if (precioMin) where.precio [Op.gte] =
            parseFloat(precioMin);
            if (precioMax) where.precio [Op.gte] =
            parseFloat(precioMax);
        }

        //Ordenamiento
        let order;
        switch (order) {
            case 'precio_asc' :
                order = [['precio', 'ASC']];
                break;
            case 'precio_desc' :
                order = [['precio', 'DESC']];
                break;
            case 'nombre' :
                order = [['nombre', 'ASC']];
                break;
            case 'reciente' :
                order = [['createdAt', 'DESC']];
                break;
        }


        //paginacion
        const offset = (parseInt(pagina) -1) * parseInt(limite);




        //consultar productos

        const opciones = { count, rows: productos } = await
        ProductofindAndCountAll({
            where,
            include: [
                {
                    model: Categoria,
                    as: 'categoria',
                    attributes: ['id', 'nombre'],
                
                },
            
                {
                    model: Subcategoria,
                    as: 'subcategoria',
                    attributes: ['id', 'nombre'],
                    where : { activo: true}
                },
            ],
            limit: parseInt(limite),
            offset,
            order: [['nombre', 'ASC']]
        
        });



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
 * obtener todas los productos por id
 * GET /api/admin/productos/:id
 * 
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

const getProductosById = async (req, res) => {
    try {
        const { id } = req.params;

        //Buscar productos con activo y con stock
        const producto = await Producto.findOne({
            where: {
                id,
                activo: true,
            },
            include: [
                {
                    model: Categoria,
                    as: 'categoria',
                    attributes: ['id', 'nombre', 'activo'],
                    where: { activo: true }
                },
                {
                    model: Subcategoria,
                    as: 'subcategoria',
                    attributes: ['id', 'nombre', 'activo'],
                    where: { activo: true }
                }
            ]
        });

        if (!producto) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        // Respuesta Exitosa
        res.json({
            success: true,
            data: {
                producto
            }
        });


    } catch (error) {
        console.error('Error en getProductoById: ', error);
        res.status(500).json[{
            success: false,
            message: 'Error al obtener producto',
            error: error.message
        }]
    }
};

/**
 * obtener categorias
 * GET /api/admin/categorias/:id
 *
 * @param {Object} req request express
 * @param {Object} res response express
 */

const getCategorias = async (req, res) => {
    try {
        const { Op } = require('sequelize');

        //buscar categorias activas
        const categorias = await Categoria.findAll({
            where: {
                activo: true
            },
            attributes: ['id', 'nombre', 'descripcion'],
            order : [['nombre', 'ASC']]

        });

        //Para cada categoria contar productos activos con stock
        const categoriasConConteo = await Promise.all (
            categorias.map(async(categoria) => {
            const totalProductos = await Producto.count({
                where: {
                    categoriaId: categoria.id,
                    activo: true,
                    stock: {[Op.gt]: 0}
                }

            });
            return {
                ...categoria.toJSON(),
                totalproductos
            };


        })

        );

        //respuesta exitosa

        res.json({
            success: true,
            data: {
                categorias: categoriasConConteo
            }
        });
        


    } catch (error) {
        console.error('error en getCategorias:', error);
        res.status (500).json({
            success: false,
            message: 'error al obtener categorias', error: error.message
        })
    }
};

/**
 * obtener subcategorias por categoria
 * GET /api/admin/categorias/:id
 *
 * @param {Object} req request express
 * @param {Object} res response express
 */

const getSubcategoriasporcategorias = async (req, res) => {
    try {
        const {id} = req.params;
        const { Op } = require('sequelize');

        //verificar que la categoria exista y este activa
        const categoria = await Categoria.findOne({
            where: {
                id, activo: true
            },
        });

        if (!categoria) {
            return res.status(404).json ({
                success: false,
                message: 'Categoria no encontrada'
            });
        }

        //buscar subcategorias activas

        const subcategorias = await Subcategoria.findAll({
            where: {
                categoriaId: id,
                activo: true
            },
            attributes: ['id', 'nombre', 'descripcion'],
            order: [['nombre', 'ASC']]
        });



        //contar productos activos con stock para cada subcategoria
        const subcategoriasConConteo = await Promise.all (
            subcategorias.map(async(subcategoria) => {
            const totalProductos = await Producto.count({
                where: {
                    subcategoriaId: subcategoria.id,
                    activo: true,
                    stock: {[Op.gt]: 0}
                }

            });
            return {
                ...subcategoria.toJSON(),
                totalproductos
            };


        })

        );

        //respuesta exitosa

        res.json({
            success: true,
            data: {
                categoria: {
                    id: categoria.id,
                    nombre: categoria.nombre
                },
                subcategorias: subcategoriasConConteo
            }
        });
        


    } catch (error) {
        console.error('error en getSubcategoriasPorCategorias:', error);
        res.status (500).json({
            success: false,
            message: 'error al obtener subcategorias', error: error.message
        })
    }
};
/**
 * obtener productos destacados
 * GET /api/admin/catalogo/destacadpos
 *
 * @param {Object} req request express
 * @param {Object} res response express
 */

const getProductosDestacados = async (req, res) => {
    try {
        const {id} = req.params;
        const { Op } = require('sequelize');

        //obtener productos mas recientes
        const productos = await Producto.findAll({
            where: {
                activo: true,
                stock: {[Op.gt]: 0}
            },

            include: [
                {
                    model: Categoria,
                    as: 'categoria',
                    attributes: ['id', 'nombre'],
                    where: { activo: true}
                },
                {
                    model: Subcategoria,
                    as:'subcategoria',
                    attributes: ['id', 'nombre'],
                    where: { activo: true}
                    
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limite)
        });

        //respuesta exitosa

        res.json({
            success: true,
            data: {
                productos
            }
        });
        


    } catch (error) {
        console.error('error en getProductosDestacados:', error);
        res.status (500).json({
            success: false,
            message: 'error al obtener productos destacados', error: error.message
        })
    }
};



//exportar todos los controladores
module.exports = {
    getProductos,
    getProductosById,
    getCategorias,
    getSubcategoriasporcategorias,
    getProductosDestacados,
};