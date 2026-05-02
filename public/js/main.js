/* =============================================
   ALUMNICONNECT — MAIN JAVASCRIPT
   Complete, bug-fixed implementation
   ============================================= */

/* ============ UTILITIES ============ */
function getCurrentUser() {
  try {
    const raw = localStorage.getItem("loggedInUser");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function setCurrentUser(user) {
  localStorage.setItem("loggedInUser", JSON.stringify(user));
}

function clearCurrentUser() {
  localStorage.removeItem("loggedInUser");
}

function adminHeaders() {
  const user = getCurrentUser();
  return {
    "Content-Type": "application/json",
    "x-user-role": user?.role || "",
    "x-user-id": user?.id || "",
  };
}

function getFileIcon(mimetype, filename) {
  if (!mimetype && !filename) return "fa-file";
  const mt = (mimetype || "").toLowerCase();
  const fn = (filename || "").toLowerCase();
  if (mt.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp)$/.test(fn)) return "fa-image";
  if (mt === "application/pdf" || fn.endsWith(".pdf")) return "fa-file-pdf";
  if (mt.includes("word") || /\.(doc|docx)$/.test(fn)) return "fa-file-word";
  if (mt === "text/plain" || fn.endsWith(".txt")) return "fa-file-alt";
  if (mt === "application/zip" || fn.endsWith(".zip")) return "fa-file-archive";
  if (mt.startsWith("video/") || /\.(mp4|webm)$/.test(fn)) return "fa-file-video";
  return "fa-file";
}

function formatTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return Math.floor(diff / 60000) + "m ago";
  if (diff < 86400000) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString();
}

function formatDate(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ============ TOAST NOTIFICATIONS ============ */
function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const icons = { success: "fa-check-circle", error: "fa-exclamation-circle", info: "fa-info-circle", warning: "fa-exclamation-triangle" };

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)";
    toast.style.transition = "0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/* ============ NAV & INIT ============ */
function initApp() {
  updateNavigation();
  highlightActiveNav();
  
  const page = window.location.pathname;
  if (page === "/" || page === "") loadHomePage();
  if (page === "/dashboard") loadDashboard();
  if (page === "/alumni") searchAlumni();
  if (page === "/jobs") { loadJobs(); setupJobsPage(); }
  if (page === "/chat") initChat();
  if (page === "/admin") initAdmin();
  if (page === "/bookings") loadBookings();
  if (page === "/events") loadEvents();
  if (page === "/profile") loadProfile();
}

function updateNavigation() {
  const user = getCurrentUser();
  const loginBtn = document.getElementById("loginNavBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const navUserInfo = document.getElementById("navUserInfo");

  if (user) {
    if (loginBtn) loginBtn.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "inline-flex";
    if (navUserInfo) {
      const roleIcons = { admin: "👑", alumni: "🏆", student: "🎓" };
      navUserInfo.textContent = `${roleIcons[user.role] || "👤"} ${user.name}`;
    }
  } else {
    if (loginBtn) loginBtn.style.display = "inline-flex";
    if (logoutBtn) logoutBtn.style.display = "none";
    if (navUserInfo) navUserInfo.textContent = "";
  }
}

function highlightActiveNav() {
  const path = window.location.pathname;
  document.querySelectorAll(".main-nav a").forEach((a) => {
    if (a.getAttribute("href") === path) a.classList.add("active");
  });
}

function handleLogout() {
  clearCurrentUser();
  showToast("Logged out successfully", "info");
  setTimeout(() => window.location.href = "/login", 800);
}

function toggleMobileMenu() {
  const menu = document.getElementById("mobileMenu");
  if (menu) menu.classList.toggle("open");
}

function togglePassword(id, btn) {
  const input = document.getElementById(id);
  if (!input) return;
  if (input.type === "password") {
    input.type = "text";
    btn.innerHTML = '<i class="fas fa-eye-slash"></i>';
  } else {
    input.type = "password";
    btn.innerHTML = '<i class="fas fa-eye"></i>';
  }
}

/* ============ LOGIN ============ */
document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector("button[type=submit]");
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.error || "Login failed", "error");
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login to Account';
      return;
    }

    setCurrentUser(data);
    showToast(`Welcome back, ${data.name}! 🎉`, "success");

    setTimeout(() => {
      // Admin goes to admin panel, others to dashboard
      window.location.href = data.role === "admin" ? "/admin" : "/dashboard";
    }, 900);

  } catch (err) {
    showToast("Network error. Please try again.", "error");
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login to Account';
  }
});

/* ============ REGISTER ============ */
document.getElementById("registerForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector("button[type=submit]");
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const role = document.getElementById("role").value;

  if (!role) { showToast("Please select a role", "warning"); return; }

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';

  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.error || "Registration failed", "error");
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
      return;
    }

    showToast("Account created! Waiting for admin approval. ✅", "success");
    setTimeout(() => window.location.href = "/login", 1500);

  } catch {
    showToast("Network error. Please try again.", "error");
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
  }
});

