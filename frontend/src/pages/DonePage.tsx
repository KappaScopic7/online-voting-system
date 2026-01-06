import { useNavigate } from 'react-router-dom';

export default function DonePage() {
    const nav = useNavigate();
    return (
        <div style={{ padding: 24 }}>
            <h2>投票完了</h2>
            <div>投票を受け付けました。</div>
            <button style={{ marginTop: 16 }} onClick={() => nav('/elections')}>
                選挙一覧へ
            </button>
        </div>
    );
}
