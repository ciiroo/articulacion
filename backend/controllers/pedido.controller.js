/**
 * Controlador de pedidos
 * Gestion de pedidos
 * requiere autenticacion
 */

//Importar modelos

const Pedido = require('../models/pedido');
const DetallePedido = require('../models/DetallePedido');
const Carrito = require('../models/Carrito');
const Producto = require('../models/Producto');
const Usuario = require('../models/Usuario');
const Categoria = require('../models/Categoria');
const Subcategoria = require('../models/subcategoria');

/**
 * Crear pedido desde el carrito (checkout)
 * POST /api/cliente/pedidos
 */

const crearPedido = async (req, res) => {
    const {sequelize} = require('../config/database')
    const t = await sequelize.transaccion();

    try {
        const { direccionEnvio, telefono, metodoPago = 'efectivo', notasAdicionales } = req.body;

        //Validacion 1 Direccion requerida

        if (!direccionEnvio || direccionEnvio.trim() === '')
            
            {
            await t.rolback();
            return res.status(400).json({
                success: false,
                message: 'Direccion de envio es requerida'
            });
        }


        //Validacion 2 Telefono
        if (!telefono || telefono.trim() === '')  {
            await t.rollback()
            return res.status(400).json({
                success: false,
                message: 'El telefono no es valido'
            });
        }

        //Validacion 3 Metodo de pago
        
        const metodosValidos = ['efectivo', 'tarjeta', 'transferencia'];

        if (!metodosValidos.includes(metodoPago))  {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message:  `metodo de pago invalido, opciones: ${metodosValidos.join(',')}`
            });
        }

        // obtener items del carrito

        const itemsCarrito = await Carrito.findAll({
            where: {
                usuarioId: req.user.usuarioId
            },
            include: [{
                model: Producto,
                as: 'producto',
                atributes: ['id', 'nombre', 'precio', 'stock', 'activo']
            }],
            transaction: t
        });

        if (itemsCarrito.length === 0) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'El carrito esta vacio'
            });
        }

        //Verificar stock y productos activos
        const erroresValidacion = [];
        let totalPedido = 0;

        for (const item of itemsCarrito) {
            const producto = item.producto;

            // verificar que el producto este activo
            if (!producto.activo) {
                erroresValidacion.push(`${producto.nombre} ya no esta disponible` );
                continue;
            }

            //verificar stock suficiente
            if (item.cantidad > producto.stock){
                erroresValidacion.push (`
                    ${producto.nombre} stock insuficiente (disponible: ${producto.stock}, solicitado: ${item.cantidad})`
                );
                continue;
            }

            //Calcular total
            totalPedido += parseFloat (item.precioUnitario) * item.cantidad;
        }

        // su hay errores de validacion retornar
        if (erroresValidacion.length > 0){
            await t.rollback();
            return res.status(400).json ({
                success: false,
                message: 'Error en la validacion de carrito',
                errores: erroresValidacion
            });
        }

        //crear pedido
        const pedido = await Pedido.create({
            usuarioId: req.usuarioId,
            total: totalPedido,
            estado: 'pendiente',
            direccionEnvio,
            telefono,
            metodoPago,
            notasAdicionales

        
        }, {transaction: t });

        // crear detalle del pedido y actualizar stock

        const detallesPedido = [] ;

        for (const item of itemsCarrito) {
        const producto = item.producto;

         // crear detalle
        const detalle = await DetallePedido.create({
            pedidoId: pedido.id,
            productoId: producto.id,
            cantidad : item.cantidad,
            precioUnitario: item.precioUnitario,
            subtotal: parseFloat (item.precioUnitario) * item.cantidad
        }, { transaction: t });

        detallesPedido.push(detalle);

        //reducir stock del producto
        producto.stock -= item.cantidad;
        await producto.save({ transaction: t });
        }

        // vaciar carrito
        await Carrito.destroy({
            where: {
                usuarioId: req.usuario.id
            },
            transaction: t
        });

        //confirmar transaccion
        await t.commit();
    
        //cargar pedido con relaciones
        await pedido.reload ({
            include: [
                {
                    model: Usuario,
                    as: 'usuario',
                    attributes: ['id','nombre','email']
                },
                {
                    model: DetallePedido,
                    as: 'detalles',
                    include: [{
                        model: Producto,
                        as: 'producto',
                        attributes: ['id', 'nombre', 'precio', 'imagen']
                    }]
                },
            ]
        }),

        //Respuesta exitosa
    

        res.json({
            success: true,
            message: 'Pedido creado exitosamente',
            data: {
                pedido
            }
        });

    } catch (error) {
        //revertir transaccion en caso de error
        await t.rollback();
        console.error('Error al crear pedido', error);
        res.status(500).json({
            success: false,
            message: 'Error cargar pedido con detalles',
            error: error.message
        });





    }
};

