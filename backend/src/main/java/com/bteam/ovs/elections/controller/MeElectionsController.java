package com.bteam.ovs.elections.controller;

import com.bteam.ovs.elections.controller.dto.MyElectionItem;
import com.bteam.ovs.elections.service.MyElectionsService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.bteam.ovs.shared.security.PrincipalExtractor;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/me/elections")
public class MeElectionsController {

    private final MyElectionsService myElectionsService;

    public MeElectionsController(MyElectionsService myElectionsService) {
        this.myElectionsService = myElectionsService;
    }

    @GetMapping
    public List<MyElectionItem> list(Authentication auth) {
        UUID accountId = PrincipalExtractor.requireAccountId(auth);
        return myElectionsService.listMyElections(accountId);
    }
}