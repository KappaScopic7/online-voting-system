import { useMemo } from "react";
import { Link } from "react-router-dom";
import type { MeDetailResponse } from "../../../user/model/userAuthTypes";
import { Card } from "../../../shared/ui/page";
import { Badge } from "./Badge";
import { AlertList } from "./AlertList";

export function QuickOverviewCard(props: {
    me: MeDetailResponse;
    returnTo: string;
    profileFilled: boolean;
    disableSelfEdit: boolean;

    // ★ 追加：プロフィール編集へ飛ばす時の from
    profileEditLinkFrom: string;
}) {
    const {
        me,
        returnTo,
        profileFilled,
        disableSelfEdit,
        profileEditLinkFrom,
    } = props;

    const identityStatus = me.identityStatus ?? "UNKNOWN";
    const isLinked = identityStatus === "LINKED";
    const isPending = identityStatus === "PENDING";
    const emailVerified = me.emailVerified === true;

    const alerts = useMemo(() => {
        const list: { title: string; body: string; cta?: React.ReactNode }[] =
            [];

        if (!emailVerified) {
            list.push({
                title: "メール認証が未完了です",
                body: "投票機能の制限がかかる可能性があります。先にメール認証を完了してください。",
                cta: me.email ? (
                    <Link
                        to="/verify"
                        state={{ email: me.email, from: returnTo }}
                    >
                        メール認証へ →
                    </Link>
                ) : (
                    <Link to="/verify" state={{ from: returnTo }}>
                        メール認証へ →
                    </Link>
                ),
            });
        }

        if (isPending) {
            list.push({
                title: "本人認証：審査中です",
                body: "審査が完了するまで投票できません。",
                cta: (
                    <Link to="/me/identity/pending" state={{ from: returnTo }}>
                        審査状況を見る →
                    </Link>
                ),
            });
        } else if (!isLinked) {
            list.push({
                title: "本人認証が未完了です",
                body: "投票するには本人認証が必要です。",
                cta: (
                    <Link to="/me/identity" state={{ from: returnTo }}>
                        本人認証へ進む →
                    </Link>
                ),
            });
        }

        // ★ ここを /me/profile へ統一
        if (!profileFilled && !disableSelfEdit) {
            list.push({
                title: "プロフィール情報が不足しています",
                body: "My選挙の対象判定に使います（本人認証後は市民情報で上書きされます）。",
                cta: (
                    <Link
                        to="/me/profile"
                        state={{ from: profileEditLinkFrom }}
                    >
                        プロフィールを入力する →
                    </Link>
                ),
            });
        }

        return list;
    }, [
        disableSelfEdit,
        emailVerified,
        isLinked,
        isPending,
        me.email,
        profileFilled,
        profileEditLinkFrom,
        returnTo,
    ]);

    return (
        <Card>
            <div style={{ display: "grid", gap: 12 }}>
                <div
                    style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "baseline",
                        flexWrap: "wrap",
                    }}
                >
                    <div style={{ fontSize: 16, fontWeight: 900 }}>
                        {me.email ?? "ユーザー"}
                    </div>
                    <span style={{ fontSize: 12, opacity: 0.7 }}>
                        accountId: {me.accountId}
                    </span>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Badge tone={emailVerified ? "good" : "warn"}>
                        {emailVerified ? "メール認証済み" : "メール未認証"}
                    </Badge>

                    <Badge tone={isLinked ? "good" : "warn"}>
                        {isLinked
                            ? "本人認証済み"
                            : isPending
                              ? "本人認証：審査中"
                              : "本人認証：未完了"}
                    </Badge>

                    <Badge tone={me.enabled ? "good" : "bad"}>
                        {me.enabled ? "有効アカウント" : "無効アカウント"}
                    </Badge>

                    <Badge tone={me.locked ? "bad" : "good"}>
                        {me.locked ? "ロック中" : "ロックなし"}
                    </Badge>
                </div>

                <AlertList items={alerts} />

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <Link to="/me/elections" state={{ from: returnTo }}>
                        <b>My選挙へ →</b>
                    </Link>
                    <Link to="/me/votes" state={{ from: returnTo }}>
                        投票履歴 →
                    </Link>
                    <Link to="/elections" state={{ from: returnTo }}>
                        選挙一覧 →
                    </Link>
                </div>
            </div>
        </Card>
    );
}
