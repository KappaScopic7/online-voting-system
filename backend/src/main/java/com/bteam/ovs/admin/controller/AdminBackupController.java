package com.bteam.ovs.admin.controller;

import com.bteam.ovs.admin.service.AdminBackupService;
// import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

// import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/admin/backup")
public class AdminBackupController {

    private final AdminBackupService service;

    public AdminBackupController(AdminBackupService service) {
        this.service = service;
    }

    /** 管理者のみ：DBバックアップ(sql) */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')") // ← あなたのロールに合わせて ROLE_STAFF 等に変えてOK
    public ResponseEntity<ByteArrayResource> backup() {
        byte[] sql = service.dumpSql();

        var filename = "ovs_backup_" + LocalDateTime.now()
                .format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".sql";

        var res = new ByteArrayResource(sql);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("application/sql"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentLength(sql.length)
                .body(res);
    }

    /** 管理者のみ：DBリストア(sql投入) */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> restore(@RequestPart("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("file is empty");
        }
        if (file.getOriginalFilename() != null && !file.getOriginalFilename().toLowerCase().endsWith(".sql")) {
            return ResponseEntity.badRequest().body("only .sql is allowed");
        }

        service.restoreSql(file);
        return ResponseEntity.ok("restore ok");
    }
}
