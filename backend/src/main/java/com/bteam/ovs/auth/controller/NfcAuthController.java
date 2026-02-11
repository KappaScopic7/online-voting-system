package com.bteam.ovs.auth.controller;

import com.bteam.ovs.auth.controller.dto.TokenResponse;
import com.bteam.ovs.auth.controller.dto.NfcLoginRequest;
import com.bteam.ovs.auth.controller.dto.NfcLoginResponse;
import com.bteam.ovs.auth.controller.dto.NfcExchangeRequest;
import com.bteam.ovs.auth.service.NfcAuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth/nfc")
public class NfcAuthController {

    private final NfcAuthService service;

    public NfcAuthController(NfcAuthService service) {
        this.service = service;
    }

    /**
     * Android → payload+pin+electionId を照合して ticket を発行
     * POST /api/auth/nfc/login
     */
    @PostMapping(value = "/login", produces = "application/json; charset=UTF-8")
    public NfcLoginResponse login(@RequestBody @Valid NfcLoginRequest req) {
        return service.login(req);
    }

    /**
     * Web → ticket を voteToken に交換（publicTokenとして保存）
     * POST /api/auth/nfc/exchange
     */
    @PostMapping(value = "/exchange", produces = "application/json; charset=UTF-8")
    public TokenResponse exchange(@RequestBody @Valid NfcExchangeRequest req) {
        return service.exchange(req);
    }
}
