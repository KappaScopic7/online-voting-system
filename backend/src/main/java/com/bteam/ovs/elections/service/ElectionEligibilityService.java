package com.bteam.ovs.elections.service;

import com.bteam.ovs.elections.repository.ElectionRepository;
import com.bteam.ovs.eligibility.service.EligibilityProfileResolver;
import com.bteam.ovs.shared.errors.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.UUID;

@Service
public class ElectionEligibilityService {

    private final ElectionRepository electionRepo;
    private final EligibilityProfileResolver profileResolver;

    public ElectionEligibilityService(
            ElectionRepository electionRepo,
            EligibilityProfileResolver profileResolver) {
        this.electionRepo = electionRepo;
        this.profileResolver = profileResolver;
    }

    /** 例：18歳以上ならOK（卒制デモの最小） */
    public boolean isEligible(UUID accountId, UUID electionId) {
        try {
            requireEligible(accountId, electionId);
            return true;
        } catch (ApiException ex) {
            return false;
        }
    }

    /** ダメなら ApiException(FORBIDDEN) を投げる（必要なら controller/service で使える） */
    public void requireEligible(UUID accountId, UUID electionId) {
        var election = electionRepo.findById(electionId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "ELECTION_NOT_FOUND",
                        "選挙が存在しません"));

        var snap = profileResolver.resolve(accountId);
        if (snap == null || snap.birthDate() == null) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "ELIGIBILITY_UNKNOWN",
                    "年齢情報がないため投票できません");
        }

        // 選挙開始日時 기준で年齢判定（UTC寄せ）
        LocalDate on = election.getStartsAt().atZone(ZoneOffset.UTC).toLocalDate();

        int age = calcAge(snap.birthDate(), on);
        if (age < 18) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "UNDER_AGE",
                    "年齢条件を満たしていません");
        }

        // 住所条件などは卒制なら後で足す
    }

    private int calcAge(LocalDate birthDate, LocalDate onDate) {
        int age = onDate.getYear() - birthDate.getYear();
        if (onDate.getMonthValue() < birthDate.getMonthValue()
                || (onDate.getMonthValue() == birthDate.getMonthValue()
                        && onDate.getDayOfMonth() < birthDate.getDayOfMonth())) {
            age--;
        }
        return age;
    }
}
