// frontend/src/identity/components/IdentityNfcScanner.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../user/UserAuthContext";
import {
    performIdentityAction,
    type IdentityActionMode,
} from "../services/identityAction";
import {
    extractUuidFromNdef,
    looksLikeUuid,
    isPinValid,
} from "../utils/identityValidation";

type Props = {
    onLinked: (token: string) => void;
    onError?: (msg: string) => void;

    mode?: IdentityActionMode;
    electionId?: string;

    pin?: string;
    pinRequired?: boolean;
};

export function IdentityNfcScanner({
    onLinked,
    onError,
    mode = "IDENTITY_LINK",
    electionId,
    pin = "",
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
    const busyRef = useRef(false);

    const pinOk = useMemo(
        () => !pinRequired || isPinValid(pin),
        [pin, pinRequired],
    );

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
        busyRef.current = false;
    }, [mode]);

    const startScan = async () => {
        if (!("NDEFReader" in window)) return;

        if (!pinOk) {
            setStatus("ERROR");
            const m = "PINは4桁の数字で入力してください。";
            setMessage(m);
            onError?.(m);
            return;
        }

        if (mode === "VOTE_TOKEN_ISSUE" && !String(electionId ?? "").trim()) {
            setStatus("ERROR");
            const m = "electionId がありません（画面側の指定ミスです）";
            setMessage(m);
            onError?.(m);
            return;
        }

        setStatus("SCANNING");
        setMessage("カードをスマートフォンの背面に近づけてください...");

        try {
            // @ts-ignore
            const ndef = new NDEFReader();
            await ndef.scan();

            ndef.onreading = async (event: any) => {
                if (busyRef.current) return;
                busyRef.current = true;

                setStatus("PROCESSING");

                const uuid = extractUuidFromNdef(event);
                if (!uuid || !looksLikeUuid(uuid)) {
                    setStatus("ERROR");
                    const m =
                        "タグから citizenId(UUID) を読み取れませんでした（TextレコードにUUIDが入っているか確認してください）。";
                    setMessage(m);
                    onError?.(m);
                    busyRef.current = false;
                    return;
                }

                setMessage(`読み取り成功: ${uuid}\nサーバーに送信中...`);

                try {
                    const r = await performIdentityAction({
                        mode,
                        payload: uuid, //citizenId: uuid, 02/16変更ポイント
                        pin,
                        //pinRequired, 02/16変更ポイント
                        electionId,
                        setAccessToken,
                    });

                    setStatus("SUCCESS");
                    setMessage("認証に成功しました！");
                    setTimeout(() => {
                        onLinked(
                            r.kind === "LINK" ? r.accessToken : r.voteToken,
                        );
                    }, 500);
                } catch (err: any) {
                    const m =
                        err?.response?.data?.message ??
                        (mode === "IDENTITY_LINK"
                            ? "本人認証に失敗しました"
                            : "本人認証（投票）に失敗しました");
                    setStatus("ERROR");
                    setMessage(m);
                    onError?.(m);
                } finally {
                    busyRef.current = false;
                }
            };

            ndef.onreadingerror = () => {
                setStatus("ERROR");
                const m =
                    "読み取りエラーが発生しました。カードをしっかり密着させてください。";
                setMessage(m);
                onError?.(m);
            };
        } catch {
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
            {!pinOk && (
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
                disabled={scanDisabled || !pinOk}
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
