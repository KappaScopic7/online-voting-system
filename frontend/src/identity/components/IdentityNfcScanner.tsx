// frontend/src/identity/components/IdentityNfcScanner.tsx
import { useEffect, useMemo, useState } from "react";
import { linkIdentity } from "../api/identity";
import { useAuth } from "../../user/UserAuthContext";
import { issueVoteToken } from "../../public/api/voteToken";

type Props = {
    onLinked: (token: string) => void;
    onError?: (msg: string) => void;
    mode?: "IDENTITY_LINK" | "VOTE_TOKEN_ISSUE";
    electionId?: string;

    // ✅ 追加（すでに型にある）
    pin?: string;
    pinRequired?: boolean;
};

function isValidPin(pin: string) {
    return /^\d{4}$/.test(pin);
}

function looksLikeUuid(v: string) {
    // return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    //     v,
    // );
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        v,
    );
}

function extractUuidFromNdef(event: any): string | null {
    const msg = event?.message;
    const records = msg?.records;
    if (!records || !Array.isArray(records)) return null;

    for (const rec of records) {
        try {
            if (rec.recordType === "text") {
                const encoding = rec.encoding ?? "utf-8";
                const text = rec.data
                    ? new TextDecoder(encoding).decode(rec.data)
                    : "";
                const v = String(text).trim();
                if (looksLikeUuid(v)) return v;
            }

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
            // ignore
        }
    }
    return null;
}

