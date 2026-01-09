// pages/ResultPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchResult, type ElectionResultResponse } from "../api/elections";

export function ResultPage() {
  const { electionId } = useParams<{ electionId: string }>();
  const [data, setData] = useState<ElectionResultResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!electionId) return;
    setError(null);
    try {
      const res = await fetchResult(electionId);
      setData(res);
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message;

      if (status === 403) {
        setError(msg ?? "この選挙はまだ結果を公開できません（未終了）");
      } else {
        setError(msg ?? "Failed to load result");
      }
      setData(null);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [electionId]);

  const sorted = useMemo(() => {
    if (!data) return [];
    return [...data.results].sort((a, b) => b.votes - a.votes);
  }, [data]);

  const maxVotes = useMemo(() => {
    return sorted.reduce((m, x) => Math.max(m, x.votes), 0);
  }, [sorted]);

  if (!electionId) return <div>Invalid electionId</div>;

  return (
    <div>
      <h2>Result</h2>

      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <Link to="/">← 戻る（選挙一覧）</Link>
        <Link to={`/elections/${electionId}/candidates`}>候補者へ</Link>
        <button onClick={load} style={{ marginLeft: "auto" }}>
          Reload
        </button>
      </div>

      {error && (
        <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
          <p style={{ margin: 0 }}>{error}</p>
        </div>
      )}

      {!error && data === null ? (
        <p>Loading...</p>
      ) : !error && data ? (
        <div style={{ display: "grid", gap: 10 }}>
          <div
            style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <strong style={{ fontSize: 16 }}>{data.title}</strong>
              <span style={{ opacity: 0.8 }}>総投票数: {data.totalVotes}</span>
            </div>

            <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
              {sorted.map((r) => {
                const ratio = maxVotes > 0 ? (r.votes / maxVotes) * 100 : 0;
                return (
                  <div key={r.candidateId} style={{ display: "grid", gap: 4 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                      }}
                    >
                      <span>{r.candidateName}</span>
                      <span style={{ opacity: 0.85 }}>{r.votes}票</span>
                    </div>

                    <div
                      style={{
                        height: 10,
                        border: "1px solid #ddd",
                        borderRadius: 999,
                      }}
                    >
                      <div
                        style={{
                          width: `${ratio}%`,
                          height: "100%",
                          borderRadius: 999,
                          background: "#999",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <details>
            <summary>Raw JSON</summary>
            <pre style={{ whiteSpace: "pre-wrap" }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        </div>
      ) : null}
    </div>
  );
}
