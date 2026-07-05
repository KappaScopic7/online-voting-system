package com.bteam.ovs.favorites.service;

import com.bteam.ovs.favorites.entity.FavoriteTargetType;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

import java.util.UUID;

// ここはあなたの既存Repositoryに合わせてimportを調整してOK
import com.bteam.ovs.elections.repository.ElectionRepository;
import com.bteam.ovs.candidates.repository.CandidateRepository;
import com.bteam.ovs.parties.repository.PartyRepository;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Component
@Service
public class FavoriteTargetExistenceService {

    private final ElectionRepository electionRepository;
    private final CandidateRepository candidateRepository;
    private final PartyRepository partyRepository;

    public boolean exists(FavoriteTargetType type, UUID targetId) {
        return switch (type) {
            case ELECTION -> electionRepository.existsById(targetId);
            case CANDIDATE -> candidateRepository.existsById(targetId);
            case PARTY -> partyRepository.existsById(targetId);
        };
    }
}
