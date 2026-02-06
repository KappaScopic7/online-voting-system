// frontend/src/voting/pages/VoteHistoryPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { fetchVoteHistory, type VoteHistoryItem } from "../api/votes";
import { Card, DevDebug, Page } from "../../shared/ui/page";
import { normalizeFrom } from "../../shared/normalizeFrom";
import { CandidateAvatar } from "../../shared/ui/CandidateAvatar";
import { fetchMeDetail } from "../../user/api/userAuthApi";
import type { MeDetailResponse } from "../../user/model/userAuthTypes";

function formatJST(iso?: string | null): string {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${y}/${m}/${day} ${hh}:${mm}`;
}

function EmptyAvatar({ size }: { size: number }) {
    return (
        <div
            aria-hidden
            style={{
                width: size,
                height: size,
                borderRadius: 999,
                border: "1px solid #eee",
                background: "#fafafa",
            }}
        />
    );
}

type Group = {
    electionId: string;
    electionTitle: string;
    items: VoteHistoryItem[];
};

type LocationState = { from?: string } | null;

function VoteRow({ v, from }: { v: VoteHistoryItem; from: string }) {
    const [hover, setHover] = useState(false);
    const isDev = import.meta.env?.DEV;

    const isCandidate = v.type === "CANDIDATE" && !!v.candidateId;

    const label =
        v.candidateName ||
        (isCandidate ? "(unknown candidate)" : "誰も支持しない");

    const labelNode = isCandidate ? (
        <Link
            to={`/elections/${v.electionId}/candidates/${v.candidateId}`}
            state={{ from }}
            style={{ color: "inherit", textDecoration: "none" }}
            title="候補者詳細へ"
        >
            {label}
        </Link>
    ) : (
        <span>{label}</span>
    );

    return (
        <div
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                border: "1px solid #eee",
                borderRadius: 12,
                padding: 12,
                display: "grid",
                gap: 8,
                background: hover ? "#fafafa" : "#fff",
                transition: "background 120ms ease",
            }}
        >
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                    alignItems: "baseline",
                }}
            >
                <span style={{ fontSize: 12, opacity: 0.8 }}>
                    {formatJST(v.castedAt)}
                </span>

                <span style={{ fontSize: 12, opacity: 0.75 }}>
                    {v.electionStatus}
                </span>
            </div>

            <div
                style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    flexWrap: "wrap",
                }}
            >
                {isCandidate ? (
                    // NOTE: VoteHistoryItem に candidateKey / sortOrder が無い前提なので、
                    // とりあえず固定 index。将来、voteHistory API に candidateKey を追加したらここを改善できる。
                    <CandidateAvatar
                        name={label}
                        imageUrl={null}
                        index={0}
                        size={30}
                        mode="AUTO"
                    />
                ) : (
                    <EmptyAvatar size={30} />
                )}

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span>
                        投票先: <strong>{labelNode}</strong>
                        {!isCandidate && (
                            <span
                                style={{
                                    marginLeft: 8,
                                    fontSize: 12,
                                    opacity: 0.7,
                                }}
                            >
                                （候補者を選ばない）
                            </span>
                        )}
                    </span>
                </div>

                {isDev && (
                    <span
                        style={{
                            marginLeft: "auto",
                            fontSize: 12,
                            opacity: 0.7,
                        }}
                    >
                        voteId: {v.voteId}
                        {" / "}
                        type: {v.type}
                        {" / "}
                        candidateId: {v.candidateId ?? "null"}
                    </span>
                )}
            </div>
        </div>
    );
}

export function VoteHistoryPage() {
    const [items, setItems] = useState<VoteHistoryItem[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // ★ 本人認証状態のために me を取得
    const [me, setMe] = useState<MeDetailResponse | null>(null);
    const [meError, setMeError] = useState<string | null>(null);

    const loc = useLocation();
    const state = (loc.state as LocationState) ?? null;

    const backTo = normalizeFrom(state?.from ?? "/me");
    const from = loc.pathname + loc.search;

    const [q, setQ] = useState("");

    const loadMe = async () => {
        setMeError(null);
        try {
            const m = await fetchMeDetail();
            setMe(m);
        } catch (err: any) {
            // me が取れない = 未ログイン等の可能性
            setMe(null);
            setMeError(
                err?.response?.data?.message ??
                    err?.message ??
                    "Failed to load user",
            );
        }
    };

    const loadVotes = async () => {
        setError(null);
        setIsLoading(true);
        try {
            const data = await fetchVoteHistory();
            setItems(data);
        } catch (err: any) {
            const status = err?.response?.status;
            const message =
                err?.response?.data?.message ?? "Failed to load vote history";

            // ★ 認可系は「未本人認証/未ログイン」等の導線に寄せる
            if (status === 401 || status === 403) {
                setError(null); // エラー表示より導線カードを優先
                setItems([]); // 空扱い
            } else {
                setError(message);
                setItems([]); // 空扱い
            }
        } finally {
            setIsLoading(false);
        }
    };

    const load = async () => {
        // ★ まず me を更新してから履歴を取る（導線の精度UP）
        await loadMe();
        await loadVotes();
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const identityStatus = me?.identityStatus ?? "UNKNOWN";
    const isLinked = identityStatus === "LINKED";
    const isPending = identityStatus === "PENDING";
    const emailVerified = me?.emailVerified === true;

    const showIdentityGuide = me !== null && !isLinked; // ログインはしてるが本人認証が未完了
    const showEmailGuide = me !== null && !emailVerified;

    const groups: Group[] = useMemo(() => {
        if (!items) return [];
        const map = new Map<string, Group>();

        for (const v of items) {
            const key = v.electionId;
            if (!map.has(key)) {
                map.set(key, {
                    electionId: v.electionId,
                    electionTitle: v.electionTitle,
                    items: [],
                });
            }
            map.get(key)!.items.push(v);
        }

        // 各グループ内：新しい順
        for (const g of map.values()) {
            g.items.sort((a, b) =>
                (b.castedAt ?? "").localeCompare(a.castedAt ?? ""),
            );
        }

        // グループ：最新投票が新しい順
        return Array.from(map.values()).sort((a, b) => {
            const at = a.items[0]?.castedAt ?? "";
            const bt = b.items[0]?.castedAt ?? "";
            return bt.localeCompare(at);
        });
    }, [items]);

    const filteredGroups = useMemo(() => {
        const keyword = q.trim().toLowerCase();
        if (!keyword) return groups;

        return groups
            .map((g) => {
                const hitElection = (g.electionTitle ?? "")
                    .toLowerCase()
                    .includes(keyword);

                const hitItems = g.items.filter((v) => {
                    const label =
                        v.candidateName ??
                        (v.type === "NONE_SUPPORT"
                            ? "誰も支持しない"
                            : "(unknown candidate)");
                    return label.toLowerCase().includes(keyword);
                });

                if (hitElection) return g;
                if (hitItems.length === 0) return null;
                return { ...g, items: hitItems };
            })
            .filter((x): x is Group => x !== null);
    }, [groups, q]);

    const totalVotes = items?.length ?? 0;
    const totalGroups = groups.length;

    const isDev = import.meta.env?.DEV;

    return (
        <Page
            title={<h1 style={{ margin: 0, fontSize: 20 }}>投票履歴</h1>}
            actions={
                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        flexWrap: "wrap",
                    }}
                >
                    <Link to={backTo}>← 戻る</Link>

                    <button
                        onClick={load}
                        disabled={isLoading}
                        style={{ marginLeft: 8 }}
                    >
                        {isLoading ? "Reloading..." : "再読み込み"}
                    </button>
                </div>
            }
            maxWidth={920}
        >
            {/* ★ 未ログインっぽい導線 */}
            {me === null && meError && (
                <Card role="alert">
                    <div style={{ display: "grid", gap: 8 }}>
                        <div style={{ fontWeight: 900 }}>
                            ログインが必要です
                        </div>
                        <div style={{ fontSize: 13, opacity: 0.85 }}>
                            投票履歴を見るにはログインしてください。
                        </div>
                        <div
                            style={{
                                display: "flex",
                                gap: 12,
                                flexWrap: "wrap",
                            }}
                        >
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
            )}

            {/* ★ メール未認証の導線 */}
            {showEmailGuide && (
                <Card>
                    <div style={{ display: "grid", gap: 8 }}>
                        <div style={{ fontWeight: 900 }}>
                            メール認証が未完了です
                        </div>
                        <div
                            style={{
                                fontSize: 13,
                                opacity: 0.85,
                                lineHeight: 1.6,
                            }}
                        >
                            投票機能の制限がかかる可能性があります。先にメール認証を完了してください。
                        </div>
                        <div>
                            <Link
                                to="/verify"
                                state={{ email: me?.email, from }}
                            >
                                <b>メール認証へ →</b>
                            </Link>
                        </div>
                    </div>
                </Card>
            )}

            {/* ★ 本人認証の導線（未認証/審査中） */}
            {showIdentityGuide && (
                <Card>
                    <div style={{ display: "grid", gap: 8 }}>
                        <div style={{ fontWeight: 900 }}>
                            本人認証が未完了です
                        </div>
                        <div
                            style={{
                                fontSize: 13,
                                opacity: 0.85,
                                lineHeight: 1.6,
                            }}
                        >
                            {isPending
                                ? "現在は審査中のため投票できません。審査状況を確認してください。"
                                : "投票するには本人認証が必要です。本人認証へ進んでください。"}
                        </div>
                        <div
                            style={{
                                display: "flex",
                                gap: 12,
                                flexWrap: "wrap",
                            }}
                        >
                            {isPending ? (
                                <Link
                                    to="/me/identity/pending"
                                    state={{ from }}
                                >
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
            )}

            <Card>
                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        flexWrap: "wrap",
                    }}
                >
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="検索（選挙名 / 投票先）"
                        style={{ flex: 1, minWidth: 240, padding: 8 }}
                    />
                    <span style={{ fontSize: 12, opacity: 0.75 }}>
                        合計 {totalVotes} 件（{totalGroups} 選挙）
                    </span>
                </div>
            </Card>

            {error && (
                <Card role="alert">
                    <div
                        style={{
                            display: "flex",
                            gap: 12,
                            alignItems: "center",
                            flexWrap: "wrap",
                        }}
                    >
                        <div>
                            <div style={{ fontWeight: 800 }}>エラー</div>
                            <div style={{ opacity: 0.9 }}>{error}</div>
                        </div>
                        <button onClick={load} style={{ marginLeft: "auto" }}>
                            再試行
                        </button>
                    </div>
                </Card>
            )}

            {items === null ? (
                <Card>読み込み中…</Card>
            ) : items.length === 0 ? (
                <Card>
                    <p style={{ margin: 0 }}>投票履歴はありません</p>
                    {/* 未本人認証の時に「空」に見えないよう補助 */}
                    {me !== null && !isLinked && (
                        <p
                            style={{
                                margin: "8px 0 0",
                                fontSize: 12,
                                opacity: 0.75,
                            }}
                        >
                            ※
                            本人認証が未完了の場合、履歴が取得できないことがあります。
                        </p>
                    )}
                </Card>
            ) : filteredGroups.length === 0 ? (
                <Card>
                    <p style={{ margin: 0 }}>該当する履歴が見つかりません</p>
                </Card>
            ) : (
                <div style={{ display: "grid", gap: 12 }}>
                    {filteredGroups.map((g) => {
                        const latest = g.items[0];

                        return (
                            <Card key={g.electionId}>
                                <div style={{ display: "grid", gap: 10 }}>
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            gap: 12,
                                            flexWrap: "wrap",
                                            alignItems: "baseline",
                                        }}
                                    >
                                        <strong style={{ fontSize: 16 }}>
                                            <Link
                                                to={`/elections/${g.electionId}`}
                                                state={{ from }}
                                            >
                                                {g.electionTitle}
                                            </Link>
                                        </strong>

                                        <span
                                            style={{
                                                fontSize: 12,
                                                opacity: 0.75,
                                            }}
                                        >
                                            回数: {g.items.length}
                                        </span>
                                    </div>

                                    <div
                                        style={{ fontSize: 12, opacity: 0.75 }}
                                    >
                                        最新:{" "}
                                        {formatJST(latest?.castedAt ?? null)}
                                    </div>

                                    <div style={{ display: "grid", gap: 10 }}>
                                        {g.items.map((v) => (
                                            <VoteRow
                                                key={v.voteId}
                                                v={v}
                                                from={from}
                                            />
                                        ))}
                                    </div>

                                    <div
                                        style={{
                                            display: "flex",
                                            gap: 12,
                                            flexWrap: "wrap",
                                            alignItems: "center",
                                        }}
                                    >
                                        <Link
                                            to={`/elections/${g.electionId}/candidates`}
                                            state={{ from }}
                                        >
                                            候補者（公開）
                                        </Link>

                                        <Link
                                            to={`/elections/${g.electionId}/result`}
                                            state={{ from }}
                                        >
                                            結果
                                        </Link>

                                        <span style={{ marginLeft: "auto" }}>
                                            {latest?.electionStatus ===
                                            "ONGOING" ? (
                                                <Link
                                                    to={`/voting/entry?electionId=${g.electionId}`}
                                                    state={{ from }}
                                                >
                                                    <b>投票を変更する →</b>
                                                </Link>
                                            ) : (
                                                <span
                                                    style={{
                                                        fontSize: 12,
                                                        opacity: 0.6,
                                                    }}
                                                >
                                                    投票期間終了
                                                </span>
                                            )}
                                        </span>
                                    </div>

                                    <div
                                        style={{ fontSize: 12, opacity: 0.65 }}
                                    >
                                        ※
                                        結果が未公開の場合、結果ページで「未公開」表示になります。
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            <DevDebug
                value={{
                    me,
                    meError,
                    itemsLen: items?.length ?? null,
                    error,
                    groupsLen: groups.length,
                    filteredGroupsLen: filteredGroups.length,
                    backTo,
                    from,
                    q,
                    isLoading,
                }}
            />
        </Page>
    );
}