/* ============ HOME PAGE ============ */
async function loadHomePage() {
  // Animate stats counters
  animateCounter("statAlumni", "alumni", 0);
  animateCounter("statMentors", "mentors", 0);
  animateCounter("statJobs", "jobs", 0);

  // Load featured alumni
  try {
    const res = await fetch("/api/alumni/featured");
    if (!res.ok) return;
    const alumni = await res.json();
    const container = document.getElementById("featuredAlumni");
    if (!container) return;

    if (alumni.length === 0) {
      container.innerHTML = '<p style="color:var(--text-muted);text-align:center;grid-column:1/-1">No alumni to show yet.</p>';
      return;
    }

    container.innerHTML = alumni.map(a => `
      <div class="alumni-card">
        <div class="alumni-avatar">${escapeHtml(a.name[0] || "A")}</div>
        <h3>${escapeHtml(a.name)}</h3>
        <div class="alumni-company">
          <i class="fas fa-building" style="font-size:11px;color:var(--text-muted)"></i>
          ${escapeHtml(a.company || "Alumni")} ${a.batch ? `· ${escapeHtml(a.batch)}` : ""}
        </div>
        ${a.bio ? `<p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;-webkit-line-clamp:2;display:-webkit-box;-webkit-box-orient:vertical;overflow:hidden;">${escapeHtml(a.bio)}</p>` : ""}
        <button class="btn-sm" onclick="requestMentor(${a.id})">
          <i class="fas fa-handshake"></i> Connect
        </button>
      </div>
    `).join("");
  } catch {}
}

async function animateCounter(elId, type, start) {
  const el = document.getElementById(elId);
  if (!el) return;
  // Just show a nice placeholder until real data
  const targets = { alumni: 0, mentors: 0, jobs: 0 };
  try {
    if (type === "jobs") {
      const r = await fetch("/api/jobs");
      const d = await r.json();
      targets.jobs = d.length;
    } else if (type === "alumni") {
      const r = await fetch("/api/alumni/search?name=");
      const d = await r.json();
      targets.alumni = d.length;
    }
  } catch {}
  
  const target = targets[type] || 0;
  let current = 0;
  const step = Math.ceil(target / 30) || 1;
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current + "+";
    if (current >= target) clearInterval(timer);
  }, 40);
}

/* ============ ALUMNI SEARCH ============ */
async function searchAlumni() {
  const name = document.getElementById("search")?.value || "";
  const company = document.getElementById("searchCompany")?.value || "";
  const batch = document.getElementById("searchBatch")?.value || "";
  const resultsDiv = document.getElementById("results");
  const countEl = document.getElementById("resultsCount");

  if (!resultsDiv) return;
  resultsDiv.innerHTML = '<div class="loading-shimmer"></div><div class="loading-shimmer"></div><div class="loading-shimmer"></div>';

  try {
    const params = new URLSearchParams();
    if (name) params.append("name", name);
    if (company) params.append("company", company);
    if (batch) params.append("batch", batch);

    const res = await fetch(`/api/alumni/search?${params}`);
    if (!res.ok) throw new Error();
    const data = await res.json();

    if (countEl) countEl.textContent = `${data.length} alumni found`;

    resultsDiv.innerHTML = data.length === 0
      ? '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted)"><i class="fas fa-search" style="font-size:32px;margin-bottom:12px;display:block"></i><p>No alumni found. Try different search terms.</p></div>'
      : data.map(a => `
        <div class="alumni-card">
          <div class="alumni-avatar">${escapeHtml(a.name[0] || "A")}</div>
          <h3>${escapeHtml(a.name)}</h3>
          <div class="alumni-company">
            ${a.company ? `<i class="fas fa-building" style="font-size:11px;color:var(--text-muted)"></i> ${escapeHtml(a.company)}` : ""}
            ${a.batch ? `<span style="margin-left:6px;color:var(--text-muted)">· ${escapeHtml(a.batch)}</span>` : ""}
          </div>
          ${a.bio ? `<p style="font-size:13px;color:var(--text-secondary);margin:8px 0;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden">${escapeHtml(a.bio)}</p>` : ""}
          <div style="display:flex;gap:8px;margin-top:12px">
            <button class="btn-sm" onclick="requestMentor(${a.id})">
              <i class="fas fa-handshake"></i> Request Mentorship
            </button>
          </div>
        </div>
      `).join("");
  } catch {
    resultsDiv.innerHTML = '<p style="color:var(--danger);padding:20px">Failed to load alumni. Please try again.</p>';
  }
}

// Enter key search
document.getElementById("search")?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") searchAlumni();
});

/* ============ MENTORSHIP ============ */
async function requestMentor(alumni_id) {
  const user = getCurrentUser();
  if (!user) { showToast("Please login first", "warning"); window.location.href = "/login"; return; }
  if (user.role === "alumni" && user.id === alumni_id) { showToast("You cannot mentor yourself!", "warning"); return; }

  try {
    const res = await fetch("/api/mentorship/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: user.id,
        alumni_id,
        message: "Hi! I would love your guidance and mentorship.",
      }),
    });

    const data = await res.json();
    if (!res.ok) { showToast(data.error || "Request failed", "error"); return; }
    showToast("Mentorship request sent! 🎉", "success");
  } catch {
    showToast("Failed to send request", "error");
  }
}

async function loadBookings() {
  const div = document.getElementById("mentorshipBookings");
  if (!div) return;
  const user = getCurrentUser();
  if (!user) {
    div.innerHTML = `<div class="auth-card centered" style="margin:0 auto"><i class="fas fa-lock" style="font-size:32px;color:var(--text-muted);margin-bottom:12px;display:block"></i><p>Please <a href="/login" style="color:var(--primary-light)">login</a> to view bookings.</p></div>`;
    return;
  }

  div.innerHTML = '<div class="loading-shimmer"></div><div class="loading-shimmer"></div>';

  try {
    const res = await fetch(`/api/mentorship/bookings?user_id=${user.id}&role=${user.role}`);
    const data = await res.json();

    if (data.length === 0) {
      div.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-muted)"><i class="fas fa-handshake" style="font-size:36px;margin-bottom:12px;display:block"></i><p>No mentorship bookings yet.</p><a class="btn-primary" href="/alumni" style="margin-top:16px;display:inline-flex"><i class="fas fa-search"></i>&nbsp;Find a Mentor</a></div>`;
      return;
    }

    div.innerHTML = data.map(b => {
      const statusColors = { pending: "amber", accepted: "green", rejected: "danger" };
      const isAlumni = user.role === "alumni";
      const otherName = isAlumni ? (b.student_name || "Student") : (b.alumni_name || "Alumni");
      const otherEmail = isAlumni ? b.student_email : b.alumni_email;

      return `
        <div class="booking-card">
          <div style="display:flex;align-items:center;gap:14px">
            <div class="user-item-avatar">${escapeHtml((otherName || "?")[0])}</div>
            <div class="booking-info">
              <h4>${escapeHtml(otherName)}</h4>
              <p>${escapeHtml(otherEmail || "")} ${b.company ? `· ${escapeHtml(b.company)}` : ""}</p>
              ${b.message ? `<p style="margin-top:4px;font-style:italic;color:var(--text-muted)">"${escapeHtml(b.message)}"</p>` : ""}
            </div>
          </div>
          <div class="booking-actions">
            <span class="tag ${statusColors[b.status] || ""}">${b.status || "pending"}</span>
            ${isAlumni && b.status === "pending" ? `
              <button class="btn-success" onclick="updateMentorshipStatus(${b.id}, 'accepted')">
                <i class="fas fa-check"></i> Accept
              </button>
              <button class="btn-danger" onclick="updateMentorshipStatus(${b.id}, 'rejected')">
                <i class="fas fa-times"></i> Decline
              </button>
            ` : ""}
          </div>
        </div>
      `;
    }).join("");
  } catch {
    div.innerHTML = '<p style="color:var(--danger)">Failed to load bookings.</p>';
  }
}

