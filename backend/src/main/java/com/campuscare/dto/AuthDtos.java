package com.campuscare.dto;

import com.campuscare.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;

/** Request and response objects used by the authentication endpoints. */
public final class AuthDtos {

    private AuthDtos() {
    }

    public record RegisterRequest(
            @NotBlank(message = "Full name is required")
            @Size(max = 120, message = "Full name must be 120 characters or less")
            String fullName,

            @NotBlank(message = "Email is required")
            @Email(message = "Enter a valid email address")
            @Size(max = 180, message = "Email is too long")
            String email,

            @NotBlank(message = "Password is required")
            @Size(min = 8, max = 72, message = "Password must be between 8 and 72 characters")
            String password,

            @NotBlank(message = "Please confirm your password")
            String confirmPassword,

            @Size(max = 120, message = "Department is too long")
            String department
    ) {
    }

    public record LoginRequest(
            @NotBlank(message = "Email is required")
            @Email(message = "Enter a valid email address")
            String email,

            @NotBlank(message = "Password is required")
            String password
    ) {
    }

    /** Public user information. This never contains the password hash. */
    public record UserSummary(
            Long id,
            String fullName,
            String email,
            Role role,
            boolean active,
            String department,
            Instant createdAt
    ) {
    }

    public record AuthResponse(
            String token,
            String tokenType,
            long expiresIn,
            UserSummary user
    ) {
    }
}
