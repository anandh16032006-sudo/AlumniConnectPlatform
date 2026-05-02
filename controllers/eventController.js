const db = require("../config/db");

// GET EVENTS
exports.getEvents = (req, res) => {
  db.query(
    "SELECT e.*, u.name as organizer_name FROM events e LEFT JOIN users u ON e.created_by = u.id ORDER BY e.event_date ASC",
    (err, result) => {
      if (err) return res.status(500).json({ error: "Failed to load events" });
      res.json(result);
    }
  );
};

// CREATE EVENT (admin/alumni only)
exports.createEvent = (req, res) => {
  const { title, description, event_date, location, created_by } = req.body;
  const role = req.headers["x-user-role"];

  if (!["admin", "alumni"].includes(role)) {
    return res.status(403).json({ error: "Only admin or alumni can create events" });
  }

  if (!title || !event_date || !created_by) {
    return res.status(400).json({ error: "Title, date and organizer required" });
  }

  db.query(
    "INSERT INTO events (title, description, event_date, location, created_by) VALUES (?, ?, ?, ?, ?)",
    [title, description || null, event_date, location || null, created_by],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Failed to create event" });
      res.json({ message: "Event created!", id: result.insertId });
    }
  );
};

// DELETE EVENT
exports.deleteEvent = (req, res) => {
  const { id } = req.params;
  const role = req.headers["x-user-role"];

  if (role !== "admin") {
    return res.status(403).json({ error: "Only admin can delete events" });
  }

  db.query("DELETE FROM events WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: "Delete failed" });
    res.json({ message: "Event deleted" });
  });
};
