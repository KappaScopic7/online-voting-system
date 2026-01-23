package com.bteam.ovs.profile.service;

import com.bteam.ovs.auth.repository.UserAccountRepository;
import com.bteam.ovs.citizen.repository.CitizenRepository;
import com.bteam.ovs.profile.controller.dto.MeProfileResponse;
import com.bteam.ovs.profile.controller.dto.MeProfileUpdateRequest;
import com.bteam.ovs.profile.entity.VoterProfileSelf;
import com.bteam.ovs.profile.repository.VoterProfileSelfRepository;
import com.bteam.ovs.shared.errors.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

@Service
public class MeProfileService {

    private final UserAccountRepository userRepo;
    private final VoterProfileSelfRepository profileRepo;
    private final CitizenRepository citizenRepo; // ★追加

    public MeProfileService(
            UserAccountRepository userRepo,
            VoterProfileSelfRepository profileRepo,
            CitizenRepository citizenRepo // ★追加
    ) {
        this.userRepo = userRepo;
        this.profileRepo = profileRepo;
        this.citizenRepo = citizenRepo;
    }

    @Transactional(readOnly = true)
    public MeProfileResponse get(UUID accountId) {
        var acc = userRepo.findById(accountId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです"));

        // ★本人認証済みなら Citizen を優先
        if (acc.getCitizenId() != null) {
            var c = citizenRepo.findById(acc.getCitizenId())
                    .orElseThrow(() -> new ApiException(
                            HttpStatus.NOT_FOUND,
                            "CITIZEN_NOT_FOUND",
                            "本人認証情報が見つかりません"
                    ));

            return new MeProfileResponse(
                    accountId,
                    "CITIZEN",
                    c.getBirthDate().toString(),
                    c.getPrefCode(),
                    c.getCityCode(),
                    c.getCreatedAt(),
                    c.getUpdatedAt()
            );
        }

        // 未本人認証は自己申告
        var p = profileRepo.findById(accountId).orElse(null);
        if (p == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "PROFILE_NOT_FOUND", "プロフィールが未入力です");
        }
        return toResponse(p);
    }

    @Transactional
    public MeProfileResponse upsert(UUID accountId, MeProfileUpdateRequest req) {
        var acc = userRepo.findById(accountId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです"));

        if (!acc.isEnabled()) throw new ApiException(HttpStatus.FORBIDDEN, "ACCOUNT_DISABLED", "アカウントが無効です");
        if (acc.isLocked()) throw new ApiException(HttpStatus.FORBIDDEN, "ACCOUNT_LOCKED", "アカウントがロックされています");

        // ★本人認証後は自己申告プロフィールを編集させない
        if (acc.getCitizenId() != null) {
            throw new ApiException(HttpStatus.CONFLICT, "ALREADY_LINKED", "本人認証済みのためプロフィールは編集できません");
        }

        LocalDate birthDate;
        try {
            birthDate = LocalDate.parse(req.birthDate());
        } catch (Exception e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_BIRTH_DATE", "birthDateが不正です");
        }

        var p = profileRepo.findById(accountId).orElseGet(VoterProfileSelf::new);
        p.setAccountId(accountId);
        p.setBirthDate(birthDate);
        p.setPrefCode(req.prefCode());
        p.setCityCode(req.cityCode());

        p = profileRepo.save(p);
        return toResponse(p);
    }

    private MeProfileResponse toResponse(VoterProfileSelf p) {
        return new MeProfileResponse(
                p.getAccountId(),
                "SELF",
                p.getBirthDate().toString(),
                p.getPrefCode(),
                p.getCityCode(),
                p.getCreatedAt(),
                p.getUpdatedAt()
        );
    }
}
