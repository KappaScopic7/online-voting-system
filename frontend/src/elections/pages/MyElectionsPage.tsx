// frontend/src/me/pages/MyElectionsPage.tsx
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { fetchMyElections, type MyElectionItem } from "../api/meElections";
import {
    fetchMeEligibility,
    type MeEligibilityResponse,
} from "../../me/api/eligibility";

function fmt(iso: string) {
    try {
        return new Date(iso).toLocaleString();
    } catch {
        return iso;
    }
}

function badgeStyle() {
    return {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        border: "1px solid #ccc",
        borderRadius: 999,
        padding: "4px 10px",
        fontSize: 12,
        opacity: 0.9,
    } as const;
}

export function MyElectionsPage() {
    const loc = useLocation();
    const from = loc.pathname + loc.search;

    const [items, setItems] = useState<MyElectionItem[] | null>(null);
    const [elig, setElig] = useState<MeEligibilityResponse | null>(null);

    const [err, setErr] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function reload() {
        setLoading(true);
        setErr(null);

        try {
            const [elections, eligibility] = await Promise.all([
                fetchMyElections(),
                fetchMeEligibility(),
            ]);

            setItems(elections);
            setElig(eligibility);
        } catch (e: any) {
            setItems(null);
            setElig(null);
            setErr(e?.message ?? String(e));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        reload();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const showHint = elig?.source === "NONE" || !elig?.cityCode;

    return (
        <div style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}>
            <div
                style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 12,
                    flexWrap: "wrap",
                }}
            >
                <h1 style={{ margin: 0 }}>My選挙</h1>

                <button onClick={reload} disabled={loading}>
                    {loading ? "読み込み中..." : "再読み込み"}
                </button>

                {elig && (
                    <span style={badgeStyle()}>
                        判定ソース: <b>{elig.source}</b>
                        {elig.cityCode ? (
                            <>
                                / cityCode: <b>{elig.cityCode}</b>
                            </>
                        ) : null}
                    </span>
                )}
            </div>

            {showHint && (
                <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
                    {elig?.source === "NONE"
                        ? "判定に使える情報がありません（本人認証 or プロフィール入力が必要）"
                        : "cityCode が未設定です（本人認証 or プロフィール入力で設定してください）"}
                </div>
            )}

            {err && (
                <div
                    style={{
                        marginTop: 12,
                        padding: 12,
                        border: "1px solid #ccc",
                    }}
                >
                    <div style={{ fontWeight: 700 }}>エラー</div>
                    <div style={{ whiteSpace: "pre-wrap" }}>{err}</div>
                    <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
                        401なら未ログイン or
                        token不正。403なら権限不足/アカウント状態。
                    </div>
                </div>
            )}

            {items && items.length === 0 && !err && (
                <div
                    style={{
                        marginTop: 12,
                        padding: 12,
                        border: "1px solid #ccc",
                    }}
                >
                    該当する選挙がありません。
                    <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
                        rule の cityCode/minAge と、判定ソースの cityCode
                        が一致しているか確認してね。
                    </div>
                </div>
            )}

            {items && items.length > 0 && (
                <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
                    {items.map((e) => (
                        <div
                            key={e.electionId}
                            style={{ border: "1px solid #ccc", padding: 12 }}
                        >
                            <div style={{ fontWeight: 700 }}>
                                <Link
                                    to={`/elections/${e.electionId}`}
                                    state={{ from }}
                                >
                                    {e.title}
                                </Link>
                            </div>

                            <div style={{ marginTop: 6, fontSize: 13 }}>
                                <div>開始: {fmt(e.startsAt)}</div>
                                <div>終了: {fmt(e.endsAt)}</div>
                            </div>

                            <div
                                style={{
                                    marginTop: 8,
                                    fontSize: 12,
                                    opacity: 0.7,
                                }}
                            >
                                electionId: {e.electionId}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!items && !err && (
                <div style={{ marginTop: 12, opacity: 0.8 }}>読み込み中…</div>
            )}
        </div>
    );
}
