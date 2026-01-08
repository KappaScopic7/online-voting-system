// pages/VoteHistoryPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchVoteHistory, type VoteHistoryItem } from "../api/votes";

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

type Group = {
  electionId: string;
  electionTitle: string;
  items: VoteHistoryItem[];
};

export function VoteHistoryPage() {
  const [items, setItems] = useState<VoteHistoryItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    try {
      const data = await fetchVoteHistory();
      setItems(data);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to load vote history");
      setItems([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

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

    // items は castedAt desc で来てる想定。グループも最新順に並べる
    return Array.from(map.values()).sort((a, b) => {
      const at = a.items[0]?.castedAt ?? "";
      const bt = b.items[0]?.castedAt ?? "";
      return bt.localeCompare(at);
    });
  }, [items]);

  return (
    <div>
      <h2>投票履歴</h2>

      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <Link to="/">← 戻る</Link>
        <button onClick={load} style={{ marginLeft: "auto" }}>
          Reload
        </button>
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
        <p>投票履歴はありません</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {groups.map((g) => {
            const latest = g.items[0];
            return (
              <div
                key={g.electionId}
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
                  }}
                >
                  <strong style={{ fontSize: 16 }}>{g.electionTitle}</strong>
                  <span style={{ opacity: 0.8 }}>回数: {g.items.length}</span>
                </div>

                <div style={{ fontSize: 13, opacity: 0.8 }}>
                  最新: {formatJST(latest?.castedAt ?? null)}
                </div>

                <div style={{ display: "grid", gap: 6, marginTop: 4 }}>
                  {g.items.map((v) => (
                    <div
                      key={v.voteId}
                      style={{
                        borderTop: "1px dashed #ddd",
                        paddingTop: 8,
                        display: "flex",
                        gap: 12,
                        alignItems: "baseline",
                      }}
                    >
                      <span style={{ width: 150, fontSize: 12, opacity: 0.85 }}>
                        {formatJST(v.castedAt)}
                      </span>
                      <span>
                        投票先: <strong>{v.candidateName}</strong>
                      </span>

                      <details style={{ marginLeft: "auto" }}>
                        <summary style={{ cursor: "pointer" }}>詳細</summary>
                        <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
                          {JSON.stringify(v, null, 2)}
                        </pre>
                      </details>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 8, display: "flex", gap: 12 }}>
                  <Link to={`/elections/${g.electionId}/candidates`}>
                    候補者（公開）
                  </Link>
                  <Link to={`/elections/${g.electionId}/result`}>
                    結果（公開）
                  </Link>
                </div>
              </div>
            );
          })}
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
