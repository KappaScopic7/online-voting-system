package com.bteam.ovs.admin.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.List;

@Service
public class AdminBackupService {

    @Value("${spring.datasource.url}")
    private String jdbcUrl;

    @Value("${spring.datasource.username}")
    private String dbUser;

    @Value("${spring.datasource.password}")
    private String dbPassword;

    @Value("${ovs.backup.dockerContainer:ovs-postgres-dev}")
    private String dockerContainer;

    public byte[] dumpSql() {
        DbInfo db = DbInfo.parse(jdbcUrl, dbUser, dbPassword);
        return pgDumpViaDocker(db);
    }

    public void restoreSql(MultipartFile file) {
        DbInfo db = DbInfo.parse(jdbcUrl, dbUser, dbPassword);

        File tmp = null;
        try {
            tmp = Files.createTempFile("ovs_restore_", ".sql").toFile();
            try (var out = new FileOutputStream(tmp)) {
                out.write(file.getBytes());
            }
            psqlViaDocker(db, tmp);
        } catch (Exception e) {
            throw new RuntimeException("restore failed", e);
        } finally {
            if (tmp != null)
                tmp.delete();
        }
    }

    private byte[] pgDumpViaDocker(DbInfo db) {
        try {
            var cmd = List.of(
                    "docker", "exec",
                    "-e", "PGPASSWORD=" + db.password,
                    dockerContainer,
                    "pg_dump",
                    "-U", db.user,
                    "-d", db.dbname,
                    "--clean",
                    "--if-exists",
                    "--no-owner",
                    "--no-privileges");

            Process p = new ProcessBuilder(cmd).start();
            byte[] out = p.getInputStream().readAllBytes();
            byte[] err = p.getErrorStream().readAllBytes();
            int code = p.waitFor();

            if (code != 0) {
                throw new RuntimeException("docker pg_dump failed:\n" +
                        new String(err, StandardCharsets.UTF_8));
            }
            return out;
        } catch (Exception e) {
            throw new RuntimeException("backup failed (docker)", e);
        }
    }

    private void psqlViaDocker(DbInfo db, File sqlFile) {
        try {
            String remotePath = "/tmp/ovs_restore.sql";

            Process cp = new ProcessBuilder(
                    "docker", "cp",
                    sqlFile.getAbsolutePath(),
                    dockerContainer + ":" + remotePath).start();
            int cpCode = cp.waitFor();
            if (cpCode != 0)
                throw new RuntimeException("docker cp failed");

            var cmd = List.of(
                    "docker", "exec",
                    "-e", "PGPASSWORD=" + db.password,
                    dockerContainer,
                    "psql",
                    "-U", db.user,
                    "-d", db.dbname,
                    "-v", "ON_ERROR_STOP=1",
                    "-f", remotePath);

            Process p = new ProcessBuilder(cmd).start();
            byte[] err = p.getErrorStream().readAllBytes();
            int code = p.waitFor();

            // cleanup
            new ProcessBuilder("docker", "exec", dockerContainer, "rm", "-f", remotePath).start();

            if (code != 0) {
                throw new RuntimeException("docker psql restore failed:\n" +
                        new String(err, StandardCharsets.UTF_8));
            }
        } catch (Exception e) {
            throw new RuntimeException("restore failed (docker)", e);
        }
    }

    private record DbInfo(String dbname, String user, String password) {
        static DbInfo parse(String jdbcUrl, String user, String password) {
            // jdbc:postgresql://localhost:5432/ovs
            String s = jdbcUrl.replace("jdbc:postgresql://", "");
            String[] hpDb = s.split("/", 2);
            String dbname = hpDb.length > 1 ? hpDb[1] : "postgres";
            // "?..." が付いてたら落とす
            int q = dbname.indexOf('?');
            if (q >= 0)
                dbname = dbname.substring(0, q);
            return new DbInfo(dbname, user, password);
        }
    }
}
