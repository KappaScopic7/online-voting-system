package com.bteam.ovs.elections.service;

import com.bteam.ovs.auth.entity.Role;
import com.bteam.ovs.auth.repository.StaffAccountRepository;
import com.bteam.ovs.elections.controller.dto.ElectionResponse;
import com.bteam.ovs.elections.entity.Election;
import com.bteam.ovs.elections.repository.ElectionRepository;
import com.bteam.ovs.shared.errors.ApiException;
import com.bteam.ovs.shared.security.PrincipalExtractor;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class ElectionCommitteeService {

    private final ElectionRepository electionRepo;
    private final StaffAccountRepository staffRepo;

    public ElectionCommitteeService(ElectionRepository electionRepo, StaffAccountRepository staffRepo) {
        this.electionRepo = electionRepo;
        this.staffRepo = staffRepo;
    }

    /**
     * 選挙一覧取得（Committeeの担当自治体のみ）
     */
    @Transactional(readOnly = true)
    public List<ElectionResponse> listElections(Authentication auth) {
        UUID staffId = PrincipalExtractor.requireAccountId(auth);

        var staff = staffRepo.findById(staffId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです"));

        if (staff.getRole() != Role.COMMITTEE) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "権限がありません");
        }

        String pref = staff.getAssignedPrefCode();
        String city = staff.getAssignedCityCode();
        if (isBlank(pref) || isBlank(city)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "COMMITTEE_AREA_NOT_SET", "担当自治体が設定されていません");
        }

        return electionRepo
                .findByDistrictPrefCodeAndDistrictCityCodeOrderByStartsAtDesc(pref, city)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * 選挙詳細取得（Committeeの担当自治体のみ）
     */
    @Transactional(readOnly = true)
    public ElectionResponse getElection(UUID electionId, Authentication auth) {
        UUID staffId = PrincipalExtractor.requireAccountId(auth);

        var staff = staffRepo.findById(staffId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです"));

        if (staff.getRole() != Role.COMMITTEE) {
            throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "権限がありません");
        }

        String pref = staff.getAssignedPrefCode();
        String city = staff.getAssignedCityCode();
        if (isBlank(pref) || isBlank(city)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "COMMITTEE_AREA_NOT_SET", "担当自治体が設定されていません");
        }

        Election e = electionRepo.findById(electionId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "ELECTION_NOT_FOUND",
                        "選挙が存在しません"));

        // ★ 担当外の選挙は見れない
        if (!pref.equals(e.getDistrictPrefCode()) || !city.equals(e.getDistrictCityCode())) {
            throw new ApiException(HttpStatus.NOT_FOUND, "ELECTION_NOT_FOUND", "選挙が存在しません");
            // 403でもいいけど、存在隠しなら404が無難
        }

        return toResponse(e);
    }

    private ElectionResponse toResponse(Election e) {
        return new ElectionResponse(
                e.getId(),
                e.getTitle(),
                e.getStartsAt(),
                e.getEndsAt());
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
