import { Link } from "react-router-dom";
import { Card } from "../../../shared/ui/page";
import type { MeDetailResponse } from "../../../user/model/userAuthTypes";

export function LoginRequiredCard(props: {
    from: string;
    me: MeDetailResponse | null;
    meError: string | null;
    isDev: boolean;
}) {
    const { from, me, meError, isDev } = props;
    if (me !== null || !meError) return null;

    return (
        <Card role="alert">
            <div style={{ display: "grid", gap: 8 }}>
                <div style={{ fontWeight: 900 }}>ログインが必要です</div>
                <div style={{ fontSize: 13, opacity: 0.85 }}>
                    投票履歴を見るにはログインしてください。
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <Link to="/login" state={{ from }}>
                        <b>ログインへ →</b>
                    </Link>
                    {isDev && (
                        <span style={{ fontSize: 12, opacity: 0.7 }}>
                            (dev) meError: {meError}
                        </span>
                    )}
                </div>
            </div>
        </Card>
    );
}

export function EmailGuideCard(props: {
    show: boolean;
    email?: string | null;
    from: string;
}) {
    const { show, email, from } = props;
    if (!show) return null;

    return (
        <Card>
            <div style={{ display: "grid", gap: 8 }}>
                <div style={{ fontWeight: 900 }}>メール認証が未完了です</div>
                <div style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.6 }}>
                    投票機能の制限がかかる可能性があります。先にメール認証を完了してください。
                </div>
                <div>
                    <Link to="/verify" state={{ email, from }}>
                        <b>メール認証へ →</b>
                    </Link>
                </div>
            </div>
        </Card>
    );
}

export function IdentityGuideCard(props: {
    show: boolean;
    isPending: boolean;
    from: string;
}) {
    const { show, isPending, from } = props;
    if (!show) return null;

    return (
        <Card>
            <div style={{ display: "grid", gap: 8 }}>
                <div style={{ fontWeight: 900 }}>本人認証が未完了です</div>
                <div style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.6 }}>
                    {isPending
                        ? "現在は審査中のため投票できません。審査状況を確認してください。"
                        : "投票するには本人認証が必要です。本人認証へ進んでください。"}
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {isPending ? (
                        <Link to="/me/identity/pending" state={{ from }}>
                            <b>審査状況を見る →</b>
                        </Link>
                    ) : (
                        <Link to="/me/identity" state={{ from }}>
                            <b>本人認証へ進む →</b>
                        </Link>
                    )}
                    <Link to="/me" state={{ from }}>
                        My Page →
                    </Link>
                </div>
            </div>
        </Card>
    );
}
