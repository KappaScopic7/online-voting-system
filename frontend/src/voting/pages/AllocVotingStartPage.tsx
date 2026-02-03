import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { allocConfirm, allocStart } from "../api/allocVoting";
import type {
    AllocVoteConfirmRequest,
    AllocVoteStartResponse,
} from "../model/allocVotingTypes";

type Row = {
    type: "CANDIDATE" | "NONE_SUPPORT";
    candidateId: string | null;
    label: string;
    points: number;
};

export function AllocVotingStartPage() {
    const nav = useNavigate();
    const [sp] = useSearchParams();
    const electionId = sp.get("electionId") ?? "";

    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [data, setData] = useState<AllocVoteStartResponse | null>(null);

    const [rows, setRows] = useState<Row[]>([]);
    const sum = useMemo(
        () => rows.reduce((a, r) => a + (Number(r.points) || 0), 0),
        [rows],
    );
    const canSubmit =
        !!data &&
        sum === data.pointsPerVoter &&
        rows.some((r) => (r.points ?? 0) > 0);

    useEffect(() => {
        if (!electionId) {
            setErr("electionIdが不正です");
            setLoading(false);
            return;
        }

        (async () => {
            try {
                setLoading(true);
                const res = await allocStart(electionId);
                setData(res);
                setRows(res.options.map((o) => ({ ...o, points: 0 })));
                setErr(null);
            } catch (e: any) {
                setErr(e?.response?.data?.message ?? "取得に失敗しました");
            } finally {
                setLoading(false);
            }
        })();
    }, [electionId]);

    const setPoints = (idx: number, v: number) => {
        setRows((prev) =>
            prev.map((r, i) =>
                i === idx
                    ? { ...r, points: Math.max(0, Math.floor(v || 0)) }
                    : r,
            ),
        );
    };

    const onSubmit = async () => {
        if (!data) return;

        const req: AllocVoteConfirmRequest = {
            electionId: data.electionId,
            pointsTotal: data.pointsPerVoter,
            items: rows
                .filter((r) => (r.points ?? 0) > 0)
                .map((r) => ({
                    type: r.type,
                    candidateId: r.candidateId,
                    points: r.points,
                })),
        };

        try {
            const result = await allocConfirm(req);
            nav("/alloc-voting/done", { state: { result } });
        } catch (e: any) {
            setErr(e?.response?.data?.message ?? "送信に失敗しました");
        }
    };

    if (loading) return <div style={{ padding: 16 }}>Loading...</div>;
    if (err) return <div style={{ padding: 16, color: "crimson" }}>{err}</div>;
    if (!data) return <div style={{ padding: 16 }}>No data</div>;

    return (
        <div style={{ padding: 16, maxWidth: 720 }}>
            <h2>{data.electionTitle}（配分投票）</h2>
            <p>合計 {data.pointsPerVoter}pt になるように配分してください。</p>

            <div style={{ margin: "12px 0", fontWeight: 700 }}>
                合計: {sum}/{data.pointsPerVoter}
            </div>

            <div style={{ display: "grid", gap: 10 }}>
                {rows.map((r, idx) => (
                    <div
                        key={`${r.type}-${r.candidateId ?? "none"}`}
                        style={{
                            border: "1px solid #ddd",
                            borderRadius: 12,
                            padding: 12,
                        }}
                    >
                        <div style={{ fontWeight: 600 }}>{r.label}</div>
                        <div
                            style={{
                                marginTop: 8,
                                display: "flex",
                                gap: 8,
                                alignItems: "center",
                            }}
                        >
                            <input
                                type="number"
                                min={0}
                                step={1}
                                value={r.points}
                                onChange={(e) =>
                                    setPoints(idx, Number(e.target.value))
                                }
                                style={{ width: 120 }}
                            />
                            <span>pt</span>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
                <button onClick={() => nav(-1)}>戻る</button>
                <button disabled={!canSubmit} onClick={onSubmit}>
                    投票する
                </button>
            </div>

            {err && (
                <div style={{ marginTop: 12, color: "crimson" }}>{err}</div>
            )}
        </div>
    );
}
