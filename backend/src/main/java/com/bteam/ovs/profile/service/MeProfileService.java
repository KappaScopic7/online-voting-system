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
    private final CitizenRepository citizenRepo;

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
    public MeProfileResponse find(UUID accountId) {
        var acc = userRepo.findById(accountId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです"));

        // 本人認証済みなら Citizen を優先（これは “未入力” じゃないので NOT_FOUND 維持でOK）
        if (acc.getCitizenId() != null) {
            var c = citizenRepo.findById(acc.getCitizenId())
                    .orElseThrow(() -> new ApiException(
                            HttpStatus.NOT_FOUND,
                            "CITIZEN_NOT_FOUND",
                            "本人認証情報が見つかりません"));

            return new MeProfileResponse(
                    accountId,
                    "CITIZEN",
                    c.getBirthDate().toString(),
                    c.getPrefCode(),
                    c.getCityCode(),
                    c.getCreatedAt(),
                    c.getUpdatedAt());
        }

        // 未本人認証は自己申告（★未登録は null）
        var p = profileRepo.findById(accountId).orElse(null);
        return p == null ? null : toResponse(p);
    }

    /** 互換のために残す：存在しない場合は404 */
    @Transactional(readOnly = true)
    public MeProfileResponse get(UUID accountId) {
        var res = find(accountId);
        if (res == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "PROFILE_NOT_FOUND", "プロフィールが未入力です");
        }
        return res;
    }

    @Transactional
    public MeProfileResponse upsert(UUID accountId, MeProfileUpdateRequest req) {
        var acc = userRepo.findById(accountId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです"));

        if (!acc.isEnabled())
            throw new ApiException(HttpStatus.FORBIDDEN, "ACCOUNT_DISABLED", "アカウントが無効です");
        if (acc.isLocked())
            throw new ApiException(HttpStatus.FORBIDDEN, "ACCOUNT_LOCKED", "アカウントがロックされています");

        // 本人認証後は自己申告プロフィールを編集させない
        if (acc.getCitizenId() != null) {
            throw new ApiException(HttpStatus.CONFLICT, "ALREADY_LINKED", "本人認証済みのためプロフィールは編集できません");
        }

        // 既存 or 新規
        var p = profileRepo.findById(accountId).orElseGet(VoterProfileSelf::new);
        p.setAccountId(accountId);

        // ---- 部分更新：空欄は「未変更」扱い ----
        if (req.birthDate() != null && !req.birthDate().isBlank()) {
            try {
                p.setBirthDate(LocalDate.parse(req.birthDate()));
            } catch (Exception e) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_BIRTH_DATE", "birthDateが不正です");
            }
        }

        boolean hasPref = req.prefCode() != null && !req.prefCode().isBlank();
        boolean hasCity = req.cityCode() != null && !req.cityCode().isBlank();

        // 住所は必ず両方セット（片方だけ送るのはNG）
        if (hasPref ^ hasCity) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_ADDRESS", "住所は都道府県と市区町村を両方入力してください");
        }
        if (hasPref) {
            p.setPrefCode(req.prefCode().trim());
            p.setCityCode(req.cityCode().trim());
        }

        // ---- 保存条件：birth or 住所 が埋まっていること ----
        boolean hasBirthSaved = p.getBirthDate() != null;
        boolean hasAddrSaved = p.getPrefCode() != null && p.getCityCode() != null;

        if (!hasBirthSaved && !hasAddrSaved) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "PROFILE_INCOMPLETE",
                    "生年月日 もしくは 住所（都道府県+市区町村）を入力してください");
        }

        p = profileRepo.save(p);
        return toResponse(p);
    }

    private MeProfileResponse toResponse(VoterProfileSelf p) {
        return new MeProfileResponse(
                p.getAccountId(),
                "SELF",
                p.getBirthDate() != null ? p.getBirthDate().toString() : null,
                p.getPrefCode(),
                p.getCityCode(),
                p.getCreatedAt(),
                p.getUpdatedAt());
    }

}
