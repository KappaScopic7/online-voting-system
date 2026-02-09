package com.bteam.ovs.demo.controller;

import com.bteam.ovs.demo.controller.dto.DemoPersonaDto;
import com.bteam.ovs.demo.seed.MachidaSangiinSeed;
import com.bteam.ovs.demo.seed.MachidaSangiinSeed.Mode;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Profile({ "dev", "prodlike" })
@RestController
@RequestMapping("/api/demo")
public class DemoPersonaController {

    @GetMapping("/personas")
    public List<DemoPersonaDto> personas() {
        // initializer と同じ seed を参照（Mode変えるならここも合わせる）
        var seed = new MachidaSangiinSeed(Mode.MOCK);

        // users() は UserJson(email,password,...) を返すのでそこから作る
        var users = seed.users();

        // label/description は雑でもOK。必要なら Seed 側でメタ持たせる。
        var counter = new int[] { 1 };
        return users.stream()
                .map(u -> new DemoPersonaDto(
                        "voter-" + (counter[0]++),
                        "デモ有権者 " + u.email(),
                        "Seed生成ユーザー",
                        u.email(),
                        u.password(),
                        u.citizenId() != null ? u.citizenId().toString() : null))
                .toList();

    }
}