async function updateMentorshipStatus(id, status) {
  const user = getCurrentUser();
  if (!user) return;

  try {
    const res = await fetch(`/api/mentorship/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, user_id: user.id }),
    });

    const data = await res.json();
    if (!res.ok) { showToast(data.error, "error"); return; }
    showToast(`Request ${status}! ✅`, "success");
    loadBookings();
  } catch {
    showToast("Failed to update status", "error");
  }
}

/* ============ JOBS ============ */
let allJobs = [];

async function loadJobs() {
  const div = document.getElementById("jobs");
  if (!div) return;
  div.innerHTML = '<div class="loading-shimmer"></div><div class="loading-shimmer"></div><div class="loading-shimmer"></div>';

  try {
    const res = await fetch("/api/jobs");
    allJobs = await res.json();
    renderJobs(allJobs);
  } catch {
    div.innerHTML = '<p style="color:var(--danger)">Failed to load jobs.</p>';
  }
}

function renderJobs(jobs) {
  const div = document.getElementById("jobs");
  if (!div) return;
  const user = getCurrentUser();

  if (jobs.length === 0) {
    div.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-muted)"><i class="fas fa-briefcase" style="font-size:36px;margin-bottom:12px;display:block"></i><p>No jobs posted yet. Be the first!</p></div>`;
    return;
  }

  div.innerHTML = jobs.map(j => `
    <div class="job-card">
      <div class="job-card-header">
        <div>
          <h3>${escapeHtml(j.title)}</h3>
          <div class="job-company">
            <i class="fas fa-building" style="font-size:11px"></i>
            ${escapeHtml(j.company)} ${j.poster_name ? `<span style="color:var(--text-muted)">· by ${escapeHtml(j.poster_name)}</span>` : ""}
          </div>
        </div>
        ${user?.role === "admin" || user?.id === j.posted_by ? `
          <button class="btn-danger" onclick="deleteJob(${j.id})" style="flex-shrink:0">
            <i class="fas fa-trash"></i>
          </button>
        ` : ""}
      </div>
      <p style="font-size:13px;color:var(--text-secondary);line-height:1.6">${escapeHtml(j.description)}</p>
      <div class="job-tags">
        ${j.job_type ? `<span class="tag">${escapeHtml(j.job_type)}</span>` : ""}
        ${j.location ? `<span class="tag green"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(j.location)}</span>` : ""}
      </div>
    </div>
  `).join("");
}

function searchJobs() {
  const q = document.getElementById("jobSearch")?.value.toLowerCase() || "";
  if (!q) { renderJobs(allJobs); return; }
  renderJobs(allJobs.filter(j =>
    j.title.toLowerCase().includes(q) ||
    j.company.toLowerCase().includes(q) ||
    (j.description || "").toLowerCase().includes(q)
  ));
}

function setupJobsPage() {
  const user = getCurrentUser();
  const postSection = document.getElementById("postJobSection");
  const loginPrompt = document.getElementById("jobsLoginPrompt");

  if (!user) {
    if (postSection) postSection.style.display = "none";
    if (loginPrompt) loginPrompt.style.display = "block";
  }
}

document.getElementById("jobForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = getCurrentUser();
  if (!user) { showToast("Please login first", "warning"); window.location.href = "/login"; return; }

  const btn = e.target.querySelector("button[type=submit]");
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';

  try {
    const res = await fetch("/api/jobs/post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: document.getElementById("title").value.trim(),
        company: document.getElementById("company").value.trim(),
        description: document.getElementById("desc").value.trim(),
        location: document.getElementById("location")?.value?.trim() || "",
        job_type: document.getElementById("jobType")?.value || "Full-time",
        posted_by: user.id,
      }),
    });

    const data = await res.json();
    if (!res.ok) { showToast(data.error || "Failed to post", "error"); return; }
    showToast("Job posted successfully! 🎉", "success");
    e.target.reset();
    loadJobs();
  } catch {
    showToast("Failed to post job", "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-paper-plane"></i> Post Job';
  }
});

