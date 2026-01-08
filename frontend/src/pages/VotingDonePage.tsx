// pages/VotingDonePage.tsx
import { Link, useLocation, useNavigate } from "react-router-dom";
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

type DoneState = { result?: VoteHistoryItem } | null;

export function VotingDonePage() {
  const nav = useNavigate();
  const loc = useLocation();
  const state = (loc.state as DoneState) ?? null;

  const result = state?.result;

  // state無しで直アクセスされた場合の逃げ
  if (!result) {
    return (
      <div>
        <h2>投票完了</h2>
        <p>投票結果が見つかりません（ページを直接開いた可能性があります）</p>
        <div style={{ display: "flex", gap: 12 }}>
          <Link to="/">Voter Homeへ</Link>
          <Link to="/votes">投票履歴へ</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2>投票完了</h2>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 10,
          padding: 12,
          display: "grid",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <div
          style={{ display: "flex", justifyContent: "space-between", gap: 12 }}
        >
          <strong style={{ fontSize: 16 }}>{result.electionTitle}</strong>
          <span style={{ opacity: 0.8 }}>{formatJST(result.castedAt)}</span>
        </div>

        <div>
          投票先: <strong>{result.candidateName}</strong>
        </div>

        <div style={{ fontSize: 12, opacity: 0.75 }}>
          voteId: {result.voteId}
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button onClick={() => nav("/voter", { state: { refresh: true } })}>
          Voter Homeへ戻る
        </button>

        <Link to="/votes">投票履歴を見る</Link>
        <Link to={`/voting/start?electionId=${result.electionId}`}>
          同じ選挙でもう一度投票
        </Link>
        <Link to={`/elections/${result.electionId}/candidates`}>
          候補者（公開）
        </Link>
      </div>

      <details style={{ marginTop: 16 }}>
        <summary>Raw JSON</summary>
        <pre style={{ whiteSpace: "pre-wrap" }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      </details>
    </div>
  );
}
