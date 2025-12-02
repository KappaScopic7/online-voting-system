package com.bteam.ovs.voter.web;

import com.bteam.ovs.voter.dto.VoterActivateRequest;
import com.bteam.ovs.voter.dto.VoterLoginRequest;
import com.bteam.ovs.voter.dto.VoterLoginResponse;
import com.bteam.ovs.voter.service.VoterAuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import com.bteam.ovs.voter.dto.VoterMeResponse;
import com.bteam.ovs.voter.dto.MyElectionResponse;
import com.bteam.ovs.voter.service.VoterElectionService;

import java.util.List;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/voters")
public class VoterAuthController {

    private final VoterAuthService voterAuthService;
    private final VoterElectionService voterElectionService;

    @PostMapping("/activate")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void activate(@Valid @RequestBody VoterActivateRequest request) {
        voterAuthService.activate(request);
    }

    @PostMapping("/login")
    public VoterLoginResponse login(@Valid @RequestBody VoterLoginRequest request) {
        return voterAuthService.login(request);
    }

    @GetMapping("/me")
    public VoterMeResponse me() {
        return voterAuthService.getMe();
    }

    @GetMapping("/my-elections")
    public List<MyElectionResponse> myElections() {
        return voterElectionService.getMyElections();
    }

}
