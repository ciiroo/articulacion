/**
 * Asociacion entre modelos
 * este archivo define todas las relaciones entre los modelos de sequelize
 * Debe ejecutarse despues de importar los modelos
 */

//importar todos los modelos

const Usuario = require('./Usuario');
const Categoria = require('./Categoria');
const subcategoria = require('./subcategoria');
const Producto = require('./Producto');
const Carrito = require('./Carrito');
const Pedido = require('./pedido');
const DetallePedido = require('./DetallePedido');
const Pedido = require('./pedido');

/**
 * Definir asociaciones
 * Tipos de relaciones sequelize:
 * hasone 1 - 1
 * belongsto 1 - 1
 * hasmany 1 - N
 * belongstomany N - N
 */

/**
 * Categoria - Subcategoria
 * Una categoria tiene muchas subcategorias
 * Una subcategoria le ertenece a una Categoria
 */

Categoria.hasMany(subcategoria, { foreignKey: 'categoriaId', //campo que conecta las tablas
    as: 'subcategorias', //Alias para la relacion
    onDelete: 'CASCADE', //si elimina categoria elimina subcategorias
    onUptade: 'CASCADE' //Si se actualiza categoria se actualiza subcategorias
});

subcategoria.belongsTo(Categoria, { foreignKey: 'categoriaId', //campo que conecta las tablas
    as: 'categoria', //Alias para la relacion
    onDelete: 'CASCADE', //si elimina categoria elimina subcategorias
    onUptade: 'CASCADE' //Si se actualiza categoria se actualiza subcategorias
});

/**
 * Categoria - Producto
 * Una categoria tiene muchos productos
 * Un producto pertenece a una categoria
 */

Categoria.hasMany(Producto, { foreignKey: 'categoriaId', //campo que conecta las tablas
    as: 'productos', //Alias para la relacion
    onDelete: 'CASCADE', //si elimina categoria elimina el producto
    onUptade: 'CASCADE' //Si se actualiza categoria se actualiza subcategorias
});

Producto.belongsTo(Categoria, { foreignKey: 'categoriaId', //campo que conecta las tablas
    as: 'categoria', //Alias para la relacion
    onDelete: 'CASCADE', //si elimina categoria elimina el producto
    onUptade: 'CASCADE' //Si se actualiza categoria se actualiza subcategorias
});

/**
 * Subategoria - Producto
 * Una Subcategoria tiene muchas Productos
 * Una Producto le ertenece a una Subcategoria
 */

subcategoria.hasMany(Producto, { foreignKey: 'subcategoriaId', //campo que conecta las tablas
    as: 'productos', //Alias para la relacion
    onDelete: 'CASCADE', //si elimina subcategoria elimina el producto
    onUptade: 'CASCADE' //Si se actualiza categoria se actualiza subcategorias
});

Producto.belongsTo(subcategoria, { foreignKey: 'subcategoriaId', //campo que conecta las tablas
    as: 'subcategoria', //Alias para la relacion
    onDelete: 'CASCADE', //si elimina categoria elimina subcategorias
    onUptade: 'CASCADE' //Si se actualiza subcategoria se actualiza el producto
});

/**
 * Usuario - Carrito
 * Un Usuario tiene muchos carritos
 * Un carrito pertenece a un usuario
 */

Usuario.hasMany(Carrito, { foreignKey: 'usuarioId', //campo que conecta las tablas
    as: 'carrito', //Alias para la relacion
    onDelete: 'CASCADE', //si elimina usuario elimina carrito
    onUptade: 'CASCADE' //Si se actualiza usuario se actualiza carrito
});

Carrito.belongsTo(Usuario, { foreignKey: 'usuarioId', //campo que conecta las tablas
    as: 'usuario', //Alias para la relacion
    onDelete: 'CASCADE', //si elimina usuario elimina carrito
    onUptade: 'CASCADE' //Si se actualiza usuario se actualiza carrito
});

/**
 * Producto - Carrito
 * Un producto tiene muchos carritos
 * Un carrito le pertenece a un producto
 */

