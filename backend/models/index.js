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
const pedido = require('./pedido');

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
    as: 'subcategorias',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

subcategoria.belongsTo(Categoria, { foreignKey: 'categoriaId', //campo que conecta las tablas
    as: 'categoria',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

/**
 * Categoria - Producto
 * Una categoria tiene muchos productos
 * Un producto pertenece a una categoria
 */

Categoria.hasMany(Producto, { foreignKey: 'categoriaId', //campo que conecta las tablas
    as: 'productos',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

Producto.belongsTo(Categoria, { foreignKey: 'categoriaId', //campo que conecta las tablas
    as: 'categoria',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

/**
 * Subategoria - Producto
 * Una Subcategoria tiene muchas Productos
 * Una Producto le ertenece a una Subcategoria
 */

subcategoria.hasMany(Producto, { foreignKey: 'subcategoriaId', //campo que conecta las tablas
    as: 'productos',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

Producto.belongsTo(subcategoria, { foreignKey: 'subcategoriaId', //campo que conecta las tablas
    as: 'subcategoria',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

/**
 * Usuario - Carrito
 * Un Usuario tiene muchos carritos
 * Un carrito pertenece a un usuario
 */

Usuario.hasMany(Carrito, { foreignKey: 'usuarioId', //campo que conecta las tablas
    as: 'carrito',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

Carrito.belongsTo(Usuario, { foreignKey: 'usuarioId', //campo que conecta las tablas
    as: 'usuario',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

/**
 * Producto - Carrito
 * Un producto tiene muchos carritos
 * Un carrito le pertenece a un producto
 */

Producto.hasMany(Carrito, { foreignKey: 'productoId', //campo que conecta las tablas
    as: 'carrito',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

Carrito.belongsTo(Producto, { foreignKey: 'productoId', //campo que conecta las tablas
    as: 'producto',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

/**
 * Usuario - Pedido
 * Un Usuacrio tiene muchos pedidos
 * Un pedido le pertenece a un usuario
 */

Usuario.hasMany(Pedido, { foreignKey: 'pedidoId', //campo que conecta las tablas
    as: 'pedidos',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
});

pedido.belongsTo(Usuario, { foreignKey: 'usuarioId', //campo que conecta las tablas
    as: 'usuario',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
});

/**
 * Pedido - Detallepedido
 * Un pedido tiene muchos detalles de productos
 * Un detalle de pedido pertenece a un pedido
 */

pedido.hasMany(DetallePedido, { foreignKey: 'pedidoId', //campo que conecta las tablas
    as: 'detalle_pedidos',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

DetallePedido.belongsTo(Pedido, { foreignKey: 'pedidoId', //campo que conecta las tablas
    as: 'pedido',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

/**
 * Peroducto - Detallepedidos
 * Un Producto tiene muchos Detalles de pedido
 * Un Detalle de pedido le pertenece a un Producto
 */

Producto.hasMany(DetallePedido, { foreignKey: 'productoId', //campo que conecta las tablas
    as: 'detallespedidos',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
});

DetallePedido.belongsTo(Producto, { foreignKey: 'productoId', //campo que conecta las tablas
    as: 'producto',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
});

/**
 * relacion muchos a muchos
 * pedido y producto tienen una relacion muchos a muchos atravez de detalle pedido
 */

pedido.belongsTo(Producto, {
    through: DetallePedido,
    foreignKey: 'pedidoId',
    otherKey: 'productoId',
    as: 'productos',
});

Producto.belongsTo(Pedido, {
    through: DetallePedido,
    foreignKey: 'productoId',
    otherKey: 'pedidoId',
    as: 'pedidos',
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
    Pedido, // corregido: exportar con mayúscula
    DetallePedido,
    initAssociations
};

