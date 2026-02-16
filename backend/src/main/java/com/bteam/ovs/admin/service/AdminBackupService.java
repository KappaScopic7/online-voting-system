package com.bteam.ovs.admin.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.List;

@Service
public class AdminBackupService {

    @Value("${spring.datasource.url}")
    private String jdbcUrl;

    @Value("${spring.datasource.username}")
    private String dbUser;

    @Value("${spring.datasource.password}")
    private String dbPassword;

    // ローカルか本番かを切り替えるフラグ (デフォルトは false = 直接実行)
    @Value("${ovs.backup.use-docker:false}")
    private boolean useDocker;

    @Value("${ovs.backup.docker-container:ovs-postgres-dev}")
    private String dockerContainer;

    public byte[] dumpSql() {
        DbInfo db = DbInfo.parse(jdbcUrl, dbUser, dbPassword);
        return useDocker ? pgDumpViaDocker(db) : pgDumpDirect(db);
    }

    public void restoreSql(MultipartFile file) {
        DbInfo db = DbInfo.parse(jdbcUrl, dbUser, dbPassword);
        File tmp = null;
        try {
            tmp = Files.createTempFile("ovs_restore_", ".sql").toFile();
            try (var out = new FileOutputStream(tmp)) {
                out.write(file.getBytes());
            }
            if (useDocker)
                psqlViaDocker(db, tmp);
            else
                psqlDirect(db, tmp);
        } catch (Exception e) {
            throw new RuntimeException("restore failed", e);
        } finally {
            if (tmp != null)
                tmp.delete();
        }
    }

    // --- 直接実行 (EC2 / 本番用) ---
    private byte[] pgDumpDirect(DbInfo db) {
        return runCommand(db, List.of(
                "pg_dump", "-h", db.host, "-p", db.port, "-U", db.user, "-d", db.dbname,
                "--clean", "--if-exists", "--no-owner", "--no-privileges"), null);
    }

    private void psqlDirect(DbInfo db, File sqlFile) {
        runCommand(db, List.of(
                "psql", "-h", db.host, "-p", db.port, "-U", db.user, "-d", db.dbname,
                "-v", "ON_ERROR_STOP=1", "-f", sqlFile.getAbsolutePath()), null);
    }

    // --- Docker経由 (ローカル開発用) ---
    private byte[] pgDumpViaDocker(DbInfo db) {
        return runCommand(db, List.of(
                "docker", "exec", "-e", "PGPASSWORD=" + db.password, dockerContainer,
                "pg_dump", "-U", db.user, "-d", db.dbname,
                "--clean", "--if-exists", "--no-owner", "--no-privileges"), "backup failed (docker)");
    }

    private void psqlViaDocker(DbInfo db, File sqlFile) {
        try {
            String remotePath = "/tmp/restore.sql";
            new ProcessBuilder("docker", "cp", sqlFile.getAbsolutePath(), dockerContainer + ":" + remotePath).start()
                    .waitFor();

            runCommand(db, List.of(
                    "docker", "exec", "-e", "PGPASSWORD=" + db.password, dockerContainer,
                    "psql", "-U", db.user, "-d", db.dbname, "-v", "ON_ERROR_STOP=1", "-f", remotePath),
                    "restore failed (docker)");

            new ProcessBuilder("docker", "exec", dockerContainer, "rm", "-f", remotePath).start();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    // 共通の実行メソッド
    private byte[] runCommand(DbInfo db, List<String> cmd, String errorMsg) {
        try {
            ProcessBuilder pb = new ProcessBuilder(cmd);
            if (!useDocker)
                pb.environment().put("PGPASSWORD", db.password);

            Process p = pb.start();
            byte[] out = p.getInputStream().readAllBytes();
            byte[] err = p.getErrorStream().readAllBytes();
            if (p.waitFor() != 0) {
                throw new RuntimeException((errorMsg != null ? errorMsg : "Command failed") + "\n"
                        + new String(err, StandardCharsets.UTF_8));
            }
            return out;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private record DbInfo(String host, String port, String dbname, String user, String password) {
        static DbInfo parse(String jdbcUrl, String user, String password) {
            String s = jdbcUrl.replace("jdbc:postgresql://", "");
            String[] hostPortAndDb = s.split("/", 2);
            String[] hostAndPort = hostPortAndDb[0].split(":");
            String host = hostAndPort[0];
            String port = hostAndPort.length > 1 ? hostAndPort[1] : "5432";
            String dbname = hostPortAndDb.length > 1 ? hostPortAndDb[1].split("\\?")[0] : "postgres";
            return new DbInfo(host, port, dbname, user, password);
        }
    }
}