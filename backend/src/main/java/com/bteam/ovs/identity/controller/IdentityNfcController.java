// backend/src/main/java/com/bteam/ovs/identity/controller/IdentityNfcController.java
package com.bteam.ovs.identity.controller;

import com.bteam.ovs.identity.dto.request.NfcResolveRequest;
import com.bteam.ovs.identity.dto.response.CitizenNfcResolveResponse;
import com.bteam.ovs.identity.service.NfcResolveService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/identity/nfc")
public class IdentityNfcController {

    private final NfcResolveService service;

    @PostMapping(value = "/resolve", produces = "application/json; charset=UTF-8")
    public CitizenNfcResolveResponse resolve(@RequestBody @Valid NfcResolveRequest req) {
        return service.resolve(req.payload(), req.pin());
    }
}
