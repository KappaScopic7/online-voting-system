package com.bteam.ovs.voting.controller;

import com.bteam.ovs.shared.security.PrincipalExtractor;
import com.bteam.ovs.shared.validation.UuidParsers;
import com.bteam.ovs.voting.dto.request.JudgeReviewConfirmRequest;
import com.bteam.ovs.voting.dto.response.JudgeReviewStartResponse;
import com.bteam.ovs.voting.service.VotingService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@AllArgsConstructor
@RestController
@RequestMapping("/api/judge-review")
public class JudgeReviewController {

    private final VotingService votingService;

    @GetMapping("/start")
    public JudgeReviewStartResponse start(
            @RequestParam("electionId") String electionId,
            Authentication auth) {

        UUID accountId = PrincipalExtractor.requireAccountId(auth);
        UUID eid = UuidParsers.parseOr400(
                electionId, "INVALID_ELECTION_ID", "electionIdが不正です");

        // VotingService 内で citizenIdResolver.requireCitizenId(accountId) と
        // eligibility を通す実装に寄せたいが、今は ByCitizen があるので
        // まずは accountId -> citizenId を service 側で取るのが一番綺麗。
        // ここでは VotingService に "startJudgeReview(accountId,eid)" を生やすのが理想。
        //
        // ただ、現状 startJudgeReviewByCitizen しかないので、
        // 既存の設計に合わせて VotingService に薄いラッパーを追加するのが最短。

        return votingService.startJudgeReview(accountId, eid);
    }

    @PostMapping("/confirm")
    public void confirm(
            @Valid @RequestBody JudgeReviewConfirmRequest req,
            Authentication auth) {

        UUID accountId = PrincipalExtractor.requireAccountId(auth);
        UUID electionId = UuidParsers.parseOr400(
                req.electionId(), "INVALID_ELECTION_ID", "electionIdが不正です");

        votingService.confirmJudgeReview(accountId, electionId, req.choices());
    }
}
