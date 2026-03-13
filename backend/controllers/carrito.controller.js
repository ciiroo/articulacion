/**
 * Controlador para el carrito de compras
 * Gestion de carrito
 * Requiere autenticacion
 */

//importar modelos
const Carrito = require('../models/Carrito')
const Producto = require('../models/Producto')
const Categoria = require('../models/Categoria')
const subcategoria = require('../models/subcategoria')

/**
 * Obtener carrito del usuario autenticado
 * GET /api/carrito
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

const getCarrito = async (req, res) => {
    try{
        const itemsCarrito = await Carrito.findAll({
            where: {usuarioId: req.usuario.id },
            include: [
                {
                    model: Producto,
                    as: 'producto',
                    attributes: ['id', 'nombre', 'descripcion', 'precio', 'stock', 'imagen', 'activo'],
                    include: [
                        {
                            model: Categoria,
                            as: 'categoria',
                            attributes: ['id', 'nombre']
                        },
                        {
                            model: subcategoria,
                            as: 'subcategoria',
                            attributes: ['id', 'nombre']
                        },
                    ]
                }
            ],
            order: [['createAt', 'DESC']]
        });

        //Calcular el total del carrito
        let total = 0;
        itemsCarrito.forEach (item => {
            total += parseFloat(item.precioUnitario) * item.cantidad;
        });

        //Respuesta exitosa
        res.json({
            success: true,
            data:{
                items: itemsCarrito,
                resumen: {
                    totalItems: itemsCarrito.length,
                    cantidadTotal: itemsCarrito.resuce((sum, item) => sum + item.cantidad, 0),
                    total: total.toFixed(2)
                }
            }
        });
    } catch (error) {
        console.error('Error en getCarrito', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el carrito',
            error: error.message
        })
    }
};

/**
 * Agregar producto a carrito
 * POST /api/carrito
 * @param {Object} req request de Express
 * @param {Object} res response de Express
 */
const agregarAlCarrito = async (req, res) => {
    try {
        const { productoId, cantidad=1 } = req.body;
        //Validacion 1: campos requeridos
        if (!productoId) {
            return res.status(400).json({
                success: false,
                message: 'El productoId es requerido'
            });
        }

        //Validacion 2 cantidad valida
        const cantidadNum = parseInt(cantidad);
        if (cantidadNum < 1) {
            return res.status(400).json({
                success: false,
                message:'La cantidad debe ser al menos 1'
            });
        }

        //Validacion 3: producto existe y esta activo
        const producto = await Producto.findByPk(productoId);
        if(!producto) {
            return res.status(400).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        if (!producto.activo) {
            return res.status(400).json({
                success: false,
                message: 'El producto no esta disponible'
            });
        }

        //Validacion 4 verificar si ya existe en el carrito
        const itemExistente = await Carrito.findOne({
            where: {
                usuarioId: req.id,
                productoId
            }
        });

        if (itemExistente) {
            //Actualizar cantidad
            const nuevaCantidad = itemExistente.cantidad + cantidadNum;

            //Validar stock disponible
            if (nuevaCantidad > producto.stock) {
                return res.status(400).json({
                    success: false,
                    message: `Stock insufucuente, disponible: ${producto.stock}, en carrito: ${itemExistente.cantidad}`
                });
            }

            itemExistente.cantidad = nuevaCantidad;
            await itemExistente.save();

            //Recargar producto
            await itemExistente.reload({
                include: [{
                    model: Producto,
                    as: 'producto',
                    attributes: ['id', 'nombre', 'precio', 'stock', 'imagen']
                }]
            });

            return res.json({
                success: true,
                message: 'Cantidad actializada en el carrito',
                data: { itemExistente }
            });
        }

        //Validacion 5 stock disponible
        if(cantidadNum > producto.stock) {
            return res.status(400).json({
                success: false,
                message: `Stockinsuficiente. Disponible: ${producto.stock}`
            });
        }

        //Crear un nuevo item en el carrito
        const nuevoItem = await Carrito.create({
            usuarioId: req.usuario.id,
            productoId,
            cantidad: cantidadNum,
            precioUnitario: producto.precio
        });

        //Recargar con producto
        await nuevoItem.reload({
            include: [{
                moder: Producto,
                as: 'producto',
                attributes: ['id', 'nombre', 'precio', 'stock', 'imagen']
            }]
        });

        //respuesta exitosa
        res.status(201).json({
            success: true,
            message: 'Producto agregado al carrito',
            data: {
                item: nuevoItem
            }
        });
    } catch (error) {
        console.error('Error en agregarAlCarrito', error);
        res.status(500).json({
            success: false,
            message:'Error al agregar productos al carrito',
            error: error.message
        });
    }
};

/**
 * Actualizar cantidad de item del carrito
 * PUT /api/carrito/:id
 * Body {cantidad}
 * @param {Object} req request Express
 * @param {Object} res response Express
 */
const actualizarItemCarrito = async (req, res) => {
    try {
        const { id } = req.params;
        const { cantidad } = req.body;

        //validar cantidad
        const cantidadNum = parseInt(cantidad);
        if (cantidadNum < 1 ) {
            return res.status(400).json({
                success: false,
                message: 'La cantidad debe ser almenos 1'
            });
        }

        //Buscar item del carrito
        const item = await Carrito.findOne({
            where: {
                id,
                usuarioId: req.usuario.id //Solo puede modificar su propio carrito
            },
            include: [{
                model: Producto,
                as: 'producto',
                attributes: ['id', 'nombre', 'precio', 'stock',]
            }]
        });
        if(!item) {
            return res.status(400).json({
                success: false,
                message: 'Item del carrito no encontrado'
            });
        }
        //Validar stock disponible
        if (cantidadNum > item.producto.stock) {
            return res.status(400).json({
                success: false,
                message: `Stock insuficiente. Disponible: ${item.producto.stock}`
            });
        }

            //actualizar cantidad
            item.cantidad = cantidadNum;
            await itemm.save();

            //Respuesta exitosa
            res.json({
                success: true,
                message: 'cantidad actualizada',
                data: {
                    item
                }
            });
    } catch (error) {
        console.error('Error en actualizar ItenCarrito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar item del carrito',
            error: error.message
        });
    }
};

/**Eliminar item del carrito
 * Delete /api/carrito/:id
 */

const elimintarItemCarrito = async (req, res ) => {
    try {
        const { id } = req.params;

        //Buscar item
        const item = await Carrito.findOne({
            where: {
                id,
                usuarioId: req.usuario.id
            }
        });

        if (!item) {
            return res.status(404).json({
                success: false,
                message:'Item no encontrado en el carrito'
            });
        }
        //Eliminar item
        await item.destroy();

        //Respuesta exitosa
        res.json({
            success: true,
            message: 'Item eliminado del carrito'
        });

    } catch (error) {
        console.error('Error en eliminarItemCarrito', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar item del carrito',
            error: error.message
        });
    }
};

/**
 * Vaciar todo el carrito
 * DELETE /api/carrito/vaciar
 */

const vaciarCarrito = async (req, res) => {
    try {
        //Eliminar todos los items del usuario
        const itemsEliminados = await Carrito.destroy({
            where: {
                usuarioId: req.usuario.id
            }
        });

        res.json({
            success: false,
            message: 'Carrito vaciado',
            data: {
                itemsEliminados
            }
        });
    } catch (error) {
        console.error('Error en vaciarCarrito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al vaciar carrito',
            error: error.message
        });
    }
};

//Exportar controladores
module.exports = {
    getCarrito,
    agregarAlCarrito,
    actualizarItemCarrito,
    elimintarItemCarrito,
    vaciarCarrito
};