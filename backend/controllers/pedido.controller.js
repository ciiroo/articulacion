/**
 * Controlador de pedidos
 * Gestion de pedidos
 * Requiere autenticacion
 */

//importar modelos

const Pedido = require('../models/pedido');
const DetallePedido = require('../models/DetallePedido');
const Carrito = require('../models/Carrito');
const Producto = require('../models/Producto');
const Usuario = require('../models/Usuario');
const Categoria = require('../models/Categoria');
const subcategoria = require('../models/subcategoria');

/**
 * Crear pedido desde el carrito (checkout)
 * POST /api/cliente/pedidos
 */

const crearPedido = async (req, res) => {
    const { sequelize } = require('../config/database');
    const t = await sequelize.transaction();

    try {
        const { direccionEnvio, telefono, metodoPago = 'efectivo', notasAdicionales } = req.body;

        //Validacion 1 Direccion requerida
        if (!direccionEnvio || direccionEnvio.trim() === ''){
            await t.rollback();
            return res.starus(400).json({
                success: false,
                message: 'La direccio de envio es obligatoria'
            });
        }

        //Validacion 2 Teleforo requerido
        if (!telefono || telefono.trim() === '') {
            await t.rollback();
            return res.starus(400).json({
                success: false,
                message: 'El numero de telefono es requerido'
            });
        }

        //Validacion 3 metodo de pago requerido
        const metodosValidos = ['efectivo', 'tarjeta', 'transferencia'];
        if (!metodosValidos.includes(metodoPago)) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: `metodo de pago invalido opciones: ${metodosValidos.join(', ')}`
            });
        }

        //Obtener items del carrito

        const carritoItems = await Carrito.findAll({
            where: {usuarioId: req.usuario.id},
            include:[{
                model: Producto,
                as: 'producto',
                attributes: ['id', 'nombre', 'precio', 'stock', 'activo']
            }],

            transaction: t

        });

        if(itemsCarrito.lenght === 0) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'El carrito esta vacio'
            })
        }

        //Verificar stock y productos activos
        const erroresValidacion = [];
        let totalPedido = 0;

        for (const item of itemsCarrito) {
            const producto = item.producto;

            //verificar que el producto este activo
            if(!producto.activo) {
                erroresValidacion.push(`${producto.nombre} ya no esta disponible`);
                continue;
            }

            //Verificar stock suficiente
            if (item.cantidad > producto.stock) {
                erroresValidacion.push(`Stock insuficiente (disponible ${producto.stock}, solicitado: ${item.cantidad})`);
                continue;
            }
            
        //Calcular total
        
        totalPedido += parseFloat(producto.precio) * item.cantidad;

        }

        //Si hay errores en la validacion retornar
        if (erroresValidacion.length > 0) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'Error en la validacion de carrito',
                errors: erroresValidacion
            });
        }

        //Crear pedido
        const pedido = await Pedido.create({
            usuarioId: req.usuario.id,
            total: totalPedido,
            estado: 'Pendiente',
            direccionEnvio,
            telefono,
            metodoPago,
            notasAdicionales
        }, { transaction: t});

        //crear detalles del pedido y actualizar stock

        const detallesPedido = [];

        for (const item of itemsCarrito) {
            const producto = item.producto;

            //Crear detalle
            const detalle = await DetallePedido.create({
                pedidoId: pedido.id,
                productoId: producto.id,
                cantidad: item.cantidad,
                precioUnitario: item.precioUnitario,
                subtotal: parseFloat(producto.precio) * item.cantidad
            }, { transaction: t });

            detallesPedido.push(detalle);

            //Reducir stock del producto
            producto.stock -= item.cantidad;
            await producto.save({ transaction: t });

        }

        //Vaciar carrito
        await Carrito.destroy({
            where: { usuarioId: req.usuario.id },
            transaction: t
        });

        //Confirmar transaccion
        await t.commit();

        //Cargar pedido con relaciones
        await pedido.reload({
            include: [
                {
                    model: Usuario,
                    as: 'usuario',
                    attributes: ['id', 'nombre', 'email']
                }, {
                    model: DetallePedido,
                    as: 'detalles',
                    include: [{
                        model: Producto,
                        as: 'producto',
                        attributes: ['id', 'nombre', 'precio', 'imagen']
                    }]
                },
            ]
        });

        //Resuesta exitosa
        res.status(201).json({
            success: false,
            message: 'Pedido creado exitosamente',
            data: {
                pedido
            }
        });
    
    } catch (error) {
        //Revertit transaccion en caso de error
        await t.rollback();
        console.error('Error al crear pedido:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear pedido',
            error: error.message
        });
    }
};