async function deleteJob(id) {
  if (!confirm("Delete this job listing?")) return;
  const user = getCurrentUser();
  try {
    const res = await fetch(`/api/jobs/${id}`, {
      method: "DELETE",
      headers: adminHeaders(),
    });
    const data = await res.json();
    if (!res.ok) { showToast(data.error, "error"); return; }
    showToast("Job deleted", "success");
    loadJobs();
  } catch { showToast("Failed to delete", "error"); }
}

/* ============ CHAT ============ */
let chatPolling = null;
let lastChatCount = 0;

function initChat() {
  const user = getCurrentUser();

  // Update sidebar user info
  const nameEl = document.getElementById("chatUserName");
  const roleEl = document.getElementById("chatUserRole");
  if (nameEl) nameEl.textContent = user ? user.name : "Guest (login to chat)";
  if (roleEl) roleEl.textContent = user ? user.role : "";

  loadChats();

  // Poll for new messages every 5 seconds
  chatPolling = setInterval(loadChats, 5000);

  // Auto-resize textarea
  const textarea = document.getElementById("chatMessage");
  if (textarea) {
    textarea.addEventListener("input", () => {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
    });

    textarea.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        document.getElementById("chatForm")?.requestSubmit();
      }
    });
  }
}

async function loadChats() {
  const div = document.getElementById("chatList") || document.getElementById("adminChatList");
  if (!div) return;

  try {
    const res = await fetch("/api/chat");
    if (!res.ok) return;
    const chats = await res.json();

    const countEl = document.getElementById("msgCount");
    if (countEl) countEl.textContent = `${chats.length} messages`;

    const onlineEl = document.getElementById("onlineCount");
    if (onlineEl) onlineEl.textContent = `${chats.length} messages`;

    if (chats.length === lastChatCount && div.children.length > 1) return;
    lastChatCount = chats.length;

    const user = getCurrentUser();
    const isAtBottom = div.scrollHeight - div.scrollTop - div.clientHeight < 80;

    if (div.id === "chatList") {
      // Chat page view
      div.innerHTML = chats.length === 0
        ? `<div style="text-align:center;padding:60px 20px;color:var(--text-muted)"><i class="fas fa-comments" style="font-size:40px;margin-bottom:14px;display:block"></i><p>No messages yet. Start the conversation! 👋</p></div>`
        : chats.map(c => buildChatMessage(c, user)).join("");

      if (isAtBottom || lastChatCount === chats.length) {
        div.scrollTop = div.scrollHeight;
      }
    } else {
      // Admin moderation view
      renderAdminChats(chats);
    }
  } catch {}
}

