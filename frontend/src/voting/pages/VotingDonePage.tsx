// frontend/src/voting/pages/VotingDonePage.tsx
import { Link, useLocation } from "react-router-dom";
import type { VoteHistoryItem } from "../api/votes";
import { Card, DevDebug, Page } from "../../shared/ui/page";
import { normalizeFrom } from "../../shared/normalizeFrom";
import { CandidateAvatar } from "../../shared/ui/CandidateAvatar";

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

type DoneState = {
    result?: VoteHistoryItem;
    from?: string;

    electionId?: string;
    electionTitle?: string;

    // ★ VotingStartPage から渡す（Done表示の安定用）
    selected?: {
        type: "CANDIDATE" | "NONE_SUPPORT";
        candidateId: string | null;
        name: string;
    } | null;

    // ✅ public の token を Done -> Entry へ引き回すため
    token?: string | null;
} | null;

function isTruthy(s: string | null | undefined) {
    if (!s) return false;
    const v = s.toLowerCase();
    return v === "1" || v === "true" || v === "yes" || v === "on";
}

function toType(v: any): "CANDIDATE" | "NONE_SUPPORT" | "JUDGE_REVIEW" | null {
    const s = String(v ?? "").toUpperCase();
    if (s === "CANDIDATE") return "CANDIDATE";
    if (s === "NONE_SUPPORT") return "NONE_SUPPORT";
    if (s === "JUDGE_REVIEW") return "JUDGE_REVIEW";
    return null;
}

