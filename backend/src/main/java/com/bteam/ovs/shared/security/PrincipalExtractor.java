// backend/src/main/java/com/bteam/ovs/shared/security/PrincipalExtractor.java
package com.bteam.ovs.shared.security;

import com.bteam.ovs.auth.entity.AccountKind;
import com.bteam.ovs.auth.entity.Role;
import com.bteam.ovs.shared.errors.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;

import java.util.UUID;

public final class PrincipalExtractor {
    private PrincipalExtractor() {
    }

    public static AuthPrincipal requirePrincipal(Authentication auth) {
        if (auth == null || auth.getPrincipal() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "未ログインです");
        }
        Object p = auth.getPrincipal();
        if (p instanceof AuthPrincipal ap)
            return ap;
        throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "認証情報が不正です");
    }

    public static UUID requireAccountId(Authentication auth) {
        return requirePrincipal(auth).accountId();
    }

    public static String requireSubject(Authentication auth) {
        String sub = requirePrincipal(auth).subject();
        if (sub == null || sub.isBlank()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "認証情報が不正です");
        }
        return sub;
    }

    public static AccountKind requireKind(Authentication auth) {
        AccountKind kind = requirePrincipal(auth).kind();
        if (kind == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "認証情報が不正です");
        }
        return kind;
    }

    public static Role optionalRole(Authentication auth) {
        return requirePrincipal(auth).role();
    }

    public static UUID optionalUserAccountId(Authentication auth) {
        if (auth == null)
            return null;
        Object p = auth.getPrincipal();
        if (!(p instanceof AuthPrincipal ap))
            return null;
        if (ap.kind() != AccountKind.USER)
            return null;
        return ap.accountId();
    }

    public static VotePrincipal requireVotePrincipal(Authentication auth) {
        if (auth == null || auth.getPrincipal() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "本人認証が必要です");
        }
        Object p = auth.getPrincipal();
        if (p instanceof VotePrincipal vp)
            return vp;
        throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "投票用認証情報が不正です");
    }

    public static UUID requireVoteElectionId(Authentication auth) {
        return requireVotePrincipal(auth).electionId();
    }

    // public static UUID getVoteElectionId(Authentication auth) {
    // if (auth == null)
    // return null;
    // Object p = auth.getPrincipal();
    // if (!(p instanceof VotePrincipal vp))
    // return null;
    // return vp.electionId(); // VotePrincipal 側が nullable 対応ならそのまま
    // }

    // public static UUID requireVoteCitizenId(Authentication auth) {
    // UUID cid = getVoteCitizenId(auth);
    // if (cid == null)
    // throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "本人認証が必要です");
    // return cid;
    // }

    // public static UUID getVoteCitizenId(Authentication auth) {
    // if (auth == null)
    // return null;
    // Object p = auth.getPrincipal();
    // if (!(p instanceof VotePrincipal vp))
    // return null;
    // return vp.citizenId();
    // }

    public static UUID requireVoteCitizenId(Authentication auth) {
        if (auth == null || auth.getPrincipal() == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "認証が必要です");
        }

        Object p = auth.getPrincipal();

        // 互換：従来のVOTEトークン
        if (p instanceof VotePrincipal vp) {
            return vp.citizenId();
        }

        // ★新方式：PUBLICセッション
        if (p instanceof PublicPrincipal pp) {
            return pp.citizenId();
        }

        throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "認証が必要です");
    }

    // 互換のため残す（PUBLICでは null を返す）
    public static UUID getVoteElectionId(Authentication auth) {
        if (auth == null || auth.getPrincipal() == null)
            return null;
        Object p = auth.getPrincipal();
        if (p instanceof VotePrincipal vp)
            return vp.electionId();
        return null;
    }

}
