package com.bteam.ovs.web;

import java.util.List;

import org.springframework.web.bind.annotation.*;

import com.bteam.ovs.voter.Voter;
import com.bteam.ovs.voter.VoterRepository;

@RestController
@RequestMapping("/voters")
public class VoterController {

    private final VoterRepository voterRepository;

    public VoterController(VoterRepository voterRepository) {
        this.voterRepository = voterRepository;
    }

    @PostMapping
    public Voter create(@RequestBody Voter voter) {
        return voterRepository.save(voter);
    }

    @GetMapping
    public List<Voter> findAll() {
        return voterRepository.findAll();
    }
}
