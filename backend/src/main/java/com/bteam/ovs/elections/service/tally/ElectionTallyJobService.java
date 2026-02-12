package com.bteam.ovs.elections.service.tally;

import com.bteam.ovs.elections.entity.ElectionStatus;
import com.bteam.ovs.elections.repository.ElectionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
public class ElectionTallyJobService {

    private final ElectionRepository electionRepo;
    private final TallyJsonService tallyJsonService;
    private final ObjectMapper om;

    @Value("${app.tally.python:/usr/bin/python3}")
    private String pythonCmd;

    @Value("${app.tally.script:/opt/ovs/scripts/generate_chart.py}")
    private String scriptPath;

    @Value("${app.tally.jsonDir:/var/lib/ovs/tally}")
    private String jsonDir;

    @Value("${app.tally.chartDir:/var/lib/ovs/charts}")
    private String chartDir;

    @Value("${app.tally.workDir:/opt/ovs}")
    private String workDir;

    @Value("${app.tally.timeoutSeconds:60}")
    private long timeoutSeconds;

    public ElectionTallyJobService(
            ElectionRepository electionRepo,
            TallyJsonService tallyJsonService,
            ObjectMapper om) {
        this.electionRepo = electionRepo;
        this.tallyJsonService = tallyJsonService;
        this.om = om;
    }

    @Async
    @Transactional
    public void enqueue(UUID electionId) {
        System.out.println("[tally] enqueue called electionId=" + electionId);

        var eOpt = electionRepo.findById(electionId);
        if (eOpt.isEmpty()) {
            System.out.println("[tally] election not found");
            return;
        }
        var e = eOpt.get();
        System.out.println("[tally] status at start=" + e.getStatus());
        System.out.println("[tally] jsonDir=" + jsonDir);
        System.out.println("[tally] chartDir=" + chartDir);
        System.out.println("[tally] scriptPath=" + scriptPath);
        System.out.println("[tally] pythonCmd=" + pythonCmd);

        if (e.getStatus() != ElectionStatus.CLOSED)
            return;

        Instant now = Instant.now();

        try {
            Files.createDirectories(Path.of(jsonDir));
            Files.createDirectories(Path.of(chartDir));

            Path jsonPath = Path.of(jsonDir, electionId + ".json");
            Path pngPath = Path.of(chartDir, electionId + ".png");

            var bundle = tallyJsonService.build(electionId, now);
            om.writerWithDefaultPrettyPrinter().writeValue(jsonPath.toFile(), bundle);

            ProcessBuilder pb = new ProcessBuilder(
                    pythonCmd,
                    scriptPath,
                    "--in", jsonPath.toString(),
                    "--out", pngPath.toString());

            pb.directory(Path.of(workDir).toFile());
            pb.redirectErrorStream(true);
            pb.environment().put("MPLBACKEND", "Agg");

            Process p = pb.start();

            boolean finished = p.waitFor(timeoutSeconds, TimeUnit.SECONDS);
            String logs = readAll(p.getInputStream());

            if (!finished) {
                p.destroyForcibly();
                System.err.println("[tally] TIMEOUT electionId=" + electionId);
                System.err.println(logs);
                return;
            }

            int code = p.exitValue();
            if (code != 0 || !Files.exists(pngPath)) {
                System.err.println("[tally] FAILED electionId=" + electionId + " code=" + code);
                System.err.println(logs);
                return;
            }

            e.setTalliedAt(now);
            e.setStatus(ElectionStatus.TALLIED);

            System.out.println("[tally] OK electionId=" + electionId);

        } catch (Exception ex) {
            System.err.println("[tally] EXCEPTION electionId=" + electionId);
            ex.printStackTrace();
        }
    }

    private static String readAll(InputStream in) {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            byte[] buf = new byte[4096];
            int n;
            while ((n = in.read(buf)) >= 0)
                baos.write(buf, 0, n);
            return baos.toString();
        } catch (Exception e) {
            return "";
        }
    }
}
