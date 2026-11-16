package com.campuscare.config;

import com.campuscare.model.Category;
import com.campuscare.model.Role;
import com.campuscare.model.User;
import com.campuscare.repository.CategoryRepository;
import com.campuscare.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

/**
 * Creates the complaint categories and optionally bootstraps administrator
 * accounts from environment variables. It never contains a real password.
 *
 * Local demo accounts are created only when ALL of these are true:
 *  - the "dev" profile is active
 *  - DEMO_PASSWORD environment variable is set
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final Environment environment;

    @Value("${app.main-admin.email:}")
    private String mainAdminEmail;

    @Value("${app.main-admin.password:}")
    private String mainAdminPassword;

    @Value("${app.main-admin.name:CampusCare Main Administrator}")
    private String mainAdminName;

    @Value("${DEMO_PASSWORD:}")
    private String demoPassword;

    public DataInitializer(CategoryRepository categoryRepository, UserRepository userRepository,
                           PasswordEncoder passwordEncoder, Environment environment) {
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.environment = environment;
    }

    @Override
    @Transactional
    public void run(String... args) {
        seedCategories();
        seedConfiguredMainAdmin();
        seedDemoAccounts();
        checkMainAdminExists();
    }

    private void seedCategories() {
        List<Category> defaults = List.of(
                new Category("Wi-Fi", "Campus wireless internet and access point issues"),
                new Category("Smart Board", "Classroom smart boards and display panels"),
                new Category("Electrical", "Power, lighting, fans and electrical repairs"),
                new Category("Computer Lab", "Lab computers, software and peripherals"),
                new Category("Network", "Wired network, switches and connectivity"),
                new Category("Classroom", "Classroom furniture, projectors and facilities"),
                new Category("Internet", "General internet access and bandwidth"),
                new Category("Other", "Any other campus support request")
        );

        for (Category category : defaults) {
            if (!categoryRepository.existsByNameIgnoreCase(category.getName())) {
                categoryRepository.save(category);
            }
        }
    }

    private void seedConfiguredMainAdmin() {
        if (mainAdminEmail == null || mainAdminEmail.isBlank()
                || mainAdminPassword == null || mainAdminPassword.isBlank()) {
            return;
        }
        if (mainAdminPassword.length() < 8) {
            log.warn("MAIN_ADMIN_PASSWORD is too short (minimum 8 characters). Main Admin was not created.");
            return;
        }
        createAccountIfMissing(mainAdminName, mainAdminEmail, mainAdminPassword, Role.MAIN_ADMIN, "Administration");
    }

    private void seedDemoAccounts() {
        boolean devProfile = Arrays.asList(environment.getActiveProfiles()).contains("dev");
        if (!devProfile || demoPassword == null || demoPassword.isBlank()) {
            return;
        }
        if (demoPassword.length() < 8) {
            log.warn("DEMO_PASSWORD is too short (minimum 8 characters). Demo accounts were not created.");
            return;
        }

        createAccountIfMissing("Demo Student", "student@campuscare.local", demoPassword, Role.STUDENT, "CSE");
        createAccountIfMissing("Demo Administrator", "admin@campuscare.local", demoPassword, Role.ADMIN, "Facilities");
        createAccountIfMissing("Demo Main Administrator", "mainadmin@campuscare.local", demoPassword,
                Role.MAIN_ADMIN, "Administration");

        log.info("Local demo accounts are available: student@campuscare.local, admin@campuscare.local, "
                + "mainadmin@campuscare.local (password from DEMO_PASSWORD).");
    }

    private void createAccountIfMissing(String fullName, String email, String rawPassword,
                                        Role role, String department) {
        String normalizedEmail = email.trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            return;
        }
        User user = new User(fullName, normalizedEmail, passwordEncoder.encode(rawPassword), role, department);
        userRepository.save(user);
        log.info("Created {} account: {}", role, normalizedEmail);
    }

    private void checkMainAdminExists() {
        if (userRepository.countByRoleAndActiveTrue(Role.MAIN_ADMIN) == 0) {
            log.warn("No active MAIN_ADMIN account exists. Set MAIN_ADMIN_EMAIL and MAIN_ADMIN_PASSWORD "
                    + "environment variables to bootstrap one, or enable the dev profile with DEMO_PASSWORD.");
        }
    }
}
