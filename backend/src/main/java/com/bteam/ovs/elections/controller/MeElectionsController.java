package com.bteam.ovs.elections.controller;

import com.bteam.ovs.elections.controller.dto.MyElectionItem;
import com.bteam.ovs.elections.service.MyElectionsService;
// import com.bteam.ovs.shared.errors.ApiException;
// import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.bteam.ovs.shared.security.PrincipalExtractor;

import java.util.List;
// import java.util.Map;
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

        var elections = myElectionsService.listMyElections(accountId);

        return elections.stream()
                .map(e -> new MyElectionItem(e.getId(), e.getTitle(), e.getStartsAt(), e.getEndsAt()))
                .toList();
    }

    // private UUID requireAccountId(Authentication auth) {
    // if (auth == null || auth.getName() == null) {
    // throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです");
    // }
    // try {
    // @SuppressWarnings("unchecked")
    // var details = (Map<String, Object>) auth.getDetails();
    // return UUID.fromString((String) details.get("aid"));
    // } catch (Exception e) {
    // throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです");
    // }
    // }
}