export function VotingDonePage() {
    const loc = useLocation();
    const state = (loc.state as DoneState) ?? null;

    const q = new URLSearchParams(loc.search);
    const session = (q.get("session") ?? "").toLowerCase();
    const isPublic = session === "public" || isTruthy(q.get("public"));

    const result = state?.result ?? null;
    const selected = state?.selected ?? null;

    // electionId / title（result があればそれ優先）
    const electionId =
        (result?.electionId as any) ??
        state?.electionId ??
        q.get("electionId") ??
        "";
    const electionTitle =
        (result?.electionTitle as any) ??
        state?.electionTitle ??
        (isPublic ? "投票（本人認証）" : "投票");

    const defaultBack = isPublic ? "/elections" : "/me/elections";
    const backTo = normalizeFrom(state?.from ?? defaultBack);

    const self = loc.pathname + loc.search;

    // ✅ Done → Entry を安定させる（state.token を優先）
    const tokenFromState = (state?.token ?? "").trim();

    const entryLink = electionId
        ? `/voting/entry?electionId=${encodeURIComponent(electionId)}${
              isPublic ? "&session=public" : ""
          }${
              isPublic && tokenFromState
                  ? `&token=${encodeURIComponent(tokenFromState)}`
                  : ""
          }`
        : isPublic
          ? "/elections"
          : "/me/elections";

    const eid = encodeURIComponent(electionId);
    const electionDetailLink = electionId ? `/elections/${eid}` : "/elections";
    const resultLink = electionId ? `/elections/${eid}/result` : "/elections";

    const isDev = import.meta.env?.DEV;

    // --------------------------
    // result が無い：表示だけ（ページ更新/直リンク等）
    // --------------------------
    if (!result) {
        return (
            <Page
                title={
                    <h1 style={{ margin: 0, fontSize: 20 }}>
                        投票が完了しました
                    </h1>
                }
                actions={
                    <div
                        style={{
                            display: "flex",
                            gap: 12,
                            flexWrap: "wrap",
                            alignItems: "center",
                        }}
                    >
                        <Link to={backTo}>← 戻る</Link>
                        <Link to={electionDetailLink} state={{ from: self }}>
                            選挙詳細
                        </Link>
                        <Link to={resultLink} state={{ from: self }}>
                            結果
                        </Link>
                    </div>
                }
                maxWidth={720}
            >
                <Card>
                    <div style={{ display: "grid", gap: 8 }}>
                        <div style={{ fontWeight: 800 }}>{electionTitle}</div>
                        <div style={{ fontSize: 13, opacity: 0.85 }}>
                            投票は送信されました。
                            {isPublic ? "（本人認証投票）" : ""}
                        </div>
                        <div
                            style={{
                                fontSize: 12,
                                opacity: 0.75,
                                lineHeight: 1.6,
                            }}
                        >
                            ※
                            ページを直接開いた/更新した場合、投票内容（候補者名）は表示できないことがあります。
                            <br />※
                            投票は期間内であれば何度でも変更できます（最後に送信した内容が有効）
                        </div>

                        <div
                            style={{
                                display: "flex",
                                gap: 12,
                                flexWrap: "wrap",
                                alignItems: "center",
                                marginTop: 6,
                            }}
                        >
                            <Link to={entryLink}>
                                <b>投票を変更する →</b>
                            </Link>

                            <span
                                style={{
                                    marginLeft: "auto",
                                    display: "inline-flex",
                                    gap: 12,
                                    flexWrap: "wrap",
                                }}
                            >
                                <Link to="/elections">選挙一覧へ</Link>
                                {!isPublic && (
                                    <Link to="/me/votes">投票履歴へ</Link>
                                )}
                                {!isPublic && (
                                    <Link to="/me">マイページへ</Link>
                                )}
                                <Link to={backTo}>戻る</Link>
                            </span>
                        </div>
                    </div>
                </Card>

                {isDev && (
                    <DevDebug
                        value={{
                            isPublic,
                            session,
                            state,
                            loc,
                            electionId,
                            electionTitle,
                            backTo,
                            entryLink,
                            tokenFromState: tokenFromState ? "(present)" : null,
                        }}
                    />
                )}
            </Page>
        );
    }

    // --------------------------
    // result がある：投票内容を表示
    // DTOは backend の VoteHistoryItem に合わせて
    // type / targetId / label / approve を使う
    // --------------------------
    const t = toType((result as any)?.type) ?? "NONE_SUPPORT";

    // ★ Done直後は selected を最優先（result が薄いケースに耐える）
    const effectiveType =
        selected?.type ?? (t === "JUDGE_REVIEW" ? "JUDGE_REVIEW" : t);

    const effectiveLabel =
        selected?.name ?? (result as any)?.label ?? "（不明）";

    const effectiveTargetId =
        selected?.type === "CANDIDATE"
            ? selected.candidateId
            : (result as any)?.targetId
              ? String((result as any).targetId)
              : null;

    const isCandidate = effectiveType === "CANDIDATE" && !!effectiveTargetId;

    const rid = encodeURIComponent(String((result as any).electionId));

    const candidateDetailLink =
        isCandidate && effectiveTargetId
            ? `/elections/${(result as any).electionId}/candidates/${encodeURIComponent(
                  effectiveTargetId,
              )}`
            : null;

    return (
        <Page
            title={
                <h1 style={{ margin: 0, fontSize: 20 }}>投票が完了しました</h1>
            }
            actions={
                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        flexWrap: "wrap",
                        alignItems: "center",
                    }}
                >
                    <Link to={backTo}>← 戻る</Link>

                    <Link to={`/elections/${rid}`} state={{ from: self }}>
                        選挙詳細
                    </Link>

                    <Link
                        to={`/elections/${rid}/result`}
                        state={{ from: self }}
                    >
                        結果
                    </Link>
                </div>
            }
            maxWidth={720}
        >
            <Card>
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
                            {(result as any).electionTitle}
                        </strong>
                        <span style={{ opacity: 0.8 }}>
                            {formatJST((result as any).castedAt)}
                        </span>
                    </div>

                    {isPublic && (
                        <div style={{ fontSize: 12, opacity: 0.75 }}>
                            本人認証で投票しています（ログイン不要）
                        </div>
                    )}

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
                                name={effectiveLabel}
                                imageUrl={null}
                                index={0}
                                size={34}
                            />
                        ) : (
                            <EmptyAvatar size={34} />
                        )}

                        <div>
                            投票先:{" "}
                            {candidateDetailLink ? (
                                <Link
                                    to={candidateDetailLink}
                                    state={{ from: self }}
                                    style={{
                                        color: "inherit",
                                        textDecoration: "none",
                                        fontWeight: 800,
                                    }}
                                    title="候補者詳細へ"
                                >
                                    {effectiveLabel}
                                </Link>
                            ) : (
                                <strong>
                                    {effectiveType === "NONE_SUPPORT"
                                        ? "誰も支持しない"
                                        : effectiveLabel}
                                </strong>
                            )}
                            {effectiveType === "NONE_SUPPORT" && (
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
                            {effectiveType === "JUDGE_REVIEW" && (
                                <span
                                    style={{
                                        marginLeft: 8,
                                        fontSize: 12,
                                        opacity: 0.7,
                                    }}
                                >
                                    （国民審査）
                                </span>
                            )}
                        </div>
                    </div>

                    {effectiveType === "JUDGE_REVIEW" && (
                        <div style={{ fontSize: 13, opacity: 0.9 }}>
                            判定:{" "}
                            <strong>
                                {(result as any).approve === true
                                    ? "OK（信任）"
                                    : (result as any).approve === false
                                      ? "NO（不信任）"
                                      : "（不明）"}
                            </strong>
                        </div>
                    )}

                    <div style={{ fontSize: 12, opacity: 0.75 }}>
                        ※
                        投票は期間内であれば何度でも変更できます（最後に送信した内容が有効）
                    </div>
                </div>
            </Card>

            <Card>
                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        flexWrap: "wrap",
                    }}
                >
                    {!isPublic && (
                        <Link to="/me/votes">
                            <b>投票履歴を見る</b>
                        </Link>
                    )}

                    <Link
                        to={`/elections/${(result as any).electionId}/candidates`}
                        state={{ from: self }}
                    >
                        候補者（公開）
                    </Link>

                    <Link to={entryLink} state={{ from: backTo }}>
                        <b>投票を変更する →</b>
                    </Link>

                    <span
                        style={{
                            marginLeft: "auto",
                            display: "inline-flex",
                            gap: 12,
                            flexWrap: "wrap",
                        }}
                    >
                        <Link to="/elections">選挙一覧へ</Link>
                        {!isPublic && <Link to={backTo}>マイ選挙へ</Link>}
                        {isPublic && <Link to={backTo}>戻る</Link>}
                    </span>
                </div>
            </Card>

            {isDev && (
                <DevDebug
                    value={{
                        isPublic,
                        session,
                        result,
                        state,
                        backTo,
                        self,
                        selected,
                        effectiveType,
                        effectiveTargetId,
                        candidateDetailLink,
                        entryLink,
                        tokenFromState: tokenFromState ? "(present)" : null,
                    }}
                />
            )}
        </Page>
    );
}
