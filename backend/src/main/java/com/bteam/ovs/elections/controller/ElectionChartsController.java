package com.bteam.ovs.elections.controller;

import com.bteam.ovs.elections.service.ElectionChartService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/elections")
public class ElectionChartsController {

    private final ElectionChartService electionChartService;

    @GetMapping("/{electionId}/chart")
    public ResponseEntity<Resource> chart(@PathVariable UUID electionId) throws Exception {

        Resource resource = electionChartService.getPublishedChart(electionId);

        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .cacheControl(CacheControl.noCache())
                .body(resource);
    }
}