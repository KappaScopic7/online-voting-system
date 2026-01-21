package com.bteam.ovs.voters.web;

import com.bteam.ovs.auth.repo.UserAccountRepository;
import com.bteam.ovs.elections.web.dto.ElectionListItem;
import com.bteam.ovs.shared.errors.ApiException;
import com.bteam.ovs.voters.service.VoterElectionsService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/voters")
public class VotersController {

    private final UserAccountRepository userRepo;
    private final VoterElectionsService voterElectionsService;

    public VotersController(
            UserAccountRepository userRepo,
            VoterElectionsService voterElectionsService
    ) {
        this.userRepo = userRepo;
        this.voterElectionsService = voterElectionsService;
    }

    @GetMapping("/my-elections")
    public List<ElectionListItem> myElections(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです");
        }

        var acc = userRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです"));

        UUID citizenId = acc.getCitizenId();
        if (citizenId == null) {
            throw new ApiException(HttpStatus.FORBIDDEN, "IDENTITY_NOT_LINKED", "本人認証が必要です");
        }

        return voterElectionsService.listMyElections(citizenId);
    }
}
