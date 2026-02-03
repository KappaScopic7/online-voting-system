import { useLocation, useNavigate } from "react-router-dom";
import type { AllocVoteHistoryItem } from "../model/allocVotingTypes";

export function AllocVotingDonePage() {
    const nav = useNavigate();
    const loc = useLocation();
    const result = (loc.state as any)?.result as
        | AllocVoteHistoryItem
        | undefined;

    if (!result) {
        return (
            <div style={{ padding: 16 }}>
                <div>投票結果がありません</div>
                <button onClick={() => nav("/me/alloc-votes")}>履歴へ</button>
            </div>
        );
    }

    return (
        <div style={{ padding: 16, maxWidth: 720 }}>
            <h2>投票完了（配分投票）</h2>
            <div style={{ margin: "8px 0" }}>{result.electionTitle}</div>

            <div
                style={{
                    border: "1px solid #ddd",
                    borderRadius: 12,
                    padding: 12,
                }}
            >
                {result.items.map((it, i) => (
                    <div
                        key={i}
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "6px 0",
                        }}
                    >
                        <div>{it.label}</div>
                        <div>{it.points}pt</div>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
                <button onClick={() => nav("/me/alloc-votes")}>
                    履歴を見る
                </button>
                <button onClick={() => nav("/elections")}>選挙一覧へ</button>
            </div>
        </div>
    );
}
