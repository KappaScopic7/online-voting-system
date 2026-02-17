// frontend/src/admin/pages/AdminHomePage.tsx
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { staffToken } from "../../shared/tokenStorage";

function parseFilenameFromContentDisposition(v: string | null): string | null {
    if (!v) return null;
    // attachment; filename="xxx.sql"
    const m = /filename="([^"]+)"/i.exec(v);
    return m?.[1] ?? null;
}

export function AdminHomePage() {
    const [msg, setMsg] = useState<string>("");
    const [busy, setBusy] = useState<boolean>(false);
    const [file, setFile] = useState<File | null>(null);

    const canRestore = useMemo(() => !!file && !busy, [file, busy]);

    async function downloadBackup() {
        setMsg("");
        setBusy(true);
        try {
            const token = staffToken.get();
            const res = await fetch("/api/admin/backup", {
                method: "GET",
                headers: {
                    Authorization: token ? `Bearer ${token}` : "",
                },
            });
            const ct = res.headers.get("content-type") ?? "";
            if (ct.includes("text/html")) {
                const t = await res.text();
                throw new Error(
                    `HTMLを受信しました。URLがフロントに当たってます。\n${t.slice(0, 200)}`,
                );
            }

            if (!res.ok) {
                const t = await res.text().catch(() => "");
                throw new Error(`backup failed: ${res.status}\n${t}`);
            }

            const blob = await res.blob();
            const filename =
                parseFilenameFromContentDisposition(
                    res.headers.get("content-disposition"),
                ) ?? "ovs_backup.sql";

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            a.click();
            window.URL.revokeObjectURL(url);

            setMsg("バックアップをダウンロードしました。");
        } catch (e: any) {
            setMsg(e?.message ?? String(e));
        } finally {
            setBusy(false);
        }
    }

    async function restoreBackup() {
        if (!file) return;
        setMsg("");
        setBusy(true);

        try {
            const token = staffToken.get();
            const fd = new FormData();
            fd.append("file", file);

            const res = await fetch("/api/admin/backup", {
                method: "POST",
                headers: {
                    Authorization: token ? `Bearer ${token}` : "",
                    // multipart は fetch が boundary を付けるので Content-Type は付けない
                },
                body: fd,
            });

            const text = await res.text().catch(() => "");
            if (!res.ok) {
                throw new Error(`restore failed: ${res.status}\n${text}`);
            }

            setMsg(text || "restore ok");
        } catch (e: any) {
            setMsg(e?.message ?? String(e));
        } finally {
            setBusy(false);
        }
    }

    return (
        <div style={{ padding: 16, display: "grid", gap: 24 }}>
            <div>
                <h2>管理者ホーム</h2>
                <ul>
                    <li>
                        <Link to="/admin/elections">
                            選挙管理（作成・編集・削除）
                        </Link>
                    </li>
                    <li>
                        <Link to="/admin/staff">スタッフ（委員会）管理</Link>
                    </li>
                    <li>
                        <Link to="/admin/me">管理者情報</Link>
                    </li>
                </ul>
            </div>

            <hr />

            <div style={{ display: "grid", gap: 12, maxWidth: 720 }}>
                <h3 style={{ margin: 0 }}>DBバックアップ</h3>

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <button onClick={downloadBackup} disabled={busy}>
                        {busy ? "処理中..." : "バックアップ（.sqlをDL）"}
                    </button>
                </div>

                <div style={{ display: "grid", gap: 8 }}>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>
                        リストアは DB が書き換わります（危険）。デモ用想定。
                    </div>

                    <input
                        type="file"
                        accept=".sql"
                        disabled={busy}
                        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />

                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        <button onClick={restoreBackup} disabled={!canRestore}>
                            {busy
                                ? "処理中..."
                                : "リストア（アップロード投入）"}
                        </button>

                        {file ? (
                            <span style={{ fontSize: 12, opacity: 0.8 }}>
                                選択中: {file.name}
                            </span>
                        ) : null}
                    </div>
                </div>

                {msg ? (
                    <pre
                        style={{
                            whiteSpace: "pre-wrap",
                            padding: 12,
                            border: "1px solid #ddd",
                            borderRadius: 8,
                            background: "#fafafa",
                        }}
                    >
                        {msg}
                    </pre>
                ) : null}
            </div>
        </div>
    );
}
