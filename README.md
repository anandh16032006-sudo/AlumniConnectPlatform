# 🎓 AlumniConnect — Alumni Association Platform v2.0

A beautiful, full-featured alumni network platform built with Node.js, Express, MySQL, and Pug.

---

## ✨ Features

### Core Features
- 🔐 **Secure Login/Register** — Role-based auth (Admin, Alumni, Student)
- 👑 **Admin Panel** — Protected by admin credentials, full platform control
- 💬 **Community Chat** — Real-time chat with file/image/PDF uploads
- 🎓 **Alumni Directory** — Search by name, company, or batch year
- 🤝 **Mentorship Booking** — Students request, alumni accept/decline
- 💼 **Job Board** — Post and discover opportunities within the network
- 📅 **Events** — Create and discover alumni events & webinars
- 👤 **Profile Management** — Update bio, company, batch info

### Bug Fixes (from v1)
- ✅ Admin panel now gated — only visible after admin login
- ✅ Common chat file upload fully fixed (image/PDF/doc/etc.)
- ✅ Chat shows file previews inline for images
- ✅ Login properly redirects admin → /admin, users → /dashboard
- ✅ Duplicate mentorship requests prevented
- ✅ Proper error messages throughout (no more raw error dumps)
- ✅ File type validation and 10MB size limit enforced

### New in v2.0
- 🌟 Completely redesigned UI — dark glass-morphism aesthetic
- 🎨 Playfair Display + DM Sans typography
- 🍞 Toast notification system (no more alert() popups)
- 📱 Fully responsive mobile design
- 🔴 Admin insights dashboard with 8 key metrics
- 🔍 User search & filter in admin panel
- 📊 Dashboard with recent activity preview
- 🗑️ Reject users from admin panel
- 📅 Events management for admin/alumni
- 🔄 Chat auto-refresh every 5 seconds
- 📎 Rich file previews (image thumbnails, file type icons)
- ⌨️ Enter to send chat, Shift+Enter for newline

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js v18+
- MySQL 8.0+

### 2. Database Setup
```bash
mysql -u root -p < setup.sql
```

### 3. Configure Environment
Edit `.env`:
```
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=alumni_db
```

### 4. Install Dependencies
```bash
npm install
```

### 5. Start Server
```bash
npm start
# or for development with auto-reload:
npx nodemon app.js
```

### 6. Open Browser
```
http://localhost:3000
```

---

## 🔑 Default Credentials

| Role    | Email               | Password  |
|---------|---------------------|-----------|
| Admin   | admin@gmail.com     | admin123  |
| Alumni  | priya@example.com   | pass123   |
| Student | arjun@example.com   | pass123   |

---

## 📁 Project Structure

```
alumni_platform/
├── app.js                    # Main server entry point
├── setup.sql                 # Database setup + seed data
├── .env                      # Environment variables
├── package.json
├── config/
│   └── db.js                 # MySQL connection
├── controllers/
│   ├── authController.js     # Login, register, profile
│   ├── adminController.js    # Admin operations
│   ├── alumniController.js   # Alumni search
│   ├── chatController.js     # Chat messages + file upload
│   ├── jobController.js      # Job board
│   ├── mentorshipController.js # Mentorship bookings
│   └── eventController.js   # Events (NEW)
├── routes/
│   ├── authRoutes.js
│   ├── adminRoutes.js
│   ├── alumniRoutes.js
│   ├── chatRoutes.js         # Multer file upload configured
│   ├── jobRoutes.js
│   ├── mentorshipRoutes.js
│   └── eventRoutes.js        # (NEW)
├── views/                    # Pug templates
│   ├── layout.pug            # Base layout with nav/footer
│   ├── index.pug             # Landing page
│   ├── login.pug
│   ├── register.pug
│   ├── dashboard.pug
│   ├── alumni.pug
│   ├── chat.pug              # Community chat
│   ├── jobs.pug
│   ├── bookings.pug
│   ├── events.pug            # (NEW)
│   ├── admin.pug             # Admin panel
│   ├── profile.pug           # (NEW)
│   └── 404.pug
├── public/
│   ├── css/style.css         # Complete design system
│   └── js/main.js            # All frontend logic
└── uploads/                  # Auto-created for file uploads
```

---

## 🛡️ Admin Panel

Access at `/admin` — **requires admin login first**.

Features:
- 📊 Overview with 8 platform metrics
- ✅ Approve / ❌ Reject pending users
- 👥 View all users with search & role filter
- ➕ Add users directly
- 💬 Delete chat messages (moderation)
- 💼 View and delete job listings

---

## 💬 Chat File Uploads

Supported file types:
- 🖼️ Images: JPG, PNG, GIF, WEBP (displayed inline)
- 📄 PDF documents
- 📝 Word documents (DOC, DOCX)
- 📃 Text files (TXT)
- 📦 ZIP archives
- 🎥 Videos: MP4, WEBM
- Max size: **10MB**

---

## 📡 API Endpoints

### Auth
- `POST /api/auth/login` — Login
- `POST /api/auth/register` — Register
- `GET  /api/auth/profile?user_id=` — Get profile
- `POST /api/auth/profile` — Update profile

### Admin (requires `x-user-role: admin` header)
- `GET  /api/admin/pending` — Pending users
- `GET  /api/admin/users` — All users
- `GET  /api/admin/insights` — Platform stats
- `POST /api/admin/approve` — Approve user
- `POST /api/admin/reject` — Reject user
- `POST /api/admin/users` — Add user
- `DELETE /api/admin/users/:id` — Delete user

### Chat
- `GET  /api/chat` — Get messages
- `POST /api/chat/send` — Send message (multipart/form-data)
- `DELETE /api/chat/:id` — Delete (admin only)

### Alumni
- `GET  /api/alumni/search?name=&company=&batch=`
- `GET  /api/alumni/featured`
- `GET  /api/alumni/:id`

### Jobs
- `GET  /api/jobs` — All jobs
- `POST /api/jobs/post` — Post job
- `DELETE /api/jobs/:id` — Delete job

### Mentorship
- `POST /api/mentorship/request` — Request mentorship
- `GET  /api/mentorship/bookings?user_id=&role=`
- `PUT  /api/mentorship/:id/status` — Accept/reject

### Events
- `GET  /api/events` — All events
- `POST /api/events` — Create event (admin/alumni)
- `DELETE /api/events/:id` — Delete (admin)

---

## 🎨 Design System

- **Theme**: Dark glass-morphism with purple/indigo palette
- **Fonts**: Playfair Display (headings) + DM Sans (body)
- **Colors**: `--primary: #6366f1`, `--accent: #f59e0b`, `--success: #10b981`
- **Components**: Cards, badges, toasts, shimmer loading, buttons
- **Responsive**: Mobile-first, hamburger menu on small screens

---

Built with ❤️ for alumni communities.
