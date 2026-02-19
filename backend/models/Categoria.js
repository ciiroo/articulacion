/**
 * MODELO CATEGORIA
 * Define la tabla categoria en la base de datos
 * Almacena las categorias principales de los productos
 */

//Importar DataTypes de sequelize
const { DataTypes } = require('sequelize');

//Importar instancia de Sequelize
const { sequelize } = require('../config/database');

/**
 * Definir el modelo de categoria
 */
const Categoria = sequelize.define('Categoria', {
    //Campos de la tabla
    //Id idenrificado unico (PRIMARY KEY)
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: {
            msg: 'Ya existe una categoria con ese nombre'
        },
        validate: {
            notEmpty: {
                msg: 'El nombre de la categoria no puede estar vacio'
            },
            len: {
                args: [2, 100],
                msg: 'El nombre debe tener entre 2 y 100 caracteres'
            }
        }
    },

    /**
     * Descripcion de la categoria
     */
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    /**
     * activo estado de la categoria
     * Si es false la categoria y todas sus subcategorias y productos se ocultan
     */
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    //Opciones del modelo
    tableName: 'categorias',
    timestamps: true, //Agrega campos createdAt y updatedAt

    /**
     * Hooks Acciones automaticas
     */
    
    hooks: {
        /**
         * afterupdate: se ejecuta despues de actualizar una categoria
         * Si se desactiva una categoria, se desactivan todas sus subcategorias y productos relacionados
         */
        afterUpdate: async (categoria, options) => {
            //Verificar si el campo activo cambio
            if (categoria.changed('activo') && !categoria.activo) {
                console.log(`Desactivando categoria: ${categoria.nombre}`);

                //IMportar modelos (aqui para evitar dependencias circulares)
                const Subcategoria = require('./subcategoria');
                const Producto = require('./Producto');
                
                try {
                    //Paso 1 desactivar las subcategorias de esta categoria
                    const subcategorias = await Subcategoria.findAll({ where: { categoriaId: categoria.id } });

                    for (const subcategoria of subcategorias) {
                        await subcategoria.update({ activo: false }, { transaction: options.transaction });
                        console.log(`Subcategoria desactivada: ${subcategoria.nombre}`);
                    }

                    //Paso 2 desactivar los productos de esta categoria
                    const productos = await Producto.findAll({ where: { categoriaId: categoria.id } });

                    for (const producto of productos) {
                        await producto.update({ activo: false }, { transaction: options.transaction });
                        console.log(`Producto desactivado: ${producto.nombre}`);
                    }
                    console.log(`Categoria y elementos relacionados desactivados correctamente`);
                } catch (error) {
                    console.error('Error al desactivar categoria y elementos relacionados:', error.message);
                    throw error;
                }
            }
            //Si se activa una categoria, no se activan automaticamente las subcategorias y productos

        }
    }

});

//METODOS DE INSTANCIA
/**
 * Metodo para contar subcategorias de esta categoria
 *
 *  @return {Promise<number>} - Numero de subcategorias
 */

Categoria.prototype.contarSubcategorias = async function() {
    const Subcategoria = require('./subcategoria');
    return await Subcategoria.count({ where: { categoriaId: this.id } });
};

/**
 * Metodo para contar productos de esta categoria
 *
 *  @return {Promise<number>} - Numero de subcategorias
 */

Categoria.prototype.contarProductos = async function() {
    const Producto = require('./Producto');
    return await Producto.count({ where: { categoriaId: this.id } });
};

//Exportar el modelo de categoria
module.exports = Categoria