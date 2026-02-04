import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getNfcLast, clearNfcLast } from "../api/nfcBridge";
import { verifyNfc } from "../api/publicIdentity";
import {
    publicVoteStart,
    publicVoteConfirm,
    type VoteStartResponse,
    type VoteHistoryItem,
} from "../api/publicVoting";
import { publicToken } from "../../shared/tokenStorage";

type Phase = "WAIT_NFC" | "LOADING" | "CHOOSING" | "DONE" | "ERROR";

export function PublicNfcVotePage() {
    const { electionId } = useParams();
    const nav = useNavigate();

    const [phase, setPhase] = useState<Phase>("WAIT_NFC");
    const [msg, setMsg] = useState<string>("NFCをタッチしてください");
    const [startRes, setStartRes] = useState<VoteStartResponse | null>(null);
    const [done, setDone] = useState<VoteHistoryItem | null>(null);

    useEffect(() => {
        if (!electionId) {
            setPhase("ERROR");
            setMsg("electionIdがありません");
            return;
        }
        // ページ入ったら前回tokenは一旦消す（誤爆防止）
        publicToken.clear();
    }, [electionId]);

    useEffect(() => {
        if (phase !== "WAIT_NFC") return;
        if (!electionId) return;

        let timer: number | null = null;
        let cancelled = false;

        const tick = async () => {
            try {
                const uuid = await getNfcLast();
                if (!uuid || cancelled) return;

                setPhase("LOADING");
                setMsg("本人認証中...");

                // 1) verify -> token保存
                const v = await verifyNfc(uuid, electionId);
                publicToken.set(v.accessToken);

                // 2) start（httpPublicがtokenを付与）
                const s = await publicVoteStart(electionId);
                setStartRes(s);

                // 3) 二重検出防止
                await clearNfcLast();

                setPhase("CHOOSING");
                setMsg("");
            } catch (e: any) {
                setPhase("ERROR");
                setMsg(e?.message ?? "error");
            }
        };

        timer = window.setInterval(tick, 700);
        return () => {
            cancelled = true;
            if (timer != null) window.clearInterval(timer);
        };
    }, [phase, electionId]);

    const onPick = async (candidateId: string) => {
        if (!electionId) return;
        try {
            setPhase("LOADING");
            setMsg("投票送信中...");

            const r = await publicVoteConfirm(electionId, candidateId);
            setDone(r);

            setPhase("DONE");
            setMsg("投票しました（再投票するなら候補選択に戻れます）");
        } catch (e: any) {
            setPhase("ERROR");
            setMsg(e?.message ?? "error");
        }
    };

    const backToChoose = () => {
        setDone(null);
        setPhase("CHOOSING");
        setMsg("");
    };

    const resetAll = () => {
        publicToken.clear();
        setStartRes(null);
        setDone(null);
        setPhase("WAIT_NFC");
        setMsg("NFCをタッチしてください");
    };

    return (
        <div style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
            <h2>ログイン不要投票（NFC）</h2>

            {electionId && (
                <div style={{ opacity: 0.7, marginBottom: 8 }}>
                    electionId: {electionId}
                </div>
            )}

            {msg && (
                <div
                    style={{
                        padding: 12,
                        border: "1px solid #ddd",
                        borderRadius: 8,
                        marginBottom: 12,
                    }}
                >
                    {msg}
                </div>
            )}

            {phase === "WAIT_NFC" && (
                <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => nav(-1)} style={{ padding: 10 }}>
                        戻る
                    </button>
                    <button onClick={resetAll} style={{ padding: 10 }}>
                        リセット
                    </button>
                </div>
            )}

            {phase === "CHOOSING" && startRes && (
                <div>
                    <h3 style={{ marginTop: 8 }}>{startRes.title}</h3>
                    <p>候補を選んで投票してください（再投票OK）</p>

                    <ul style={{ listStyle: "none", padding: 0 }}>
                        {startRes.candidates.map((c) => (
                            <li key={c.candidateId} style={{ marginBottom: 8 }}>
                                <button
                                    onClick={() => onPick(c.candidateId)}
                                    style={{
                                        width: "100%",
                                        padding: 12,
                                        borderRadius: 10,
                                        border: "1px solid #ccc",
                                    }}
                                >
                                    {c.name}
                                </button>
                            </li>
                        ))}
                    </ul>

                    <button onClick={resetAll} style={{ padding: 10 }}>
                        最初から（別のカードで）
                    </button>
                </div>
            )}

            {phase === "DONE" && done && (
                <div>
                    <div
                        style={{
                            padding: 12,
                            border: "1px solid #ddd",
                            borderRadius: 8,
                        }}
                    >
                        <div>投票先: {done.candidateName}</div>
                        <div>時刻: {done.castedAt}</div>
                    </div>

                    <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                        <button onClick={backToChoose} style={{ padding: 10 }}>
                            再投票する
                        </button>
                        <button onClick={resetAll} style={{ padding: 10 }}>
                            最初から
                        </button>
                    </div>
                </div>
            )}

            {phase === "ERROR" && (
                <div>
                    <div
                        style={{
                            padding: 12,
                            border: "1px solid #f99",
                            borderRadius: 8,
                        }}
                    >
                        {msg}
                    </div>
                    <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                        <button onClick={resetAll} style={{ padding: 10 }}>
                            戻る
                        </button>
                        <button onClick={() => nav(-1)} style={{ padding: 10 }}>
                            前の画面へ
                        </button>
                    </div>
                </div>
            )}

            {phase === "LOADING" && <div>...</div>}
        </div>
    );
}
