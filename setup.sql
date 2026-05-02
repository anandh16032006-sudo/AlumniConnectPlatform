-- =============================================
--  AlumniConnect — Complete Database Setup
-- =============================================

CREATE DATABASE IF NOT EXISTS alumni_db;
USE alumni_db;

-- Drop in reverse dependency order
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS chats;
DROP TABLE IF EXISTS mentorship_requests;
DROP TABLE IF EXISTS jobs;
DROP TABLE IF EXISTS users;

-- USERS TABLE
CREATE TABLE users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(100) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  role        ENUM('student','alumni','admin') NOT NULL DEFAULT 'student',
  status      ENUM('pending','approved') NOT NULL DEFAULT 'pending',
  bio         TEXT,
  company     VARCHAR(150),
  batch       VARCHAR(20),
  avatar      VARCHAR(255),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MENTORSHIP REQUESTS TABLE
CREATE TABLE mentorship_requests (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  student_id  INT NOT NULL,
  alumni_id   INT NOT NULL,
  message     TEXT,
  status      ENUM('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (alumni_id)  REFERENCES users(id) ON DELETE CASCADE
);

-- JOBS TABLE
CREATE TABLE jobs (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(150) NOT NULL,
  company     VARCHAR(150) NOT NULL,
  description TEXT,
  location    VARCHAR(150),
  job_type    VARCHAR(50) DEFAULT 'Full-time',
  posted_by   INT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (posted_by) REFERENCES users(id) ON DELETE SET NULL
);

-- CHATS TABLE
CREATE TABLE chats (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT,
  sender_name VARCHAR(100) NOT NULL,
  sender_role VARCHAR(20)  NOT NULL,
  message     TEXT,
  file_name   VARCHAR(255),
  file_path   VARCHAR(500),
  file_type   VARCHAR(100),
  file_size   INT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- EVENTS TABLE (new feature)
CREATE TABLE events (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  event_date  DATETIME NOT NULL,
  location    VARCHAR(255),
  created_by  INT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================
--  SEED DATA
-- =============================================

-- Default admin account
INSERT INTO users (name, email, password, role, status)
VALUES ('Admin', 'admin@gmail.com', 'admin123', 'admin', 'approved');

-- Sample alumni
INSERT INTO users (name, email, password, role, status, company, batch, bio) VALUES
('Priya Sharma',    'priya@example.com',    'pass123', 'alumni',  'approved', 'Google',      '2019', 'Software Engineer at Google. Passionate about AI and mentoring.'),
('Rahul Kumar',     'rahul@example.com',    'pass123', 'alumni',  'approved', 'Microsoft',   '2018', 'Cloud Architect. Happy to guide on career transitions.'),
('Ananya Patel',    'ananya@example.com',   'pass123', 'alumni',  'approved', 'Amazon',      '2020', 'Product Manager. Love connecting with motivated students.'),
('Vikram Singh',    'vikram@example.com',   'pass123', 'alumni',  'approved', 'Infosys',     '2017', 'Full Stack Developer. Open for mentorship sessions.'),
('Sneha Reddy',     'sneha@example.com',    'pass123', 'alumni',  'approved', 'Wipro',       '2021', 'Data Scientist working on NLP models.');

-- Sample students
INSERT INTO users (name, email, password, role, status) VALUES
('Arjun Nair',      'arjun@example.com',    'pass123', 'student', 'approved'),
('Meera Iyer',      'meera@example.com',    'pass123', 'student', 'approved'),
('Karthik Raman',   'karthik@example.com',  'pass123', 'student', 'pending');

-- Sample jobs
INSERT INTO jobs (title, company, description, location, job_type, posted_by) VALUES
('Software Engineer',       'Google',    'Join our engineering team working on next-gen products. 3+ years experience in Python/Java required.',  'Bangalore (Hybrid)', 'Full-time', 2),
('Product Manager',         'Amazon',    'Lead product strategy for our India marketplace team. MBA preferred with 5+ years in product.',          'Mumbai',             'Full-time', 4),
('Data Science Intern',     'Microsoft', 'Summer internship for final-year students. Work on real ML projects with top engineers.',                'Remote',             'Internship', 3),
('Frontend Developer',      'Infosys',   'React/Vue.js developer needed for our digital transformation projects. Freshers welcome.',               'Chennai',            'Full-time', 5),
('Cloud Solutions Architect','Wipro',    'AWS/Azure architect for enterprise clients. 7+ years experience required.',                              'Hyderabad',          'Full-time', 6);

-- Sample events
INSERT INTO events (title, description, event_date, location, created_by) VALUES
('Alumni Reunion 2024',        'Annual alumni gathering with networking dinner and keynote speakers.',        DATE_ADD(NOW(), INTERVAL 30 DAY),  'Grand Hyatt, Bangalore', 1),
('Tech Talk: AI in Industry',  'Panel discussion on AI adoption across industries. Featuring Google & MS alumni.', DATE_ADD(NOW(), INTERVAL 7 DAY),  'Online (Zoom)',          2),
('Career Guidance Webinar',    'Resume building, interview tips and career planning for final-year students.', DATE_ADD(NOW(), INTERVAL 14 DAY), 'Online (Google Meet)',   4),
('Startup Pitch Night',        'Alumni entrepreneurs pitch their startups. Networking opportunity for all.',   DATE_ADD(NOW(), INTERVAL 45 DAY), 'IIT Alumni Centre',      3);

-- Sample chat messages
INSERT INTO chats (user_id, sender_name, sender_role, message) VALUES
(2, 'Priya Sharma',  'alumni',  'Hi everyone! Welcome to the AlumniConnect community chat! 👋'),
(3, 'Rahul Kumar',   'alumni',  'Great platform! Looking forward to connecting with students.'),
(7, 'Arjun Nair',    'student', 'Thank you! This is amazing. Can anyone help with placement prep?'),
(2, 'Priya Sharma',  'alumni',  'Happy to help Arjun! Send me a mentorship request anytime.'),
(4, 'Ananya Patel',  'alumni',  'We have a Career Guidance Webinar coming up next week. Check the Events page!'),
(8, 'Meera Iyer',    'student', 'This is so helpful. Thank you all! 🙏');