/**
 * Obtener pedidos del cliente autenticado
 *  Get/api/cliente/pedidos
 * query: ?estado=pendiente&pagina=1&limite=10
 */

const getMisPedidos = async (req, res ) => {
    try {
        const {estado, pagina =1, limite =10 } = req.query;

        // filtros
        const where = { usuarioId: req.usuario.id };
        if (estado) where.estado = estado;

        //Paginacion

        const offset = (parseInt(pagina) - 1 ) * parseInt (limite);

        //Consultar pedidos
        const { count, rows: pedidos } = await Pedido.findAndCountAll ({
            where,
            include: [
                {
                    model: DetallePedido,
                    as: 'detalles',
                    include: [{
                        model: Producto,
                        as:'producto',
                        attributes: ['id','nombre', 'imagen']

                    }]
                }
            ],

            limit: parseInt(limite),
            offset,
            order: [['createdAt', 'DESC']]
        });

        // Respuesta exitosa

            res.json({
                success: true,
                data: {
                    pedidos,
                    paginacion: {
                        total: count,
                        pagina: parseInt(pagina),
                        limite: parseInt(limite),
                        totalPaginas: Math.ceil(count / parseInt(limite))
                    }
                }
            });

    } catch (error) {
        console.error('Error en getMisPedidos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener los pedidos',
            error: error.message
        });

        
    }
};

/**
 * Obtener un pedido especifico por ID
 * Get /api / cliente / pedidos / :id
 * solo puede ver sus pedidos admin todos
 */

const getPedidoById = async (rec , res ) => {
    try{
        const { id } = req.params;
        // construir filtros (cliente solo ve pedido admin ve todos)
        const where = {id};
        if (req.usuario.rol !== 'administrador'){

            where.usuarioId
        }

        //Buscar pedido
        const pedido = await Pedido.findOne({
            where,
            include: [
                {
                    model: Usuario,
                    as: 'usuario',
                    attributes : ['id', 'nombre', 'email']
                },
                {
                    model: DetallePedido,
                    as: 'detalles',
                    include: [{
                        model: Producto,
                        as:'producto',
                        attributes: ['id', 'nombre', 'descripcion', 'imagen'],
                        include:[
                            {
                                model: Categoria,
                                as: 'categoria',
                                attribute: ['id', 'nombre']
                            },
                            {
                                model: Subcategoria,
                                as: 'subcategoria',
                                attribute: ['id', 'nombre']
                            }
                        ]
                    }]
                }


            ]
        });

        if (!pedido) {
            return res.status(404).json({
                success: false,
                message: 'pedido no encontrado'
            });
        }

        //respuesta exitosa

        res.json ({
            success: true,
            data: {
                pedido

            }
        });


        } catch (error) {
        console.error('Error en getPedidoById', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener los pedidos',
            error: error.message
        });
    }
};

/**
 * Cancelar el pedido
 * Put / api / cliente / pedidos / :id / cancelar
 * solo se puede cancelar un pedido si el estado es pendiente
 * devuelve el stock a los productos
 */

const cancelarPedido = async (req , res ) => {
    const { sequelize } = require ('../config/database')
    const t = await sequelize.transaction ();
    try {
        const {id} = req.params;

        //Buscar pedido solo los propios
        const pedido = await Pedido.findOne({
            where: {
                id,
                usuarioId: req.usuario.id
            },
            include: [{
                model: DetallePedido,
                as: 'detalles',
                include: [{
                    model: Producto,
                    as: 'producto',

                }]
            }],
            transaction: t
        });

        if (!pedido ) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: 'Pedido no encontrado'
        });
    }
    // solo se puede cancelar si esta en pendiente
    if (pedido.estado !== 'pendiente') {
        await t.rollback();
        return res.status(400).json({
            success: false,
            message:  `no se puede cancelar un pedido en estado '¿${pedido.estado}'`
        });
    }

    //Devolver stock de los productos
    for (const detalle of pedido.detalles) {
        const producto = detalle.producto;
        producto.stock += detalle.cantidad;
        await producto.save({ transaction: t });
    }

    //Actualizar estado del pedido
    pedido.estado = 'cancelado';
    await pedido.save({transaction: t});
    await t.commit();

    //Respuesta exitosa

        res.json ({
            success: true,
            message: 'Pedido cancelado exitosamente',
            data: {
                pedido
            }
        });

        } catch (error) {
            await t.rollback();
        console.error('Error en cancelarPedido', error);
        res.status(500).json({
            success: false,
            message: 'Error al cancelar pedido',
            error: error.message
        });

    }
};

