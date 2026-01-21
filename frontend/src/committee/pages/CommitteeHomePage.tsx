// committee/pages/CommitteeHomePage.tsx
import { Link } from "react-router-dom";

export function CommitteeHomePage() {
    return (
        <div style={{ padding: 16 }}>
            <header style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                <Link to="/committee">Committee Home</Link>
                <Link to="/committee/elections">Elections</Link>
                <Link to="/committee/results">Results</Link>
                <Link to="/committee/me">Me</Link>
                <Link to="/committee/logout">Logout</Link>
            </header>

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
