const db = require("../config/db");

// SEARCH ALUMNI
exports.search = (req, res) => {
  const { name, company, batch } = req.query;

  let query = "SELECT id, name, email, role, company, batch, bio FROM users WHERE role = 'alumni' AND status = 'approved'";
  const params = [];

  if (name) {
    query += " AND name LIKE ?";
    params.push(`%${name}%`);
  }
  if (company) {
    query += " AND company LIKE ?";
    params.push(`%${company}%`);
  }
  if (batch) {
    query += " AND batch = ?";
    params.push(batch);
  }

  query += " ORDER BY name ASC LIMIT 50";

  db.query(query, params, (err, result) => {
    if (err) return res.status(500).json({ error: "Search failed" });
    res.json(result);
  });
};

// GET ALUMNI PROFILE
exports.getProfile = (req, res) => {
  const { id } = req.params;
  db.query(
    "SELECT id, name, email, company, batch, bio FROM users WHERE id = ? AND role = 'alumni'",
    [id],
    (err, result) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (result.length === 0) return res.status(404).json({ error: "Alumni not found" });
      res.json(result[0]);
    }
  );
};

// GET FEATURED ALUMNI (for homepage/dashboard)
exports.getFeatured = (req, res) => {
  db.query(
    "SELECT id, name, email, company, batch, bio FROM users WHERE role = 'alumni' AND status = 'approved' ORDER BY RAND() LIMIT 6",
    (err, result) => {
      if (err) return res.status(500).json({ error: "DB error" });
      res.json(result);
    }
  );
};