function buildChatMessage(c, user) {
  const isOwn = user && c.user_id === user.id;
  const isImage = c.file_type && c.file_type.startsWith("image/");

  return `
    <div class="chat-message ${isOwn ? "own" : "other"}">
      <div class="msg-meta">
        <span class="msg-sender">${escapeHtml(c.sender_name || "User")}</span>
        <span class="msg-role-badge role-${c.sender_role || "student"}">${c.sender_role || "student"}</span>
        <span>${formatTime(c.created_at)}</span>
        ${user?.role === "admin" ? `<button style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:12px" onclick="deleteChat(${c.id})" title="Delete"><i class="fas fa-trash"></i></button>` : ""}
      </div>
      ${c.message ? `<div class="msg-bubble">${escapeHtml(c.message)}</div>` : ""}
      ${c.file_path ? (
        isImage
          ? `<img class="msg-image" src="${c.file_path}" alt="${escapeHtml(c.file_name || 'image')}" onclick="window.open('${c.file_path}','_blank')" style="cursor:pointer">`
          : `<a class="msg-file" href="${c.file_path}" target="_blank">
               <i class="fas ${getFileIcon(c.file_type, c.file_name)}" style="font-size:20px"></i>
               <div>
                 <div style="font-weight:600;font-size:13px">${escapeHtml(c.file_name || "File")}</div>
                 <div style="font-size:11px;color:var(--text-muted)">Click to download</div>
               </div>
             </a>`
      ) : ""}
    </div>
  `;
}

function renderAdminChats(chats) {
  const div = document.getElementById("adminChatList");
  if (!div) return;

  div.innerHTML = chats.length === 0
    ? '<p style="color:var(--text-muted);padding:20px">No messages found.</p>'
    : chats.map(c => `
      <div class="chat-mod-item">
        <div class="user-item-avatar" style="flex-shrink:0">${escapeHtml((c.sender_name || "?")[0])}</div>
        <div class="chat-mod-content">
          <div class="chat-mod-sender">
            ${escapeHtml(c.sender_name)}
            <span class="msg-role-badge role-${c.sender_role}" style="margin-left:6px">${c.sender_role}</span>
          </div>
          ${c.message ? `<div class="chat-mod-message">${escapeHtml(c.message)}</div>` : ""}
          ${c.file_name ? `<div class="chat-mod-message"><i class="fas ${getFileIcon(c.file_type, c.file_name)}"></i> ${escapeHtml(c.file_name)}</div>` : ""}
          <div class="chat-mod-time">${formatTime(c.created_at)}</div>
        </div>
        <button class="btn-danger" onclick="deleteChat(${c.id})" style="flex-shrink:0">
          <i class="fas fa-trash"></i> Delete
        </button>
      </div>
    `).join("");
}

function previewFile(input) {
  const file = input.files[0];
  if (!file) return;
  const preview = document.getElementById("filePreview");
  const inner = document.getElementById("filePreviewInner");
  if (!preview || !inner) return;

  const icon = getFileIcon(file.type, file.name);
  inner.innerHTML = `<i class="fas ${icon}" style="font-size:18px;color:var(--primary-light)"></i><span>${escapeHtml(file.name)} (${(file.size / 1024).toFixed(1)} KB)</span>`;
  preview.style.display = "flex";
}

function removeFile() {
  const input = document.getElementById("chatAttachment");
  if (input) input.value = "";
  const preview = document.getElementById("filePreview");
  if (preview) preview.style.display = "none";
}

document.getElementById("chatForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = getCurrentUser();
  if (!user) { showToast("Please login to chat", "warning"); window.location.href = "/login"; return; }

  const message = document.getElementById("chatMessage")?.value.trim() || "";
  const file = document.getElementById("chatAttachment")?.files[0];

  if (!message && !file) { showToast("Enter a message or attach a file", "warning"); return; }

  const btn = e.target.querySelector(".btn-send");
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; }

  try {
    const formData = new FormData();
    formData.append("user_id", user.id);
    formData.append("sender_name", user.name);
    formData.append("sender_role", user.role);
    if (message) formData.append("message", message);
    if (file) formData.append("attachment", file);

    const res = await fetch("/api/chat/send", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) { showToast(data.error || "Failed to send message", "error"); return; }

    // Reset form
    if (document.getElementById("chatMessage")) {
      document.getElementById("chatMessage").value = "";
      document.getElementById("chatMessage").style.height = "auto";
    }
    removeFile();
    await loadChats();

    // Scroll to bottom
    const chatDiv = document.getElementById("chatList");
    if (chatDiv) chatDiv.scrollTop = chatDiv.scrollHeight;

  } catch {
    showToast("Failed to send message", "error");
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-paper-plane"></i>'; }
  }
});

async function deleteChat(id) {
  if (!confirm("Delete this message?")) return;
  const user = getCurrentUser();
  if (!user || user.role !== "admin") { showToast("Admin only", "error"); return; }

  try {
    const res = await fetch(`/api/chat/${id}`, {
      method: "DELETE",
      headers: { "x-user-role": "admin" },
    });
    const data = await res.json();
    if (!res.ok) { showToast(data.error, "error"); return; }
    showToast("Message deleted", "success");
    loadChats();
  } catch { showToast("Failed to delete", "error"); }
}

/* ============ ADMIN PANEL ============ */
let allUsersData = [];

function initAdmin() {
  const user = getCurrentUser();
  const gate = document.getElementById("adminGate");
  const panel = document.getElementById("adminPanel");

  if (!user || user.role !== "admin") {
    if (gate) gate.style.display = "flex";
    if (panel) panel.style.display = "none";
    return;
  }

  if (gate) gate.style.display = "none";
  if (panel) panel.style.display = "block";

  loadAdminData();
}

async function loadAdminData() {
  await Promise.all([
    loadInsights(),
    loadPending(),
    loadUsers(),
    loadAdminChats(),
    loadAdminJobs(),
    loadRecentUsers(),
  ]);
}

function showTab(tabName) {
  document.querySelectorAll(".admin-tab-content").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".admin-tab").forEach(el => el.classList.remove("active"));
  document.getElementById(`tab-${tabName}`)?.classList.add("active");
  document.querySelectorAll(".admin-tab").forEach(el => {
    if (el.getAttribute("onclick")?.includes(tabName)) el.classList.add("active");
  });
}

async function loadInsights() {
  const div = document.getElementById("adminInsights");
  if (!div) return;

  try {
    const res = await fetch("/api/admin/insights", { headers: adminHeaders() });
    const data = await res.json();

    if (!res.ok) { div.innerHTML = `<p style="color:var(--danger)">${data.error}</p>`; return; }

    const items = [
      { icon: "fa-users", num: data.total_users, label: "Total Users", color: "var(--primary-light)" },
      { icon: "fa-user-clock", num: data.pending_users, label: "Pending", color: "#fde68a" },
      { icon: "fa-graduation-cap", num: data.total_alumni, label: "Alumni", color: "#6ee7b7" },
      { icon: "fa-user-graduate", num: data.total_students, label: "Students", color: "var(--primary-light)" },
      { icon: "fa-comments", num: data.total_messages, label: "Messages", color: "#c4b5fd" },
      { icon: "fa-briefcase", num: data.total_jobs, label: "Jobs", color: "#fde68a" },
      { icon: "fa-handshake", num: data.total_mentorships, label: "Mentorships", color: "#6ee7b7" },
      { icon: "fa-check-circle", num: data.accepted_mentorships, label: "Accepted", color: "#6ee7b7" },
    ];

    div.innerHTML = items.map(item => `
      <div class="insight-card">
        <i class="fas ${item.icon} insight-icon" style="color:${item.color}"></i>
        <div class="insight-num">${item.num}</div>
        <div class="insight-label">${item.label}</div>
      </div>
    `).join("");

    // Update pending badge
    const badge = document.getElementById("pendingBadge");
    if (badge) badge.textContent = data.pending_users;

  } catch { div.innerHTML = '<p style="color:var(--danger)">Failed to load insights</p>'; }
}

async function loadPending() {
  const div = document.getElementById("pendingUsers");
  if (!div) return;
  div.innerHTML = '<div class="loading-shimmer"></div>';

  try {
    const res = await fetch("/api/admin/pending", { headers: adminHeaders() });
    const data = await res.json();

    if (data.length === 0) {
      div.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-muted)"><i class="fas fa-check-circle" style="font-size:36px;margin-bottom:12px;display:block;color:var(--success)"></i><p>All caught up! No pending approvals.</p></div>`;
      return;
    }

    div.innerHTML = data.map(u => `
      <div class="user-item" id="pending-${u.id}">
        <div class="user-item-avatar">${escapeHtml(u.name[0] || "?")}</div>
        <div class="user-item-info">
          <div class="user-item-name">${escapeHtml(u.name)}</div>
          <div class="user-item-email">${escapeHtml(u.email)} · ${u.role}</div>
        </div>
        <div class="user-item-actions">
          <span class="status-badge status-pending">Pending</span>
          <button class="btn-success" onclick="approveUser(${u.id})">
            <i class="fas fa-check"></i> Approve
          </button>
          <button class="btn-danger" onclick="rejectUser(${u.id})">
            <i class="fas fa-times"></i> Reject
          </button>
        </div>
      </div>
    `).join("");
  } catch { div.innerHTML = '<p style="color:var(--danger)">Failed to load pending users</p>'; }
}

