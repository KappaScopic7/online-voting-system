package com.bteam.ovs.elections.controller;

import com.bteam.ovs.shared.security.Authz;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/committee/elections")
public class CommitteeElectionChartController {

    @Value("${app.tally.chartDir:/var/lib/ovs/charts}")
    private String chartDir;

    @GetMapping("/{electionId}/chart")
    @PreAuthorize(Authz.STAFF)
    public ResponseEntity<Resource> getChart(@PathVariable("electionId") UUID electionId) throws Exception {

        Path path = Path.of(chartDir, electionId + ".png");

        if (!Files.exists(path)) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = new FileSystemResource(path);

        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .body(resource);
    }
}
