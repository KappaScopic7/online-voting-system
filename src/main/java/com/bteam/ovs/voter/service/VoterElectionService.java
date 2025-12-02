package com.bteam.ovs.voter.service;

import com.bteam.ovs.election.domain.District;
import com.bteam.ovs.election.domain.Election;
import com.bteam.ovs.election.domain.ElectionStatus;
import com.bteam.ovs.election.repository.ElectionRepository;
import com.bteam.ovs.voter.domain.VoterAccount;
import com.bteam.ovs.voter.dto.MyElectionResponse;
import com.bteam.ovs.voter.repository.VoterAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.List;

import static org.springframework.http.HttpStatus.*;

@Service
@RequiredArgsConstructor
public class VoterElectionService {

    private final VoterAccountRepository voterAccountRepository;
    private final ElectionRepository electionRepository;

    @Transactional(readOnly = true)
    public List<MyElectionResponse> getMyElections() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "認証情報が見つかりません。");
        }

        String email = auth.getName();

        VoterAccount account = voterAccountRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "アカウントが見つかりません。"));

        District district = account.getCitizen().getDistrict();
        if (district == null) {
            // 選挙区が紐付いていない場合は空リスト
            return List.of();
        }

        // 今回は「公開済み or 投票受付中」の選挙だけをMy選挙として返す例
        List<ElectionStatus> statuses = List.copyOf(EnumSet.of(
                ElectionStatus.PUBLISHED,
                ElectionStatus.OPEN
        ));

        LocalDateTime now = LocalDateTime.now();

        // 例: まだ終了していない選挙だけに絞る場合はこちら
        List<Election> elections = electionRepository
                .findByDistrictAndEndsAtAfterOrderByStartsAtAsc(district, now);

        return elections.stream()
                .filter(e -> statuses.contains(e.getStatus()))
                .map(e -> new MyElectionResponse(
                        e.getId(),
                        e.getCode(),
                        e.getName(),
                        e.getDistrict().getName(),
                        e.getStatus(),
                        e.getStartsAt(),
                        e.getEndsAt()
                ))
                .toList();
    }
}