Producto.hasMany(Carrito, { foreignKey: 'productoId', //campo que conecta las tablas
    as: 'carrito', //Alias para la relacion
    onDelete: 'CASCADE', //si elimina producto elimina carritos
    onUptade: 'CASCADE' //Si se actualiza producto se actualiza carritos
});

Carrito.belongsTo(Producto, { foreignKey: 'productoId', //campo que conecta las tablas
    as: 'producto', //Alias para la relacion
    onDelete: 'CASCADE', //si elimina producto elimina carrito
    onUptade: 'CASCADE' //Si se actualiza producto se actualiza carrito
});

/**
 * Usuario - Pedido
 * Un Usuacrio tiene muchos pedidos
 * Un pedido le pertenece a un usuario
 */

Usuario.hasMany(Pedido, { foreignKey: 'pedidoId', //campo que conecta las tablas
    as: 'pedidos', //Alias para la relacion
    onDelete: 'RESTRICT', //si elimina usuario NO elimina el pedido
    onUptade: 'CASCADE' //Si se actualiza usuario se actualiza pedido
});

Pedido.belongsTo(Usuario, { foreignKey: 'usuarioId', //campo que conecta las tablas
    as: 'usuario', //Alias para la relacion
    onDelete: 'RESTRICT', //si elimina usuario NO elimina el pedido
    onUptade: 'CASCADE' //Si se actualiza usuario se actualiza pedido
});

/**
 * Pedido - Detallepedido
 * Un pedido tiene muchos detalles de productos
 * Un detalle de pedido pertenece a un pedido
 */

Pedido.hasMany(DetallePedido, { foreignKey: 'pedidoId', //campo que conecta las tablas
    as: 'detalle_pedidos', //Alias para la relacion
    onDelete: 'CASCADE', //si elimina pedido elimina detallepedido
    onUptade: 'CASCADE' //Si se actualiza pedido se actualiza detallepedido
});

DetallePedido.belongsTo(Pedido, { foreignKey: 'pedidoId', //campo que conecta las tablas
    as: 'pedido', //Alias para la relacion
    onDelete: 'CASCADE', //si elimina pedido elimina detallepedido
    onUptade: 'CASCADE' //Si se actualiza pedido se actualiza detallepedido
});

/**
 * Peroducto - Detallepedidos
 * Un Producto tiene muchos Detalles de pedido
 * Un Detalle de pedido le pertenece a un Producto
 */

Producto.hasMany(DetallePedido, { foreignKey: 'productoId', //campo que conecta las tablas
    as: 'detallespedidos', //Alias para la relacion
    onDelete: 'RESTRICT', //no se puede eliminar un producto su eta en un detalle de pedido
    onUptade: 'CASCADE' //Si se actualiza producto se actualiza detalles de pedido
});

DetallePedido.belongsTo(Producto, { foreignKey: 'productoId', //campo que conecta las tablas
    as: 'producto', //Alias para la relacion
    onDelete: 'RESTRICT', //no se puede eliminar un producto su eta en un detalle de pedido
    onUptade: 'CASCADE' //Si se actualiza producto se actualiza detalles de pedido
});

/**
 * relacion muchos a muchos
 * pedido y producto tienen una relacion muchos a muchos atravez de detalle pedido
 */

Pedido.belongsTo(Producto, {
    through: DetallePedido, //campo que conecta las tablas
    foreignKey: 'pedidoId', // Campo que conecta las tablas
    otherKey: 'productoId', //
    as: 'productos', //Alias para la relacion
});

Producto.belongsTo(Pedido, {
    through: DetallePedido, //campo que conecta las tablas
    foreignKey: 'productoId', // Campo que conecta las tablas
    otherKey: 'pedidoId', //
    as: 'pedidos', //Alias para la relacion
});

/**
 * Exportar funcion de inicializacion
 * funcion para inicializar todas las asociaciones
 * se llama desde server.js despues de cargar los modelos
 */

const initAssociations = () => {
    console.log('Asociaciones entre los modelos establecidos correctamente');
};

//Exportar los modelos
module.exports = {
    Usuario,
    Categoria,
    subcategoria,
    Producto,
    Carrito,
    Pedido,
    DetallePedido,
    initAssociations
};

