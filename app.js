import {PORT} from './config.js'
import {
    MYSQLHOST,
    MYSQLDATABASE,
    MYSQL_ROOT_PASSWORD,
    MYSQLPORT,
    MYSQLUSER
} from './config.js'


import express from 'express' 
import mysql from 'mysql2'
import bodyParser from 'body-parser'

const app = express()
app.listen(PORT)
const puerto = 3000;

let conection = mysql.createConnection({
    host : MYSQLHOST,
    user : MYSQLUSER,
    port: MYSQLPORT,
    password : MYSQL_ROOT_PASSWORD,
    database : MYSQLDATABASE,
    connectTimeout: 10000
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended : true
}));
app.use(express.static("public"));

app.use("/ingresarProducto", async (req, res)=> {
    try{
        let nombre = req.body.nombre;
        let cantidad = req.body.cantidad;
        let precio = req.body.precio;
        let id = 1;
            
        const response = await new Promise((resolve, reject)=>{
            conection.query("SELECT pro_id FROM productos ORDER BY(pro_id) ASC;", (error, response, fields)=>{
                if(error){
                    reject(error);
                }
                else{
                    resolve(response);
                }
            });
        });
        
        for(let i = 0; i < response.length; i++){
            let columna = response[i];
            if(columna.pro_id !== id){
                break;
            }
            
            id ++;
        }

        const insert = await new Promise((resolve, reject)=>{
            conection.query("INSERT INTO productos VALUES("+id+", '"+nombre+"', "+precio+", "+cantidad+");", (error, response, fields)=>{
                if(error){
                    console.log(error);
                    reject(false);
                }
                else{
                    resolve(true);
                }
            });
        });

        if(insert){
            res.redirect("/mostrarProductos");
        }
    }
    catch(err){
        console.log(err)
    }
});

app.use("/mostrarProductos", async (request, response)=>{
    let trs = "";
    const productos = await new Promise((resolve, reject)=>{
        conection.query("SELECT pro_id, pro_nombre, pro_precio, pro_cantidad FROM productos;", (error, response, fields)=>{
            if(error){
                reject(error);
            }
            else{
                resolve(response);
            }
        });
    });

    for(let i = 0; i < productos.length; i++){
        trs += "<tr>";
        trs += "<td>"+productos[i].pro_id+"</td>";
        trs += "<td>"+productos[i].pro_nombre+"</td>";
        trs += "<td>$"+productos[i].pro_precio+"</td>";
        trs += "<td>"+productos[i].pro_cantidad+"</td>";
        trs += "<td><form action='/accionesProducto' method='POST'><input type='hidden' name='id' value='"+productos[i].pro_id+"'><input type='submit'class='submit' name='accion' value='Borrar'><input type='submit' class='submit' name='accion' value='Modificar'></form></td>";
        trs += "</tr>";
    }

    response.send(`
    <html lang='es'>
    <head>
        <style>
        
        body {
            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f0f7fc; /* Azul claro */
            margin: 0;
            padding: 20px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            border: 2px solid #1e88e5; /* Azul */
            border-radius: 8px;
            margin-bottom: 20px;
        }
        
        table th,
        table td {
            padding: 12px;
            vertical-align: middle;
            border: 1px solid #1e88e5; /* Azul */
        }
        
        th {
            background-color: #1e88e5; /* Azul */
            color: #fff; /* Texto blanco */
        }
        
        .submit {
            background-color: #1e88e5; /* Azul */
            color: #fff; /* Texto blanco */
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            transition: background-color 0.3s ease;
        }
        
        .submit:hover {
            background-color: #005cb2; /* Azul más oscuro al pasar el mouse */
        }
        
        form {
            margin-top: 20px;
        }
        
        </style>
    </head>
    <body>
        <table>
            <tr>
                <th>ID:</th>
                <th>Nombre:</th>
                <th>Precio:</th>
                <th>Cantidad:</th>
                <th>Acciones:</th>
            </tr>
            ${trs}
        </table>
        <form action='index.html'><input type='submit' class='submit' value='Regresar'></form>
    </body>
    </html>
`);
});

app.use("/accionesProducto", async (request, response)=>{
    let valor = await new Promise((resolve, reject)=>{
        if(request.body.accion === "Borrar"){
            conection.query("DELETE FROM productos WHERE pro_id = "+request.body.id+";", (error, response, fields)=>{
                if(error){
                    console.log(error);
                    reject({});
                }
                else{
                    resolve({});
                }
            });
        }
        else{
            conection.query("SELECT pro_id, pro_nombre, pro_precio, pro_cantidad FROM productos WHERE pro_id = "+request.body.id+";", (error, response, fields)=>{
                if(error){
                    console.log(error);
                    reject({});
                }
                else{
                    resolve(response);
                }
            });


        }
    });


    if(valor.length !== 0){
        try{
            let formulario = "";
            let datos = valor[0];
            formulario += "<form action='/actualizarProducto' method='POST'>";
            formulario += "<input type='hidden' name='id' value='"+datos.pro_id+"'>";
            formulario += "Nombre del Producto: <input type='text' class='input' name='nombre' value='"+datos.pro_nombre+"'>";
            formulario += "<br>";
            formulario += "Precio del Producto: <input type='number' class='input' name='precio' value='"+datos.pro_precio+"' step='0.1'>";
            formulario += "<br>";
            formulario += "Cantidad del Producto: <input type='number' class='input' name='cantidad' value='"+datos.pro_cantidad+"'>";
            formulario += "<br>";
            formulario += "<input type='submit' class='submit' name='accion' value='Actualizar'>";
            formulario += "</form>";

            response.send(`"<html lang='es'><head><style>
            body {
                font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
                background-color: #f0f0f0; /* Fondo gris claro */
                margin: 0;
                padding: 20px;
            }
            
            table {
                width: 100%;
                border-collapse: collapse;
                border: 1px solid #ccc; /* Borde gris */
                border-radius: 8px;
                margin-bottom: 20px;
            }
            
            table th,
            table td {
                padding: 12px;
                vertical-align: middle;
                border: 1px solid #ccc; /* Borde gris */
            }
            
            th {
                background-color: #007bff; /* Azul */
                color: #fff; /* Texto blanco */
            }
            
            .submit {
                background-color: #007bff; /* Azul */
                color: #fff; /* Texto blanco */
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                transition: background-color 0.3s ease;
            }
            
            .submit:hover {
                background-color: #0056b3; /* Azul más oscuro al pasar el mouse */
            }
            
            form {
                margin-top: 20px;
            }
            
            </style></head><body>"`+formulario+"</body></html>");
        }
        catch(err){
            response.redirect("/mostrarProductos")
        }
    }
    else{
        response.redirect("/mostrarProductos");
    }
});

app.use("/actualizarProducto", async (request, response)=>{
    let respuesta = await new Promise((resolve, reject)=>{
        conection.query("UPDATE productos SET pro_nombre = '"+request.body.nombre+"', pro_precio = "+request.body.precio+", pro_cantidad = "+request.body.cantidad+ " WHERE pro_id = "+request.body.id+ ";", (error, response, fields)=>{  
            if(error){
                reject(false);
            }
            else{
                resolve(true);
            }
        });
    });

    if(respuesta){
        response.redirect("/mostrarProductos");
    }
});

app.listen(puerto,()=>{
    console.log('servidor escuchando en http://localhost:'+puerto+"/");
});