/**
 * MODELO USUARIO
 * Define la tabla usuario en la base de datos
 * Almacena la informacion de los usuarios del sistema
 */

//Importar DataTypes de sequelize
const { DataTypes } = require('sequelize');

//Importar bcrypt para encriptar contraseñas
const bcrypt = require('bcrypt');

//Importar instancia de Sequelize
const { sequelize } = require('../config/database');
const { type } = require('os');

/**
 * Definir el modelo de usuario
 */
const Usuario = sequelize.define('Usuario', {
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
        validate: {
            notEmpty: {
                msg: 'El nombre no puede estar vacio'
            },
            len: {
                args: [2, 100],
                msg: 'El nombre debe tener entre 2 y 100 caracteres'
            }
        }
    },

    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: {
            msg: 'Este email ya esta registrado'
        },
        validate: {
            isEmail: {
                msg: 'Debe ser un email valido'
            },
            notEmpty: {
                msg: 'El email no puede estar vacio'
            }
        }
    },

    password: {
        type: DataTypes.STRING(255),//cadena larga para el hash
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'La contraseña no puede estar vacia'
            },
            len: {
                args: [6, 225],
                msg: 'La contraseña debe tener almenos 6 caracteres'
            }
        }
    },

//rol del usuario (cliente auxiliar o administrador)
    rol: {
        type: DataTypes.ENUM('cliente', 'auxiliar', 'administrador'),//tres roles disponibles
        allowNull: false,
        defaultValue: 'cliente', //por defecto es cliente
        validate: {
            isIn: {
                agrs:[['cliente', 'auxiliar', 'administrador']],
                msg: 'El rol debe ser cliente, auxiliar o administrador'
            },
        }
    },

//telefono del usuario (opcional)
    telefono: {
        type: DataTypes.STRING(20),
        allowNull: true, //OPCIONAL
        validate: {
            is: {
                agrs: /^[0-9+\-\s()]*$/, //Solo numeros espacion guiones y parentesis
                msg: 'El telefono solo puede ocntener numeros y caracteres validos'
            },
        }
    },

    /**
     * Direccion del usuario es opcional
     */
    direccion: {
        type: DataTypes.TEXT,
        allowNull: true,
    },


    /**
     * activo estado del usuario
     */
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true //por defecto activo
    }

}, {
    //Opciones del modelo
    tableName: 'usuarios', //nombre de tabla en la base de datos
    timestamps: true, //Agrega campos createdAt y updatedAt

    /**
     * Scopes consultas predefinidas
     */
    
    defaultScope: {
        /**
         * Por defecto excluir el password de todas las consultas
         */
        attributes: {exclude: ['password']}
    },
    scopes: {
        //scope para incluir el password cuando sea necesario (ej. el login)
        withPassword: {
            attributes: {} //incluir todos los atributos
        }
    },

    /**
     * hoosks funciones para que se ejecuten en momentos especificos
     */
    hooks: {
        /**
         * beforeCreate se ejecuta antes de crear un usuario
         * Encrpta la contraseña antes de guardarla en la base de datos
         */

        beforeCreate: async (usuario) => {
            if (usuario.password) {
                //genera un salt (semilla aleatoria) con factor de costo de 10
                const salt = await bcrypt.genSalt(10);
                //Encriptar la contraseña con salt
                usuario.password = await bcrypt.hash (usuario.password, salt);
            }
        },
/**
 * beforeUpdate se ejecuta antes de actualizar un usuario
 * Encripta la contraseña si fue modificada
 */


        beforeUpdate: async (usuario) => {
            //Verificar si la contraseña fue modificada
            if (usuario.changed('password')) {
                const salt = await bcrypt.genSalt(10);
                usuario.password = await bcrypt.hash (usuario.password, salt);
            }
        }
    }

});

//METODOS DE INSTANCIA
/**
 * Metodo para comparar contraseñas
 * Compara una contraseña en texto plano con el hash guardad
 * @param {string} passwordIngresado - contraseña en texto plano
 *  @return {Promise<boolean>} - True si coinciden, false si no
 */
Usuario.prototype.compararPassword = async function(passwordIngresado) {
    return await bcrypt.compare(passwordIngresado, this.password);
};

/**
 * Metodo para obtener datos publicos del usuario (sin contraseña)
 *
 *  @returns {Object} - Objetos con datos publicos del usuario
 */

Usuario.prototype.toJSON = function() {
    const valores =Object.assign({}, this.get());

    //Eliminar la contraseña del objeto
    delete valores.password;
    return valores;
};

//Exportar el modelo de Usuario
module.exports = Usuario;
