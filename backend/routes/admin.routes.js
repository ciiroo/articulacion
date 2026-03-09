/**
 * Rutas del administrador
 * agrupa todas las rutas de gestion del admin
 */

const express = require('express');
const router = express.Router();

//importar los middleware
const { verificarAuth } = require('../middleware/auth');
const { esAdministrador, esAdminOAuxiliar, soloAdministrador } = require ('../middleware/checkRole');

//importar configuracion de multer para la subida de imagenes
const { upload } = require('../config/multer');

//importar controladores
const categoriaController = require('../controllers/categoria.controller');
const subcategoriaController = require('../controllers/subcategoria.controller');
const productoController = require('../controllers/producto.controller');
const usuarioController = require('../controllers/usuario.controller');
const pedidoController = require('../controllers/pedido.controller');

//restricciones de acceso a las rutas del admin
router.use(verificarAuth, esAdminOAuxiliar);

//Rutas de categorias
//get /api/admin/categorias
router.get('/categorias', categoriaController.getCategorias);

//get /api/admin/categoria:id
router.get('/categorias/:id', categoriaController.getCategoriasById);

//get /api/admin/categorias/:id/stats
router.get('/categorias:id/stats', categoriaController.getEstadisticasCategoria);

//POST /api/admin/categorias
router.post('/categorias', categoriaController.crearCategoria);

//PUT /api/admin/categorias
router.put('/categorias/:id', categoriaController.actualizarCategoria);

//patch /api/admin/categorias:id/toogle desactivar o activar categoria
router.patch('/categorias/:id/toogle', categoriaController.getCategorias);

//delete /api/admin/categorias
router.get('/categorias/:id', soloAdministrador, categoriaController.eliminarCategoria);

//##-----------------------SUBCATEGORIA-----------------------##//

//Rutas de subcategorias
//get /api/admin/subcategorias
router.get('/subcategorias', subcategoriaController.getSubcategorias);

//get /api/admin/subcategoria:id
router.get('/subcategorias/:id', subcategoriaController.getSubcategoriaById);

//get /api/admin/subcategorias/:id/stats
router.get('/subcategorias/:id/stats', subcategoriaController.getEstadisticasSubcategoria);

//POST /api/admin/subcategorias
router.post('/subcategorias', subcategoriaController.crearSubcategoria);

//PUT /api/admin/subcategorias
router.put('/subcategorias/:id', subcategoriaController.actualizarSubcategoria);

//patch /api/admin/subcategorias:id/toogle desactivar o activar subcategoria
router.patch('/subcategorias/:id/toogle', subcategoriaController.getSubcategorias);

//delete /api/admin/subcategorias
router.delete('/subcategorias/:id', soloAdministrador, subcategoriaController.eliminarSubcategoria);

//##-----------------------PRODUCTOS-----------------------##//

//Rutas de productos
//get /api/admin/productos
router.get('/productos', productoController.getProductos);

//get /api/admin/producto:id
router.get('/productos/:id', productoController.getProductoById);
/**
//get /api/admin/productos/:id/stats
router.get('/productos/:id/stats', productoController.getEstadisticasProducto);
*/
//POST /api/admin/productos
router.post('/productos', productoController.crearProducto);

//PUT /api/admin/productos
router.put('/productos/:id', productoController.actualizarProducto);

//patch /api/admin/productos:id/toogle desactivar o activar producto
router.patch('/productos/:id/toogle', productoController.getProductos);

//delete /api/admin/productos
router.delete('/productos/:id', soloAdministrador, productoController.eliminarProducto);

//##-----------------------USUARIOS-----------------------##//

//Rutas de Usuarios
//get /api/admin/usuario
router.get('/usuarios', usuarioController.getUsuarios);

//get /api/admin/usuarios:id
router.get('/usuarios/:id', usuarioController.getUsuariosById);

//get /api/admin/usuarios/:id/stats
router.get('/usuarios:id/stats', usuarioController.getEstadisticasUsuarios);

//POST /api/admin/usuarios
router.post('/usuarios', usuarioController.crearUsuario);

//PUT /api/admin/usuarios
router.put('/usuarios/:id', usuarioController.actualizarUsuario);

//patch /api/admin/usuarios:id/toogle desactivar o activar categoria
router.patch('/usuarios/:id/toogle', usuarioController.getUsuarios);

//delete /api/admin/Usuarios
router.get('/usuarios/:id', soloAdministrador, usuarioController.eliminarUsuario);




