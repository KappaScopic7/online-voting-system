import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { fetchVoteHistory, type VoteHistoryItem } from "../api/votes";
import { allocHistory } from "../api/allocVoting";
import type { AllocVoteHistoryItem } from "../model/allocVotingTypes";
import { Card, DevDebug, Page } from "../../shared/ui/page";
import { normalizeFrom } from "../../shared/normalizeFrom";
import { CandidateAvatar } from "../../shared/ui/CandidateAvatar";
import { fetchMeDetail } from "../../user/api/userAuthApi";
import type { MeDetailResponse } from "../../user/model/userAuthTypes";
import { FilterBar } from "../../shared/ui/FilterBar";

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

type LocationState = { from?: string } | null;

type VoteMethod = "NORMAL" | "ALLOC" | "MIXED" | "NONE";

type UnifiedGroup = {
    electionId: string;
    electionTitle: string;
    normal: VoteHistoryItem[];
    alloc: AllocVoteHistoryItem[];
    method: VoteMethod;
    latestAt: string;
    latestStatus: string;
};

function VoteRow({ v, from }: { v: VoteHistoryItem; from: string }) {
    const [hover, setHover] = useState(false);
    const isDev = import.meta.env?.DEV;

    const isCandidate = v.type === "CANDIDATE" && !!v.targetId;
    const isNoneSupport = v.type === "NONE_SUPPORT";
    const isJudgeReview = v.type === "JUDGE_REVIEW" && !!v.targetId;

    const label =
        v.label ??
        (isCandidate
            ? "（不明な候補者）"
            : isJudgeReview
              ? "（不明な裁判官）"
              : "誰も支持しない");

    const labelNode = isCandidate ? (
        <Link
            to={`/elections/${v.electionId}/candidates/${v.targetId}`}
            state={{ from }}
            style={{ color: "inherit", textDecoration: "none" }}
            title="候補者詳細へ"
        >
            {label}
        </Link>
    ) : (
        <span>{label}</span>
    );

    const judgeMark =
        v.approve === true
            ? "○（信任）"
            : v.approve === false
              ? "×（不信任）"
              : "-";

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

                <div
                    style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                        alignItems: "baseline",
                    }}
                >
                    <span>
                        投票先: <strong>{labelNode}</strong>
                        {isNoneSupport && (
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
                        {isJudgeReview && (
                            <span
                                style={{
                                    marginLeft: 10,
                                    fontSize: 12,
                                    fontWeight: 800,
                                    opacity: 0.9,
                                }}
                            >
                                {judgeMark}
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
                        targetId: {v.targetId ?? "null"}
                        {" / "}
                        approve:{" "}
                        {v.approve === null ? "null" : String(v.approve)}
                    </span>
                )}
            </div>
        </div>
    );
}

function AllocRow({
    v,
    from,
    indexOffset = 0,
}: {
    v: AllocVoteHistoryItem;
    from: string;
    indexOffset?: number;
}) {
    const [hover, setHover] = useState(false);
    const isDev = import.meta.env?.DEV;

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
                    border: "1px solid #eee",
                    borderRadius: 12,
                    padding: 10,
                    background: "#fafafa",
                    display: "grid",
                    gap: 6,
                }}
            >
                {v.items.map((it, idx) => {
                    const isCandidate =
                        it.type === "CANDIDATE" && !!it.targetId;

                    const labelNode = isCandidate ? (
                        <Link
                            to={`/elections/${v.electionId}/candidates/${it.targetId}`}
                            state={{ from }}
                            style={{ color: "inherit", textDecoration: "none" }}
                            title="候補者詳細へ"
                        >
                            {it.label}
                        </Link>
                    ) : (
                        <span>{it.label}</span>
                    );

                    return (
                        <div
                            key={idx}
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 12,
                                padding: "6px 0",
                                borderBottom:
                                    idx === v.items.length - 1
                                        ? "none"
                                        : "1px solid #f1f1f1",
                                alignItems: "center",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    gap: 10,
                                    alignItems: "center",
                                    overflow: "hidden",
                                    minWidth: 0,
                                }}
                            >
                                <CandidateAvatar
                                    name={it.label}
                                    imageUrl={null}
                                    index={indexOffset + idx}
                                    size={28}
                                />

                                <div
                                    style={{
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {labelNode}
                                </div>
                            </div>

                            <div style={{ whiteSpace: "nowrap" }}>
                                <b>{it.points}</b>pt
                            </div>
                        </div>
                    );
                })}
            </div>

            {isDev && (
                <div style={{ fontSize: 12, opacity: 0.65 }}>
                    castId: {v.castId}
                </div>
            )}
        </div>
    );
}

type ViewMode = "ALL" | "NORMAL" | "ALLOC";