async function approveUser(id) {
  try {
    const res = await fetch("/api/admin/approve", {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (!res.ok) { showToast(data.error, "error"); return; }
    showToast("User approved! ✅", "success");
    document.getElementById(`pending-${id}`)?.remove();
    loadInsights();
    loadUsers();
  } catch { showToast("Failed to approve", "error"); }
}

async function rejectUser(id) {
  if (!confirm("Reject and remove this user?")) return;
  try {
    const res = await fetch("/api/admin/reject", {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({ id }),
    });
    if (!res.ok) { showToast("Failed to reject", "error"); return; }
    showToast("User rejected", "info");
    document.getElementById(`pending-${id}`)?.remove();
    loadInsights();
  } catch { showToast("Failed to reject", "error"); }
}

async function loadUsers() {
  const div = document.getElementById("allUsers");
  if (!div) return;
  div.innerHTML = '<div class="loading-shimmer"></div>';

  try {
    const res = await fetch("/api/admin/users", { headers: adminHeaders() });
    allUsersData = await res.json();
    renderUserList(allUsersData);
  } catch { div.innerHTML = '<p style="color:var(--danger)">Failed to load users</p>'; }
}

function renderUserList(users) {
  const div = document.getElementById("allUsers");
  if (!div) return;

  const roleIcons = { admin: "👑", alumni: "🏆", student: "🎓" };
  div.innerHTML = users.map(u => `
    <div class="user-item" id="user-${u.id}">
      <div class="user-item-avatar">${escapeHtml(u.name[0] || "?")}</div>
      <div class="user-item-info">
        <div class="user-item-name">${roleIcons[u.role] || "👤"} ${escapeHtml(u.name)}</div>
        <div class="user-item-email">${escapeHtml(u.email)} · ${escapeHtml(u.role)} ${u.company ? `· ${escapeHtml(u.company)}` : ""}</div>
      </div>
      <div class="user-item-actions">
        <span class="status-badge status-${u.status || 'approved'}">${u.status || "approved"}</span>
        ${u.role !== "admin" ? `
          <button class="btn-danger" onclick="deleteUser(${u.id})">
            <i class="fas fa-trash"></i> Delete
          </button>
        ` : '<span class="tag" style="color:var(--accent-light)">Admin</span>'}
      </div>
    </div>
  `).join("");
}

function filterUsers() {
  const search = document.getElementById("userSearch")?.value.toLowerCase() || "";
  const role = document.getElementById("roleFilter")?.value || "";
  const filtered = allUsersData.filter(u => {
    const matchSearch = !search || u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search);
    const matchRole = !role || u.role === role;
    return matchSearch && matchRole;
  });
  renderUserList(filtered);
}

async function deleteUser(id) {
  if (!confirm("Delete this user? This cannot be undone.")) return;
  try {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "DELETE",
      headers: adminHeaders(),
    });
    const data = await res.json();
    if (!res.ok) { showToast(data.error, "error"); return; }
    showToast("User deleted", "success");
    document.getElementById(`user-${id}`)?.remove();
    loadInsights();
  } catch { showToast("Failed to delete", "error"); }
}

document.getElementById("addUserForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector("button[type=submit]");
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';

  try {
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({
        name: document.getElementById("adminUserName").value.trim(),
        email: document.getElementById("adminUserEmail").value.trim(),
        password: document.getElementById("adminUserPassword").value,
        role: document.getElementById("adminUserRole").value,
        status: document.getElementById("adminUserStatus")?.value || "approved",
      }),
    });

    const data = await res.json();
    if (!res.ok) { showToast(data.error || "Failed to add", "error"); return; }
    showToast("User added successfully! ✅", "success");
    e.target.reset();
    loadUsers();
    loadInsights();
    showTab("users");
  } catch { showToast("Failed to add user", "error"); }
  finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-user-plus"></i> Add User';
  }
});

async function loadAdminChats() {
  await loadChats();
}

