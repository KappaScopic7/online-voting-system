// frontend/src/layout/PublicFooterLayout.tsx


import { useStaffAuth } from "../../staff/StaffAuthContext";


export function PublicFooterLayout() {
  

    const { staff} = useStaffAuth();

    const isDev = import.meta.env?.DEV;

    // ★ reset UI state


    // ★ 「demo + staff + admin」だけ見せる（staff.role が取れない場合は staff がいるだけでもOK）
    const isAdminStaff =
        !!staff && (String((staff as any)?.role ?? "") === "ADMIN");

    // ★ DB reset action


    return (
        <div style={{ padding: 16 }}>

    

            <footer
                style={{
                    marginTop: 24,
                    opacity: 0.85,
                    fontSize: 12,
                    display: "flex",
                    gap: 12,
                    flexWrap: "wrap",
                    alignItems: "center",
                    borderTop: "1px solid #eee",
                    paddingTop: 12,
                }}
            >
                <span style={{ opacity: 0.7 }}>© OVS / B-team</span>

                {/* ★ DB reset button */}
                {isDev && staff && (
                    <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <button
                            type="button"
                                                    title={
                                !isAdminStaff
                                    ? "ADMINでログインしたSTAFFのみ実行できます"
                                    : "DBをリセットしてデモデータを再投入します"
                            }
                            style={{
                                fontSize: 12,
                                padding: "4px 8px",
                                border: "1px solid #d99",
                            }}
                        >
                           
                        </button>

                        
                    </div>
                )}
            </footer>
        </div>
    );
}
