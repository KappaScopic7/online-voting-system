package com.bteam.ovs.vote.domain;

public enum VoteStatus {
    ACTIVE,     // 有効票（最新の投票）
    CANCELED    // 取消済み or 上書きされた過去票
}
