/**
 * SERVIDOR PRONCIPAL DEL BACKEND
 * este el archivo proncipal del servidor del backend
 * configura express. middlewares, rutas y la conexion de base de datos
 */

//IMPORTACIONES |

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

//importar modelos y asociaciones
const { initAssociations } = require('./models');

//importar seeders
const { runSeeders } = require('./seeders/adminSeeder');

//crear aplicaciones express
const app = express();

//obtener el puerto desde la variable de entorno
const PORT = process.env.PORT || 5000;

//MIDDLEWARES |

//cors permite peticiones desde el frontend
//configura que los dominios pueden hacer peticiones al backend

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000', //permitir solo el frontend
    credentials: true, //permitir cookies y credenciales
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], //permitir estos métodos
}));

/**
 * express
 */

