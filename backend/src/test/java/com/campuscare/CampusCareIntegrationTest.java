package com.campuscare;

import com.campuscare.model.Role;
import com.campuscare.model.User;
import com.campuscare.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * End-to-end API tests using MockMvc and an in-memory H2 database.
 * These cover registration, login, JWT authorization, ticket flow, admin
 * operations, main-admin user management and reports.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CampusCareIntegrationTest {

    private static final String ADMIN_EMAIL = "admin.test@campuscare.local";
    private static final String MAIN_ADMIN_EMAIL = "mainadmin.test@campuscare.local";
    private static final String PASSWORD = "StrongPass123";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void ensureAdminAccounts() {
        createAccountIfMissing("Test Administrator", ADMIN_EMAIL, Role.ADMIN);
        createAccountIfMissing("Test Main Administrator", MAIN_ADMIN_EMAIL, Role.MAIN_ADMIN);
    }

    @Test
    void healthEndpointReportsDatabaseUp() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.database").value("UP"));
    }

    @Test
    void studentRegistrationLoginAndProfileWork() throws Exception {
        String email = uniqueEmail("student");
        String token = register(email);

        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.role").value("STUDENT"))
                .andExpect(jsonPath("$.passwordHash").doesNotExist());

        // The same email cannot register twice.
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody("Another Name", email)))
                .andExpect(status().isConflict());

        String loginToken = login(email, PASSWORD);
        assertThat(loginToken).isNotBlank();
    }

    @Test
    void passwordMismatchAndValidationAreRejected() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"fullName":"Test User","email":"mismatch@example.com",
                                 "password":"StrongPass123","confirmPassword":"DifferentPass123"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Password and confirm password do not match."));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"fullName":"","email":"not-an-email","password":"short",
                                 "confirmPassword":"short"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors").exists());
    }

    @Test
    void protectedEndpointsRequireValidToken() throws Exception {
        mockMvc.perform(get("/api/tickets/my-tickets"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/tickets/my-tickets")
                        .header("Authorization", "Bearer invalid.token.value"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void completeTicketWorkflowWithAdminAndMainAdmin() throws Exception {
        String studentEmail = uniqueEmail("workflow.student");
        String studentToken = register(studentEmail);

        long categoryId = firstCategoryId(studentToken);

        String createBody = objectMapper.writeValueAsString(objectMapper.createObjectNode()
                .put("categoryId", categoryId)
                .put("title", "Projector not switching on")
                .put("description", "The classroom projector shows no signal during the morning class.")
                .put("location", "Block A - Room 204")
                .put("priority", "HIGH"));

        MvcResult createResult = mockMvc.perform(post("/api/tickets")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("SUBMITTED"))
                .andExpect(jsonPath("$.ticketNumber").value(org.hamcrest.Matchers.matchesPattern("CC-\\d{4}-[A-Z2-9]{8}")))
                .andReturn();

        JsonNode created = objectMapper.readTree(createResult.getResponse().getContentAsString());
        long ticketId = created.path("id").asLong();

        mockMvc.perform(get("/api/tickets/my-tickets").header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(org.hamcrest.Matchers.greaterThanOrEqualTo(1)));

        // Another student must not see this ticket.
        String otherToken = register(uniqueEmail("other.student"));
        mockMvc.perform(get("/api/tickets/" + ticketId).header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isNotFound());

        // Student cannot reach administrative APIs.
        mockMvc.perform(get("/api/admin/dashboard").header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());

        String adminToken = login(ADMIN_EMAIL, PASSWORD);

        mockMvc.perform(get("/api/admin/dashboard").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").isNumber())
                .andExpect(jsonPath("$.totalStudents").isNumber());

        long adminId = userRepository.findByEmailIgnoreCase(ADMIN_EMAIL).orElseThrow().getId();

        mockMvc.perform(put("/api/admin/tickets/" + ticketId + "/assign")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"adminId\":" + adminId + ",\"note\":\"Please check the HDMI cable\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ASSIGNED"))
                .andExpect(jsonPath("$.assignedAdmin.email").value(ADMIN_EMAIL));

        mockMvc.perform(put("/api/admin/tickets/" + ticketId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"IN_PROGRESS\",\"remarks\":\"Technician is on the way\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));

        mockMvc.perform(post("/api/admin/tickets/" + ticketId + "/comments")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\":\"The HDMI cable has been replaced.\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("The HDMI cable has been replaced."));

        mockMvc.perform(get("/api/tickets/" + ticketId + "/comments")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));

        mockMvc.perform(put("/api/admin/tickets/" + ticketId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"RESOLVED\",\"remarks\":\"Projector working normally\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESOLVED"))
                .andExpect(jsonPath("$.resolvedAt").exists());

        mockMvc.perform(get("/api/tickets/" + ticketId + "/history")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(4))
                .andExpect(jsonPath("$[0].toStatus").value("SUBMITTED"))
                .andExpect(jsonPath("$[3].toStatus").value("RESOLVED"));

        // Admin cannot access MAIN_ADMIN-only endpoints.
        mockMvc.perform(get("/api/main-admin/reports").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isForbidden());

        String mainAdminToken = login(MAIN_ADMIN_EMAIL, PASSWORD);

        mockMvc.perform(get("/api/main-admin/users").header("Authorization", "Bearer " + mainAdminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        String newAdminEmail = uniqueEmail("created.admin");
        mockMvc.perform(post("/api/main-admin/admins")
                        .header("Authorization", "Bearer " + mainAdminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(objectMapper.createObjectNode()
                                .put("fullName", "Created Admin")
                                .put("email", newAdminEmail)
                                .put("password", PASSWORD)
                                .put("role", "ADMIN")
                                .put("department", "IT Support"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("ADMIN"));

        // Public API cannot create admins, and Main Admin cannot create students here.
        mockMvc.perform(post("/api/main-admin/admins")
                        .header("Authorization", "Bearer " + mainAdminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(objectMapper.createObjectNode()
                                .put("fullName", "Invalid Student")
                                .put("email", uniqueEmail("invalid.student"))
                                .put("password", PASSWORD)
                                .put("role", "STUDENT"))))
                .andExpect(status().isBadRequest());

        mockMvc.perform(get("/api/main-admin/reports").header("Authorization", "Bearer " + mainAdminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalTickets").isNumber())
                .andExpect(jsonPath("$.byStatus.RESOLVED").isNumber())
                .andExpect(jsonPath("$.adminPerformance").isArray());

        mockMvc.perform(get("/api/main-admin/reports/export")
                        .header("Authorization", "Bearer " + mainAdminToken))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", org.hamcrest.Matchers.containsString("text/csv")))
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("attachment")));

        // Main Admin can deactivate a student, and that student can no longer log in.
        User student = userRepository.findByEmailIgnoreCase(studentEmail).orElseThrow();
        mockMvc.perform(put("/api/main-admin/users/" + student.getId() + "/status")
                        .header("Authorization", "Bearer " + mainAdminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"active\":false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(false));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody(studentEmail, PASSWORD)))
                .andExpect(status().isUnauthorized());

        // CSV export of the admin ticket list also works.
        mockMvc.perform(get("/api/admin/tickets/export")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", org.hamcrest.Matchers.containsString("text/csv")));
    }

    @Test
    void invalidStatusTransitionIsRejected() throws Exception {
        String studentToken = register(uniqueEmail("transition.student"));
        long categoryId = firstCategoryId(studentToken);

        MvcResult result = mockMvc.perform(post("/api/tickets")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(objectMapper.createObjectNode()
                                .put("categoryId", categoryId)
                                .put("title", "Electrical socket problem")
                                .put("description", "A socket in the lab is sparking.")
                                .put("location", "Computer Lab 1")
                                .put("priority", "URGENT"))))
                .andExpect(status().isCreated())
                .andReturn();

        long ticketId = objectMapper.readTree(result.getResponse().getContentAsString()).path("id").asLong();
        String adminToken = login(ADMIN_EMAIL, PASSWORD);

        // SUBMITTED cannot jump directly to CLOSED.
        mockMvc.perform(put("/api/admin/tickets/" + ticketId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"CLOSED\",\"remarks\":\"Skipping steps\"}"))
                .andExpect(status().isBadRequest());
    }

    private String register(String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody("Test Student", email)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.role").value("STUDENT"))
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).path("token").asText();
    }

    private String login(String email, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody(email, password)))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).path("token").asText();
    }

    private long firstCategoryId(String token) throws Exception {
        MvcResult result = mockMvc.perform(get("/api/categories")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andReturn();
        JsonNode categories = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(categories.size()).isGreaterThanOrEqualTo(8);
        return categories.get(0).path("id").asLong();
    }

    private void createAccountIfMissing(String fullName, String email, Role role) {
        if (userRepository.existsByEmailIgnoreCase(email)) {
            return;
        }
        userRepository.save(new User(fullName, email, passwordEncoder.encode(PASSWORD), role, "Administration"));
    }

    private String registerBody(String fullName, String email) throws Exception {
        return objectMapper.writeValueAsString(objectMapper.createObjectNode()
                .put("fullName", fullName)
                .put("email", email)
                .put("password", PASSWORD)
                .put("confirmPassword", PASSWORD)
                .put("department", "Computer Science"));
    }

    private String loginBody(String email, String password) throws Exception {
        return objectMapper.writeValueAsString(objectMapper.createObjectNode()
                .put("email", email)
                .put("password", password));
    }

    private String uniqueEmail(String prefix) {
        return prefix + "." + UUID.randomUUID().toString().substring(0, 8) + "@example.com";
    }
}
