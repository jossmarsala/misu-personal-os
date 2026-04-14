const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('./db.cjs');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'misu_super_secret_key_123!';

// Authentication Middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

app.post('/api/auth/signup', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  db.get(`SELECT id FROM users WHERE email = ?`, [email], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (row) return res.status(409).json({ error: 'Email already exists' });

    const hashedPassword = bcrypt.hashSync(password, 10);
    const userId = crypto.randomUUID();

    db.run(`INSERT INTO users (id, email, password) VALUES (?, ?, ?)`, [userId, email, hashedPassword], (err) => {
      if (err) return res.status(500).json({ error: 'Failed to create user' });
      
      const initialData = JSON.stringify({ tasks: [], settings: {} });
      db.run(`INSERT INTO user_data (user_id, data) VALUES (?, ?)`, [userId, initialData]);

      const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { id: userId, email } });
    });
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  db.get(`SELECT id, email, password FROM users WHERE email = ?`, [email], (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email } });
  });
});

app.get('/api/data', authenticate, (req, res) => {
  db.get(`SELECT data FROM user_data WHERE user_id = ?`, [req.userId], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!row) return res.json({ data: null });
    res.json({ data: JSON.parse(row.data) });
  });
});

app.post('/api/data', authenticate, (req, res) => {
  const { data } = req.body;
  const dataString = JSON.stringify(data);
  
  db.run(`UPDATE user_data SET data = ? WHERE user_id = ?`, [dataString, req.userId], function(err) {
    if (err) return res.status(500).json({ error: 'Failed to save data' });
    
    if (this.changes === 0) {
      db.run(`INSERT INTO user_data (user_id, data) VALUES (?, ?)`, [req.userId, dataString], (err) => {
        if (err) return res.status(500).json({ error: 'Failed to insert data' });
        res.json({ success: true });
      });
    } else {
      res.json({ success: true });
    }
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Misu API Server running on port ${PORT}`);
});
