const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'Comida',
  charset: 'utf8mb4',
  timezone: 'local'
});

connection.connect((err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
    return;
  }
  console.log('Conexión exitosa a la base de datos (shop)');
});

function obtenerProductos(callback) {
  connection.query('SELECT * FROM Productos', (err, results) => {
    if (err) {
      console.error('Error al obtener productos:', err);
      callback(err, null);
      return;
    }
    callback(null, results);
  });
}

function crearOrden(productoId, cantidad, total, callback) {
  connection.query(
    'INSERT INTO Ordenes (producto_id, cantidad, total) VALUES (?, ?, ?)',
    [productoId, cantidad, total],
    (err, results) => {
      if (err) {
        console.error('Error al crear orden:', err);
        callback(err, null);
        return;
      }
      callback(null, results.insertId);
    }
  );
}

function actualizarOrden(pspReference, estado, ordenId, callback) {
  connection.query(
    'UPDATE Ordenes SET estado = ?, adyen_psp_reference = ? WHERE id = ?',
    [estado, pspReference, ordenId],
    (err, results) => {
      if (err) {
        console.error('Error al actualizar orden:', err);
        callback(err, null);
        return;
      }
      callback(null, results);
    }
  );
}

module.exports = {
  obtenerProductos,
  crearOrden,
  actualizarOrden
};