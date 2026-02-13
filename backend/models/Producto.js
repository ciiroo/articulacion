/**
 * modelo producto
 * define la tabla producto en la base de datos
 * almacena los productos
 */
//importar datatypes de sequelize
const { DataTypes } = require('sequelize');

//importar instancia de sequelize
const { sequelize } = require('../config/database');
const { table } = require('console');
const { type } = require('os');

/**
 * definir el modelo de producto
 */
const Producto = sequelize.define('Producto', {
    //campos de la tabla
    //id identificador unico (primary key)
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },

    nombre: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'El nombre del producto no puede estar vacio'
            },
            len:{
                args: [2,200],
                msg: 'el nombre debe tener entre 2 y 200 caracteres'
            }
        }
    },

    /**
     * Descrpcion detallada del producto
     */
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    //Precio del producto
    precio:{
        type: DataTypes.DECIMAL(10,2), //hasta 99,999,
        allowNull: false,
        validate: {
            isDecimal: {
                msg: 'El precio debe ser un numero decimal valido'
            },
            min: {
                args: [0],
                msg: 'El precio no puede ser negativo'
            }
        }
    },

    //Stock del producto cantidad disponible en inventario
    stock:{
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue:0,
        validate: {
            isInt: {
                msg: 'El stock debe ser un numero entero valido'
            },
            min: {
                args: [0],
                msg: 'El stock no puede ser negativo'
            }
        }
    },

    /**
     * imagen Nombre del archivo de imagen
     * se guarda solo el nombre ejemplo:
    coca-cola-producto.jpg
     * la ruta seria uploads/coca-cola-producto.jpg
     */
    imagen: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
            is: {
                args: /\.(jpg|jpeg|png|gif)$/i,
                msg: 'La imagen debe ser un archivo JPG, JPEG, PNG o GIF'

            }
        }
    },

    /**
     * categoriaId - id de la categoria a la que pertenece foreign key
     * esta es la relacion con la tabla categoria
     */
    categoriaId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'categorias', //nombre de la tabla categoria
            key: 'id' //camo de la tabla relacionada
        },
        onUpdate: 'CASCADE', //si se actualiza el id, actualizar aca tambien
        onDelete: 'CASCADE', //si se elimina la categoria, eliminar esta subcategoria tambien
        validate: {
            notNull: {
                msg: 'Debe seleccionar una categoria'
            }
        }
    },

    subcategoriaId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'categorias', //nombre de la tabla subcategoria
            key: 'id' //camo de la tabla relacionada
        },
        onUpdate: 'CASCADE', //si se actualiza el id, actualizar aca tambien
        onDelete: 'CASCADE', //si se elimina la categoria, eliminar esta subcategoria tambien
        validate: {
            notNull: {
                msg: 'Debe seleccionar una subcategoria'
            }
        }
    },

    /**
     * activo estado de la subcategoria
     * si es false los productos de esta subcategoria se ocultan
     */
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }

}, {
    //opciones del modelo

    tableName: 'subcategorias',
    timestamps: true, //crea campos createdAt y updatedAt

    /**
     * indices compuestos para optimizar busquedas
     */
    indexes: [
        {
            //indice para buscar subcategorias por subcategoria
            fields: ['subcategoriaId']
        },
        {
            //indice para buscar subcategorias por subcategoria
            fields: ['categoriaId']
        },
        {
            //indice para buscar productos activos
            fields: ['Activos']
        },
        {
            //indice para buscar productos por nombre
            fields: ['nombre']
        },
    ],

    /**
     * hooks acciones automaticas
     */
    hooks: {
        /**
         * beforeCreate - se ejecuta antes de crear un producto
         * valida que la subcategoria y que la categoria padre esten activas
         */
        beforeCreate: async (producto) => {
            const categoria = require('./categoria');
            const subcategoria = require('./subcategoria');

            //Buscar subcategoria padre
            const subcategoria = await subcategoria.findByPk(producto.subcategoriaId);
            if (!subcategoria) {
                throw new Error('la subcategoria seleccionada no existe');
            }

            if (!subcategoria.activo) {
                throw new Error('no se puede crear un producto en una categoria inactiva');
            }

            //Buscar categoria padre
            const categoria = await categoria.findByPk(producto.categoriaId);
            if (!categoria) {
                throw new Error('la categoria seleccionada no existe');
            }

            if (!categoria.activo) {
                throw new Error('no se puede crear un producto en una categoria inactiva');
            }

            //Validar que la subcategoria pretenezca a una categoria
            if (subcategoria.categoriaId !==producto.categoriaId) {
                throw new Error ('La subcategoria no perteece a la categoria seleccionada');
            }
        },

        /**
         * beforeDestroy: se ejecuta antes de eliminar un producto
         * Elimina la imagen del servidor si existe
         */

        beforeDestroy: async (producto) => {
            if (producto.imagen) {
                const {deletefile} = require('../config/multer');
                //Intenta eliminar la imagen del servidor
                const eliminado = await require('../config/multer');
                if (eliminado) {
                    console.log (`imagen eliminada: ${producto.imagen}`);
                }
            }
        }
    }
});

/**
 * metodo para verificar si hay stock disponible
 *
 * @param {number} cantidad - cantidad deseada
 * @returns {boolean} - true si hay stock suficiente false si no
 */
producto.producto.hayStock = function(cantidad = 3) {
    return this.stock >= cantidad;
};

/**
 * Metodo para reducir el stock
 * util para despues de una venta
 * @param {number} cantidad - cantidad a reducir
 * @returns {Promise<Producto>} producto actualizado
 */

producto.prototype.reducirStock = async function (cantidad) {
    if (this.hayStock(cantidad)) {
        throw new Error('Stock insuficiente');
    }
    this.stock -= cantidad;
    return await this.save();

}

//exportar modelo categoria
module.exports = producto;