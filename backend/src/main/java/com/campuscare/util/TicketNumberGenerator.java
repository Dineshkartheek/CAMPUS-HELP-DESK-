package com.campuscare.util;

import java.security.SecureRandom;
import java.time.Year;

/** Generates readable, unique ticket numbers such as CC-2026-7K4M2Q9B. */
public final class TicketNumberGenerator {

    private static final char[] ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".toCharArray();
    private static final SecureRandom RANDOM = new SecureRandom();

    private TicketNumberGenerator() {
    }

    public static String generate() {
        StringBuilder suffix = new StringBuilder(8);
        for (int i = 0; i < 8; i++) {
            suffix.append(ALPHABET[RANDOM.nextInt(ALPHABET.length)]);
        }
        return "CC-" + Year.now().getValue() + "-" + suffix;
    }
}