async function loadAdminJobs() {
  const div = document.getElementById("adminJobList");
  if (!div) return;
  div.innerHTML = '<div class="loading-shimmer"></div>';

  try {
    const res = await fetch("/api/admin/jobs", { headers: adminHeaders() });
    const jobs = await res.json();

    if (jobs.length === 0) {
      div.innerHTML = '<p style="color:var(--text-muted);padding:20px">No jobs posted yet.</p>';
      return;
    }

    div.innerHTML = jobs.map(j => `
      <div class="user-item">
        <div style="width:44px;height:44px;background:rgba(99,102,241,0.15);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">
          <i class="fas fa-briefcase" style="color:var(--primary-light)"></i>
        </div>
        <div class="user-item-info">
          <div class="user-item-name">${escapeHtml(j.title)}</div>
          <div class="user-item-email">${escapeHtml(j.company)} · by ${escapeHtml(j.poster_name || "Unknown")}</div>
        </div>
        <button class="btn-danger" onclick="adminDeleteJob(${j.id})">
          <i class="fas fa-trash"></i> Delete
        </button>
      </div>
    `).join("");
  } catch { div.innerHTML = '<p style="color:var(--danger)">Failed to load jobs</p>'; }
}

async function adminDeleteJob(id) {
  if (!confirm("Delete this job listing?")) return;
  try {
    const res = await fetch(`/api/admin/jobs/${id}`, { method: "DELETE", headers: adminHeaders() });
    if (!res.ok) { showToast("Failed to delete", "error"); return; }
    showToast("Job deleted", "success");
    loadAdminJobs();
  } catch { showToast("Error", "error"); }
}

async function loadRecentUsers() {
  const div = document.getElementById("recentUsers");
  if (!div) return;

  try {
    const res = await fetch("/api/admin/users", { headers: adminHeaders() });
    const data = await res.json();
    const recent = data.slice(0, 5);

    div.innerHTML = recent.length === 0
      ? '<p style="color:var(--text-muted)">No users yet.</p>'
      : recent.map(u => `
        <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)">
          <div style="width:34px;height:34px;background:linear-gradient(135deg,var(--primary),var(--primary-dark));border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700">${escapeHtml(u.name[0])}</div>
          <div style="flex:1">
            <div style="font-size:14px;font-weight:600">${escapeHtml(u.name)}</div>
            <div style="font-size:12px;color:var(--text-muted)">${escapeHtml(u.email)}</div>
          </div>
          <span class="tag">${u.role}</span>
        </div>
      `).join("");
  } catch {}
}

/* ============ EVENTS ============ */
async function loadEvents() {
  const div = document.getElementById("eventsList");
  if (!div) return;
  div.innerHTML = '<div class="loading-shimmer"></div><div class="loading-shimmer"></div>';

  const user = getCurrentUser();
  
  // Show create form only for admin/alumni
  const createSection = document.getElementById("createEventSection");
  if (createSection && user && (user.role === "admin" || user.role === "alumni")) {
    createSection.style.display = "block";
  }

  try {
    const res = await fetch("/api/events");
    const events = await res.json();

    if (events.length === 0) {
      div.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-muted)"><i class="fas fa-calendar-alt" style="font-size:36px;margin-bottom:12px;display:block"></i><p>No events scheduled. Check back soon!</p></div>`;
      return;
    }

    div.innerHTML = events.map(ev => {
      const d = new Date(ev.event_date);
      const now = new Date();
      const isPast = d < now;
      return `
        <div class="event-card" style="${isPast ? "opacity:0.6" : ""}">
          <div class="event-date-box" style="${isPast ? "background:var(--bg-card);border:1px solid var(--border)" : ""}">
            <div class="event-day">${d.getDate()}</div>
            <div class="event-month">${d.toLocaleString('default', { month: 'short' })}</div>
          </div>
          <div class="event-info">
            <h3>${escapeHtml(ev.title)}</h3>
            ${ev.description ? `<p>${escapeHtml(ev.description)}</p>` : ""}
            <div class="event-meta">
              <span class="event-meta-item"><i class="fas fa-clock"></i> ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              ${ev.location ? `<span class="event-meta-item"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(ev.location)}</span>` : ""}
              ${ev.organizer_name ? `<span class="event-meta-item"><i class="fas fa-user"></i> ${escapeHtml(ev.organizer_name)}</span>` : ""}
            </div>
          </div>
          ${user?.role === "admin" ? `
            <button class="btn-danger" onclick="deleteEvent(${ev.id})" style="flex-shrink:0">
              <i class="fas fa-trash"></i>
            </button>
          ` : ""}
        </div>
      `;
    }).join("");
  } catch { div.innerHTML = '<p style="color:var(--danger)">Failed to load events.</p>'; }
}

document.getElementById("eventForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = getCurrentUser();
  if (!user) { window.location.href = "/login"; return; }

  const btn = e.target.querySelector("button[type=submit]");
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';

  try {
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { ...adminHeaders() },
      body: JSON.stringify({
        title: document.getElementById("evTitle").value.trim(),
        description: document.getElementById("evDesc").value.trim(),
        event_date: document.getElementById("evDate").value,
        location: document.getElementById("evLocation").value.trim(),
        created_by: user.id,
      }),
    });

    const data = await res.json();
    if (!res.ok) { showToast(data.error || "Failed to create event", "error"); return; }
    showToast("Event created! 🎉", "success");
    e.target.reset();
    loadEvents();
  } catch { showToast("Failed to create event", "error"); }
  finally { btn.disabled = false; btn.innerHTML = '<i class="fas fa-calendar-plus"></i> Create Event'; }
});

async function deleteEvent(id) {
  if (!confirm("Delete this event?")) return;
  try {
    const res = await fetch(`/api/events/${id}`, { method: "DELETE", headers: adminHeaders() });
    if (!res.ok) { showToast("Failed to delete", "error"); return; }
    showToast("Event deleted", "success");
    loadEvents();
  } catch {}
}

