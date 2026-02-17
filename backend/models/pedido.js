/**
 * Modelo Pedido
 * define la tabla pedido en la base datos
 * almacena la informacion de los pedidos relizados por los usuarios
 */

//Importar DataTrypes de sequelize
const { DataTypes } = require('sequelize');

//Importar instancia de sequelize
const {sequelize} = require('../config/database');
const { type } = require('node:os');
const { before } = require('node:test');


/**
 * Definir el modelo de pedido
 */
const Pedido = sequelize.define('Pedido', {
    //Campos de la tabla
    //Id Indentificador unico (PRIMARY KEY)
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false

    },


    // UsuarioId ID del usuario que realizo el pedido
    usuarioId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Usuarios',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT', // no se puede eliminar el usuario si tiene pedidos
        validate: {
            notNull: {
                msg: 'Debe especificar su usuario'

            }

        }
    },
    
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique : {
            msg: 'Ya existe una categoria con ese nombre'
        },
        validate : {
            notEmpty: {
                msg: 'El nombre de la categoria no puede estar vacio'
            },
            len: {
                args: [2, 100],

            }
        }
    },

    /**
     * descripcion de la categoria
     */

    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    // Total monto del pedido
    total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            isDecimal: {
                msg: 'El total debe ser un numero decimal valido'
            },
            min: {
                args: [0],
                msg: 'El total no puede ser negativo'
            }
        }
    },

    /**
     * Estado - estado actual del pedido
     * valores posibles:
     * pendiente: pedido creado, esperando pago
     * pagado: pedido paado, en preparacion
     * enviado: pedido enviado al cliente
     * cancelado: pedido cancelado 
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

    // Telefono de contacto para el envio
    telefono: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'El telefono de contacto es obligatorio'
            }
        }
    },

    // notas adicionales del pedido (opcional)
    notas: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    //Fecha de pago 
    fechaPago: {
        type: DataTypes.DATE,
        allowNull: true
    },

     //Fecha de envio
    fechaEnvio: {
        type: DataTypes.DATE,
        allowNull: true
    },

     //Fecha de entrega
    fechaEntrega: {
        type: DataTypes.DATE,
        allowNull: true
    },


}, {
    //opciones del modelo
    tableName: 'pedidos',
    timestamp: true,
    //indice para mejorar las busquesdas
    indexes: [
        {
            //indice para buscar carrito por usuario
            fields: ['usuarioId']
        },

        {
            //indice para buscar pedidos por estado
            fields: ['estado']
        },

        {
            //indice para buscar pedidos por fecha
            fields: ['createdAt']
        },

    ],
    /**
         * Hooks Acciones automaticas
         */

        hooks:{
            /**
             *beforeCreate - se ejecuta antes de un item en el carrito
             *verifica que este activo y tenga stock suficiente para agregarlo al carrito
             */

             /**beforeCreate: async (itemCatrrito, options) => {
                const Categoria = require('./Producto');

                //buscar producto
                const producto = await Producto.findByPk(itemCarrito.productoId);

                if (!producto) {
                    throw new Error('El producto seleccionado no existe');

                }

                if (!producto.activo) {
                    throw new Error('No se puede crear agregar un producto inactivo al carrito');
                }

                if (!producto.hayStock(itemCarrito.cantidad)) {
                    throw new Error(`Stock insuficiente, solo hay ${producto.stock} unidades diisponibles`);
                }

                //Guardar el precio actual del producto
                itemCarrito.precioUnitario = producto.precio;

             },

              /**
             *afterUpdate. se ejecuta despues de actualizar un pedido
             *actualiza las fechas segun el estado
             */

            
            afterUpdate: async (pedido) => {
                //si es estado cambio a pagado, guardar fecha de pago
                if (pedido.changed('estadoo') && pedido.estado === 'Pagado') {
                    pedido.fechaPago = new Date();
                    await pedido.save({hooks: false}); // guardar sin ejecutar hooks para evitar loop infinito
                
                    //si el estado cambio a enviado, guardar fecha de envio

                    if (pedido.changed('estado') && pedido.estado === 'Enviado' && !pedido.fechaEnvio) { 
                        pedido.fechaEnvio = new Date();
                        await pedido.save({hooks: false});
                    }
                }
                    //si el estado cambio a entregado, guardar fecha de entrega

                    if (pedido.changed('estado') && pedido.estado === 'Entregado' && !pedido.fechaEntrega) { 
                        pedido.fechaEntrega = new Date();
                        await pedido.save({hooks: false});  
                    
                }
                    
        },

        /**
         * beforeDestry: se ejecuta antes de elimibar un pedido
         */
        beforeDestroy: async () => {
            throw new Error('No se puede eliminar un pedido, use el estado "Cancelado" en su lugar');
        }
    }
});

