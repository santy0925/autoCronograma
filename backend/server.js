const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Configura tu conexión
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'flyr2025',
  database: 'flyr'
});

// Conexión inicial
db.connect(err => {
  if (err) {
    console.error('❌ Error de conexión:', err);
    return;
  }
  console.log('✅ Conectado a MySQL');
});

// Obtener todos los equipos
app.get('/equipos', (req, res) => {
  db.query('SELECT * FROM equipos', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Agregar equipo
app.post('/equipos', (req, res) => {
  const { nombre, personas, dias } = req.body;
  db.query('INSERT INTO equipos (nombre, personas, dias) VALUES (?, ?, ?)',
    [nombre, personas, dias],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: result.insertId });
    });
});

// Eliminar equipo
app.delete('/equipos/:id', (req, res) => {
  db.query('DELETE FROM equipos WHERE id = ?', [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: result.affectedRows });
  });
});

// Servidor activo
app.listen(3000, () => {
  console.log('🚀 Servidor backend corriendo en http://localhost:3000');
});
