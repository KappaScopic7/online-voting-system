package com.bteam.ovs.elections.controller;

import com.bteam.ovs.elections.dto.response.ElectionDetailResponse;
import com.bteam.ovs.elections.dto.response.ElectionListItem;
import com.bteam.ovs.elections.dto.response.ElectionResultBundleResponse;
import com.bteam.ovs.elections.service.ElectionService;
import com.bteam.ovs.shared.security.PrincipalExtractor;

import lombok.AllArgsConstructor;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@AllArgsConstructor
@RestController
@RequestMapping("/api/elections")
public class ElectionsController {

    private final ElectionService electionService;

    @GetMapping
    public List<ElectionListItem> list(Authentication auth) {
        UUID accountId = PrincipalExtractor.optionalUserAccountId(auth);
        return electionService.list(accountId);
    }

    @GetMapping("/{electionId}")
    public ElectionDetailResponse detail(
            @PathVariable("electionId") UUID electionId,
            Authentication auth) {
        UUID accountId = PrincipalExtractor.optionalUserAccountId(auth);
        return electionService.detail(electionId, accountId);
    }

    @GetMapping("/{electionId}/result")
    public ElectionResultBundleResponse result(@PathVariable("electionId") UUID electionId) {
        return electionService.resultBundle(electionId);
    }

}
