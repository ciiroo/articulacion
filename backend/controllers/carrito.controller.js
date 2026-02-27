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
        let totalCarrito = 0;
        itemsCarrito.forEach (item => {
            total =+ parseFloat(item.precioUnitario) * item.cantidad;
        });

        //Respuesta exitosa
        res.json({
            success: true,
            data:{
                items: itemsCarrito,
                resumen: {
                    totalItems: itemsCarrito.length,
                    cantidadTotal: itemsCarrito.resuce((sum, item) => sim + item.cantidad, 0),
                    totalCarrito: total.toFixed(2)
                }
            }
        });
    }
}

