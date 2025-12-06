// frontend/src/pages/ElectionDetailPage.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchElectionDetail } from "../api/authClient";
import type { ElectionDetail } from "../api/authClient";

export function ElectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<ElectionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/login");
      return;
    }

    if (!id) {
      setError("選挙IDが不正です。");
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const data = await fetchElectionDetail(token, Number(id));
        setDetail(data);
      } catch (err: any) {
        if (err.message === "unauthorized") {
          localStorage.removeItem("accessToken");
          navigate("/login");
          return;
        }
        setError(err.message ?? "選挙詳細の取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, navigate]);

  if (loading) {
    return <p>読み込み中...</p>;
  }

  if (error) {
    return <p style={{ color: "red" }}>{error}</p>;
  }

  if (!detail) {
    return <p>選挙が見つかりません。</p>;
  }

  const isClosed = detail.status === "CLOSED";
  const isOpen = detail.status === "OPEN";

  return (
    <main>
      <h1>{detail.name}</h1>
      {detail.description && <p>{detail.description}</p>}

      <dl style={{ display: "grid", gridTemplateColumns: "max-content 1fr", gap: 8 }}>
        <dt>コード</dt>
        <dd>{detail.code}</dd>

        <dt>選挙区</dt>
        <dd>{detail.districtName}</dd>

        <dt>状態</dt>
        <dd>{detail.status}</dd>

        <dt>開始日時</dt>
        <dd>{formatDateTime(detail.startsAt)}</dd>

        <dt>終了日時</dt>
        <dd>{formatDateTime(detail.endsAt)}</dd>
      </dl>

      {/* ★ 状態に応じて表示を変える */}
      {isOpen && (
        <button
          style={{ marginTop: 16 }}
          onClick={() => navigate(`/elections/${detail.id}/vote`)}
        >
          この選挙で投票する
        </button>
      )}

      {isClosed && (
        <p style={{ marginTop: 16, color: "red" }}>
          この選挙はすでに終了しているため、オンライン投票はできません。
        </p>
      )}
    </main>
  );
}

function formatDateTime(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("ja-JP");
}