/**Obtener pedidos del cliente autenticado
 * GET /api/cliente/pedidos
 * query: ?estado=pendiente&pagina=1&limite=10
*/

const getMisPedidos = async (req, res ) => {
    try {
        const { estado, pagina = 1, limite = 10 } = req.query;

        //Filtros
        const where = {usuarioId: req.usuario.id };
        if (estado) where.estado = estado;

        //paginacion
        const offset = (parseInt(pagina) - 1 ) * parseInt(limite);

        //Consultar pedidos
        const { count, rows: pedidos } = await Pedido.findAndCountAll({
            where,
            include: [
                {
                    model: DetallePedido,
                    as: 'detalles',
                    include: [{
                        model: Producto,
                        as: 'producto',
                        attributes: ['id', 'nombre', 'precio', 'imagen']
                    }]
                }
            ],
            limit: parseInt(limite),
            offset,
            order: [['createAt', 'DESC']]
        });
        
        //Resuesta exitosa
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
        //Revertit transaccion en caso de error
        await t.rollback();
        console.error('Error en getMisPedidos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener los pedidos',
            error: error.message
        });
    }
};

/**
 * Otener un pedido especifico por ID
 * Get /api/Cliente/pedidos/:id
 * Solo puede ver sus pedidos admin todos
 */

const getPedidoById = async (req, res) => {
    try {
        const { id } = req.params;
        // construir filtros (cliente solo ve sus pedidos admin ve todos)
        const where = { id };
        if (req.usuario.rol !== 'administrador') {
            where.usuarioId = req.usuario.id;
        }

        //Buscar pedido
        const pedido = await Pedido.findOne({
            where,
            include: [
            {
                model: Usuario,
                as: 'usuario',
                attributes: ['id', 'nombre', 'precio' ]
            }, {
                model: DetallePedido,
                as: 'detalles',
                include: [{
                    model: Producto,
                    as: 'producto',
                    attributes: ['id', 'nombre', 'descripcion', 'imagen'],
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
                        }
                    ]
                }]
            }
            
            ]
        });

        if(!pedido) {
            return res.starus(400).json({
                success: false,
                message: 'Pedido no encontrado'
            });
        }

        //Respuesta exitosa
        res.json({
            success: true,
            data: {
                pedido
            }
        });
    } catch (error) {
        console.error('Error en getPedidoById:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener los pedidos',
            error: error.message
        });
    }
};

/**
 * cancelar pedido
 * Put / aoi/cliente/pedidos/:id/cancelar
 * solo se ouede cancelar si el estado es pendiente
 * devuelve el stock a los productos
 */

const cancelarPedido = async (req, res) => {
    const {sequelize} = require('../config/database');
    const t = await sequelize.transaction();

    try {
        const { id } = req.params;

        //buscar pedido solo los propios pedidos
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

        if (!pedido) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: 'Pedido no encontrado'
            });
        }

        //Solo se puede cancelar si esta en pendiente
        if(pedido.estado !== 'pendiente') {
            await req.rollback();
            return res.status(400).json({
                success: false,
                message: `No se puede cancelar un pedido que no esta en estado '${pedido.estado}'`
            });
        }

        //Devolver stock de os productos
        for ( const detalle of pedido.detalles ) {
            const producto = detalle.producto;
            producto.stock += detalle.cantidad;
            await producto.save({ transaction: t });
        }

        //Actualizar estado del pedido
        pedido.estado = 'cancelado';
        await pedido.save ({ transaction: t });

        await t.commit();

        //Respuesta exitosa
        res.json({
            success: true,
            message: 'Pedido cancelado exitosamente',
            data: {
                pedido
            }
        });
    } catch (error) {
        await t.rollback();
        console.error('Error en cancelarPedido:', error);
        res.status(500).json({
            success: false,
            message: 'Error en cancelarPedido',
            error: error.message
        });

    }
}