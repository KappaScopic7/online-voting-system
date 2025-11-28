package com.bteam.ovs.voter.web;

import com.bteam.ovs.voter.dto.VoterActivateRequest;
import com.bteam.ovs.voter.dto.VoterLoginRequest;
import com.bteam.ovs.voter.service.VoterAuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/voters")
@RequiredArgsConstructor
public class VoterAuthController {

    private final VoterAuthService voterAuthService;

    /**
     * 本人認証＋メール＆パスワード登録
     * ※フロントの画面は2ステップでもOK。APIは1回でまとめて処理。
     */
    @PostMapping("/activate")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void activate(@Valid @RequestBody VoterActivateRequest request) {
        voterAuthService.activate(request);
    }

    /**
     * 通常ログイン
     */
    @PostMapping("/login")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void login(@Valid @RequestBody VoterLoginRequest request) {
        voterAuthService.login(request);
    }
}
