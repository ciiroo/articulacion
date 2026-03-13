/**
 * Rutas del cliente
 * rutas publicas y para los clientes autenticados
 */


const express = require ('express');
const router = express.Router();

// importar los middlewares

const { verificarAuth } = require ('../middleware/auth');
const { esCliente } = require ('../middleware/checkRole');

//importar controladores

const catalogoController = require ('../controllers/catalogo.controller');
// Rutas públicas de catálogo (ahora accesibles bajo /api/catalogo y /api/cliente)
// GET /api/catalogo/productos
router.get('/productos', catalogoController.getProductos);

// GET /api/catalogo/productos/:id
router.get('/productos/:id', catalogoController.getProductosById);

// GET /api/catalogo/categorias
router.get('/categorias', catalogoController.getCategorias);

// GET /api/catalogo/categorias/:id/subcategorias
router.get('/categorias/:id/subcategorias', catalogoController.getSubcategoriasporcategorias);

// POST /api/catalogo/destacados
router.post('/destacados', catalogoController.getProductosDestacados);
const carritoController = require ('../controllers/carrito.controller');
const pedidoController = require ('../controllers/pedido.controller');


// Rutas públicas de catálogo movidas a catalogo.routes.js


//Rutas de carrito
// get /api/cliente/carrito
router.get('/cliente/carrito',verificarAuth , carritoController.getCarrito);

// POST /api/cliente/carrito
router.post('/cliente/carrito', verificarAuth, carritoController.agregarAlCarrito);

// PUT /api/cliente/carrito/:id
router.put('/cliente/carrito/:id', verificarAuth, carritoController.actualizarItemCarrito);

// delete /api/cliente/carrito/:id
//Eliminar un item del carrito
router.delete('/cliente/carrito/:id', verificarAuth, carritoController.elimintarItemCarrito);

// delete /api/cliente/carrito/:id/vaciar carrito
router.delete('/cliente/carrito', verificarAuth, carritoController.vaciarCarrito);


//Rutas de  p -cliente

// POST /api/admin/productos
router.post('cliente/pedidos', verificarAuth, pedidoController.crearPedido);

// GET /api/cliente/pedidos
router.put('/cliente/pedidos', verificarAuth, pedidoController.getMisPedidos);

// GET /api/cliente/pedidos/:id
router.patch('/cliente/pedidos/:id', verificarAuth, pedidoController.getPedidoById);

// PUT /api/cliente/pedidos/:id/cancelar
router.put('/cliente/pedidos/:id/cancelar', verificarAuth, pedidoController.cancelarPedido);


module.exports = router;