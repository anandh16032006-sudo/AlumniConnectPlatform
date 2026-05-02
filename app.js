require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Pug template engine
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// API Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/alumni", require("./routes/alumniRoutes"));
app.use("/api/mentorship", require("./routes/mentorshipRoutes"));
app.use("/api/jobs", require("./routes/jobRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/api/events", require("./routes/eventRoutes"));

// Page Routes
app.get("/", (req, res) => res.render("index"));
app.get("/login", (req, res) => res.render("login"));
app.get("/register", (req, res) => res.render("register"));
app.get("/dashboard", (req, res) => res.render("dashboard"));
app.get("/alumni", (req, res) => res.render("alumni"));
app.get("/jobs", (req, res) => res.render("jobs"));
app.get("/admin", (req, res) => res.render("admin"));
app.get("/chat", (req, res) => res.render("chat"));
app.get("/bookings", (req, res) => res.render("bookings"));
app.get("/events", (req, res) => res.render("events"));
app.get("/profile", (req, res) => res.render("profile"));

// 404 handler
app.use((req, res) => {
  res.status(404).render("404");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`✅ AlumniConnect running at: http://localhost:${PORT}`)
);
module.exports = app;