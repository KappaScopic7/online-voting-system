package com.bteam.ovs.elections.controller;

import com.bteam.ovs.elections.dto.response.ElectionListItem;
import com.bteam.ovs.elections.service.MyElectionsService;
import com.bteam.ovs.shared.security.PrincipalExtractor;

import lombok.RequiredArgsConstructor;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/me/elections")
public class MeElectionsController {

    private final MyElectionsService myElectionsService;

    @GetMapping
    public List<ElectionListItem> list(Authentication auth) {
        UUID accountId = PrincipalExtractor.requireAccountId(auth);
        return myElectionsService.listMyElections(accountId);
    }
}
