// frontend/src/identity/components/IdentityNfcScanner.tsx
import { useEffect, useState } from "react";
import { linkIdentity } from "../api/identity";
import { useAuth } from "../../user/UserAuthContext";

type Props = {
    onLinked: (token: string) => void;
};

function looksLikeUuid(v: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        v,
    );
}

function extractUuidFromNdef(event: any): string | null {
    const msg = event?.message;
    const records = msg?.records;
    if (!records || !Array.isArray(records)) return null;

    for (const rec of records) {
        try {
            // Text record（推奨：タグにはUUID文字列だけ）
            if (rec.recordType === "text") {
                const encoding = rec.encoding ?? "utf-8";
                const text = rec.data
                    ? new TextDecoder(encoding).decode(rec.data)
                    : "";
                const v = String(text).trim();
                if (looksLikeUuid(v)) return v;
            }

            // URL record（UUIDを埋め込む方式にも対応）
            if (rec.recordType === "url") {
                const url = rec.data
                    ? new TextDecoder("utf-8").decode(rec.data)
                    : "";
                const m = String(url).match(
                    /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i,
                );
                if (m?.[0]) return m[0];
            }
        } catch {
            // ignore and continue
        }
    }
    return null;
}

export function IdentityNfcScanner({ onLinked }: Props) {
    const { setAccessToken } = useAuth();

    const [status, setStatus] = useState<
        "IDLE" | "SCANNING" | "PROCESSING" | "SUCCESS" | "ERROR"
    >("IDLE");
    const [message, setMessage] = useState(
        "「スキャン開始」を押してカードをかざしてください",
    );
    const [isSupported, setIsSupported] = useState(true);

    useEffect(() => {
        if (!("NDEFReader" in window)) {
            setIsSupported(false);
            setMessage(
                "このブラウザはNFCに対応していません（Android Chrome推奨）。",
            );
        }
    }, []);

    const startScan = async () => {
        if (!("NDEFReader" in window)) return;

        setStatus("SCANNING");
        setMessage("カードをスマートフォンの背面に近づけてください...");

        try {
            // @ts-ignore
            const ndef = new NDEFReader();
            await ndef.scan();

            ndef.onreading = async (event: any) => {
                if (status === "PROCESSING" || status === "SUCCESS") return;

                const uuid = extractUuidFromNdef(event);
                if (!uuid) {
                    setStatus("ERROR");
                    setMessage(
                        "タグから citizenId(UUID) を読み取れませんでした。TextレコードにUUIDが入っているか確認してください。",
                    );
                    return;
                }

                if (!looksLikeUuid(uuid)) {
                    setStatus("ERROR");
                    setMessage("読み取り結果がUUID形式ではありません。");
                    return;
                }

                setStatus("PROCESSING");
                setMessage(`読み取り成功: ${uuid}\nサーバーに送信中...`);

                try {
                    const token = await linkIdentity(uuid);
                    await setAccessToken(token.accessToken);

                    setStatus("SUCCESS");
                    setMessage("認証に成功しました！");

                    setTimeout(() => {
                        onLinked(token.accessToken);
                    }, 500);
                } catch (err: any) {
                    setStatus("ERROR");
                    setMessage(
                        err?.response?.data?.message ??
                            "サーバー認証に失敗しました",
                    );
                }
            };

            ndef.onreadingerror = () => {
                setStatus("ERROR");
                setMessage(
                    "読み取りエラーが発生しました。カードをしっかり密着させてください。",
                );
            };
        } catch (error) {
            console.error(error);
            setStatus("ERROR");
            setMessage("NFCの起動に失敗しました。権限を許可してください。");
        }
    };

    if (!isSupported) {
        return (
            <div style={{ padding: 20, textAlign: "center", color: "crimson" }}>
                <p>{message}</p>
            </div>
        );
    }

    return (
        <div style={{ textAlign: "center", display: "grid", gap: 16 }}>
            <div
                style={{
                    height: 140,
                    background: status === "SCANNING" ? "#e6f7ff" : "#f5f5f5",
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                    border: "2px dashed #ccc",
                    padding: 12,
                }}
            >
                {status === "SCANNING" && (
                    <span style={{ fontSize: 24 }}>📡</span>
                )}
                {status === "PROCESSING" && (
                    <span style={{ fontSize: 24 }}>⏳</span>
                )}
                {status === "SUCCESS" && (
                    <span style={{ fontSize: 24 }}>✅</span>
                )}
                {status === "ERROR" && <span style={{ fontSize: 24 }}>❌</span>}

                <p style={{ margin: "10px 0 0", whiteSpace: "pre-wrap" }}>
                    {message}
                </p>
            </div>

            <button
                onClick={startScan}
                disabled={
                    status === "SCANNING" ||
                    status === "PROCESSING" ||
                    status === "SUCCESS"
                }
                style={{ padding: "12px", fontSize: "16px", cursor: "pointer" }}
            >
                {status === "IDLE"
                    ? "スキャン開始"
                    : status === "ERROR"
                      ? "再試行する"
                      : "スキャン中..."}
            </button>
        </div>
    );
}
