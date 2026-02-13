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
