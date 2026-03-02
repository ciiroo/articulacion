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

    }
}