package com.campuscare.service;

import com.campuscare.dto.AuthDtos;
import com.campuscare.dto.DtoMapper;
import com.campuscare.exception.ApiException;
import com.campuscare.model.Role;
import com.campuscare.model.User;
import com.campuscare.repository.UserRepository;
import com.campuscare.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

/** Registration, login and "who am I" business logic. */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    /**
     * Public registration always creates a STUDENT account.
     * A client cannot send a role field to create an administrator.
     */
    @Transactional
    public AuthDtos.AuthResponse register(AuthDtos.RegisterRequest request) {
        if (!request.password().equals(request.confirmPassword())) {
            throw ApiException.badRequest("Password and confirm password do not match.");
        }

        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict("An account with this email already exists.");
        }

        User student = new User(
                request.fullName().trim(),
                email,
                passwordEncoder.encode(request.password()),
                Role.STUDENT,
                trimToNull(request.department())
        );
        student = userRepository.save(student);
        return buildAuthResponse(student);
    }

    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest request) {
        String email = normalizeEmail(request.email());

        // Throws BadCredentialsException / DisabledException, handled centrally.
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.password()));

        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> ApiException.unauthorized("Invalid email or password."));
        if (!user.isActive()) {
            throw ApiException.forbidden("This account has been deactivated. Contact the Main Administrator.");
        }
        return buildAuthResponse(user);
    }

    @Transactional(readOnly = true)
    public AuthDtos.UserSummary currentUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.unauthorized("Account no longer exists."));
        return DtoMapper.toUserSummary(user);
    }

    private AuthDtos.AuthResponse buildAuthResponse(User user) {
        String token = jwtService.generateToken(user);
        return new AuthDtos.AuthResponse(
                token,
                "Bearer",
                jwtService.getExpirationSeconds(),
                DtoMapper.toUserSummary(user)
        );
    }

    public static String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
