import { useEffect, useMemo, useState } from "react";
import { getNfcLast, clearNfcLast } from "../api/nfcBridge";
import { verifyNfc } from "../api/publicIdentity";
import {
    publicVoteConfirm,
    publicVoteStart,
    type VoteStartResponse,
    type VoteHistoryItem,
} from "../api/publicVoting";
import { publicToken } from "../../shared/tokenStorage";

type Phase = "WAIT_NFC" | "LOADING" | "CHOOSING" | "DONE" | "ERROR";

export function PublicVotePage(props: { electionId: string }) {
    const electionId = props.electionId;

    const [phase, setPhase] = useState<Phase>("WAIT_NFC");
    const [msg, setMsg] = useState<string>("NFCをタッチしてください");
    const [startRes, setStartRes] = useState<VoteStartResponse | null>(null);
    const [done, setDone] = useState<VoteHistoryItem | null>(null);

    const title = useMemo(() => startRes?.title ?? "投票", [startRes]);

    useEffect(() => {
        // 誤爆防止：ページ入ったら一旦クリア
        publicToken.clear();
    }, []);

    useEffect(() => {
        if (phase !== "WAIT_NFC") return;

        let timer: number | null = null;
        let cancelled = false;

        const tick = async () => {
            try {
                const uuid = await getNfcLast();
                if (!uuid || cancelled) return;

                setPhase("LOADING");
                setMsg("本人認証中...");

                // 1) vote token
                const v = await verifyNfc(uuid, electionId);
                publicToken.set(v.accessToken); // ★保存（httpPublicがAuthorization付与する）

                // 2) start（token引数は不要）
                const s = await publicVoteStart(electionId);
                setStartRes(s);

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
        if (!startRes) return;

        try {
            setPhase("LOADING");
            setMsg("投票送信中...");

            // token引数は不要
            const r = await publicVoteConfirm(startRes.electionId, candidateId);

            setDone(r);
            setPhase("DONE");
            setMsg("投票しました（再投票するなら候補選択に戻れます）");
        } catch (e: any) {
            setPhase("ERROR");
            setMsg(e?.message ?? "error");
        }
    };

    const backToChoose = () => {
        if (!startRes) return;
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
            <h2>{title}</h2>

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
                <div>
                    <p>選挙ID: {electionId}</p>
                    <p>
                        PaSoRi / NFC タッチ → 本人認証 → 候補表示 の流れです。
                    </p>
                </div>
            )}

            {phase === "CHOOSING" && startRes && (
                <div>
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
                            border: "1px solid #f3c",
                            borderRadius: 8,
                        }}
                    >
                        {msg}
                    </div>
                    <div style={{ marginTop: 12 }}>
                        <button onClick={resetAll} style={{ padding: 10 }}>
                            戻る
                        </button>
                    </div>
                </div>
            )}

            {phase === "LOADING" && <div>...</div>}
        </div>
    );
}
