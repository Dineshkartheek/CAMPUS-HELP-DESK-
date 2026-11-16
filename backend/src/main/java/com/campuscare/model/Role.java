package com.campuscare.model;

/**
 * Application roles. The public registration endpoint can only create STUDENT.
 * ADMIN and MAIN_ADMIN accounts are created by a MAIN_ADMIN.
 */
public enum Role {
    STUDENT,
    ADMIN,
    MAIN_ADMIN
}
