// admin/pages/AdminHomePage.tsx
import { Link } from "react-router-dom";
export function AdminHomePage() {
    return (
        <div style={{ padding: 16 }}>
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
    );
}
