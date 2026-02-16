/**
 * MODELO PEDIDO
 * define la tabla pedido en la base de datos
 * Almacena la informacion de los pedidos realizados por los usuarios
 */


//Importar Datatypes de sequelize
const { DataTypes } = require('sequelize');


//importar instancia de sequelize
const { sequelize } = require('../config/database');
const { type } = require('os');


/**
 * Definir el modelo de pedido
 */
const Carrito = sequelize.define('pedido', {
    // campos de la tabla
    // id identificador unico (PRIMARY KEY)
    id: {
        type: DataTypes.INTEGER, // tipo entero
        primaryKey: true, // clave primaria
        autoIncrement: true, // se incrementa automaticamente
        allowNull: false // no puede ser nulo
    },


    // Ususario ID del usuario realizo el pedido
    usuarioId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Usuarios',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT', // No se puede eliminar un usuario con pedidos
        validate: {
            notNull: {
                msg: 'Debe especificar un usuario'
            }
        }
    },
    
    nombre: {
        type: DataTypes.STRING(100), // tipo cadena de texto
        allowNull: false, // no puede ser nulo
        unique:{
            msg: 'Ya existe una categoria con ese nombre'
        },
        validate: {
            notEmpty: {
                msg: 'El nombre de la categoria no puede estar vacio'
            },
            len: {
                args: [2, 100],
                msg: 'El nombre de la categoria debe tener entre 2 y 100 caracteres'
            }
        }
    },

    /**
     *descripcion de la categoria
     */

    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true, // puede ser nulo
    },

    //Total monto total del pedido
    Total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate:{
            isDecimal:{
                msg:'el total debe ser un numero decimal valido'
            },

            min:{
                args: [0],
                msg: 'El total no puede ser negativo'
            }
        }
    },

    /**
     * Estado - decimal actual del pedido
     * Valores posibles:
     * Pendiente: pedido creado, esperando pago
     * Pagado: pedido pagado, en proceso de preparacion
     * Enviado: pedido enviado al cliente
     * Cancelado: pedido cancelado
     */
    estado: {
        type: DataTypes.ENUM('Pendiente', 'Pagado', 'Enviado', 'Cancelado'),
        allowNull: false,
        defaultValue: 'Pendiente',
        validate: {
            isIn: {
                args: [['Pendiente', 'Pagado', 'Enviado', 'Cancelado']],
            }
        }
    },

    //Direccion de envio del pedido
    direccionEnvio: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'La direccion de envio es obligatoria'
            }
        }
    },

    //teledono de contacto para el envio
    telefono: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'El telefono es obligatorio'
            }
        }
    },

    //notas adicionales del pedido (opcional)
    notas: {
        type: DataTypes.TEXT,
        allowNull: true,
    },

     // Producto ID del Producto en el carrito carrito
    productoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Productos',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', //elimina el producto  del carrito
        validate: {
            notNull: {
                msg: 'Debe especificar un producto'
            }
        }
    },

    // Cantidad de este producto en el carrito
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
     * Precio Unitario del producto al momento de agregarlo al carrito
     * Se guarda para mantener el precio aunque el producto cambie de precio
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
    }
}, {
    //opciones del modelo

    tableName: 'carritos',
    timestamps: true,
    //indices para mejorar las busquedas
    indexes:[
        {
            //indice para buscar por usuario
            fields: ['usuarioId']
        },
        {

        //Indice compuesto : un usuario no puede teber el mismo producto mas de una vez
        unique: true,
        fields: ['usuarioId', 'productoId'],
        name: 'usuario_producto_unique'
        }

    ],

    /**
     * hooks acciones automaticas
     */
    hooks: {
        /**
         * beforeCreate - se ejecuta antes de crear un item en el carrito
         * valida que este activo y tenga stock suficiente el producto que se esta agregando al carrito
         */
        beforeCreate: async (itemCarrito, options) => {
            const Producto = require('./Producto');

            //buscar el producto
            const producto = await Producto.findByPk(itemCarrito.productoId);
            if (!producto) {
                throw new Error('El producto seleccionado no existe');
            }

            if (!producto.activo) {
                throw new Error('No se puede agregar un producto inactivo al carrito');
            }

            if (!producto.hayStock(itemCarrito.cantidad)) {
                throw new Error(`Stock insuficiente. Solo hay ${producto.stock} unidades disponibles`);
            }

            //Guardar el precio actual del producto
            itemCarrito.precioUnitario = producto.precio
        },

        /**
         * beforeUpdate - se ejecuta antes de actualizar un item en el carrito
         * valida que el producto siga activo y tenga stock suficiente si se aumenta la cantidad
         */
        beforeUpdate: async (itemCarrito) => {
            
            if (itemCarrito.changed('cantidad')) {
                const Producto = require('./Producto');
                const producto = await Producto.findByPk(itemCarrito.productoId);

                if (!producto) {
                    throw new Error('El producto seleccionado no existe');
                }
                if (!producto.hayStock(itemCarrito.cantidad)) {
                    throw new Error(`Stock insuficiente. Solo hay ${producto.stock} unidades disponibles`);
                }
            }
        }
    }
});

//metodo de instancia
/**
 * metodo para calcular el subtotal de este item
 *
 * @return {number} - subtotal (precio * cantidad)
 */
Carrito.prototype.calcularSubtotal = function () {
    return parseFloat (this.precioUnitario) * this.cantidad;
};

/**
 * Metodo para actualizar la cantidad
 * @param {number} nuevaCantidad - la nueva cantidad a establecer
 * @returns {Promise} Item actualizado
 */

Carrito.prototype.actualizarCantidad = async function (nuevaCantidad){
    const Producto = require('./Producto');

    const producto = await Producto.findByPk(this.productoId);

    if (!producto.hayStock(nuevaCantidad)) {
        throw new Error(`Stock insuficiente. Solo hay ${producto.stock} unidades disponibles`);
    }

    this.cantidad = nuevaCantidad;
    return await this.save();
};


/**
 * Metodo para obtener el carrito completo de un usuario
 * incluye informacion de los productos
 * @param {number} usuarioId - ID del usuario
 * @returns {Promise<Array>} - Items del carrito con productos
 */

Carrito.obtenerCarritoCompleto = async function (usuarioId) {
    const Producto = require('./Producto');

    return await this.findAll({
        where: {usuarioId},
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