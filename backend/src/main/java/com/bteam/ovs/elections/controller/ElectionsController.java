package com.bteam.ovs.elections.controller;

import com.bteam.ovs.elections.controller.dto.CandidateItem;
import com.bteam.ovs.elections.controller.dto.ElectionListItem;
import com.bteam.ovs.elections.controller.dto.ElectionResultResponse;
import com.bteam.ovs.elections.controller.dto.ElectionDetailResponse;
import com.bteam.ovs.elections.service.ElectionService;
import com.bteam.ovs.shared.errors.ApiException;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/elections")
public class ElectionsController {

    private final ElectionService electionService;

    public ElectionsController(ElectionService electionService) {
        this.electionService = electionService;
    }

    @GetMapping
    public List<ElectionListItem> list(Authentication auth) {
        UUID accountId = null;

        if (auth != null && auth.getName() != null) {
            Object kind = auth.getDetails() instanceof Map<?, ?> m ? m.get("kind") : null;

            if ("USER".equals(kind)) {
                try {
                    @SuppressWarnings("unchecked")
                    var details = (Map<String, Object>) auth.getDetails();
                    accountId = UUID.fromString((String) details.get("aid"));
                } catch (Exception ex) {
                    throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです");
                }
            }
        }

        return electionService.list(accountId);
    }

    @GetMapping("/{electionId}")
    public ElectionDetailResponse detail(
            @PathVariable("electionId") UUID electionId,
            Authentication auth) {
        UUID accountId = null;

        if (auth != null && auth.getName() != null) {
            Object kind = auth.getDetails() instanceof Map<?, ?> m ? m.get("kind") : null;

            if ("USER".equals(kind)) {
                try {
                    @SuppressWarnings("unchecked")
                    var details = (Map<String, Object>) auth.getDetails();
                    accountId = UUID.fromString((String) details.get("aid"));
                } catch (Exception ex) {
                    throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです");
                }
            }
        }

        return electionService.detail(electionId, accountId);
    }

    @GetMapping("/{electionId}/candidates")
    public List<CandidateItem> candidates(@PathVariable("electionId") UUID electionId) {
        return electionService.candidates(electionId);
    }

    @GetMapping("/{electionId}/result")
    public ElectionResultResponse result(@PathVariable("electionId") UUID electionId) {
        return electionService.result(electionId);
    }
}
