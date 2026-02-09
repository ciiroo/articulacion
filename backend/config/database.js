/***CONFIGURACION DE LA BASE DE DATOS */

//Importar Sequelize
const { Sequelize } = require('sequelize');

//importar dotenv para variables de entorno
require('dotenv').config();

//crear instancia de sequelize
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    port: process.ENV.DB_PORT,
    dialect: 'mysql',

    //configuracion de pool de conexiones
    //mantienen las conexiones abiertas para mejorar el rendimiento
    pool:{
        max: 5, //Numero maximo de conexiones en el pool
        min: 0, //Numero minimo de conexiones en el pool
        acquire: 30000, //Tiempo maximo (en ms) que el pool intentara obtener una conexion antes de lanzar un error
        idle: 10000 //Tiempo maximo (en ms) que una conexion puede estar inactiva antes de ser liberada
    },
    //configuracion de logGin
    //Permite ver las consultas de mysql por consola
    loggin: process.env.NODE_ENV === 'development' ? console.log : false,

    ///Zone horaria
    timezone: '-05:00', //ZONA HORARIA DE COLOMBIA

    //opciones adicionales
    define:{
        timestamps: true, //Agrega campos createdAt y updatedAT a todas las tablas
        underscored: false, //Usa snake_case para los nombres de columnas en lugar de camelCase
    //frazeTableNombre: true usa el nombre del modelo como nombre de la tabla sin pluralizarlo
        freezetableName: true
    }

});
/* Funcion para probar la conexion a la base de datos */
const testConnection = async () => {
    try {
        //intentar autenticar con al base de datos 
        await sequelize.authenticate(); //si la autenticacion es exitosa, se muestra un mensaje de exito
        console.log('Conexion a MYSQL establecida exitosamente');
        return true;
    } catch (error) {
        console.error('X error al concetar a MYSQL:',
        error.message);
        console.error('XVERIFICA QUE xampp este corriendo y las credenciales .env sean correctas:');
        return false;
    }
}