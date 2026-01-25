// frontend/src/identity/components/IdentityNfcStub.tsx
import { useMemo, useState } from "react";
import { linkIdentity } from "../api/identity";
import { useAuth } from "../../auth/AuthContext";
import { demoPersonas } from "../../demo/personas";

function isUuidLike(v: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        v,
    );
}

export function IdentityNfcStub(props: {
    onLinked: (accessToken: string) => void;
}) {
    const { onLinked } = props;
    const { setAccessToken } = useAuth();

    const isDev = import.meta.env?.DEV;

    const [readCitizenId, setReadCitizenId] = useState<string>("");
    const [msg, setMsg] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const canLink = useMemo(() => {
        if (!readCitizenId) return false;
        if (!isUuidLike(readCitizenId)) return false;
        return !isSubmitting;
    }, [readCitizenId, isSubmitting]);

    // ===== NFC読み取り（スタブ）
    // 将来：ここを Web NFC / ネイティブ連携に差し替える
    const simulateRead = (id: string) => {
        setReadCitizenId(id);
        setMsg(null);
    };

    const onLink = async () => {
        setMsg(null);

        if (!readCitizenId) {
            setMsg("NFC読み取り結果がありません");
            return;
        }
        if (!isUuidLike(readCitizenId)) {
            setMsg("読み取った citizenId の形式が不正です");
            return;
        }

        try {
            setIsSubmitting(true);
            const token = await linkIdentity(readCitizenId);
            await setAccessToken(token.accessToken);

            // NFCは「審査中へ遷移」する想定（本番に近い）
            onLinked(token.accessToken);
        } catch (err: any) {
            setMsg(err?.response?.data?.message ?? "Link failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ display: "grid", gap: 8 }}>
            <p style={{ margin: 0, opacity: 0.85 }}>
                NFC読み取り（スタブ）：カードから citizenId
                を取得した想定で本人認証を行います。
            </p>

            {msg && (
                <div
                    role="alert"
                    style={{ padding: 8, border: "1px solid #ccc" }}
                >
                    {msg}
                </div>
            )}

            <div
                style={{
                    border: "1px solid #ddd",
                    borderRadius: 10,
                    padding: 12,
                    display: "grid",
                    gap: 8,
                }}
            >
                <div style={{ display: "grid", gap: 4 }}>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>
                        読み取り結果 citizenId
                    </div>
                    <code style={{ wordBreak: "break-all" }}>
                        {readCitizenId || "(未読み取り)"}
                    </code>
                </div>

                {isDev && (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {Object.values(demoPersonas.voter)
                            .filter((p) => p.citizenId)
                            .map((p) => (
                                <button
                                    key={p.key}
                                    type="button"
                                    onClick={() => simulateRead(p.citizenId)}
                                    disabled={isSubmitting}
                                    style={{ fontSize: 12, padding: "4px 8px" }}
                                    title={p.description}
                                >
                                    読取 {p.label}
                                </button>
                            ))}
                    </div>
                )}

                <div
                    style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                        alignItems: "center",
                    }}
                >
                    <button type="button" onClick={onLink} disabled={!canLink}>
                        {isSubmitting
                            ? "登録中..."
                            : "この読み取り結果で本人認証（審査へ）"}
                    </button>

                    {!readCitizenId && (
                        <span style={{ fontSize: 12, opacity: 0.7 }}>
                            先に読み取り（スタブ）してください
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
