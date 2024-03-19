import { PORT } from './config.js';
import {
  MYSQLHOST,
  MYSQLDATABASE,
  MYSQL_ROOT_PASSWORD,
  MYSQLPORT,
  MYSQLUSER,
} from './config.js';

import express from 'express';
import mysql from 'mysql2/promise';
import bodyParser from 'body-parser';

const app = express();
const puerto = 3000;

const conection = mysql.createPool({
  host: MYSQLHOST,
  user: MYSQLUSER,
  port: MYSQLPORT,
  password: MYSQL_ROOT_PASSWORD,
  database: MYSQLDATABASE,
  connectionLimit: 10, // Límite de conexiones en el pool
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use('/ingresarProducto', async (req, res) => {
  try {
    const { nombre, cantidad, precio } = req.body;

    // Consulta preparada para obtener el próximo ID
    const [rows] = await conection.execute(
      'SELECT MAX(pro_id) + 1 AS next_id FROM productos'
    );
    const nextId = rows[0].next_id || 1;

    // Consulta preparada para insertar un nuevo producto
    const [result] = await conection.execute(
      'INSERT INTO productos (pro_id, pro_nombre, pro_precio, pro_cantidad) VALUES (?, ?, ?, ?)',
      [nextId, nombre, precio, cantidad]
    );

    if (result.affectedRows > 0) {
      res.redirect('/mostrarProductos');
    } else {
      console.error('Error al insertar el producto');
    }
  } catch (err) {
    console.error(err);
  }
});

app.use('/mostrarProductos', async (request, response) => {
  try {
    const [productos] = await conection.execute(
      'SELECT pro_id, pro_nombre, pro_precio, pro_cantidad FROM productos'
    );

    let trs = '';
    for (const producto of productos) {
      trs += '<tr>';
      trs += `<td>${producto.pro_id}</td>`;
      trs += `<td>${producto.pro_nombre}</td>`;
      trs += `<td>$${producto.pro_precio}</td>`;
      trs += `<td>${producto.pro_cantidad}</td>`;
      trs += `<td><form action='/accionesProducto' method='POST'><input type='hidden' name='id' value='${producto.pro_id}'><input type='submit' class='submit' name='accion' value='Borrar'><input type='submit' class='submit' name='accion' value='Modificar'></form></td>`;
      trs += '</tr>';
    }

    response.send(`
      <html lang='es'>
      <head>
        <style>
          /* Estilos CSS ... */
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
  } catch (err) {
    console.error(err);
  }
});

app.use('/accionesProducto', async (request, response) => {
  try {
    const accion = request.body.accion;
    const id = request.body.id;

    if (accion === 'Borrar') {
      // Consulta preparada para borrar un producto
      const [result] = await conection.execute(
        'DELETE FROM productos WHERE pro_id = ?',
        [id]
      );

      if (result.affectedRows > 0) {
        response.redirect('/mostrarProductos');
      } else {
        console.error('Error al borrar el producto');
      }
    } else {
      // Consulta preparada para obtener los detalles del producto
      const [productos] = await conection.execute(
        'SELECT pro_id, pro_nombre, pro_precio, pro_cantidad FROM productos WHERE pro_id = ?',
        [id]
      );

      if (productos.length > 0) {
        const producto = productos[0];
        let formulario = '';
        formulario += '<form action="/actualizarProducto" method="POST">';
        formulario += `<input type="hidden" name="id" value="${producto.pro_id}">`;
        formulario += `Nombre del Producto: <input type="text" class="input" name="nombre" value="${producto.pro_nombre}">`;
        formulario += '<br>';
        formulario += `Precio del Producto: <input type="number" class="input" name="precio" value="${producto.pro_precio}" step="0.1">`;
        formulario += '<br>';
        formulario += `Cantidad del Producto: <input type="number" class="input" name="cantidad" value="${producto.pro_cantidad}">`;
        formulario += '<br>';
        formulario += '<input type="submit" class="submit" name="accion" value="Actualizar">';
        formulario += '</form>';

        response.send(`
          <html lang="es">
          <head>
            <style>
              /* Estilos CSS ... */
            </style>
          </head>
          <body>${formulario}</body>
          </html>
        `);
      } else {
        response.redirect('/mostrarProductos');
      }
    }
  } catch (err) {
    console.error(err);
    response.redirect('/mostrarProductos');
  }
});

app.use('/actualizarProducto', async (request, response) => {
  try {
    const { id, nombre, precio, cantidad } = request.body;

    // Consulta preparada para actualizar un producto
    const [result] = await conection.execute(
      'UPDATE productos SET pro_nombre = ?, pro_precio = ?, pro_cantidad = ? WHERE pro_id = ?',
      [nombre, precio, cantidad, id]
    );

    if (result.affectedRows > 0) {
      response.redirect('/mostrarProductos');
    } else {
      console.error('Error al actualizar el producto');
    }
  } catch (err) {
    console.error(err);
  }
});

app.listen(puerto, () => {
  console.log('Servidor escuchando en http://localhost:' + puerto + '/');
});