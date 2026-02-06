package com.bteam.ovs.auth.controller;

import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    // チケット一時保存場所 (本番ではRedisやDB推奨)
    // Key: ticket, Value: citizenId
    private static final Map<String, String> ticketStore = new ConcurrentHashMap<>();

    // スマホから送られてくるデータの形
    public static class LoginRequest {
        public String citizenId;
        public String pin;
    }

    /**
     * 1. スマホアプリからの認証リクエスト
     * URL: POST /api/auth/nfc-login
     */
    @PostMapping("/nfc-login")
    public Map<String, String> nfcLogin(@RequestBody LoginRequest request) {

        System.out.println("認証リクエスト受信: ID=" + request.citizenId + ", PIN=" + request.pin);

        // ★ここで本来はDBと照合します
        // 今回はテストのため「PINが 0000 ならOK」とします
        if (request.citizenId != null && "0000".equals(request.pin)) {

            // 1. 成功したらランダムなチケット(整理券)を発行
            String ticket = UUID.randomUUID().toString();

            // 2. チケットを保存 (誰のチケットかを記録)
            ticketStore.put(ticket, request.citizenId);

            // 3. スマホにチケットを返す
            return Collections.singletonMap("ticket", ticket);

        } else {
            // 失敗 (401エラーなどを返すのが理想ですが、簡易的に例外を投げます)
            throw new RuntimeException("認証失敗: PINまたはIDが間違っています");
        }
    }

    /**
     * 2. Web側からのチケット確認 (今回は使いませんが、一応残しておきます)
     * URL: GET /api/auth/verify-ticket?ticket=...
     */
    @GetMapping("/verify-ticket")
    public Map<String, Object> verifyTicket(@RequestParam String ticket) {
        String citizenId = ticketStore.remove(ticket); // 一度使ったら消す

        if (citizenId != null) {
            return Map.of("success", true, "citizenId", citizenId);
        } else {
            return Map.of("success", false, "message", "無効なチケットです");
        }
    }
}