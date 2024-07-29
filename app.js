//Importar libreria
const express = require('express');
const app = express();


//Ruta de archivos estaticos

app.use(express.static("public"));


//Configuracion del Puerto
app.listen(3000, ()=>{
    console.log('SERVER UP en http://localhost:3000')
})