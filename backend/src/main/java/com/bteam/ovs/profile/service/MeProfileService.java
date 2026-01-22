package com.bteam.ovs.profile.service;

import com.bteam.ovs.auth.repo.UserAccountRepository;
import com.bteam.ovs.profile.model.VoterProfileSelf;
import com.bteam.ovs.profile.repo.VoterProfileSelfRepository;
import com.bteam.ovs.profile.web.dto.MeProfileResponse;
import com.bteam.ovs.profile.web.dto.MeProfileUpdateRequest;
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

    public MeProfileService(UserAccountRepository userRepo, VoterProfileSelfRepository profileRepo) {
        this.userRepo = userRepo;
        this.profileRepo = profileRepo;
    }

    @Transactional(readOnly = true)
    public MeProfileResponse get(UUID accountId) {
        var p = profileRepo.findById(accountId).orElse(null);
        if (p == null) {
            // 未入力は 404 にするか null返しにするか好みだけど、今回は 404
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

        // ★本人認証後は自己申告プロフィールを編集させない（市民情報で上書きされる仕様のため）
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
