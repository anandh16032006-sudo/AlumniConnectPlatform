const db = require("../config/db");

// REGISTER
exports.register = (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "All fields required" });
  }

  // Prevent registering as admin via public form
  if (role === "admin") {
    return res.status(403).json({ error: "Cannot register as admin" });
  }

  db.query(
    "INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, 'pending')",
    [name, email, password, role],
    (err) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).json({ error: "Email already registered" });
        }
        return res.status(500).json({ error: "Registration failed" });
      }
      res.json({ message: "Registered successfully! Wait for admin approval." });
    }
  );
};

// LOGIN — properly returns user with role for admin redirect
exports.login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  db.query(
    "SELECT * FROM users WHERE email = ? AND password = ?",
    [email, password],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Server error" });

      if (result.length === 0) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const user = result[0];

      // Admin can always login regardless of status
      if (user.role !== "admin" && user.status !== "approved") {
        return res.status(403).json({ error: "Account pending admin approval. Please wait." });
      }

      // Return safe user object (no password in response)
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        bio: user.bio || "",
        company: user.company || "",
        batch: user.batch || "",
        avatar: user.avatar || null,
      });
    }
  );
};

// LOGOUT (client-side, but API endpoint for consistency)
exports.logout = (req, res) => {
  res.json({ message: "Logged out successfully" });
};

// GET CURRENT USER PROFILE
exports.getProfile = (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: "User ID required" });

  db.query("SELECT id, name, email, role, status, bio, company, batch FROM users WHERE id = ?",
    [user_id],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Server error" });
      if (result.length === 0) return res.status(404).json({ error: "User not found" });
      res.json(result[0]);
    }
  );
};

// UPDATE PROFILE
exports.updateProfile = (req, res) => {
  const { user_id, bio, company, batch } = req.body;
  if (!user_id) return res.status(400).json({ error: "User ID required" });

  db.query(
    "UPDATE users SET bio = ?, company = ?, batch = ? WHERE id = ?",
    [bio || null, company || null, batch || null, user_id],
    (err) => {
      if (err) return res.status(500).json({ error: "Update failed" });
      res.json({ message: "Profile updated successfully" });
    }
  );
};
