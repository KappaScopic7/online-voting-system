// frontend/src/pages/MyPage.tsx
import { useNavigate } from 'react-router-dom';

export function MyPage() {
    const navigate = useNavigate();

    return (
        <main>
            <h1>Myページ</h1>

            <section>
                <h2>利用メニュー</h2>
                <div style={{ marginTop: 8, display: 'flex', gap: 12 }}>
                    <button type="button" onClick={() => navigate('/my-elections')}>
                        My選挙一覧を見る
                    </button>

                    <button type="button" onClick={() => navigate('/my/votes')}>
                        投票履歴を見る
                    </button>
                </div>
            </section>
        </main>
    );
}
