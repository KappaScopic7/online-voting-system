// committee/pages/CommitteeHomePage.tsx
import { Link } from "react-router-dom";

export function CommitteeHomePage() {
    return (
        <div style={{ padding: 16 }}>
            <h2>選挙管理委員会ホーム</h2>

            <ul>
                <li>
                    <Link to="/committee/elections">担当選挙の管理</Link>
                </li>
                <li>
                    <Link to="/committee/results">開票・結果確認</Link>
                </li>
                <li>
                    <Link to="/committee/me">アカウント情報</Link>
                </li>
            </ul>
        </div>
    );
}
