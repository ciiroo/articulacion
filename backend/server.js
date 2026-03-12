/**
 * SERVIDOR PRINCIPAL DEL BACKEND
 * este es l archivo principal del servidor del backend
 * configura express. middlewares, rutas y conexion de base de datos
 */


// IMPORTACIONES |


//importar express para crear el servidor
const express = require('express');

//importar cors para permitir solicitudes desde el frontend
const cors = require('cors');



//importar path para manejar rutas de archivos
const path = require('path');


//importar dotenv para cargar variables de entorno
require('dotenv').config();



//importar configuracion de la base de datos
const dbConfig = require('./config/database');

//importar modelos y asociasciones
const { initAssociations } = require('./models');

//importar seeders
const { runSeeders } = require('./seeders/adminSeeder');


//crear aplicaciones express

const app = express();


//obtener el puerto desde  la variable de entorno
const PORT = process.env.PORT || 5000;


// MIDDLEWARES |

//cors para permitir peticiones desde el frontend
//configura que los dominios puedan hacer peticiones al backend

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',//url del front end
    credentials: true, // permite enviar cookies y credenciales en las solicitudes
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], // métodos HTTP permitidos
    allowedHeaders: ['Content-Type', 'Authorization'] //Headers permitidos
}));



/**
 * express.json() - parse body de las peticiones formato json
 */
app.use(express.json());

/**
 * express.urlencoded() - parse body de los formularios
 * las imagenes estaran disponibles
 */

app.use(express.urlencoded({ extended: true }));


/**
 * servir archivos estaticos de la carpeta raiz
 */

app.use('uploads', express.static(path.join(__dirname, 'uploads')));

//middleware para loggin de peticiones
//muestra en consola cada peticion que llega al servidor

if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(` ok ${req.method} ${req.path}`);
        next();

    });
}


//rutas

//rutas raiz para verificar que el servidor este corriendo

app.get('/', (req, res) => {
    res.json({
        message: 'Servidor E-commerce corriendo correctamente',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
    });
});


//ruta de salud verifica como esta el servidor

app.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString(),
    });
});


//rutas api 

//importar de autenticacion
//incluye registro login, perfil


const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

//Rutas del administrador
//requieren autenticacion y rol de administrador


const adminRoutes = require('./eoutes/admin.routes');
app.use('/api/admin', adminRoutes);


//Rutas del cliente

const clienteRoutes = require('./routes/cliente.routes');
app.use('/api/cliente', clienteRoutes);


//Manejo de rutas no encontradas (404)

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada',
        path: req.path,
    });
});

//manejo de errores globales

app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    //Error de multer subida de archivos
    if (err.name === 'MulterError'){
        return res.status(400).json({
            success: false,
            message: 'Error en la subida de archivos',
            error: err.message
        });
    }
});



//otros errores

res.status(500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }), // mostrar stack solo en desarrollo
});


//inicializar servidor y base de datos

/**
 * funcion principal para iniciar el servidor
 * prueba la conexion a MySQL
 * sincroniza los modelos (crea las tablas)
 * inicia el servidor express
 */

const startServer = async () => {
    try {
        //paso 1 probar conexion a MySQL
        console.log('Conectado a MySQL...');
        const dbConnected = await testConnection();

        if(!dbConnected) {
            console.error(' No se pudo conectar a MySQL verificar XAMPP y el archivo .env');
            process.exit(1); //Salir si no hay conexion
            }
    
            //paso 2 sincronizar modelos (crear tablas)
            console.log('Sincronizando los modelos con la base de datos...');

            //Inicializar asociasiones entre los modelos
            initAssociations();

            //en desarrollo alter puede ser un true para actualizar la estructura
            //en produccion debe ser false para no perder los datos

            const alterTables = process.env.NODE_ENV === 'development';
            const dbSynced = await syncDatabase(false, alterTables);

            if (!dbSynced) {
                console.error('X Error al sincronizar la base de datos');
                process.exit(1);
            }

            //paso 3 ejecutar seeders datos iniciales
            await runSeeders();

            //paso 4 iniciar sevidor express
            app.listen(PORT, () => {
                console.log('/n_____________');
                console.log(`URL: http://localhost:${PORT}`);
                console.log(`base de datos: ${process.env.DB_NAME}`);
                console.log(`Modo: ${process.env.NODE_ENV}`);
                console.log('Servidor listo para realizar peticiones');
            });
        }catch (error) {
            console.error('X Error fatal al iniciar el servidor:', error.message);
            process.exit(1);
        }
};


// manejo de cierre
//captura el ctrl+c para cerrar el servidor correctamente

process.on('SIGINT', () => {
    console.log('\n\n cerrando servidor...');
    process.exit(0);
});


//capturar errores no manejados

process.on('unhandledRejection', (err) => {
    console.error('X Error no manejado:', err.message);
    process.exit(1);
});

// Iniciar servidor

startServer();

//exportar app para testing
module.exports = app;

