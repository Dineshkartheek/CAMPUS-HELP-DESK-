package com.campuscare;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point of the CampusCare REST API.
 *
 * Run locally:
 *   mvn spring-boot:run -Dspring-boot.run.profiles=dev
 *
 * The "dev" profile uses a local H2 database so the project can be demonstrated
 * without installing MySQL. Production uses MySQL through environment variables.
 */
@SpringBootApplication
public class CampusCareApplication {

    public static void main(String[] args) {
        SpringApplication.run(CampusCareApplication.class, args);
    }
}
