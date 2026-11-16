package com.campuscare.util;

import java.nio.charset.StandardCharsets;

/** Tiny CSV builder with correct quoting for Excel and other spreadsheet tools. */
public final class CsvUtil {

    private CsvUtil() {
    }

    public static String cell(String value) {
        if (value == null) {
            return "";
        }
        String escaped = value.replace("\"", "\"\"");
        return "\"" + escaped + "\"";
    }

    public static String row(String... values) {
        StringBuilder builder = new StringBuilder();
        for (int i = 0; i < values.length; i++) {
            if (i > 0) {
                builder.append(',');
            }
            builder.append(cell(values[i]));
        }
        return builder.append("\r\n").toString();
    }

    /** UTF-8 BOM helps Microsoft Excel display special characters correctly. */
    public static byte[] toBytes(String csv) {
        return ("\uFEFF" + csv).getBytes(StandardCharsets.UTF_8);
    }
}
