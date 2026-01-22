// voting/pages/VotingDonePage.tsx
import { Link, useLocation } from "react-router-dom";
import type { VoteHistoryItem } from "../api/votes";

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

type DoneState = { result?: VoteHistoryItem; from?: string } | null;

export function VotingDonePage() {
    const loc = useLocation();
    const state = (loc.state as DoneState) ?? null;

    const result = state?.result;

    const isDev = import.meta.env?.DEV;

    // state無しで直アクセスされた場合の逃げ
    if (!result) {
        return (
            <div
                style={{ padding: 16, display: "grid", gap: 12, maxWidth: 720 }}
            >
                <h2 style={{ margin: 0 }}>投票完了</h2>
                <div
                    style={{
                        border: "1px solid #ddd",
                        borderRadius: 10,
                        padding: 12,
                    }}
                >
                    <p style={{ marginTop: 0 }}>
                        投票結果が見つかりません（ページを直接開いた可能性があります）
                    </p>
                    <p style={{ marginBottom: 0, fontSize: 13, opacity: 0.8 }}>
                        投票履歴から直近の投票を確認してください。
                    </p>
                </div>

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <Link to="/votes">投票履歴へ</Link>
                    <Link to="/elections">選挙一覧へ</Link>
                    <Link to="/me">My Pageへ</Link>
                </div>

                {isDev && (
                    <details>
                        <summary>Debug</summary>
                        <pre style={{ whiteSpace: "pre-wrap" }}>
                            {JSON.stringify({ state, loc }, null, 2)}
                        </pre>
                    </details>
                )}
            </div>
        );
    }

    return (
        <div style={{ padding: 16, display: "grid", gap: 12, maxWidth: 720 }}>
            <h2 style={{ margin: 0 }}>投票が完了しました</h2>

            <div
                style={{
                    border: "1px solid #ddd",
                    borderRadius: 10,
                    padding: 12,
                    display: "grid",
                    gap: 8,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        flexWrap: "wrap",
                    }}
                >
                    <strong style={{ fontSize: 16 }}>
                        {result.electionTitle}
                    </strong>
                    <span style={{ opacity: 0.8 }}>
                        {formatJST(result.castedAt)}
                    </span>
                </div>

                <div>
                    投票先: <strong>{result.candidateName}</strong>
                </div>

                {/* voteId はユーザーに見せる価値が薄いのでDEVのみ */}
                {isDev && (
                    <div style={{ fontSize: 12, opacity: 0.75 }}>
                        voteId: {result.voteId}
                    </div>
                )}
            </div>

            {/* 次アクション */}
            <section
                style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    flexWrap: "wrap",
                }}
            >
                <Link to="/votes">
                    <b>投票履歴を見る</b>
                </Link>
                <Link to="/elections">選挙一覧へ</Link>
                <Link to={`/elections/${result.electionId}/candidates`}>
                    候補者（公開）
                </Link>
                <Link to={`/elections/${result.electionId}/result`}>結果</Link>

                {/* 仕様に合わせて文言調整 */}
                <Link to={`/voting/start?electionId=${result.electionId}`}>
                    投票を変更する
                </Link>
            </section>

            {isDev && (
                <details>
                    <summary>Debug</summary>
                    <pre style={{ whiteSpace: "pre-wrap" }}>
                        {JSON.stringify({ result, state }, null, 2)}
                    </pre>
                </details>
            )}
        </div>
    );
}
