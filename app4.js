const express = require('express');
const app = express();
const path = require('path');
const { body, validationResult } = require('express-validator');
const mysql = require("mysql2");

// Configuración de la conexión a la base de datos
let conexion = mysql.createConnection({
    host: "localhost",
    database: "Database1",
    user: "root",
    password: ""
});

// Ruta de archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Configurar EJS como el motor de plantillas
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));

// Ruta para el formulario
app.get('/form', (req, res) => {
    res.render('form');
});

// Ruta para registrar datos
app.post('/registrar', [
    body('nya', 'Ingrese un nombre y apellido completo')
        .exists()
        .isLength({ min: 5 }),
    body('email', 'Ingrese un E-mail válido')
        .exists()
        .isEmail(),
    body('edad', 'Ingrese un valor numérico')
        .exists()
        .isNumeric()
], (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        console.log(req.body);
        const valores = req.body;
        const validaciones = errors.array();
        res.render('form', { validaciones: validaciones, valores: valores });
    } else {
        const datos = req.body;
        let nya = datos.nya;
        let email = datos.email;
        let edad = datos.edad;

        let registrar = "INSERT INTO tabla1 (nombre_apellido, email, edad) VALUES (?, ?, ?)";

        conexion.query(registrar, [nya, email, edad], (error) => {
            if (error) {
                throw error;
            } else {
                console.log("Datos almacenados correctamente");
                res.send('¡Validación Exitosa y Datos Almacenados Correctamente!');
            }
        });
    }
});

app.listen(3000, () => {
    console.log('SERVER UP en http://localhost:3000');
});
