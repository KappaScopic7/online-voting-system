// frontend/src/admin/pages/AdminStaffPage.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchStaffList, type StaffListItem } from "../api/staff";

export function AdminStaffPage() {
    const [items, setItems] = useState<StaffListItem[] | null>(null);
    const [msg, setMsg] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // 一覧取得処理
    const load = useCallback(async () => {
        setMsg(null);
        try {
            setIsLoading(true);
            const data = await fetchStaffList();
            setItems(data);
        } catch (err: any) {
            setMsg(err?.message ?? "アカウント一覧の取得に失敗しました");
            setItems([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    // 表示用フラグ
    const hasItems = useMemo(() => {
        return items !== null && items.length > 0;
    }, [items]);

    return (
        <div style={{ padding: 16, display: "grid", gap: 12 }}>
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                }}
            >
                <h3 style={{ margin: 0 }}>管理者アカウント一覧</h3>

                <button onClick={load} disabled={isLoading}>
                    {isLoading ? "Loading..." : "Reload"}
                </button>
            </div>

            {/* Error Message */}
            {msg && (
                <div role="alert" style={{ padding: 8, border: "1px solid #ccc" }}>
                    {msg}
                </div>
            )}

            {/* Body */}
            {items === null ? (
                <p>Loading...</p>
            ) : !hasItems ? (
                <p>アカウントがありません</p>
            ) : (
                <table
                    style={{
                        borderCollapse: "collapse",
                        width: "100%",
                        marginTop: 12,
                    }}
                >
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>ログインID</th>
                            <th>Email</th>
                            <th>権限</th>
                            <th>有効</th>
                            <th>作成日</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((s) => (
                            <tr key={s.staffId}>
                                <td>{s.staffId}</td>
                                <td>{s.loginId}</td>
                                <td>{s.email}</td>
                                <td>{s.role}</td>
                                <td>{s.enabled ? "有効" : "無効"}</td>
                                <td>
                                    {new Date(s.createdAt).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
