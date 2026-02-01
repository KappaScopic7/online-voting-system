// frontend/src/me/pages/MyElectionsPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { fetchMyElections, type MyElectionItem } from "../api/meElections";
import { Card, DevDebug, Page } from "../../shared/ui/page";
// import { normalizeFrom } from "../../shared/normalizeFrom";
import { statusLabel } from "../../shared/elections/format";

import {
    fetchMeEligibility,
    type MeEligibilityResponse,
} from "../../me/api/eligibility";

function fmt(iso: string) {
    try {
        return new Date(iso).toLocaleString();
    } catch {
        return iso;
    }
}

export function MyElectionsPage() {
    const loc = useLocation();
    const self = loc.pathname + loc.search;

    const [items, setItems] = useState<MyElectionItem[] | null>(null);
    const [elig, setElig] = useState<MeEligibilityResponse | null>(null);

    const [err, setErr] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function reload() {
        setLoading(true);
        setErr(null);

        try {
            const [elections, eligibility] = await Promise.all([
                fetchMyElections(),
                fetchMeEligibility(),
            ]);

            setItems(elections);
            setElig(eligibility);
        } catch (e: any) {
            setItems(null);
            setElig(null);
            setErr(e?.message ?? String(e));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        reload();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const showHint = elig?.source === "NONE" || !elig?.cityCode;

    const eligBadge = useMemo(() => {
        if (!elig) return null;
        return (
            <span
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    border: "1px solid #eee",
                    borderRadius: 999,
                    padding: "4px 10px",
                    fontSize: 12,
                    background: "#fafafa",
                    opacity: 0.95,
                    whiteSpace: "nowrap",
                }}
                title="投票可能な選挙を判定するための情報"
            >
                判定: <b>{elig.source}</b>
                {elig.cityCode ? (
                    <>
                        / cityCode: <b>{elig.cityCode}</b>
                    </>
                ) : null}
            </span>
        );
    }, [elig]);

    return (
        <Page
            title={<h1 style={{ margin: 0, fontSize: 20 }}>My選挙</h1>}
            actions={
                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        flexWrap: "wrap",
                    }}
                >
                    <button onClick={reload} disabled={loading}>
                        {loading ? "読み込み中..." : "再読み込み"}
                    </button>
                    {eligBadge}
                    <span style={{ marginLeft: "auto" }}>
                        <Link to="/me">マイページ →</Link>
                    </span>
                </div>
            }
            maxWidth={900}
        >
            {showHint && (
                <Card>
                    <div
                        style={{ fontSize: 12, opacity: 0.85, lineHeight: 1.6 }}
                    >
                        {elig?.source === "NONE"
                            ? "判定に使える情報がありません（本人認証 or プロフィール入力が必要）"
                            : "cityCode が未設定です（本人認証 or プロフィール入力で設定してください）"}
                    </div>

                    <div
                        style={{
                            marginTop: 10,
                            display: "flex",
                            gap: 12,
                            flexWrap: "wrap",
                        }}
                    >
                        <Link to="/me/identity" state={{ from: self }}>
                            本人確認へ →
                        </Link>
                        <Link to="/me/profile" state={{ from: self }}>
                            プロフィールへ →
                        </Link>
                    </div>
                </Card>
            )}

            {err && (
                <Card role="alert">
                    <div style={{ fontWeight: 800, marginBottom: 6 }}>
                        エラー
                    </div>
                    <div style={{ whiteSpace: "pre-wrap", color: "crimson" }}>
                        {err}
                    </div>
                    <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
                        401なら未ログイン or
                        token不正。403なら権限不足/アカウント状態。
                    </div>
                </Card>
            )}

            {items && items.length === 0 && !err && (
                <Card>
                    該当する選挙がありません。
                    <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
                        rule の cityCode/minAge と、判定ソースの cityCode
                        が一致しているか確認してね。
                    </div>
                </Card>
            )}

            {items && items.length > 0 && (
                <div style={{ display: "grid", gap: 12 }}>
                    {items.map((e) => (
                        <MyElectionCard key={e.electionId} e={e} from={self} />
                    ))}
                </div>
            )}

            {!items && !err && <Card>読み込み中…</Card>}

            <DevDebug value={{ items, elig, err, loading, self }} />
        </Page>
    );
}

