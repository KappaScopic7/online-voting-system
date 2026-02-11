import { useMemo, useState } from "react";
import { Card, Page } from "../../shared/ui/page";
import { httpStaff } from "../../shared/httpStaff";

export function AdminBackupPage() {
    const [file, setFile] = useState<File | null>(null);
    const [msg, setMsg] = useState<string>("");

    const canUpload = useMemo(() => !!file, [file]);

    async function downloadBackup() {
        setMsg("");
        const res = await httpStaff.get("/admin/backup", {
            responseType: "blob",
        });
        const blob = res.data as Blob;

        // Content-Disposition の filename を拾えるなら拾う（無ければ固定名）
        const cd = String(res.headers?.["content-disposition"] ?? "");
        const m = /filename="([^"]+)"/.exec(cd);
        const filename = m?.[1] ?? "ovs_backup.sql";

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
        setMsg("バックアップをダウンロードしました");
    }

    async function uploadRestore() {
        if (!file) return;
        setMsg("");

        const fd = new FormData();
        fd.append("file", file);

        try {
            const res = await httpStaff.post("/admin/backup", fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setMsg(String(res.data ?? "ok"));
        } catch (e: any) {
            setMsg(e?.response?.data ?? e?.message ?? "restore failed");
        }
    }

    return (
        <Page title="Admin / バックアップ">
            <Card>
                <div style={{ display: "grid", gap: 12 }}>
                    <button onClick={downloadBackup}>
                        バックアップをダウンロード（.sql）
                    </button>

                    <div style={{ display: "grid", gap: 8 }}>
                        <input
                            type="file"
                            accept=".sql"
                            onChange={(e) =>
                                setFile(e.target.files?.[0] ?? null)
                            }
                        />
                        <button disabled={!canUpload} onClick={uploadRestore}>
                            リストア（アップロードした .sql を投入）
                        </button>
                    </div>

                    {msg ? (
                        <div style={{ whiteSpace: "pre-wrap" }}>{msg}</div>
                    ) : null}
                </div>
            </Card>
        </Page>
    );
}
