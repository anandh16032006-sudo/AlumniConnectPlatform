const db = require("../config/db");

// Middleware-like admin check helper
function requireAdmin(req, res) {
  const role = req.headers["x-user-role"];
  if (role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return false;
  }
  return true;
}

// GET PENDING USERS
exports.getPending = (req, res) => {
  if (!requireAdmin(req, res)) return;

  db.query(
    "SELECT id, name, email, role, status, created_at FROM users WHERE status = 'pending' ORDER BY created_at DESC",
    (err, result) => {
      if (err) return res.status(500).json({ error: "DB error" });
      res.json(result);
    }
  );
};

// APPROVE USER
exports.approve = (req, res) => {
  if (!requireAdmin(req, res)) return;

  const { id } = req.body;
  db.query("UPDATE users SET status = 'approved' WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: "DB error" });
    res.json({ message: "User approved successfully" });
  });
};

// REJECT / DELETE PENDING USER
exports.reject = (req, res) => {
  if (!requireAdmin(req, res)) return;

  const { id } = req.body;
  db.query("DELETE FROM users WHERE id = ? AND status = 'pending'", [id], (err) => {
    if (err) return res.status(500).json({ error: "DB error" });
    res.json({ message: "User rejected and removed" });
  });
};

// GET ALL USERS
exports.getUsers = (req, res) => {
  if (!requireAdmin(req, res)) return;

  db.query(
    "SELECT id, name, email, role, status, company, batch, created_at FROM users ORDER BY created_at DESC",
    (err, result) => {
      if (err) return res.status(500).json({ error: "DB error" });
      res.json(result);
    }
  );
};

// ADD USER (by admin)
exports.addUser = (req, res) => {
  if (!requireAdmin(req, res)) return;

  const { name, email, password, role, status } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "All fields required" });
  }

  db.query(
    "INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)",
    [name, email, password, role, status || "approved"],
    (err) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") return res.status(400).json({ error: "Email already exists" });
        return res.status(500).json({ error: "Failed to add user" });
      }
      res.json({ message: "User added successfully" });
    }
  );
};

// DELETE USER
exports.deleteUser = (req, res) => {
  if (!requireAdmin(req, res)) return;

  const { id } = req.params;
  db.query("DELETE FROM users WHERE id = ? AND role != 'admin'", [id], (err, result) => {
    if (err) return res.status(500).json({ error: "DB error" });
    if (result.affectedRows === 0) return res.status(400).json({ error: "Cannot delete admin user" });
    res.json({ message: "User deleted" });
  });
};

// COMPREHENSIVE INSIGHTS
exports.getInsights = (req, res) => {
  if (!requireAdmin(req, res)) return;

  const queries = [
    new Promise((resolve, reject) => {
      db.query("SELECT COUNT(*) as total FROM users", (err, r) => err ? reject(err) : resolve(r[0].total));
    }),
    new Promise((resolve, reject) => {
      db.query("SELECT COUNT(*) as c FROM users WHERE status = 'pending'", (err, r) => err ? reject(err) : resolve(r[0].c));
    }),
    new Promise((resolve, reject) => {
      db.query("SELECT COUNT(*) as c FROM users WHERE role = 'alumni'", (err, r) => err ? reject(err) : resolve(r[0].c));
    }),
    new Promise((resolve, reject) => {
      db.query("SELECT COUNT(*) as c FROM users WHERE role = 'student'", (err, r) => err ? reject(err) : resolve(r[0].c));
    }),
    new Promise((resolve, reject) => {
      db.query("SELECT COUNT(*) as c FROM chats", (err, r) => err ? reject(err) : resolve(r[0].c));
    }),
    new Promise((resolve, reject) => {
      db.query("SELECT COUNT(*) as c FROM jobs", (err, r) => err ? reject(err) : resolve(r[0].c));
    }),
    new Promise((resolve, reject) => {
      db.query("SELECT COUNT(*) as c FROM mentorship_requests", (err, r) => err ? reject(err) : resolve(r[0].c));
    }),
    new Promise((resolve, reject) => {
      db.query("SELECT COUNT(*) as c FROM mentorship_requests WHERE status = 'accepted'", (err, r) => err ? reject(err) : resolve(r[0].c));
    }),
  ];

  Promise.all(queries)
    .then(([total, pending, alumni, students, messages, jobs, mentorships, accepted]) => {
      res.json({
        total_users: total,
        pending_users: pending,
        total_alumni: alumni,
        total_students: students,
        total_messages: messages,
        total_jobs: jobs,
        total_mentorships: mentorships,
        accepted_mentorships: accepted,
      });
    })
    .catch(() => res.status(500).json({ error: "Failed to fetch insights" }));
};

// GET ALL JOBS (admin view)
exports.getJobs = (req, res) => {
  if (!requireAdmin(req, res)) return;

  db.query(
    "SELECT j.*, u.name as poster_name FROM jobs j LEFT JOIN users u ON j.posted_by = u.id ORDER BY j.id DESC",
    (err, result) => {
      if (err) return res.status(500).json({ error: "DB error" });
      res.json(result);
    }
  );
};

// DELETE JOB
exports.deleteJob = (req, res) => {
  if (!requireAdmin(req, res)) return;

  const { id } = req.params;
  db.query("DELETE FROM jobs WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: "DB error" });
    res.json({ message: "Job deleted" });
  });
};
