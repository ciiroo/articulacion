/**
 * Rutas del administrador
 * agrupa todas las rutas de gestion del admin
 */


const express = require ('express');
const router = express.Router();

// importar los middlewares

const { verificarAuth } = require ('../middleware/auth');
const { esAdministrador, esAdminOAuxiliar, soloAdministrador } = require ('../middleware/checkRole');

// importar configuracion de multer para la subida de imagenes

const { upload } = require ('../config/multer');

//importar controladores

const categoriaController = require ('../controllers/categoria.controller');
const subcategoriaController = require ('../controllers/subcategoria.controller');
const productoController = require ('../controllers/producto.controller');
const usuarioController = require ('../controllers/usuario.controller');
const pedidoController = require ('../controllers/pedido.controller');

// restricciones
router.use(verificarAuth, esAdminOAuxiliar);

//Rutas de categorias
// get /api/admin/categorias
router.get('/categorias', categoriaController.getCategorias);

// get /api/admin/categorias
router.get('/categorias/:id', categoriaController.getCategoriasById);

// get /api/admin/categorias/:id/stats
router.get('/categorias:id/stats', categoriaController.getEstadisticasCategoria);

// POST /api/admin/categorias
router.post('/categorias', categoriaController.crearCategoria);

// PUT /api/admin/categorias
router.put('/categorias', categoriaController.actualizarCategoria);

// patch /api/admin/categorias:id / toggle desactivar o activar categoria
router.patch('/categorias', categoriaController.toggleCategoria);

// delete /api/admin/categorias
router.get('/categorias/:id', categoriaController.eliminarCategoria);



//Rutas de subcategorias
// get /api/admin/subcategorias
router.get('/subcategorias', subcategoriaController.getSubcategorias);

// get /api/admin/subcategorias
router.get('/subcategorias/:id', subcategoriaController.getSubcategoriaById);

// get /api/admin/subcategorias/:id/stats
router.get('/subcategorias:id/stats', subcategoriaController.getEstadisticasSubcategoria);

// POST /api/admin/subcategorias
router.post('/subcategorias', subcategoriaController.crearSubcategoria);

// PUT /api/admin/subcategorias
router.put('/subcategorias', subcategoriaController.actualizarSubcategoria);

// patch /api/admin/subcategorias:id / toggle desactivar o activar categoria
router.patch('/subcategorias', subcategoriaController.toggleSubcategoria);

// delete /api/admin/subcategorias
router.get('/subcategorias/:id', subcategoriaController.eliminarSubcategoria);


//Rutas de producto
// get /api/admin/productos
router.get('/productos', productoController.getProductos);

// get /api/admin/productos
router.get('/productos/:id', productoController.getProductosById);

// get /api/admin/productos/:id/stats
//router.get('/productos:id/stats', productoController.getEstadisticasProducto);

// POST /api/admin/productos
router.post('/productos', productoController.crearProducto);

// PUT /api/admin/productos /stock
router.put('/productos', productoController.actualizarProducto);

// patch /api/admin/productos:id / stock
router.patch('/productos', productoController.toggleProducto);

// delete /api/admin/productos/:id
router.get('/productos/:id', productoController.eliminarProducto);



//Rutas de usuario
// get /api/admin/usuarios
router.get('/usuarios/estadisticas', usuarioController.getEstadisticasUsuarios);

router.get('/usuarios', usuarioController.getUsuarios);

// get /api/admin/usuarios
router.get('/usuarios/:id', usuarioController.getUsuariosById);

// get /api/admin/usuarios/:id/stats
router.get('/usuarios:id/stats', usuarioController.getEstadisticasUsuarios);

// POST /api/admin/usuarios
router.post('/usuarios', soloAdministrador, usuarioController.crearUsuario);

// PUT /api/admin/usuarios
router.put('/usuarios/:id', soloAdministrador, usuarioController.actualizarUsuario);

// patch /api/admin/usuario:id / toggle desactivar o activar usuario
router.patch('/usuarios/:id/toggle', soloAdministrador, usuarioController.toggleUsuario);

// delete /api/admin/usuario
router.get('/usuarios/:id', soloAdministrador, usuarioController.eliminarUsuario);


//Rutas de pedidos
// get /api/admin/pedidos/estadistias
router.get('/pedidos/estadisticas', pedidoController.getEstadisticasPedidos);

// get /api/admin/pedidos
router.get('/pedidos/:id', pedidoController.getAllPedidos);

// get /api/admin/pedidos/:id
router.get('/categorias:id/stats', pedidoController.getPedidoById);

// PUT /api/admin/pedidos/:id/estado
router.put('/pedidos/:id/estado', pedidoController.actualizarEstadoPedido);


module.exports = router;