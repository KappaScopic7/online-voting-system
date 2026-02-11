package com.bteam.ovs.admin.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
// import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/admin/backup")
@PreAuthorize("hasAuthority('ADMIN')") // RequireStaff role="ADMIN" に合わせる
public class AdminBackupController {

    @Value("${spring.datasource.url}")
    String jdbcUrl;

    @Value("${spring.datasource.username}")
    String dbUser;

    @Value("${spring.datasource.password}")
    String dbPassword;

    private String host() {
        return jdbcUrl.replaceAll("jdbc:postgresql://([^:/]+).*", "$1");
    }

    private String port() {
        return jdbcUrl.replaceAll("jdbc:postgresql://[^:]+:(\\d+).*", "$1");
    }

    private String db() {
        return jdbcUrl.replaceAll("jdbc:postgresql://[^/]+/(\\w+).*", "$1");
    }

    // ====== ダウンロード ======
    @GetMapping
    public ResponseEntity<byte[]> backup() throws Exception {

        ProcessBuilder pb = new ProcessBuilder(
                "pg_dump",
                "-h", host(),
                "-p", port(),
                "-U", dbUser,
                "-d", db());
        pb.environment().put("PGPASSWORD", dbPassword);
        pb.redirectErrorStream(true);

        Process p = pb.start();
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        p.getInputStream().transferTo(baos);

        if (p.waitFor() != 0) {
            throw new RuntimeException("pg_dump failed: " + baos);
        }

        String ts = LocalDateTime.now()
                .format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"ovs_" + ts + ".sql\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(baos.toByteArray());
    }

    // ====== アップロード ======
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> restore(@RequestPart("file") MultipartFile file)
            throws Exception {

        ProcessBuilder pb = new ProcessBuilder(
                "psql",
                "-h", host(),
                "-p", port(),
                "-U", dbUser,
                "-d", db(),
                "-v", "ON_ERROR_STOP=1");
        pb.environment().put("PGPASSWORD", dbPassword);
        pb.redirectErrorStream(true);

        Process p = pb.start();

        file.getInputStream().transferTo(p.getOutputStream());
        p.getOutputStream().close();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        p.getInputStream().transferTo(baos);

        if (p.waitFor() != 0) {
            return ResponseEntity
                    .status(500)
                    .body("restore failed:\n" + baos);
        }

        return ResponseEntity.ok("restore ok");
    }
}
