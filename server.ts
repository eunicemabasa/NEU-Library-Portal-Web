import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database('library.db');

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    email TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    user_type TEXT,
    college_office TEXT,
    is_blocked INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_email TEXT NOT NULL,
    reason TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_email) REFERENCES users(email)
  );
`);

// Seed an admin if not exists
const seedAdmin = db.prepare("INSERT OR IGNORE INTO users (email, name, role) VALUES (?, ?, ?)");
seedAdmin.run('admin@neu.edu.ph', 'System Admin', 'admin');

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Routes
  app.post('/api/login', (req, res) => {
    const { email, name } = req.body;
    let user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    
    if (!user) {
      // Create new user if not exists
      db.prepare("INSERT INTO users (email, name) VALUES (?, ?)").run(email, name || email.split('@')[0]);
      user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    }

    if (user.is_blocked) {
      return res.status(403).json({ error: 'Your access to the library has been blocked.' });
    }

    // Get visit count and history
    const visitCount = db.prepare("SELECT COUNT(*) as count FROM visits WHERE user_email = ?").get(email) as any;
    const history = db.prepare("SELECT * FROM visits WHERE user_email = ? ORDER BY timestamp DESC LIMIT 10").all(email);

    res.json({ ...user, visitCount: visitCount.count, history });
  });

  app.post('/api/update-profile', (req, res) => {
    const { email, user_type, college_office } = req.body;
    db.prepare("UPDATE users SET user_type = ?, college_office = ? WHERE email = ?")
      .run(user_type, college_office, email);
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    res.json(user);
  });

  app.post('/api/log-visit', (req, res) => {
    const { email, reason } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    
    if (!user || user.is_blocked) {
      return res.status(403).json({ error: 'Unauthorized or blocked.' });
    }

    db.prepare("INSERT INTO visits (user_email, reason) VALUES (?, ?)").run(email, reason);
    res.json({ success: true });
  });

  // Admin Routes
  app.get('/api/admin/stats', (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const stats = {
      totalVisitsToday: db.prepare("SELECT COUNT(*) as count FROM visits WHERE date(timestamp) = date('now')").get() as any,
      studentVisits: db.prepare("SELECT COUNT(*) as count FROM visits v JOIN users u ON v.user_email = u.email WHERE u.user_type = 'student' AND date(v.timestamp) = date('now')").get() as any,
      facultyVisits: db.prepare("SELECT COUNT(*) as count FROM visits v JOIN users u ON v.user_email = u.email WHERE u.user_type = 'faculty' AND date(v.timestamp) = date('now')").get() as any,
      adminVisits: db.prepare("SELECT COUNT(*) as count FROM visits v JOIN users u ON v.user_email = u.email WHERE u.user_type = 'admin' AND date(v.timestamp) = date('now')").get() as any,
    };
    res.json({
      totalVisitsToday: stats.totalVisitsToday.count,
      studentVisits: stats.studentVisits.count,
      facultyVisits: stats.facultyVisits.count,
      adminVisits: stats.adminVisits.count,
    });
  });

  app.get('/api/admin/visits', (req, res) => {
    const { start, end, search } = req.query;
    let query = `
      SELECT v.*, u.name as user_name, u.user_type, u.college_office 
      FROM visits v 
      JOIN users u ON v.user_email = u.email 
      WHERE 1=1
    `;
    const params: any[] = [];

    if (start) {
      query += " AND date(v.timestamp) >= date(?)";
      params.push(start);
    }
    if (end) {
      query += " AND date(v.timestamp) <= date(?)";
      params.push(end);
    }
    if (search) {
      query += " AND (u.name LIKE ? OR u.email LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    query += " ORDER BY v.timestamp DESC";
    const visits = db.prepare(query).all(...params);
    res.json(visits);
  });

  app.get('/api/admin/users', (req, res) => {
    const { search } = req.query;
    let query = "SELECT * FROM users WHERE 1=1";
    const params: any[] = [];
    if (search) {
      query += " AND (name LIKE ? OR email LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }
    const users = db.prepare(query).all(...params);
    res.json(users);
  });

  app.post('/api/admin/block-user', (req, res) => {
    const { email, is_blocked } = req.body;
    db.prepare("UPDATE users SET is_blocked = ? WHERE email = ?").run(is_blocked ? 1 : 0, email);
    res.json({ success: true });
  });

  // Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
