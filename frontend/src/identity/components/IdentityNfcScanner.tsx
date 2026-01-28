import { useState, useEffect } from "react";
import { linkIdentityByNfc } from "../api/identity";

type Props = {
    onLinked: (token: string) => void; // 成功時のコールバック
};

export function IdentityNfcScanner({ onLinked }: Props) {
    const [status, setStatus] = useState<
        "IDLE" | "SCANNING" | "PROCESSING" | "SUCCESS" | "ERROR"
    >("IDLE");
    const [message, setMessage] = useState(
        "「スキャン開始」を押してカードをかざしてください",
    );
    const [isSupported, setIsSupported] = useState(true);

    // ブラウザがNFCに対応しているかチェック
    useEffect(() => {
        if (!("NDEFReader" in window)) {
            setIsSupported(false);
            setMessage(
                "このブラウザはNFCに対応していません (Android Chromeを使用してください)",
            );
        }
    }, []);

    const startScan = async () => {
        if (!("NDEFReader" in window)) return;

        setStatus("SCANNING");
        setMessage("カードをスマートフォンの背面に近づけてください...");

        try {
            // @ts-ignore (TypeScriptの型定義が標準で含まれていない場合があるため)
            const ndef = new NDEFReader();

            // スキャン開始
            await ndef.scan();

            // 読み取りイベント
            ndef.onreading = async (event: any) => {
                const serialNumber = event.serialNumber;

                if (!serialNumber) {
                    setMessage(
                        "シリアルナンバーが読み取れませんでした。もう一度試してください。",
                    );
                    return;
                }

                // 読み取り成功 -> バックエンド送信処理へ
                setStatus("PROCESSING");
                setMessage(
                    `読み取り成功: ${serialNumber}\nサーバーに送信中...`,
                );

                try {
                    // ここでバックエンドAPIを叩く
                    await linkIdentityByNfc(serialNumber);

                    setStatus("SUCCESS");
                    setMessage("認証に成功しました！");

                    // 少し待ってから画面遷移させる
                    setTimeout(() => {
                        onLinked("dummy_token"); // 必要なら新しいトークンを渡す
                    }, 1000);
                } catch (err: any) {
                    setStatus("ERROR");
                    setMessage(
                        err?.response?.data?.message ??
                            "サーバー認証に失敗しました",
                    );
                    // エラーが出ても再スキャンできるようにボタンを表示
                }
            };

            // エラーハンドリング
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
                    height: 120,
                    background: status === "SCANNING" ? "#e6f7ff" : "#f5f5f5",
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                    border: "2px dashed #ccc",
                }}
            >
                {/* 状態に応じたアイコンやテキスト */}
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

            {/* スキャン開始ボタン (スキャン中や処理中は無効化) */}
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
