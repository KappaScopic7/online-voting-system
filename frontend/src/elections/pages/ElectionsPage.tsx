// pages/ElectionsPage.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchElections, type ElectionListItem } from "../api/elections";
import { useAuth } from "../../auth/AuthContext";

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

export function ElectionsPage() {
  const { me } = useAuth();
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

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h2>Elections</h2>

      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <button onClick={load}>Reload</button>
        {!me && (
          <span style={{ fontSize: 12, opacity: 0.7 }}>
            ログインすると投票できます
          </span>
        )}
      </div>

      {error && <p>{error}</p>}

      {items === null ? (
        <p>Loading...</p>
      ) : items.length === 0 ? (
        <p>選挙がありません</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
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
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>{e.title}</strong>
                <span>{statusLabel(e.status)}</span>
              </div>

              <div style={{ fontSize: 13, opacity: 0.8 }}>
                <div>開始: {formatJST(e.startsAt)}</div>
                <div>終了: {formatJST(e.endsAt)}</div>
              </div>

              <div style={{ fontSize: 13 }}>
                候補者数: {e.candidateCount}
                {e.currentVote ? (
                  <span style={{ marginLeft: 12 }}>
                    現在の投票:{" "}
                    {e.currentVote.candidateName ??
                      `候補ID: ${e.currentVote.candidateId}`}
                  </span>
                ) : (
                  <span style={{ marginLeft: 12, opacity: 0.6 }}>
                    現在の投票: なし
                  </span>
                )}
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link to={`/elections/${e.electionId}/candidates`}>
                  候補者（公開）
                </Link>

                {e.hasResult ? (
                  <Link to={`/elections/${e.electionId}/result`}>結果</Link>
                ) : (
                  <span style={{ opacity: 0.5 }}>結果（未公開）</span>
                )}

                {e.canCast ? (
                  <Link to={`/voting/start?electionId=${e.electionId}`}>
                    投票する →
                  </Link>
                ) : me ? (
                  <span style={{ opacity: 0.5 }}>投票不可</span>
                ) : (
                  <Link to="/login">ログインして投票</Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