/* ============ DASHBOARD ============ */
async function loadDashboard() {
  const user = getCurrentUser();

  // Update welcome card
  const nameEl = document.getElementById("welcomeName");
  const roleEl = document.getElementById("welcomeRole");
  if (nameEl) nameEl.textContent = user ? `Hello, ${user.name}!` : "Hello there!";
  if (roleEl) {
    const roleLabels = { admin: "👑 Administrator", alumni: "🏆 Alumni Member", student: "🎓 Student Member" };
    roleEl.textContent = user ? (roleLabels[user.role] || "Member") : "Guest";
  }

  // Load quick stats
  try {
    const [jobs, alumni] = await Promise.all([
      fetch("/api/jobs").then(r => r.json()),
      fetch("/api/alumni/search").then(r => r.json()),
    ]);
    const statAlumni = document.getElementById("statAlumni");
    const statJobs = document.getElementById("statJobs");
    if (statAlumni) statAlumni.textContent = alumni.length;
    if (statJobs) statJobs.textContent = jobs.length;
  } catch {}

  // Load dashboard previews
  loadDashChat();
  loadDashJobs();
  loadDashEvents();
}

async function loadDashChat() {
  const div = document.getElementById("dashChat");
  if (!div) return;
  try {
    const res = await fetch("/api/chat?limit=3");
    const chats = await res.json();
    const last3 = chats.slice(-3);
    div.innerHTML = last3.length === 0
      ? '<p style="color:var(--text-muted);font-size:13px">No messages yet.</p>'
      : last3.map(c => `
        <div style="padding:8px 0;border-bottom:1px solid var(--border);font-size:13px">
          <strong>${escapeHtml(c.sender_name)}</strong>
          <span style="color:var(--text-muted);font-size:11px;margin-left:6px">${formatTime(c.created_at)}</span>
          <div style="color:var(--text-secondary);margin-top:2px">${c.message ? escapeHtml(c.message.substring(0, 60)) + (c.message.length > 60 ? "..." : "") : c.file_name ? `📎 ${escapeHtml(c.file_name)}` : ""}</div>
        </div>
      `).join("");
  } catch {}
}

async function loadDashJobs() {
  const div = document.getElementById("dashJobs");
  if (!div) return;
  try {
    const res = await fetch("/api/jobs");
    const jobs = (await res.json()).slice(0, 3);
    div.innerHTML = jobs.length === 0
      ? '<p style="color:var(--text-muted);font-size:13px">No jobs yet.</p>'
      : jobs.map(j => `
        <div style="padding:8px 0;border-bottom:1px solid var(--border)">
          <div style="font-size:14px;font-weight:600">${escapeHtml(j.title)}</div>
          <div style="font-size:12px;color:var(--text-muted)">${escapeHtml(j.company)}</div>
        </div>
      `).join("");
  } catch {}
}

async function loadDashEvents() {
  const div = document.getElementById("dashEvents");
  if (!div) return;
  try {
    const res = await fetch("/api/events");
    const events = (await res.json()).slice(0, 3);
    div.innerHTML = events.length === 0
      ? '<p style="color:var(--text-muted);font-size:13px">No upcoming events.</p>'
      : events.map(ev => {
          const d = new Date(ev.event_date);
          return `
            <div style="padding:8px 0;border-bottom:1px solid var(--border);display:flex;gap:10px;align-items:center">
              <div style="background:var(--primary);border-radius:8px;padding:6px 10px;text-align:center;min-width:44px">
                <div style="font-size:16px;font-weight:700;line-height:1">${d.getDate()}</div>
                <div style="font-size:9px;opacity:0.8;text-transform:uppercase">${d.toLocaleString('default', { month: 'short' })}</div>
              </div>
              <div>
                <div style="font-size:14px;font-weight:600">${escapeHtml(ev.title)}</div>
                ${ev.location ? `<div style="font-size:12px;color:var(--text-muted)"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(ev.location)}</div>` : ""}
              </div>
            </div>
          `;
        }).join("");
  } catch {}
}

/* ============ PROFILE ============ */
async function loadProfile() {
  const user = getCurrentUser();
  if (!user) { window.location.href = "/login"; return; }

  const nameEl = document.getElementById("profileName");
  const roleEl = document.getElementById("profileRole");
  if (nameEl) nameEl.textContent = user.name;
  if (roleEl) roleEl.textContent = user.role;

  // Pre-fill form
  if (document.getElementById("profName")) document.getElementById("profName").value = user.name;
  if (document.getElementById("profEmail")) document.getElementById("profEmail").value = user.email;
  if (document.getElementById("profCompany")) document.getElementById("profCompany").value = user.company || "";
  if (document.getElementById("profBatch")) document.getElementById("profBatch").value = user.batch || "";
  if (document.getElementById("profBio")) document.getElementById("profBio").value = user.bio || "";
}

document.getElementById("profileForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = getCurrentUser();
  if (!user) return;

  const btn = e.target.querySelector("button[type=submit]");
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

  try {
    const res = await fetch("/api/auth/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.id,
        bio: document.getElementById("profBio")?.value,
        company: document.getElementById("profCompany")?.value,
        batch: document.getElementById("profBatch")?.value,
      }),
    });

    const data = await res.json();
    if (!res.ok) { showToast(data.error, "error"); return; }

    // Update local storage
    const updated = { ...user, bio: document.getElementById("profBio")?.value, company: document.getElementById("profCompany")?.value, batch: document.getElementById("profBatch")?.value };
    setCurrentUser(updated);
    showToast("Profile saved! ✅", "success");
  } catch { showToast("Failed to save profile", "error"); }
  finally { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Save Profile'; }
});

// Clean up polling when leaving chat page
window.addEventListener("beforeunload", () => {
  if (chatPolling) clearInterval(chatPolling);
});
