package com.bteam.ovs.voter.domain;

public enum VoterStatus {
    PENDING,   // 初期状態（AdminがVoterAccountだけ作った状態）
    ACTIVE,    // 本人認証＋メール・パスワード登録済み
    LOCKED,    // ロック
    DELETED    // 退会
}
