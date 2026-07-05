package com.bteam.ovs.elections.controller;

import com.bteam.ovs.elections.entity.ElectionStatus;
import com.bteam.ovs.elections.repository.ElectionRepository;
import com.bteam.ovs.shared.errors.ApiException;

import lombok.AllArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

@AllArgsConstructor
@RestController
@RequestMapping("/api/elections")
public class ElectionChartsController {

    private final ElectionRepository electionRepo;

    @Value("${app.tally.chartDir:data/charts}")
    private String chartDir;

    public ElectionChartsController(ElectionRepository electionRepo) {
        this.electionRepo = electionRepo;
    }

    @GetMapping("/{electionId}/chart")
    public ResponseEntity<Resource> chart(@PathVariable("electionId") UUID electionId) throws Exception {

        var election = electionRepo.findById(electionId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "ELECTION_NOT_FOUND",
                        "選挙が存在しません"));

        if (election.getStatus() != ElectionStatus.PUBLISHED) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "RESULT_NOT_AVAILABLE",
                    "結果は未公開です");
        }

        Path path = Path.of(chartDir, electionId + ".png");

        if (!Files.exists(path)) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = new UrlResource(path.toUri());

        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .cacheControl(CacheControl.noCache())
                .body(resource);
    }

}
