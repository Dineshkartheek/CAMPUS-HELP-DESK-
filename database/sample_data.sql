-- ============================================================================
-- CAMPUSCARE — optional demo data for MySQL (Sunset Glass build)
--
-- Demo password for every account below: CampusCare@123
-- (BCrypt hash only — never plaintext)
--
-- Run after database/schema.sql:
--   SOURCE database/sample_data.sql;
--
-- Best run once on a fresh database. Users, complaints and confidential
-- reports use INSERT IGNORE with unique emails/codes, but history, remarks,
-- assignments, notifications and audit rows have no natural unique key and
-- would be duplicated on repeated runs.
-- Remove or replace all demo accounts before a real production launch.
-- ============================================================================

USE helpdesk_db;

-- ---------------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------------
INSERT IGNORE INTO users
  (full_name, email, password_hash, role, registration_number, department, year, section, active)
VALUES
  ('Demo Student', 'student@campuscare.local',
   '$2a$10$iNygHCFdxAGaq8LNLBAyTOOWYsF3cDW23cLhBmJD32eYTGwA701K6',
   'STUDENT', 'CSE2026001', 'Computer Science and Engineering', 3, 'A', TRUE),
  ('Priya Sharma', 'priya@campuscare.local',
   '$2a$10$iNygHCFdxAGaq8LNLBAyTOOWYsF3cDW23cLhBmJD32eYTGwA701K6',
   'STUDENT', 'ECE2026014', 'Electronics and Communication', 2, 'B', TRUE),
  ('Demo Administrator', 'admin@campuscare.local',
   '$2a$10$iNygHCFdxAGaq8LNLBAyTOOWYsF3cDW23cLhBmJD32eYTGwA701K6',
   'ADMIN', NULL, 'Campus Facilities', NULL, NULL, TRUE),
  ('Ravi Kumar', 'ravi.admin@campuscare.local',
   '$2a$10$iNygHCFdxAGaq8LNLBAyTOOWYsF3cDW23cLhBmJD32eYTGwA701K6',
   'ADMIN', NULL, 'IT Services', NULL, NULL, TRUE),
  ('Demo Main Administrator', 'mainadmin@campuscare.local',
   '$2a$10$iNygHCFdxAGaq8LNLBAyTOOWYsF3cDW23cLhBmJD32eYTGwA701K6',
   'MAIN_ADMIN', NULL, 'Administration', NULL, NULL, TRUE);

-- ---------------------------------------------------------------------------
-- Complaints (one per workflow status)
-- ---------------------------------------------------------------------------
INSERT IGNORE INTO complaints
  (complaint_code, student_id, category, subject, description, location, room_number,
   priority, status, current_admin_id, created_at, updated_at)