export function IdentityNfcScanner({
    onLinked,
    onError,
    mode = "IDENTITY_LINK",
    electionId,
    pin: pinProp,
    pinRequired = false,
}: Props) {
    const { setAccessToken } = useAuth();

    const [status, setStatus] = useState<
        "IDLE" | "SCANNING" | "PROCESSING" | "SUCCESS" | "ERROR"
    >("IDLE");

    const [message, setMessage] = useState(() =>
        mode === "VOTE_TOKEN_ISSUE"
            ? "PIN(4桁)を入力してから「スキャン開始」を押してください"
            : "「スキャン開始」を押してカードをかざしてください",
    );

    const [isSupported, setIsSupported] = useState(true);

    // voteモード用（既存）
    const [pin, setPin] = useState("");
    const pinOkVote = useMemo(() => isValidPin(pin), [pin]);

    // ✅ linkモード用（props）
    const pinOkLink = useMemo(() => {
        if (!pinRequired) return true;
        return isValidPin(String(pinProp ?? ""));
    }, [pinProp, pinRequired]);

    useEffect(() => {
        if (!("NDEFReader" in window)) {
            setIsSupported(false);
            setMessage(
                "このブラウザはNFCに対応していません（Android Chrome推奨）。",
            );
        }
    }, []);

    useEffect(() => {
        setStatus("IDLE");
        setMessage(
            mode === "VOTE_TOKEN_ISSUE"
                ? "PIN(4桁)を入力してから「スキャン開始」を押してください"
                : "「スキャン開始」を押してカードをかざしてください",
        );
    }, [mode]);

    const startScan = async () => {
        if (!("NDEFReader" in window)) return;

        // ✅ IDENTITY_LINK でも PIN必須にできる
        if (mode === "IDENTITY_LINK") {
            if (pinRequired && !pinOkLink) {
                setStatus("ERROR");
                const m = "PINは4桁の数字で入力してください。";
                setMessage(m);
                onError?.(m);
                return;
            }
        }

        if (mode === "VOTE_TOKEN_ISSUE") {
            if (!electionId) {
                setStatus("ERROR");
                setMessage("electionId がありません（画面側の指定ミスです）");
                return;
            }
            if (!pinOkVote) {
                setStatus("ERROR");
                setMessage("PINは4桁の数字で入力してください。");
                return;
            }
        }

        setStatus("SCANNING");
        setMessage("カードをスマートフォンの背面に近づけてください...");

        try {
            // @ts-ignore
            const ndef = new NDEFReader();
            await ndef.scan();

            ndef.onreading = async (event: any) => {
                setStatus((prev) => {
                    if (prev === "PROCESSING" || prev === "SUCCESS")
                        return prev;
                    return "PROCESSING";
                });

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

                setMessage(`読み取り成功: ${uuid}\nサーバーに送信中...`);

                try {
                    if (mode === "IDENTITY_LINK") {
                        const pinToSend = pinRequired
                            ? String(pinProp ?? "")
                            : undefined;
                        const token = await linkIdentity({
                            citizenId: uuid,
                            pin: pinToSend,
                        });

                        await setAccessToken(token.accessToken);

                        setStatus("SUCCESS");
                        setMessage("認証に成功しました！");

                        setTimeout(() => onLinked(token.accessToken), 500);
                        return;
                    }

                    // === VOTE_TOKEN_ISSUE ===
                    const r = await issueVoteToken({
                        electionId: electionId as string,
                        payload: uuid,
                        pin,
                    });

                    setStatus("SUCCESS");
                    setMessage("本人認証に成功しました！（投票を開始します）");

                    setTimeout(() => onLinked(r.voteToken), 500);
                } catch (err: any) {
                    const status = err?.response?.status;
                    const msg = err?.response?.data?.message;

                    setStatus("ERROR");
                    if (status === 401) setMessage(msg ?? "PINが違います。");
                    else if (status === 404)
                        setMessage(msg ?? "市民情報が見つかりませんでした。");
                    else setMessage(msg ?? "サーバー認証に失敗しました");

                    onError?.(msg ?? "サーバー認証に失敗しました");
                }
            };

            ndef.onreadingerror = () => {
                setStatus("ERROR");
                const m =
                    "読み取りエラーが発生しました。カードをしっかり密着させてください。";
                setMessage(m);
                onError?.(m);
            };
        } catch (error) {
            console.error(error);
            setStatus("ERROR");
            const m = "NFCの起動に失敗しました。権限を許可してください。";
            setMessage(m);
            onError?.(m);
        }
    };

    if (!isSupported) {
        return (
            <div style={{ padding: 20, textAlign: "center", color: "crimson" }}>
                <p>{message}</p>
            </div>
        );
    }

    const scanDisabled =
        status === "SCANNING" ||
        status === "PROCESSING" ||
        status === "SUCCESS";

    return (
        <div style={{ textAlign: "center", display: "grid", gap: 16 }}>
            {/* voteモード PIN入力（既存） */}
            {mode === "VOTE_TOKEN_ISSUE" && (
                <div style={{ display: "grid", gap: 8 }}>
                    <div style={{ fontWeight: 700, textAlign: "left" }}>
                        PIN（4桁）
                    </div>
                    <input
                        inputMode="numeric"
                        pattern="\d{4}"
                        maxLength={4}
                        value={pin}
                        onChange={(e) => {
                            const v = e.target.value
                                .replace(/[^\d]/g, "")
                                .slice(0, 4);
                            setPin(v);
                        }}
                        placeholder="例: 1234"
                        style={{
                            padding: 12,
                            fontSize: 16,
                            borderRadius: 10,
                            border: "1px solid #ddd",
                        }}
                        disabled={scanDisabled}
                    />
                    <div
                        style={{
                            fontSize: 12,
                            opacity: 0.75,
                            textAlign: "left",
                        }}
                    >
                        ※ PINを入力してからスキャンしてください
                    </div>
                </div>
            )}

            {/* linkモード PIN未入力注意（表示だけ。入力は親でやる） */}
            {mode === "IDENTITY_LINK" && pinRequired && !pinOkLink && (
                <div style={{ fontSize: 12, opacity: 0.8, textAlign: "left" }}>
                    ※ 先に PIN（4桁）を入力してください
                </div>
            )}

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
                <p style={{ margin: "10px 0 0", whiteSpace: "pre-wrap" }}>
                    {message}
                </p>
            </div>

            <button
                onClick={startScan}
                disabled={
                    scanDisabled ||
                    (mode === "VOTE_TOKEN_ISSUE" && !pinOkVote) ||
                    (mode === "IDENTITY_LINK" && pinRequired && !pinOkLink)
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
