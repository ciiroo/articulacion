/**
 * script deinicializacion de la base de datos
 * este script crea la bse de datos si no existe
 * Debe ejecutarse una sola vez antes de iniciar el servidor
 */

//importar mysql2 para la conexion directa
const mysql = require('mysql2/promise');

//importar dotenv para cargar las variables de entorno
require('dotenv').config();

//funcion para crear la base de datos
const createDatabase = async () => {
    let connection;
    try {
        console.log('Iniciando creacion de base de datos ... \n');

        //conectar a mysql sin especificar base de datos
        console.log('Conectando a MySQL...');
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || ''
        });

        console.log('Conexion a MySQL establecida\n');
        //Crear la base de datos si no existe
        const dbName = process.env.DB_NAME ||'e-commerce_db'; //nombre de la base de datos por defecto
        console.log(`Creando base de datos: ${dbName} ...`);

        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
        console.log(`Base de datos '${dbName}' creada o ya existe\n`);
//genera la conexion directa con la base de datos creada o verificada

        //Cerrar conexion
        await connection.end(); //despues de crear la base de datos, cerramos la conexion

        console.log('¡Proceso completado! Ahora puedes iniciar el servidor con: npm start\n');
    } catch (error) {
        console.error('Error al crear la base de datos:', error.message);
        console.error('\n Verifica que:');
        console.error('1. XAMPP esté corriendo');
        console.error('2. MySQL esté iniciado en XAMPP');
        console.error('3. Las credenciales en .env sean correctas\n');
        //MIRA LOS ERRORES POR SI HAY ALGUN PROBLEMA CON LA CONEXION O CREACION DE LA BASE DE DATOS

        if(connection){
            await connection.end();
        }

        process.exit(1); //Salir con error
    }
}
//Ejecutar la funcion
createDatabase();