function MyElectionCard({ e, from }: { e: MyElectionItem; from: string }) {
    const [hover, setHover] = useState(false);

    const canVoteNow = e.status === "ONGOING" && e.canCast && !e.currentVote;

    const statusPill = (
        <span
            style={{
                fontSize: 12,
                padding: "2px 10px",
                border: "1px solid #eee",
                borderRadius: 999,
                background: "#fafafa",
                whiteSpace: "nowrap",
            }}
        >
            {statusLabel(e.status as any)}
        </span>
    );

    const voteArea = (() => {
        if (e.status === "ONGOING") {
            if (e.currentVote) {
                return (
                    <span style={{ fontSize: 13 }}>
                        投票済み：
                        <b>{e.currentVote.candidateName ?? "投票済み"}</b>
                    </span>
                );
            }
            if (e.canCast) {
                return (
                    <Link
                        to={`/voting/start?electionId=${e.electionId}`}
                        state={{ from }}
                        style={{ textDecoration: "none" }}
                    >
                        <b>投票する →</b>
                    </Link>
                );
            }
            return <span style={{ opacity: 0.6 }}>投票不可</span>;
        }

        if (e.status === "ENDED") {
            return e.hasResult ? (
                <Link to={`/elections/${e.electionId}/result`} state={{ from }}>
                    結果を見る →
                </Link>
            ) : (
                <span style={{ opacity: 0.6 }}>結果未公開</span>
            );
        }

        return <span style={{ opacity: 0.6 }}>開始前</span>;
    })();

    return (
        <Card>
            <div
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
                style={{
                    border: "1px solid #eee",
                    borderRadius: 12,
                    padding: 12,
                    display: "grid",
                    gap: 10,
                    background: hover ? "#fafafa" : "#fff",
                    transition: "background 120ms ease",
                }}
            >
                {/* header */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        flexWrap: "wrap",
                        alignItems: "center",
                    }}
                >
                    <strong style={{ fontSize: 16 }}>
                        <Link
                            to={`/elections/${e.electionId}`}
                            state={{ from }}
                            style={{ textDecoration: "none", color: "inherit" }}
                        >
                            {e.title}
                        </Link>
                    </strong>

                    {statusPill}
                </div>

                {/* dates */}
                <div style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.6 }}>
                    <div>開始: {fmt(e.startsAt)}</div>
                    <div>終了: {fmt(e.endsAt)}</div>
                </div>

                {/* links */}
                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        flexWrap: "wrap",
                        alignItems: "center",
                    }}
                >
                    <Link to={`/elections/${e.electionId}`} state={{ from }}>
                        詳細
                    </Link>

                    <Link
                        to={`/elections/${e.electionId}/candidates`}
                        state={{ from }}
                    >
                        候補者
                    </Link>

                    {e.hasResult ? (
                        <Link
                            to={`/elections/${e.electionId}/result`}
                            state={{ from }}
                        >
                            結果
                        </Link>
                    ) : (
                        <span style={{ opacity: 0.5 }}>結果（未公開）</span>
                    )}

                    <Link to="/me/votes" state={{ from }}>
                        投票履歴
                    </Link>

                    <span style={{ marginLeft: "auto" }}>{voteArea}</span>
                </div>

                {canVoteNow && (
                    <div style={{ fontSize: 12, opacity: 0.75 }}>
                        ※ 投票は1回のみ有効（想定）。内容確認画面があります。
                    </div>
                )}
            </div>
        </Card>
    );
}
