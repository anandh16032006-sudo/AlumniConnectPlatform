const db = require("../config/db");

// GET ALL JOBS
exports.getJobs = (req, res) => {
  const { search, company } = req.query;
  let query = `
    SELECT j.*, u.name as poster_name, u.role as poster_role 
    FROM jobs j 
    LEFT JOIN users u ON j.posted_by = u.id
  `;
  const params = [];

  if (search) {
    query += " WHERE (j.title LIKE ? OR j.description LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }
  if (company) {
    query += params.length ? " AND j.company LIKE ?" : " WHERE j.company LIKE ?";
    params.push(`%${company}%`);
  }

  query += " ORDER BY j.id DESC LIMIT 50";

  db.query(query, params, (err, result) => {
    if (err) return res.status(500).json({ error: "Failed to load jobs" });
    res.json(result);
  });
};

// POST A JOB
exports.postJob = (req, res) => {
  const { title, company, description, posted_by, location, job_type } = req.body;

  if (!title || !company || !description || !posted_by) {
    return res.status(400).json({ error: "All fields required" });
  }

  db.query(
    "INSERT INTO jobs (title, company, description, posted_by, location, job_type) VALUES (?, ?, ?, ?, ?, ?)",
    [title, company, description, posted_by, location || null, job_type || "Full-time"],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Failed to post job" });
      res.json({ message: "Job posted successfully", id: result.insertId });
    }
  );
};

// DELETE JOB
exports.deleteJob = (req, res) => {
  const { id } = req.params;
  const user = req.headers["x-user-id"];
  const role = req.headers["x-user-role"];

  // Admin can delete any, users only their own
  const query = role === "admin"
    ? "DELETE FROM jobs WHERE id = ?"
    : "DELETE FROM jobs WHERE id = ? AND posted_by = ?";
  const params = role === "admin" ? [id] : [id, user];

  db.query(query, params, (err, result) => {
    if (err) return res.status(500).json({ error: "Delete failed" });
    if (result.affectedRows === 0) return res.status(403).json({ error: "Cannot delete this job" });
    res.json({ message: "Job deleted" });
  });
};