// METODOS DE INSTANCIA

/**
 * Metodo para cambiar el estado del pedido
 *@param {string} nuevoEstado - nuevo estado del pedido
 * @returns {number} - Subtotal (precio * canridad)
 */
Pedido.prototype.cambiarEstado = async function(nuevoEstado) {
    const estadosValidos = ['Pendiente', 'Pagado', 'Enviado', 'Cancelado'];
    if (!estadosValidos.includes(nuevoEstado)) {
        throw new Error(`Estado invalido.`);
    }
    this.estado = nuevoEstado;
    return await this.save();
};

/**
 * Metodo para verificar si el pedido puede ser cancelado
 * solo se puede cancelar si esta en estado pendiente o pagado
 * @return {boolean} - true si se puede cancelar, false en caso contrario
 */

Pedido.prototype.puedeCancelar = function() {
    return ['Pendiente', 'Pagado'].includes(this.estado);
}






/**
 * Metodo para actualizar la cantidad
 * @param {number} nuevaCantidad - nueva cantidad
 * @returns {Promise} Item actualizado *
 */

Pedido.prototype.cancelar = async function(nuevaCantidad) {

    if (!this.puedeSerCancelado()) {
        throw new Error('este pedido no puede ser cnacelado');
    }

    //Importar modelos
    const DetallePedido = require('./DetallePedido');
    const Producto = require('./Producto');

    //Obtener detalles del pedido
    const detalles = await DetallePedido.findAll({
        where: { pedidoId: this.id }
    });

    // devolver el stock de cada producto
    for (const detalle of detalles) {
        const producto = await Producto.findByPk(detalle.productoId);
        if (producto) {
            await producto.aumentarStock(detalle.cantidad);
            console.log(`Stock devuelto: ${detalle.cantidad} X ${producto.nombre}`);
        }
    }

    //Cambiar estado a cancelado
        this.estado = 'Cancelado';
        return await this.save();




    this.cantidad = nuevaCantidad;
    return await this.save(); 

};

/**
 * Metodo para obtener detalles del pedido con productos 
 * @returns {Promise<Array>} - Detalles del pedido 
 */
Pedido.prototype.obtenerDetalles = async function () {
    const DetallePedido = require('./DetallePedido');
    const Producto = require('./Producto');
    
    
    return await DetallePedido.findAll({
        where: { pedidoId: this.id },
        include: [
            {
                model: Producto,
                as: 'producto'
            }
        ]
    });
};

/**
 * Metodo para obtener pedidos por estado
 * @param {string} estado - Estado a filtrar
 * @return {Promise<Array>} - Pedidos filtrados
 */
Pedido.obtenerPorEstado = async function (estado) {
    const Usuario = require ('./Usuario');
    return await this.findAll({
        whwere: { estado },
        include: [
            {
                model: Usuario,
                as: 'usuario',
                attributes: ['id', 'nombre', 'email']
            }
        ],
        order: [['createdAt', 'DESC']]
    });
};



/**
 * Metodo para obtener historial de pedidos de un usuario
 * @param {number} usuarioId - ID del usuario
 * @returns {Promise<Array>} - Pedidos del usuario 
 */

Pedido.obtenerHistorialUsuario = async function(usuarioId) {
    return await this.findAll({
        where: { usuarioId },
        order: [['createdAt', 'DESC']]
    });
};

// Exportar el modelo
module.exports = Pedido;