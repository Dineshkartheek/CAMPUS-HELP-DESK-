-- ============================================================
-- CAMPUSCARE - SMART CAMPUS HELP DESK MANAGEMENT SYSTEM
-- MySQL 8.0 schema
--
-- Safe to run on a new or existing database: tables are created only
-- if they do not exist. Existing data is never deleted by this script.
--
-- Usage:
--   1. Run as a MySQL user that can create databases.
--   2. The application itself creates the first MAIN_ADMIN from
--      MAIN_ADMIN_EMAIL / MAIN_ADMIN_PASSWORD environment variables.
--      Never insert a plain-text password into this file.
-- ============================================================

CREATE DATABASE IF NOT EXISTS helpdesk_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE helpdesk_db;

-- ------------------------------------------------------------
-- 1. USERS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    full_name     VARCHAR(120) NOT NULL,
    email         VARCHAR(180) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    role          VARCHAR(20)  NOT NULL,
    department    VARCHAR(120) NULL,
    active        TINYINT(1)   NOT NULL DEFAULT 1,
    created_at    TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at    TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_users_email (email),
    KEY idx_users_role (role),
    CONSTRAINT chk_users_role CHECK (role IN ('STUDENT', 'ADMIN', 'MAIN_ADMIN'))
) ENGINE = InnoDB;

-- ------------------------------------------------------------
-- 2. CATEGORIES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    name        VARCHAR(80)  NOT NULL,
    description VARCHAR(255) NULL,
    active      TINYINT(1)   NOT NULL DEFAULT 1,
    created_at  TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_categories_name (name)
) ENGINE = InnoDB;

-- ------------------------------------------------------------
-- 3. TICKETS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tickets (
    id                      BIGINT        NOT NULL AUTO_INCREMENT,
    ticket_number           VARCHAR(32)   NOT NULL,
    student_id              BIGINT        NOT NULL,
    category_id             BIGINT        NOT NULL,
    title                   VARCHAR(160)  NOT NULL,
    description             TEXT          NOT NULL,
    location                VARCHAR(180)  NOT NULL,
    priority                VARCHAR(20)   NOT NULL,
    status                  VARCHAR(20)   NOT NULL DEFAULT 'SUBMITTED',
    assigned_admin_id       BIGINT        NULL,
    admin_remarks           VARCHAR(2000) NULL,
    ai_suggested_category   VARCHAR(80)   NULL,
    ai_suggested_priority   VARCHAR(20)   NULL,
    ai_summary              VARCHAR(500)  NULL,
    ai_suggested_department VARCHAR(120)  NULL,
    created_at              TIMESTAMP(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at              TIMESTAMP(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    resolved_at             TIMESTAMP(6)  NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_tickets_number (ticket_number),
    KEY idx_tickets_student (student_id),
    KEY idx_tickets_category (category_id),
    KEY idx_tickets_status (status),
    KEY idx_tickets_priority (priority),
    KEY idx_tickets_created (created_at),
    KEY idx_tickets_assigned_admin (assigned_admin_id),
    CONSTRAINT fk_tickets_student FOREIGN KEY (student_id) REFERENCES users (id),
    CONSTRAINT fk_tickets_category FOREIGN KEY (category_id) REFERENCES categories (id),
    CONSTRAINT fk_tickets_assigned_admin FOREIGN KEY (assigned_admin_id) REFERENCES users (id),
    CONSTRAINT chk_tickets_status CHECK (status IN ('SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED')),
    CONSTRAINT chk_tickets_priority CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT'))
) ENGINE = InnoDB;

-- ------------------------------------------------------------
-- 4. TICKET COMMENTS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ticket_comments (
    id         BIGINT        NOT NULL AUTO_INCREMENT,
    ticket_id  BIGINT        NOT NULL,
    author_id  BIGINT        NOT NULL,
    message    VARCHAR(2000) NOT NULL,
    created_at TIMESTAMP(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_comments_ticket (ticket_id),
    KEY idx_comments_author (author_id),
    CONSTRAINT fk_comments_ticket FOREIGN KEY (ticket_id) REFERENCES tickets (id) ON DELETE CASCADE,
    CONSTRAINT fk_comments_author FOREIGN KEY (author_id) REFERENCES users (id)
) ENGINE = InnoDB;

-- ------------------------------------------------------------
-- 5. TICKET ASSIGNMENTS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ticket_assignments (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    ticket_id   BIGINT       NOT NULL,
    admin_id    BIGINT       NOT NULL,
    assigned_by BIGINT       NOT NULL,
    note        VARCHAR(255) NULL,
    active      TINYINT(1)   NOT NULL DEFAULT 1,
    assigned_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_assignments_ticket (ticket_id),
    KEY idx_assignments_admin (admin_id),
    CONSTRAINT fk_assignments_ticket FOREIGN KEY (ticket_id) REFERENCES tickets (id) ON DELETE CASCADE,
    CONSTRAINT fk_assignments_admin FOREIGN KEY (admin_id) REFERENCES users (id),
    CONSTRAINT fk_assignments_assigned_by FOREIGN KEY (assigned_by) REFERENCES users (id)
) ENGINE = InnoDB;

-- ------------------------------------------------------------
-- 6. TICKET STATUS HISTORY
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ticket_status_history (
    id          BIGINT        NOT NULL AUTO_INCREMENT,
    ticket_id   BIGINT        NOT NULL,
    from_status VARCHAR(20)   NULL,
    to_status   VARCHAR(20)   NOT NULL,
    changed_by  BIGINT        NOT NULL,
    remarks     VARCHAR(1000) NULL,
    changed_at  TIMESTAMP(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_history_ticket (ticket_id),
    KEY idx_history_changed_at (changed_at),
    CONSTRAINT fk_history_ticket FOREIGN KEY (ticket_id) REFERENCES tickets (id) ON DELETE CASCADE,
    CONSTRAINT fk_history_changed_by FOREIGN KEY (changed_by) REFERENCES users (id)
) ENGINE = InnoDB;

-- ------------------------------------------------------------
-- INITIAL COMPLAINT CATEGORIES
-- ------------------------------------------------------------
INSERT IGNORE INTO categories (name, description) VALUES
    ('Wi-Fi',        'Campus wireless internet and access point issues'),
    ('Smart Board',  'Classroom smart boards and display panels'),
    ('Electrical',   'Power, lighting, fans and electrical repairs'),
    ('Computer Lab', 'Lab computers, software and peripherals'),
    ('Network',      'Wired network, switches and connectivity'),
    ('Classroom',    'Classroom furniture, projectors and facilities'),
    ('Internet',     'General internet access and bandwidth'),
    ('Other',        'Any other campus support request');

-- ------------------------------------------------------------
-- FIRST MAIN ADMIN
-- ------------------------------------------------------------
-- Do NOT insert a plain-text password here.
-- Set these environment variables before starting the backend once:
--   MAIN_ADMIN_EMAIL=you@example.com
--   MAIN_ADMIN_PASSWORD=a-strong-password
-- The backend hashes it with BCrypt and creates the account automatically.
-- After the first successful startup, remove MAIN_ADMIN_PASSWORD from the
-- environment if you do not want the bootstrap check to run again.
