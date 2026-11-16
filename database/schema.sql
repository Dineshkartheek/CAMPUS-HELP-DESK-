-- ============================================================================
-- CAMPUSCARE — Smart Campus Help Desk Management System
-- Production MySQL 8 schema (Theme 6 — Sunset Glass build)
--
-- Usage (MySQL Workbench or CLI, as an administrator):
--   SOURCE database/schema.sql;
--   SOURCE database/sample_data.sql;   -- optional demo data
--
-- The Spring Boot application uses JPA with ddl-auto=update, so it can also
-- create/extend these tables itself. This script is the authoritative,
-- idempotent definition and never drops tables or deletes data.
-- ============================================================================

CREATE DATABASE IF NOT EXISTS helpdesk_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE helpdesk_db;

-- ---------------------------------------------------------------------------
-- 1. users — students, admins and the main administrator
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id                 BIGINT       NOT NULL AUTO_INCREMENT,
  full_name          VARCHAR(120) NOT NULL,
  email              VARCHAR(190) NOT NULL,
  password_hash      VARCHAR(100) NOT NULL,
  role               VARCHAR(20)  NOT NULL,
  registration_number VARCHAR(50) NULL,
  department         VARCHAR(120) NULL,
  year               TINYINT      NULL,
  section            VARCHAR(10)  NULL,
  active             BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_email (email),
  UNIQUE KEY uk_users_registration (registration_number),
  KEY idx_users_role (role),
  KEY idx_users_active (active),
  CONSTRAINT chk_users_role CHECK (role IN ('STUDENT', 'ADMIN', 'MAIN_ADMIN')),
  CONSTRAINT chk_users_year CHECK (year IS NULL OR (year BETWEEN 1 AND 5))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 2. complaints
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS complaints (
  id               BIGINT       NOT NULL AUTO_INCREMENT,
  complaint_code   VARCHAR(30)  NOT NULL,
  student_id       BIGINT       NOT NULL,
  category         VARCHAR(40)  NOT NULL,
  subject          VARCHAR(160) NOT NULL,
  description      TEXT         NOT NULL,
  location         VARCHAR(160) NULL,
  room_number      VARCHAR(40)  NULL,
  priority         VARCHAR(20)  NOT NULL,
  status           VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
  current_admin_id BIGINT       NULL,
  attachment_name  VARCHAR(255) NULL,
  attachment_path  VARCHAR(500) NULL,
  created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_complaints_code (complaint_code),
  KEY idx_complaints_student (student_id),
  KEY idx_complaints_status (status),
  KEY idx_complaints_category (category),
  KEY idx_complaints_priority (priority),
  KEY idx_complaints_admin (current_admin_id),
  KEY idx_complaints_created (created_at),
  CONSTRAINT fk_complaints_student FOREIGN KEY (student_id) REFERENCES users (id),
  CONSTRAINT fk_complaints_admin FOREIGN KEY (current_admin_id) REFERENCES users (id),
  CONSTRAINT chk_complaints_status CHECK (status IN
    ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REOPENED')),
  CONSTRAINT chk_complaints_priority CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
  CONSTRAINT chk_complaints_category CHECK (category IN
    ('WIFI', 'ELECTRICAL', 'HARDWARE', 'SOFTWARE', 'CLASSROOM',
     'LABORATORY', 'WATER', 'WASHROOM', 'OTHER'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 3. complaint_assignments — audit of who is handling a complaint
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS complaint_assignments (
  id           BIGINT       NOT NULL AUTO_INCREMENT,
  complaint_id BIGINT       NOT NULL,
  admin_id     BIGINT       NOT NULL,
  assigned_by  BIGINT       NOT NULL,
  note         VARCHAR(500) NULL,
  active       BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_assignments_complaint (complaint_id),
  KEY idx_assignments_admin (admin_id),
  CONSTRAINT fk_assignments_complaint FOREIGN KEY (complaint_id)
    REFERENCES complaints (id) ON DELETE CASCADE,
  CONSTRAINT fk_assignments_admin FOREIGN KEY (admin_id) REFERENCES users (id),
  CONSTRAINT fk_assignments_by FOREIGN KEY (assigned_by) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 4. complaint_status_history — immutable workflow audit
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS complaint_status_history (
  id           BIGINT        NOT NULL AUTO_INCREMENT,
  complaint_id BIGINT        NOT NULL,
  updated_by   BIGINT        NOT NULL,
  old_status   VARCHAR(20)   NULL,
  new_status   VARCHAR(20)   NOT NULL,
  remarks      VARCHAR(1000) NULL,
  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_status_history_complaint (complaint_id),
  KEY idx_status_history_created (created_at),
  CONSTRAINT fk_status_history_complaint FOREIGN KEY (complaint_id)
    REFERENCES complaints (id) ON DELETE CASCADE,
  CONSTRAINT fk_status_history_user FOREIGN KEY (updated_by) REFERENCES users (id),
  CONSTRAINT chk_status_history_new CHECK (new_status IN
    ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REOPENED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 5. complaint_remarks — administrator remarks shown to the student
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS complaint_remarks (
  id           BIGINT        NOT NULL AUTO_INCREMENT,
  complaint_id BIGINT        NOT NULL,
  admin_id     BIGINT        NOT NULL,
  remark       VARCHAR(1000) NOT NULL,
  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_remarks_complaint (complaint_id),
  CONSTRAINT fk_remarks_complaint FOREIGN KEY (complaint_id)
    REFERENCES complaints (id) ON DELETE CASCADE,
  CONSTRAINT fk_remarks_admin FOREIGN KEY (admin_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 6. confidential_reports — Main-Admin-only support reports
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS confidential_reports (
  id          BIGINT       NOT NULL AUTO_INCREMENT,
  report_code VARCHAR(30)  NOT NULL,
  student_id  BIGINT       NOT NULL,
  category    VARCHAR(40)  NOT NULL,
  description TEXT         NOT NULL,
  location    VARCHAR(160) NULL,
  status      VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_reports_code (report_code),
  KEY idx_reports_student (student_id),
  KEY idx_reports_status (status),
  KEY idx_reports_created (created_at),
  CONSTRAINT fk_reports_student FOREIGN KEY (student_id) REFERENCES users (id),
  CONSTRAINT chk_reports_status CHECK (status IN ('PENDING', 'IN_REVIEW', 'RESOLVED', 'REJECTED')),
  CONSTRAINT chk_reports_category CHECK (category IN
    ('HARASSMENT', 'RAGGING', 'SAFETY', 'DISCRIMINATION', 'ACADEMIC', 'FINANCIAL', 'OTHER'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 7. confidential_report_history
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS confidential_report_history (
  id         BIGINT        NOT NULL AUTO_INCREMENT,
  report_id  BIGINT        NOT NULL,
  updated_by BIGINT        NOT NULL,
  old_status VARCHAR(20)   NULL,
  new_status VARCHAR(20)   NOT NULL,
  remarks    VARCHAR(1000) NULL,
  created_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_report_history_report (report_id),
  CONSTRAINT fk_report_history_report FOREIGN KEY (report_id)
    REFERENCES confidential_reports (id) ON DELETE CASCADE,
  CONSTRAINT fk_report_history_user FOREIGN KEY (updated_by) REFERENCES users (id),
  CONSTRAINT chk_report_history_new CHECK (new_status IN ('PENDING', 'IN_REVIEW', 'RESOLVED', 'REJECTED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 8. admin_departments — department / support-category ownership per admin
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_departments (
  id               BIGINT       NOT NULL AUTO_INCREMENT,
  admin_id         BIGINT       NOT NULL,
  department       VARCHAR(120) NOT NULL,
  support_category VARCHAR(40)  NULL,
  created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_admin_departments_admin (admin_id),
  CONSTRAINT fk_admin_departments_admin FOREIGN KEY (admin_id)
    REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT chk_admin_departments_category CHECK (support_category IS NULL OR support_category IN
    ('HARASSMENT', 'RAGGING', 'SAFETY', 'DISCRIMINATION', 'ACADEMIC', 'FINANCIAL', 'OTHER'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 9. notifications
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id         BIGINT       NOT NULL AUTO_INCREMENT,
  user_id    BIGINT       NOT NULL,
  title      VARCHAR(120) NOT NULL,
  message    VARCHAR(500) NOT NULL,
  is_read    BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notifications_user (user_id),
  KEY idx_notifications_read (is_read),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 10. audit_logs — security and workflow trail
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id          BIGINT       NOT NULL AUTO_INCREMENT,
  actor_id    BIGINT       NULL,
  actor_email VARCHAR(190) NOT NULL,
  action      VARCHAR(60)  NOT NULL,
  entity_type VARCHAR(40)  NULL,
  entity_id   BIGINT       NULL,
  details     VARCHAR(500) NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_audit_created (created_at),
  KEY idx_audit_actor (actor_id),
  KEY idx_audit_action (action),
  CONSTRAINT fk_audit_actor FOREIGN KEY (actor_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
