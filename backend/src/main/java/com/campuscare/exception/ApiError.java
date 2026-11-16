package com.campuscare.exception;

import java.time.Instant;
import java.util.Map;

/** Consistent JSON error body returned by every API error. */
public record ApiError(
        Instant timestamp,
        int status,
        String error,
        String message,
        String path,
        Map<String, String> fieldErrors
) {
}
