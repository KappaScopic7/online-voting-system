// pages/VoterHomePage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { fetchElections } from "../api/elections";
import type { ElectionListItem } from "../api/elections";

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

function statusLabel(status: string): string {
  switch (status) {
    case "UPCOMING":
      return "予定";
    case "ONGOING":
      return "開催中";
    case "ENDED":
      return "終了";
    default:
      return status;
  }
}

type VoterLocationState = { refresh?: boolean } | null;

export function VoterHomePage() {
  const { me, logout } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const state = (location.state as VoterLocationState) ?? null;

  const [items, setItems] = useState<ElectionListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    try {
      const data = await fetchElections();
      setItems(data);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to load elections");
      setItems([]);
    }
  };

  // 初回ロード
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // refresh指定で戻ってきたら再ロードして state を消す（1回だけ）
  useEffect(() => {
    if (!state?.refresh) return;

    load();
    nav("/voter", { replace: true, state: null });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.refresh]);

  const linked = !!me?.identityLinked;

  const headerNote = useMemo(() => {
    if (!linked)
      return "本人認証リンクが未完了です。リンクすると投票できます。";
    return "本人認証リンク済み。投票可能な選挙が表示されます。";
  }, [linked]);

  return (
    <div>
      <h2>Voter</h2>

      <div style={{ display: "grid", gap: 6, marginBottom: 12 }}>
        <div>email: {me?.email}</div>
        <div>identityLinked: {String(me?.identityLinked)}</div>
        <div style={{ fontSize: 12, opacity: 0.75 }}>{headerNote}</div>

        <div style={{ display: "flex", gap: 12 }}>
          <Link to="/identity/link">Link Identity</Link>
          <Link to="/votes">Vote History</Link>
          <button onClick={load}>Reload</button>
          <button onClick={logout} style={{ marginLeft: "auto" }}>
            Logout
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: 12,
            marginBottom: 12,
          }}
        >
          <p style={{ margin: 0 }}>{error}</p>
        </div>
      )}

      {items === null ? (
        <p>Loading...</p>
      ) : items.length === 0 ? (
        <p>対象の選挙がありません</p>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {items.map((e) => (
            <div
              key={e.electionId}
              style={{
                border: "1px solid #ddd",
                borderRadius: 8,
                padding: 12,
                display: "grid",
                gap: 6,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <strong style={{ fontSize: 16 }}>{e.title}</strong>
                <span>{statusLabel(e.status)}</span>
              </div>

              <div style={{ fontSize: 13, opacity: 0.8 }}>
                <div>開始: {formatJST(e.startsAt)}</div>
                <div>終了: {formatJST(e.endsAt)}</div>
              </div>

              <div style={{ fontSize: 13 }}>
                投票: {e.canCast ? "可能" : "不可"}
                {e.currentVote ? (
                  <span style={{ marginLeft: 12, opacity: 0.85 }}>
                    現在の投票:{" "}
                    {e.currentVote.candidateName
                      ? e.currentVote.candidateName
                      : `候補ID: ${e.currentVote.candidateId}`}
                    （{formatJST(e.currentVote.castedAt)}）
                  </span>
                ) : (
                  <span style={{ marginLeft: 12, opacity: 0.7 }}>
                    現在の投票: なし
                  </span>
                )}
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
                <Link to={`/elections/${e.electionId}/candidates`}>
                  候補者（公開）
                </Link>

                {e.canCast ? (
                  <Link to={`/voting/start?electionId=${e.electionId}`}>
                    投票する →
                  </Link>
                ) : (
                  <span style={{ opacity: 0.6 }}>投票する（不可）</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <details style={{ marginTop: 16 }}>
        <summary>Raw JSON</summary>
        <pre style={{ whiteSpace: "pre-wrap" }}>
          {JSON.stringify(items, null, 2)}
        </pre>
      </details>
    </div>
  );
}
