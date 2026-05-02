const db = require("../config/db");

// REQUEST MENTORSHIP
exports.request = (req, res) => {
  const { student_id, alumni_id, message } = req.body;

  if (!student_id || !alumni_id) {
    return res.status(400).json({ error: "Student and alumni IDs required" });
  }

  // Check for existing pending request
  db.query(
    "SELECT id FROM mentorship_requests WHERE student_id = ? AND alumni_id = ? AND status = 'pending'",
    [student_id, alumni_id],
    (err, existing) => {
      if (err) return res.status(500).json({ error: "DB error" });
      if (existing.length > 0) {
        return res.status(400).json({ error: "Request already sent to this alumni" });
      }

      db.query(
        "INSERT INTO mentorship_requests (student_id, alumni_id, message) VALUES (?, ?, ?)",
        [student_id, alumni_id, message || "I would love your mentorship guidance!"],
        (err) => {
          if (err) return res.status(500).json({ error: "Failed to send request" });
          res.json({ message: "Mentorship request sent!" });
        }
      );
    }
  );
};

// GET BOOKINGS (user-specific)
exports.getBookings = (req, res) => {
  const { user_id, role } = req.query;

  if (!user_id) return res.status(400).json({ error: "User ID required" });

  let query, params;

  if (role === "admin") {
    query = `
      SELECT mr.*, 
        s.name as student_name, s.email as student_email,
        a.name as alumni_name, a.email as alumni_email, a.company
      FROM mentorship_requests mr
      LEFT JOIN users s ON mr.student_id = s.id
      LEFT JOIN users a ON mr.alumni_id = a.id
      ORDER BY mr.id DESC
    `;
    params = [];
  } else if (role === "alumni") {
    query = `
      SELECT mr.*, 
        s.name as student_name, s.email as student_email
      FROM mentorship_requests mr
      LEFT JOIN users s ON mr.student_id = s.id
      WHERE mr.alumni_id = ?
      ORDER BY mr.id DESC
    `;
    params = [user_id];
  } else {
    query = `
      SELECT mr.*, 
        a.name as alumni_name, a.email as alumni_email, a.company
      FROM mentorship_requests mr
      LEFT JOIN users a ON mr.alumni_id = a.id
      WHERE mr.student_id = ?
      ORDER BY mr.id DESC
    `;
    params = [user_id];
  }

  db.query(query, params, (err, result) => {
    if (err) return res.status(500).json({ error: "Failed to fetch bookings" });
    res.json(result);
  });
};

// UPDATE BOOKING STATUS (accept/reject)
exports.updateStatus = (req, res) => {
  const { id } = req.params;
  const { status, user_id } = req.body;

  if (!["accepted", "rejected", "pending"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  db.query(
    "UPDATE mentorship_requests SET status = ? WHERE id = ? AND alumni_id = ?",
    [status, id, user_id],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Update failed" });
      if (result.affectedRows === 0) return res.status(403).json({ error: "Not authorized" });
      res.json({ message: `Request ${status}` });
    }
  );
};