/**
 * Adminobtener todos los pedidos
 * get /api/admin/pedidos
 *  * query ?estado=pendiente&usuarioId=1&pagina=1&limite=10
 */

const getAllPedidos = async (req, res) => {
    try {
        const {estado, usuarioId, pagina =1, limite =20 } =req.query;

        //filtros
        const where = {};
        if (estado) where.estado = estado;
        if (usuarioId) where.usuarioId = usuarioId;


        //paginacion
        const offset = (parseInt(pagina) - 1) * parseInt(limite);

        //Consultar pedidos
        const { count, rows: pedidos } = await Pedido.findAndCountAll({
            where,
            include: [{
                model: Usuario,
                as: 'usuario',
                attributes: ['id', 'nombre', 'email']
            },
            {model: DetallePedido,
                as: 'detalle_pedidos',
                include: [{
                    model: Producto,
                    as: 'producto',
                    attributes: ['id', 'nombre', 'imagen']
                }]
            },
        ],

        limit: parseInt(limite),
        offset,
        order: [['createdAt', 'DESC']]

        });

        //Respuesta exitosa
        res.json({
            success: true,
            message: 'Pedidos obtenidos exitosamente',
            data: {
                pedidos,
                paginacion: {
                    total: count,
                    pagina: parseInt(pagina),
                    limite: parseInt(limite),
                    totalPaginas: Math.ceil(count / parseInt(limite))
                }
            }
        });


    }catch (error) {
        console.error('Error en getAllPedidos', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener los pedidos',
            error: error.message
        });
    }
};

/**
 * admin acrualizar estado del pedido
 * PUT /api/admin/pedidos/:id/estado
 * body { estado }
 */

const actualizarEstadoPedido = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        // validar estado
        const estadosValidos = ['pendiente', 'enviado', 'entregado', 'cancelado'];
        if (!estadosValidos.includes(estado)){
            return res.status(400).json({
                success: false,
                message: `Estado invalido, opciones: ${estadosValidos.join(',')}`
            })
        }

        //Buscar pedido
        const pedido = await pedido.findByPk(id);
        if (!pedido) {
            return res.status(404).json({
                success: false,
                message: 'Pedido no encontrado'
            })
        }

        //Actualizar estados
        pedido.estado = estado;
        await pedido.save();

        //Recargar con relaciones
        await pedido.reload({
            include: [{
                model: Usuario,
                as: 'usuario',
                attributes: ['id', 'nombre', 'email']
            }]
        });

        //Respuesta exitosa
        res.json({
            success: true,
            message: 'Estado del pedido actualizado exitosamente',
            data: {
                pedido
            }
        });

        
    }catch (error) {
        console.error('Error en actualizarEstadoPedido', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el estado del pedido',
            error: error.message
        });
    }
};

/**
 * Obtener estadisticasdelos pedidos
 * Get /api/admin/pedidos/estadisticas
 */

const getEstadisticasPedidos = async (req, res) => {
    try {
        const { op, fn, col } = require('sequelize');

        //Total pedidos
        const totalPedidos = await Pedido.count();

        //Pedidos estado
        const pedidosPorEstado = await Pedido.findAll({
            attribute: [
                'estado',
                [fn('COUNT', col('id')), 'cantidad'],
                [fn('SUM', col('total')), 'totalVentas']
            ],
            group: ['estado']
        });

        //Total ventas
        const totalVentas = await Pedido.sum('total');

        //Pedidos hoy
        const hoy = new Date();
        hoy,setHours(0, 0, 0, 0);

        const pedidosHoy = await Pedido.count({
            where: {
                createAt: {[Op.gte]: hoy} //Pedidos ultimos 7 dias
            }
        });

        //Respuesta exitosa
        res.json({
            success: true,
            data: {
                totalPedidos,
                pedidosHoy,
                ventasTotales: parseFloat(totalVentas || 0).toFixed(2),
                pedidosPorEstado: pedidosPorEstado.map(p => ({
                    estado: p.estado,
                    cantidad: parseInt(p.gerDataValue('cantidad')),
                    totalVentas: parseFloat(p.getDataValue('totalVentas') || 0).toFixed(2)
                }))
            }
        });
        
    }catch (error) {
        console.error('Error en getEstadisticasPedidos', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadisticas de pedidos',
            error: error.message
        });
    }
};

//Exportar controlladores
module.exports = {
    crearPedido,
    getMisPedidos,
    getPedidoById,
    cancelarPedido,
    //admin
    getAllPedidos,
    actualizarEstadoPedido,
    getEstadisticasPedidos
};
