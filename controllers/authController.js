const db = require("../config/db");

// REGISTER
exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "All fields required" });
  }

  if (role === "admin") {
    return res.status(403).json({ error: "Cannot register as admin" });
  }

  try {
    await db.query(
      "INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, 'pending')",
      [name, email, password, role]
    );
    res.json({ message: "Registered successfully! Wait for admin approval." });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Email already registered" });
    }
    console.error("Reg Error:", err);
    return res.status(500).json({ error: "Registration failed" });
  }
};

// LOGIN
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    // With pool.promise(), result is returned as [rows, fields]
    const [rows] = await db.query(
      "SELECT * FROM users WHERE email = ? AND password = ?",
      [email, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = rows[0];

    if (user.role !== "admin" && user.status !== "approved") {
      return res.status(403).json({ error: "Account pending admin approval. Please wait." });
    }

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
  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// LOGOUT
exports.logout = (req, res) => {
  res.json({ message: "Logged out successfully" });
};

// GET CURRENT USER PROFILE
exports.getProfile = async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: "User ID required" });

  try {
    const [rows] = await db.query(
      "SELECT id, name, email, role, status, bio, company, batch FROM users WHERE id = ?",
      [user_id]
    );

    if (rows.length === 0) return res.status(404).json({ error: "User not found" });
    res.json(rows[0]);
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
};

// UPDATE PROFILE
exports.updateProfile = async (req, res) => {
  const { user_id, bio, company, batch } = req.body;
  if (!user_id) return res.status(400).json({ error: "User ID required" });

  try {
    await db.query(
      "UPDATE users SET bio = ?, company = ?, batch = ? WHERE id = ?",
      [bio || null, company || null, batch || null, user_id]
    );
    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    return res.status(500).json({ error: "Update failed" });
  }
};