VALUES
  ('CC-2026-A1B2C3D4',
   (SELECT id FROM users WHERE email = 'student@campuscare.local'),
   'WIFI', 'Wi-Fi keeps disconnecting in the CSE block',
   'The Wi-Fi in the second-floor CSE laboratory disconnects every few minutes, which interrupts online classes and lab work.',
   'CSE Block', '204', 'HIGH', 'IN_PROGRESS',
   (SELECT id FROM users WHERE email = 'admin@campuscare.local'),
   DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
  ('CC-2026-E5F6A7B8',
   (SELECT id FROM users WHERE email = 'student@campuscare.local'),
   'CLASSROOM', 'Projector in classroom 301 is not working',
   'The projector does not power on. We have a presentation scheduled this week.',
   'Academic Block A', '301', 'MEDIUM', 'RESOLVED',
   (SELECT id FROM users WHERE email = 'admin@campuscare.local'),
   DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_SUB(NOW(), INTERVAL 9 DAY)),
  ('CC-2026-11223344',
   (SELECT id FROM users WHERE email = 'priya@campuscare.local'),
   'ELECTRICAL', 'Power socket sparking near hostel corridor',
   'A wall socket near the first-floor hostel corridor sparks when a charger is plugged in. This looks unsafe.',
   'Girls Hostel B', 'Corridor 1', 'URGENT', 'PENDING',
   NULL, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
  ('CC-2026-55667788',
   (SELECT id FROM users WHERE email = 'priya@campuscare.local'),
   'WATER', 'Drinking water cooler on the third floor is empty',
   'The water cooler on the third floor of the academic block has not been refilled for two days.',
   'Academic Block B', 'Third floor', 'MEDIUM', 'ASSIGNED',
   (SELECT id FROM users WHERE email = 'ravi.admin@campuscare.local'),
   DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
  ('CC-2026-99AABBCC',
   (SELECT id FROM users WHERE email = 'student@campuscare.local'),
   'WASHROOM', 'Washroom in the CSE block was not cleaned last week',
   'The washroom next to classroom 204 was not cleaned for several days and the dust bins were not emptied.',
   'CSE Block', '204', 'LOW', 'REOPENED',
   (SELECT id FROM users WHERE email = 'admin@campuscare.local'),
   DATE_SUB(NOW(), INTERVAL 15 DAY), DATE_SUB(NOW(), INTERVAL 11 DAY)),
  ('CC-2026-DDEEFF00',
   (SELECT id FROM users WHERE email = 'priya@campuscare.local'),
   'LABORATORY', 'Request for additional power outlets in the electronics lab',
   'There are not enough power outlets near the work benches in the electronics laboratory for lab equipment.',
   'Electronics Lab 1', 'Bench 4', 'LOW', 'RESOLVED',
   (SELECT id FROM users WHERE email = 'ravi.admin@campuscare.local'),
   DATE_SUB(NOW(), INTERVAL 25 DAY), DATE_SUB(NOW(), INTERVAL 22 DAY));

-- ---------------------------------------------------------------------------
-- Assignments
-- ---------------------------------------------------------------------------
INSERT IGNORE INTO complaint_assignments
  (complaint_id, admin_id, assigned_by, note, active, created_at)
VALUES
  ((SELECT id FROM complaints WHERE complaint_code = 'CC-2026-A1B2C3D4'),
   (SELECT id FROM users WHERE email = 'admin@campuscare.local'),
   (SELECT id FROM users WHERE email = 'mainadmin@campuscare.local'),
   'Please coordinate with the network team.', TRUE, DATE_SUB(NOW(), INTERVAL 3 DAY)),
  ((SELECT id FROM complaints WHERE complaint_code = 'CC-2026-E5F6A7B8'),
   (SELECT id FROM users WHERE email = 'admin@campuscare.local'),
   (SELECT id FROM users WHERE email = 'mainadmin@campuscare.local'),
   'Classroom equipment issue.', TRUE, DATE_SUB(NOW(), INTERVAL 11 DAY)),
  ((SELECT id FROM complaints WHERE complaint_code = 'CC-2026-55667788'),
   (SELECT id FROM users WHERE email = 'ravi.admin@campuscare.local'),
   (SELECT id FROM users WHERE email = 'mainadmin@campuscare.local'),
   'Water supply contractor to be informed.', TRUE, DATE_SUB(NOW(), INTERVAL 2 DAY)),
  ((SELECT id FROM complaints WHERE complaint_code = 'CC-2026-99AABBCC'),
   (SELECT id FROM users WHERE email = 'admin@campuscare.local'),
   (SELECT id FROM users WHERE email = 'mainadmin@campuscare.local'),
   'Housekeeping supervisor to verify.', TRUE, DATE_SUB(NOW(), INTERVAL 14 DAY)),
  ((SELECT id FROM complaints WHERE complaint_code = 'CC-2026-DDEEFF00'),
   (SELECT id FROM users WHERE email = 'ravi.admin@campuscare.local'),
   (SELECT id FROM users WHERE email = 'mainadmin@campuscare.local'),
   'Assess the electrical work in the laboratory.', TRUE, DATE_SUB(NOW(), INTERVAL 24 DAY));

-- ---------------------------------------------------------------------------
-- Status history
-- ---------------------------------------------------------------------------
INSERT IGNORE INTO complaint_status_history
  (complaint_id, updated_by, old_status, new_status, remarks, created_at)
VALUES
  ((SELECT id FROM complaints WHERE complaint_code = 'CC-2026-A1B2C3D4'),
   (SELECT id FROM users WHERE email = 'student@campuscare.local'),
   NULL, 'PENDING', 'Complaint submitted', DATE_SUB(NOW(), INTERVAL 4 DAY)),
  ((SELECT id FROM complaints WHERE complaint_code = 'CC-2026-A1B2C3D4'),
   (SELECT id FROM users WHERE email = 'mainadmin@campuscare.local'),
   'PENDING', 'ASSIGNED', 'Assigned to the Campus Facilities administrator.', DATE_SUB(NOW(), INTERVAL 3 DAY)),
  ((SELECT id FROM complaints WHERE complaint_code = 'CC-2026-A1B2C3D4'),
   (SELECT id FROM users WHERE email = 'admin@campuscare.local'),
   'ASSIGNED', 'IN_PROGRESS', 'Network team is checking the second-floor access point.', DATE_SUB(NOW(), INTERVAL 2 DAY)),
  ((SELECT id FROM complaints WHERE complaint_code = 'CC-2026-E5F6A7B8'),
   (SELECT id FROM users WHERE email = 'student@campuscare.local'),
   NULL, 'PENDING', 'Complaint submitted', DATE_SUB(NOW(), INTERVAL 12 DAY)),
  ((SELECT id FROM complaints WHERE complaint_code = 'CC-2026-E5F6A7B8'),
   (SELECT id FROM users WHERE email = 'mainadmin@campuscare.local'),
   'PENDING', 'ASSIGNED', 'Technician assigned.', DATE_SUB(NOW(), INTERVAL 11 DAY)),
  ((SELECT id FROM complaints WHERE complaint_code = 'CC-2026-E5F6A7B8'),
   (SELECT id FROM users WHERE email = 'admin@campuscare.local'),
   'ASSIGNED', 'IN_PROGRESS', 'Technician inspected the projector.', DATE_SUB(NOW(), INTERVAL 10 DAY)),
  ((SELECT id FROM complaints WHERE complaint_code = 'CC-2026-E5F6A7B8'),
   (SELECT id FROM users WHERE email = 'admin@campuscare.local'),
   'IN_PROGRESS', 'RESOLVED', 'Power cable replaced and the projector tested.', DATE_SUB(NOW(), INTERVAL 9 DAY)),
  ((SELECT id FROM complaints WHERE complaint_code = 'CC-2026-11223344'),
   (SELECT id FROM users WHERE email = 'priya@campuscare.local'),
   NULL, 'PENDING', 'Complaint submitted', DATE_SUB(NOW(), INTERVAL 1 DAY)),
  ((SELECT id FROM complaints WHERE complaint_code = 'CC-2026-55667788'),
   (SELECT id FROM users WHERE email = 'priya@campuscare.local'),
   NULL, 'PENDING', 'Complaint submitted', DATE_SUB(NOW(), INTERVAL 3 DAY)),
  ((SELECT id FROM complaints WHERE complaint_code = 'CC-2026-55667788'),
   (SELECT id FROM users WHERE email = 'mainadmin@campuscare.local'),
   'PENDING', 'ASSIGNED', 'Assigned to IT Services for contractor follow-up.', DATE_SUB(NOW(), INTERVAL 2 DAY)),
  ((SELECT id FROM complaints WHERE complaint_code = 'CC-2026-99AABBCC'),
   (SELECT id FROM users WHERE email = 'student@campuscare.local'),
   NULL, 'PENDING', 'Complaint submitted', DATE_SUB(NOW(), INTERVAL 15 DAY)),
  ((SELECT id FROM complaints WHERE complaint_code = 'CC-2026-99AABBCC'),
   (SELECT id FROM users WHERE email = 'mainadmin@campuscare.local'),
   'PENDING', 'ASSIGNED', 'Housekeeping to verify.', DATE_SUB(NOW(), INTERVAL 14 DAY)),
  ((SELECT id FROM complaints WHERE complaint_code = 'CC-2026-99AABBCC'),
   (SELECT id FROM users WHERE email = 'admin@campuscare.local'),
   'ASSIGNED', 'RESOLVED', 'Cleaning completed.', DATE_SUB(NOW(), INTERVAL 13 DAY)),
  ((SELECT id FROM complaints WHERE complaint_code = 'CC-2026-99AABBCC'),
   (SELECT id FROM users WHERE email = 'admin@campuscare.local'),
   'RESOLVED', 'REOPENED', 'Student reported the issue recurred; reopening for verification.', DATE_SUB(NOW(), INTERVAL 11 DAY)),
  ((SELECT id FROM complaints WHERE complaint_code = 'CC-2026-DDEEFF00'),
   (SELECT id FROM users WHERE email = 'priya@campuscare.local'),
   NULL, 'PENDING', 'Complaint submitted', DATE_SUB(NOW(), INTERVAL 25 DAY)),
  ((SELECT id FROM complaints WHERE complaint_code = 'CC-2026-DDEEFF00'),
   (SELECT id FROM users WHERE email = 'mainadmin@campuscare.local'),
   'PENDING', 'ASSIGNED', 'Assigned to IT Services for the laboratory assessment.', DATE_SUB(NOW(), INTERVAL 24 DAY)),
  ((SELECT id FROM complaints WHERE complaint_code = 'CC-2026-DDEEFF00'),
   (SELECT id FROM users WHERE email = 'ravi.admin@campuscare.local'),
   'ASSIGNED', 'RESOLVED', 'Additional outlets installed near the work benches.', DATE_SUB(NOW(), INTERVAL 22 DAY));

-- ---------------------------------------------------------------------------
-- Remarks
-- ---------------------------------------------------------------------------
INSERT IGNORE INTO complaint_remarks (complaint_id, admin_id, remark, created_at)
VALUES
  ((SELECT id FROM complaints WHERE complaint_code = 'CC-2026-A1B2C3D4'),
   (SELECT id FROM users WHERE email = 'admin@campuscare.local'),
   'Access point firmware update is scheduled for tomorrow morning.', DATE_SUB(NOW(), INTERVAL 2 DAY)),
  ((SELECT id FROM complaints WHERE complaint_code = 'CC-2026-E5F6A7B8'),
   (SELECT id FROM users WHERE email = 'admin@campuscare.local'),
   'Projector is working again. Please report immediately if it fails once more.', DATE_SUB(NOW(), INTERVAL 9 DAY)),
  ((SELECT id FROM complaints WHERE complaint_code = 'CC-2026-99AABBCC'),
   (SELECT id FROM users WHERE email = 'admin@campuscare.local'),
   'Reopened case: housekeeping supervisor will inspect within 24 hours.', DATE_SUB(NOW(), INTERVAL 11 DAY));

-- ---------------------------------------------------------------------------
-- Confidential reports (Main Admin only)
-- ---------------------------------------------------------------------------
INSERT IGNORE INTO confidential_reports
  (report_code, student_id, category, description, location, status, created_at, updated_at)
VALUES
  ('SR-2026-7A8B9C0D',
   (SELECT id FROM users WHERE email = 'student@campuscare.local'),
   'SAFETY',
   'The emergency exit near the hostel is blocked by stored furniture. I am concerned about fire safety.',
   'Girls Hostel B', 'IN_REVIEW', DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)),
  ('SR-2026-1E2F3A4B',
   (SELECT id FROM users WHERE email = 'priya@campuscare.local'),
   'HARASSMENT',
   'A group of students repeatedly makes inappropriate comments in the common area. I would like this handled confidentially.',
   NULL, 'PENDING', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY));

INSERT IGNORE INTO confidential_report_history
  (report_id, updated_by, old_status, new_status, remarks, created_at)
VALUES
  ((SELECT id FROM confidential_reports WHERE report_code = 'SR-2026-7A8B9C0D'),
   (SELECT id FROM users WHERE email = 'mainadmin@campuscare.local'),
   'PENDING', 'IN_REVIEW',
   'Facilities team asked to clear the corridor immediately.', DATE_SUB(NOW(), INTERVAL 4 DAY));

-- ---------------------------------------------------------------------------
-- Admin departments / support categories
-- ---------------------------------------------------------------------------
INSERT IGNORE INTO admin_departments (admin_id, department, support_category, created_at)
VALUES
  ((SELECT id FROM users WHERE email = 'admin@campuscare.local'),
   'Campus Facilities', NULL, DATE_SUB(NOW(), INTERVAL 30 DAY)),
  ((SELECT id FROM users WHERE email = 'ravi.admin@campuscare.local'),
   'IT Services', NULL, DATE_SUB(NOW(), INTERVAL 30 DAY));

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
INSERT IGNORE INTO notifications (user_id, title, message, is_read, created_at)
VALUES
  ((SELECT id FROM users WHERE email = 'student@campuscare.local'),
   'Complaint in progress',
   'Your complaint CC-2026-A1B2C3D4 is now IN_PROGRESS.', FALSE, DATE_SUB(NOW(), INTERVAL 2 DAY)),
  ((SELECT id FROM users WHERE email = 'student@campuscare.local'),
   'Complaint reopened',
   'Your complaint CC-2026-99AABBCC was REOPENED for verification.', FALSE, DATE_SUB(NOW(), INTERVAL 11 DAY)),
  ((SELECT id FROM users WHERE email = 'priya@campuscare.local'),
   'Complaint assigned',
   'Your complaint CC-2026-55667788 has been assigned to an administrator.', FALSE, DATE_SUB(NOW(), INTERVAL 2 DAY));

-- ---------------------------------------------------------------------------
-- Audit logs
-- ---------------------------------------------------------------------------
INSERT IGNORE INTO audit_logs
  (actor_id, actor_email, action, entity_type, entity_id, details, created_at)
VALUES
  ((SELECT id FROM users WHERE email = 'student@campuscare.local'),
   'student@campuscare.local', 'COMPLAINT_CREATED', 'COMPLAINT',
   (SELECT id FROM complaints WHERE complaint_code = 'CC-2026-A1B2C3D4'),
   'Complaint CC-2026-A1B2C3D4 created', DATE_SUB(NOW(), INTERVAL 4 DAY)),
  ((SELECT id FROM users WHERE email = 'mainadmin@campuscare.local'),
   'mainadmin@campuscare.local', 'COMPLAINT_ASSIGNED', 'COMPLAINT',
   (SELECT id FROM complaints WHERE complaint_code = 'CC-2026-A1B2C3D4'),
   'Assigned to admin@campuscare.local', DATE_SUB(NOW(), INTERVAL 3 DAY)),
  ((SELECT id FROM users WHERE email = 'mainadmin@campuscare.local'),
   'mainadmin@campuscare.local', 'CONFIDENTIAL_REPORT_VIEWED', 'CONFIDENTIAL_REPORT',
   (SELECT id FROM confidential_reports WHERE report_code = 'SR-2026-7A8B9C0D'),
   'Full report details viewed by Main Admin', DATE_SUB(NOW(), INTERVAL 4 DAY));
