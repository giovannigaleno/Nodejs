const express = require('express');
const app = express();
const path = require('path');
const { body, validationResult } = require('express-validator');
const mysql = require('mysql2');
const session = require('express-session');
const bcrypt = require('bcrypt');

// Configuración de la conexión a la base de datos
require('dotenv').config();
let conexion = mysql.createConnection({
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

// Conexión a la base de datos
conexion.connect(err => {
    if (err) {
        console.error('Error al conectar a la base de datos: ' + err.stack);
        return;
    }
    console.log('Conectado a la base de datos como ID ' + conexion.threadId);
});

// Configuración de la sesión
app.use(session({
    secret: 'mi-secreto',
    resave: false,
    saveUninitialized: true
}));

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
        const valores = req.body;
        const validaciones = errors.array();
        res.render('form', { validaciones: validaciones, valores: valores });
    } else {
        const datos = req.body;
        let { nya, email, edad } = datos;

        let registrar = "INSERT INTO tabla1 (nombre_apellido, email, edad) VALUES (?, ?, ?)";

        conexion.query(registrar, [nya, email, edad], (error) => {
            if (error) {
                console.error('Error al insertar datos: ' + error.message);
                res.status(500).send('Error al almacenar los datos.');
            } else {
                res.send('¡Validación Exitosa y Datos Almacenados Correctamente!');
            }
        });
    }
});

// Ruta para el registro de usuario
app.get('/register', (req, res) => {
    res.render('register', { errors: [] }); // Pasa una variable `errors` vacía si no hay errores
});


app.post('/register', [
    body('username', 'Nombre de usuario es requerido').notEmpty(),
    body('password', 'Contraseña es requerida').notEmpty(),
    body('passwordConfirm', 'Confirmar contraseña es requerida').notEmpty(),
    body('passwordConfirm', 'Las contraseñas deben coincidir').custom((value, { req }) => value === req.body.password)
], (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.render('register', { errors: errors.array() });
    } else {
        const { username, password } = req.body;
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                console.error('Error al hashear la contraseña: ' + err.message);
                res.status(500).send('Error al registrar usuario.');
            } else {
                let insertarUsuario = "INSERT INTO usuarios (username, password) VALUES (?, ?)";
                conexion.query(insertarUsuario, [username, hashedPassword], (error) => {
                    if (error) {
                        console.error('Error al registrar el usuario: ' + error.message);
                        res.status(500).send('Error al registrar el usuario.');
                    } else {
                        res.send('Registro exitoso');
                    }
                });
            }
        });
    }
});



// Ruta para el inicio de sesión
app.get('/login', (req, res) => {
    res.render('login', { errors: [] }); // Pasa una variable `errors` vacía si no hay errores
});

app.post('/login', [
    body('username', 'Nombre de usuario es requerido').notEmpty(),
    body('password', 'Contraseña es requerida').notEmpty()
], (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.render('login', { errors: errors.array() });
    } else {
        const { username, password } = req.body;
        let obtenerUsuario = "SELECT * FROM usuarios WHERE username = ?";
        conexion.query(obtenerUsuario, [username], (error, results) => {
            if (error || results.length === 0) {
                res.render('login', { errors: [{ msg: 'Usuario o contraseña incorrectos' }] });
            } else {
                const user = results[0];
                bcrypt.compare(password, user.password, (err, result) => {
                    if (result) {
                        req.session.user = user;
                        res.send('Inicio de sesión exitoso');
                    } else {
                        res.render('login', { errors: [{ msg: 'Usuario o contraseña incorrectos' }] });
                    }
                });
            }
        });
    }
});


// Ruta para cerrar sesión
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error al cerrar sesión: ' + err.message);
            res.status(500).send('Error al cerrar sesión.');
        } else {
            res.redirect('/login');
        }
    });
});

app.listen(3000, () => {
    console.log('SERVER UP en http://localhost:3000');
});
