/**
 * MODELO DETALLE PEDIDO
 * define la tabla detalle_pedidos en la base de datos
 * Almacena los productos incluidos en cada pedido
 * relacion muchos a muchos entre pedido y productos
 */


//Importar Datatypes de sequelize
const { DataTypes } = require('sequelize');


//importar instancia de sequelize
const { sequelize } = require('../config/database');


/**
 * Definir el modelo de detalle de pedido
 */
const DetallePedido = sequelize.define('DetallePedido', {
    // campos de la tabla
    // id identificador unico (PRIMARY KEY)
    id: {
        type: DataTypes.INTEGER, // tipo entero
        primaryKey: true, // clave primaria
        autoIncrement: true, // se incrementa automaticamente
        allowNull: false // no puede ser nulo
    },


    // Pedido ID del pedido al que pertenece este detalle
    pedidoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Pedidos',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', // si se elimina el pedido se eliminan sus detalles
        validate: {
            notNull: {
                msg: 'Debe especificar un pedido'
            }
        }
    },
    
    nombre: {
        type: DataTypes.STRING(100), // tipo cadena de texto
        allowNull: false, // no puede ser nulo
        unique:{
            msg: 'Ya existe un detalle de pedido con ese nombre'
        },
        validate: {
            notEmpty: {
                msg: 'El nombre del detalle de pedido no puede estar vacio'
            },
            len: {
                args: [2, 100],
                msg: 'El nombre del detalle de pedido debe tener entre 2 y 100 caracteres'
            }
        }
    },

    /**
     *descripcion del detalle de pedido
     */

    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true, // puede ser nulo
    },

     // Producto ID del Producto en el pedido
    productoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Productos',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT', // si se elimina el producto se eliminan sus detalles
        validate: {
            notNull: {
                msg: 'Debe especificar un producto'
            }
        }
    },

    // Cantidad de este producto en el pedido
    cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
            isInt: {
                msg: 'La cantidad debe ser un numero entero'
            },
            min:{
                args: [1],
                msg: 'La cantidad debe ser al menos 1'
            }
        }
    },


    /**
     * Precio unitario del producto al momento del pedido
     * Se guarda para mantener el historial aunque el producto cambie de precio
     */

    precioUnitario: {
        type: DataTypes.DECIMAL(10,2),
        allowNull: false,
        validate:{
            isDecimal:{
                msg: 'El precio debe ser un  numero decimal valido'
            },
            min:{
                args: [0],
                msg: 'El precio no puede ser negativo'
            }
        }
    },

    /**
     * Subtotal de este item (Precio * cantidad)
     * Se calcula automaticamente antes de guardar
     */
    subtotal:{
        type: DataTypes.DECIMAL(10,2),
        allowNull: false,
        validate:{
            isDecimal:{
                msg: 'El subtotal debe ser un numero decimal valido'
            },
            min:{
                args: [0],
                msg: 'El subtotal no puede ser negativo'
            }
        }
    }
}, {
    //opciones del modelo

    tableName: 'detalle_pedidos',
    timestamps: false, // no necesita createdAt/updatedAt

    
    //indices para mejorar las busquedas
    indexes:[
        {
            //indice para buscar detalles por pedido
            fields: ['pedidoId']
        },
        {
            //indice para buscar detalles por producto
            fields: ['productoId']
        },
        


    ],

    /**
     * hooks acciones automaticas
     */
    hooks: {
        /**
         * beforeCreate - se ejecuta antes de crear un detalle de pedido
         * calcula el subtotal automaticamente
         * valida que este activo y tenga stock suficiente el producto que se esta agregando al carrito
         */
        beforeCreate: (detalle) => {
            //calcular subtotal precio * cantidad
            detalle.subtotal = parseFloat(detalle.precioUnitario) * detalle.cantidad;
        },

        /**
         * beforeUpdate - se ejecuta antes de actualizar un detalle de pedido
         * recalcula el subtotal si se cambio la cantidad o el precio
         */
        beforeUpdate:(detalle) => {
            
            if (detalle.changed('precioUnitario') || detalle.changed('cantidad')) {
                detalle.subtotal = parseFloat(detalle.precioUnitario) * detalle.cantidad;

            }
        }
    }
});

//metodo de instancia
/**
 * metodo para calcular el subtotal
 *
 * @return {number} - subtotal calculado
 */

DetallePedido.prototype.calcularSubtotal = function () {
    return parseFloat (this.precioUnitario) * this.cantidad;
};

/**
 * Metodo para crear detalles del pedido desde el carrito
 * convierte los items del carrito en detalles de pedido
 * @param {number} pedidoId - ID del pedido al que se asociarán los detalles
 * @param {Array} itemsCarrito - Array de items del carrito con productoId, cantidad y precioUnitario
 * @returns {Promise<Array>} - Detalles del pedido creados
 */

DetallePedido.crearDesdeCarrito = async function (pedidoId, itemsCarrito){
    const detalles = [];
    for (const item of itemsCarrito){
        const detalle = await this.create({
            pedidoId: pedidoId,
            productoId: item.productoId,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
        });
        detalles.push(detalle);
    }
    return detalles;
};


/**
 * Metodo para calcular el total de un pedido desde sus detalles
 * @param {number} pedidoId - ID del pedido
 * @returns {Promise<number>} - Total calculado
 */

DetallePedido.calcularTotalPedido = async function (pedidoId) {
    const detalles = require('./Producto');

    return await this.findAll({
        where: {pedidoId},
        include: [
            {
                model: Producto,
                as: 'producto'
            }
        ],
        order: [['createdAt', 'DESC']]
    });
};

/**
 * Metodo para calcular el total del carrito de un usuario
 * @param {number} usuarioId - ID del usuario
 * @returns {Promise<number>} - Total del carrito
 */

Carrito.calcularTotalCarrito = async function(usuarioId){
    const items = await this.findAll({ where: { usuarioId } });

    let total = 0;
    for (const item of items) {
        total += item.calcularSubtotal();
    }
    return total;
};


/**
 * Metodo para vaciar el carrito de un usuario
 * util despues de realizar un pedido
 * @param {number} usuarioId - ID del usuario
 * @return {Promise<number>} - Numero de items eliminados
 */

Carrito.vaciarCarrito = async function(usuarioId){
    return await this.destroy({
        where: { usuarioId }
    });
};

//Exportar modelo
module.exports = Carrito;