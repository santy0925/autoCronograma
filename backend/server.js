const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Conexión a MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root', // cambia si tu usuario es diferente
  password: 'flyr2025', // pon tu contraseña si tiene
  database: 'flyr'
});

// ▶ Conexión
db.connect(err => {
  if (err) {
    console.error('Error al conectar a MySQL:', err);
    return;
  }
  console.log('✅ Conectado a MySQL');
});

// ------------------- RUTAS -------------------

// Obtener equipos con sus integrantes
app.get('/equipos', (req, res) => {
  const queryEquipos = 'SELECT * FROM equipos';
  const queryIntegrantes = 'SELECT * FROM integrantes';

  db.query(queryEquipos, (err, equipos) => {
    if (err) return res.status(500).send(err);

    db.query(queryIntegrantes, (err2, integrantes) => {
      if (err2) return res.status(500).send(err2);

      const equiposConIntegrantes = equipos.map(equipo => {
        const lista = integrantes.filter(i => i.equipo_id === equipo.id);
        return { ...equipo, integrantes: lista };
      });

      res.json(equiposConIntegrantes);
    });
  });
});

//  Crear equipo
app.post('/equipos', (req, res) => {
  const { nombre, personas, dias } = req.body;
  db.query(
    'INSERT INTO equipos (nombre, personas, dias) VALUES (?, ?, ?)',
    [nombre, personas, dias],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.send({ id: result.insertId });
    }
  );
});

//  Eliminar equipo (y sus integrantes)
app.delete('/equipos/:id', (req, res) => {
  const id = req.params.id;
  db.query('DELETE FROM equipos WHERE id = ?', [id], err => {
    if (err) return res.status(500).send(err);
    res.sendStatus(200);
  });
});

//  Agregar integrante a un equipo
app.post('/integrantes', (req, res) => {
  const { equipo_id, nombre } = req.body;
  db.query(
    'INSERT INTO integrantes (equipo_id, nombre) VALUES (?, ?)',
    [equipo_id, nombre],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.send({ id: result.insertId });
    }
  );
});

// ------------------- INICIAR SERVIDOR -------------------
app.listen(3000, () => {
  console.log('🚀 Backend corriendo en http://localhost:3000');
});