export function VoteHistoryPage() {
    // ---- data ----
    const [normalItems, setNormalItems] = useState<VoteHistoryItem[] | null>(
        null,
    );
    const [allocItems, setAllocItems] = useState<AllocVoteHistoryItem[] | null>(
        null,
    );

    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // 本人認証/メール認証ガイド用
    const [me, setMe] = useState<MeDetailResponse | null>(null);
    const [meError, setMeError] = useState<string | null>(null);

    const loc = useLocation();
    const state = (loc.state as LocationState) ?? null;

    const backTo = normalizeFrom(state?.from ?? "/me");
    const from = loc.pathname + loc.search;

    const [q, setQ] = useState("");
    const [mode, setMode] = useState<ViewMode>("ALL");

    const isDev = import.meta.env?.DEV;

    const loadMe = async () => {
        setMeError(null);
        try {
            const m = await fetchMeDetail();
            setMe(m);
        } catch (err: any) {
            setMe(null);
            setMeError(
                err?.response?.data?.message ??
                    err?.message ??
                    "ユーザー情報の取得に失敗しました",
            );
        }
    };

    const loadHistories = async () => {
        setError(null);
        setIsLoading(true);

        try {
            const [n, a] = await Promise.allSettled([
                fetchVoteHistory(),
                allocHistory(),
            ]);

            // 通常投票
            if (n.status === "fulfilled") {
                setNormalItems(n.value);
            } else {
                const status = (n.reason as any)?.response?.status;
                const message =
                    (n.reason as any)?.response?.data?.message ??
                    "投票履歴（通常）の取得に失敗しました";
                if (status === 401 || status === 403) {
                    setNormalItems([]);
                } else {
                    setNormalItems([]);
                    setError(message);
                }
            }

            // 配分投票
            if (a.status === "fulfilled") {
                setAllocItems(a.value);
            } else {
                const status = (a.reason as any)?.response?.status;
                const message =
                    (a.reason as any)?.response?.data?.message ??
                    "投票履歴（配分）の取得に失敗しました";
                if (status === 401 || status === 403) {
                    setAllocItems([]);
                } else {
                    setAllocItems([]);
                    setError((prev) => prev ?? message);
                }
            }
        } finally {
            setIsLoading(false);
        }
    };

    const load = async () => {
        await loadMe();
        await loadHistories();
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const identityStatus = me?.identityStatus ?? "UNKNOWN";
    const isLinked = identityStatus === "LINKED";
    const isPending = identityStatus === "PENDING";
    const emailVerified = me?.emailVerified === true;

    const showIdentityGuide = me !== null && !isLinked;
    const showEmailGuide = me !== null && !emailVerified;

    // ---- unify by election ----
    const groups: UnifiedGroup[] = useMemo(() => {
        if (!normalItems || !allocItems) return [];

        const map = new Map<string, UnifiedGroup>();

        const ensure = (electionId: string, electionTitle: string) => {
            if (!map.has(electionId)) {
                map.set(electionId, {
                    electionId,
                    electionTitle,
                    normal: [],
                    alloc: [],
                    method: "NONE",
                    latestAt: "",
                    latestStatus: "",
                });
            } else {
                const g = map.get(electionId)!;
                if (!g.electionTitle && electionTitle)
                    g.electionTitle = electionTitle;
            }
            return map.get(electionId)!;
        };

        for (const v of normalItems) {
            ensure(v.electionId, v.electionTitle).normal.push(v);
        }
        for (const v of allocItems) {
            ensure(v.electionId, v.electionTitle).alloc.push(v);
        }

        for (const g of map.values()) {
            g.normal.sort((a, b) =>
                (b.castedAt ?? "").localeCompare(a.castedAt ?? ""),
            );
            g.alloc.sort((a, b) =>
                (b.castedAt ?? "").localeCompare(a.castedAt ?? ""),
            );

            // --- method detect ---
            const hasN = g.normal.length > 0;
            const hasA = g.alloc.length > 0;
            g.method =
                hasN && hasA
                    ? "MIXED"
                    : hasA
                      ? "ALLOC"
                      : hasN
                        ? "NORMAL"
                        : "NONE";

            // --- latest ---
            const latestNormal = g.normal[0]?.castedAt ?? "";
            const latestAlloc = g.alloc[0]?.castedAt ?? "";

            const latestAt =
                latestNormal.localeCompare(latestAlloc) >= 0
                    ? latestNormal
                    : latestAlloc;

            const latestStatus =
                (latestAt === latestNormal
                    ? g.normal[0]?.electionStatus
                    : g.alloc[0]?.electionStatus) ??
                g.normal[0]?.electionStatus ??
                g.alloc[0]?.electionStatus ??
                "";

            g.latestAt = latestAt;
            g.latestStatus = latestStatus;
        }

        return Array.from(map.values()).sort((a, b) =>
            (b.latestAt ?? "").localeCompare(a.latestAt ?? ""),
        );
    }, [normalItems, allocItems]);

    // ---- filter ----
    const filteredGroups = useMemo(() => {
        const keyword = q.trim().toLowerCase();
        const wantNormal = mode === "ALL" || mode === "NORMAL";
        const wantAlloc = mode === "ALL" || mode === "ALLOC";

        return groups
            .map((g) => {
                const hitElection = (g.electionTitle ?? "")
                    .toLowerCase()
                    .includes(keyword);

                const normalFiltered = !wantNormal
                    ? []
                    : !keyword
                      ? g.normal
                      : g.normal.filter((v) => {
                            const label =
                                v.label ??
                                (v.type === "NONE_SUPPORT"
                                    ? "誰も支持しない"
                                    : v.type === "JUDGE_REVIEW"
                                      ? "（不明な裁判官）"
                                      : "（不明な候補者）");
                            return label.toLowerCase().includes(keyword);
                        });

                const allocFiltered = !wantAlloc
                    ? []
                    : !keyword
                      ? g.alloc
                      : g.alloc.filter((v) =>
                            v.items.some((it) =>
                                (it.label ?? "")
                                    .toLowerCase()
                                    .includes(keyword),
                            ),
                        );

                if (!keyword) {
                    const hasAny =
                        normalFiltered.length > 0 || allocFiltered.length > 0;
                    return hasAny
                        ? { ...g, normal: normalFiltered, alloc: allocFiltered }
                        : null;
                }

                if (hitElection) {
                    const keepNormal = wantNormal ? g.normal : [];
                    const keepAlloc = wantAlloc ? g.alloc : [];
                    const hasAny =
                        keepNormal.length > 0 || keepAlloc.length > 0;
                    return hasAny
                        ? { ...g, normal: keepNormal, alloc: keepAlloc }
                        : null;
                }

                if (normalFiltered.length === 0 && allocFiltered.length === 0)
                    return null;
                return { ...g, normal: normalFiltered, alloc: allocFiltered };
            })
            .filter((x): x is UnifiedGroup => x !== null);
    }, [groups, q, mode]);

    const totalNormal = normalItems?.length ?? 0;
    const totalAlloc = allocItems?.length ?? 0;
    const totalVotes = totalNormal + totalAlloc;
    const totalGroups = groups.length;

    const ready = normalItems !== null && allocItems !== null;

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
                        {isLoading ? "読み込み中..." : "再読み込み"}
                    </button>
                </div>
            }
            maxWidth={920}
        >
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

            {/* モード切替（同一ページのまま） */}
            <Card>
                <div
                    style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                        alignItems: "center",
                    }}
                >
                    <span style={{ fontSize: 12, opacity: 0.75 }}>表示:</span>
                    <button
                        type="button"
                        onClick={() => setMode("ALL")}
                        disabled={isLoading}
                        style={{ fontWeight: mode === "ALL" ? 800 : 400 }}
                    >
                        すべて
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode("NORMAL")}
                        disabled={isLoading}
                        style={{ fontWeight: mode === "NORMAL" ? 800 : 400 }}
                    >
                        通常
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode("ALLOC")}
                        disabled={isLoading}
                        style={{ fontWeight: mode === "ALLOC" ? 800 : 400 }}
                    >
                        配分
                    </button>

                    <span
                        style={{
                            marginLeft: "auto",
                            fontSize: 12,
                            opacity: 0.75,
                        }}
                    >
                        通常 <b>{totalNormal}</b> / 配分 <b>{totalAlloc}</b>
                    </span>
                </div>
            </Card>

            <FilterBar
                value={q}
                onChange={setQ}
                placeholder="検索（選挙名 / 投票先 / 配分項目）"
                disabled={isLoading}
                right={
                    <span>
                        合計 <b>{totalVotes}</b> 件（<b>{totalGroups}</b> 選挙）
                    </span>
                }
            />

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

            {!ready ? (
                <Card>読み込み中…</Card>
            ) : totalVotes === 0 ? (
                <Card>
                    <p style={{ margin: 0 }}>投票履歴はありません</p>
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
                    {filteredGroups.map((g, gi) => {
                        const latestAt = g.latestAt ?? "";
                        const latestStatus = g.latestStatus ?? "";

                        const latestIsOngoing = latestStatus === "ONGOING";

                        // 「投票を変更する」リンクは、どっちの方式でも選べるように両方出す
                        // const showNormalChange =
                        //     latestIsOngoing && g.normal.length > 0;
                        // const showAllocChange =
                        //     latestIsOngoing && g.alloc.length > 0;

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

                                        {/* <span
                                            style={{
                                                fontSize: 12,
                                                opacity: 0.75,
                                            }}
                                        >
                                            通常: {g.normal.length} / 配分:{" "}
                                            {g.alloc.length}
                                        </span> */}
                                    </div>

                                    <div
                                        style={{ fontSize: 12, opacity: 0.75 }}
                                    >
                                        最新: {formatJST(latestAt)}
                                        {latestStatus ? (
                                            <span
                                                style={{
                                                    marginLeft: 10,
                                                    opacity: 0.75,
                                                }}
                                            >
                                                status: {latestStatus}
                                            </span>
                                        ) : null}
                                    </div>

                                    {/* 方式固定：NORMAL のときだけ通常を表示 */}
                                    {g.method === "NORMAL" &&
                                        g.normal.length > 0 && (
                                            <div
                                                style={{
                                                    display: "grid",
                                                    gap: 10,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        fontWeight: 900,
                                                        fontSize: 13,
                                                    }}
                                                >
                                                    通常投票
                                                </div>
                                                {g.normal.map((v) => (
                                                    <VoteRow
                                                        key={v.voteId}
                                                        v={v}
                                                        from={from}
                                                    />
                                                ))}
                                            </div>
                                        )}

                                    {/* 方式固定：ALLOC のときだけ配分を表示 */}
                                    {g.method === "ALLOC" &&
                                        g.alloc.length > 0 && (
                                            <div
                                                style={{
                                                    display: "grid",
                                                    gap: 10,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        fontWeight: 900,
                                                        fontSize: 13,
                                                    }}
                                                >
                                                    配分投票
                                                </div>
                                                {g.alloc.map((v, vi) => (
                                                    <AllocRow
                                                        key={v.castId}
                                                        v={v}
                                                        from={from}
                                                        indexOffset={
                                                            gi * 1000 + vi * 20
                                                        }
                                                    />
                                                ))}
                                            </div>
                                        )}

                                    {/* データ不整合：本来起きない */}
                                    {g.method === "MIXED" && (
                                        <Card role="alert">
                                            <div
                                                style={{
                                                    display: "grid",
                                                    gap: 6,
                                                }}
                                            >
                                                <div
                                                    style={{ fontWeight: 900 }}
                                                >
                                                    投票方式が不整合です
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: 12,
                                                        opacity: 0.85,
                                                        lineHeight: 1.6,
                                                    }}
                                                >
                                                    この選挙は「通常」か「配分」のどちらか一方のみのはずですが、
                                                    両方の履歴が存在します（データ整合性の問題）。
                                                </div>

                                                {/* デモ用の暫定：最新の方式だけ見せる（任意） */}
                                                <div
                                                    style={{
                                                        fontSize: 12,
                                                        opacity: 0.75,
                                                    }}
                                                >
                                                    最新:{" "}
                                                    {formatJST(g.latestAt)} /
                                                    status: {g.latestStatus}
                                                </div>

                                                {/* ここでどっちを見せるかは方針次第。まずは表示しないでOK */}
                                            </div>
                                        </Card>
                                    )}

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

                                        <span
                                            style={{
                                                marginLeft: "auto",
                                                display: "flex",
                                                gap: 12,
                                                flexWrap: "wrap",
                                            }}
                                        >
                                            {latestIsOngoing ? (
                                                <>
                                                    {g.method === "NORMAL" && (
                                                        <Link
                                                            to={`/voting/entry?electionId=${g.electionId}`}
                                                            state={{ from }}
                                                        >
                                                            <b>投票を変更 →</b>
                                                        </Link>
                                                    )}
                                                    {g.method === "ALLOC" && (
                                                        <Link
                                                            to={`/alloc-voting/start?electionId=${encodeURIComponent(g.electionId)}`}
                                                            state={{ from }}
                                                        >
                                                            <b>投票を変更 →</b>
                                                        </Link>
                                                    )}
                                                    {g.method === "MIXED" && (
                                                        <span
                                                            style={{
                                                                fontSize: 12,
                                                                opacity: 0.6,
                                                            }}
                                                        >
                                                            投票方式が不整合（管理者に連絡）
                                                        </span>
                                                    )}
                                                </>
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

            {isDev && (
                <DevDebug
                    value={{
                        me,
                        meError,
                        normalLen: normalItems?.length ?? null,
                        allocLen: allocItems?.length ?? null,
                        error,
                        groupsLen: groups.length,
                        filteredGroupsLen: filteredGroups.length,
                        backTo,
                        from,
                        q,
                        mode,
                        isLoading,
                    }}
                />
            )}
        </Page>
    );
}
