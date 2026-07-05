package com.bteam.ovs.elections.service;

import com.bteam.ovs.elections.entity.ElectionStatus;
import com.bteam.ovs.elections.repository.ElectionRepository;
import com.bteam.ovs.shared.errors.ApiException;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

@RequiredArgsConstructor
@Service
public class ElectionChartService {

    private final ElectionRepository electionRepo;

    @Value("${app.tally.chartDir:data/charts}")
    private String chartDir;

    public Resource getPublishedChart(UUID electionId) throws Exception {

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
            throw new ApiException(
                    HttpStatus.NOT_FOUND,
                    "CHART_NOT_FOUND",
                    "グラフ画像が存在しません");
        }

        return new UrlResource(path.toUri());
    }
}