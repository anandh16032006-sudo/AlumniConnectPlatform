const db = require("../config/db");

// GET ALL CHATS with pagination
exports.getChats = (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;

  db.query(
    "SELECT * FROM chats ORDER BY created_at ASC LIMIT ? OFFSET ?",
    [limit, offset],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Failed to load chats" });
      res.json(result);
    }
  );
};

// SEND CHAT MESSAGE (fixed - handles both text and file)
exports.sendChat = (req, res) => {
  try {
    const { user_id, sender_name, sender_role, message } = req.body;

    // Validate required user info
    if (!user_id || !sender_name || !sender_role) {
      return res.status(400).json({ error: "User info missing. Please login first." });
    }

    // Either message or file must be present
    const hasMessage = message && message.trim().length > 0;
    const hasFile = req.file != null;

    if (!hasMessage && !hasFile) {
      return res.status(400).json({ error: "Please enter a message or attach a file." });
    }

    const file_name = hasFile ? req.file.originalname : null;
    const file_path = hasFile ? `/uploads/${req.file.filename}` : null;
    const file_type = hasFile ? req.file.mimetype : null;
    const file_size = hasFile ? req.file.size : null;

    db.query(
      "INSERT INTO chats (user_id, sender_name, sender_role, message, file_name, file_path, file_type, file_size) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        user_id,
        sender_name,
        sender_role,
        hasMessage ? message.trim() : null,
        file_name,
        file_path,
        file_type,
        file_size,
      ],
      (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to send message" });
        res.json({
          message: "Message sent",
          id: result.insertId,
          file_path: file_path,
          file_name: file_name,
          file_type: file_type,
        });
      }
    );
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Server error sending message" });
  }
};

// DELETE CHAT (admin only)
exports.deleteChat = (req, res) => {
  const { id } = req.params;
  const requester_role = req.headers["x-user-role"];

  if (requester_role !== "admin") {
    return res.status(403).json({ error: "Only admin can delete messages" });
  }

  db.query("DELETE FROM chats WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: "Failed to delete" });
    res.json({ message: "Message deleted" });
  });
};

// GET CHAT COUNT
exports.getChatCount = (req, res) => {
  db.query("SELECT COUNT(*) as total FROM chats", (err, result) => {
    if (err) return res.status(500).json({ error: "DB error" });
    res.json({ total: result[0].total });
  });
};
