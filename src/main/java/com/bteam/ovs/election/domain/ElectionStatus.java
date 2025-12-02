package com.bteam.ovs.election.domain;

public enum ElectionStatus {
    DRAFT,      // 下書き
    PUBLISHED,  // 公開されたがまだ投票期間外
    OPEN,       // 投票受付中
    CLOSED      // 投票終了
}
