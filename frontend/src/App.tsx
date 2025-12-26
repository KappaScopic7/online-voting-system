// frontend/src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';

import { LoginPage } from './pages/LoginPage';
import { MyElectionsPage } from './pages/MyElectionsPage';
import { ElectionDetailPage } from './pages/ElectionDetailPage';
import { VotePage } from './pages/VotePage';
import { ElectionResultPage } from './pages/ElectionResultPage';
import { VoteHistoryPage } from './pages/VoteHistoryPage';
import { MyPage } from './pages/MyPage';

import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';

export default function App() {
    return (
        <AuthProvider>
            <div style={{ maxWidth: 800, margin: '0 auto', padding: 16 }}>
                <Header />
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />

                    <Route element={<ProtectedRoute />}>
                        <Route path="/my" element={<MyPage />} />
                        <Route path="/my-elections" element={<MyElectionsPage />} />
                        <Route path="/elections/:id" element={<ElectionDetailPage />} />
                        <Route path="/elections/:id/vote" element={<VotePage />} />
                        <Route path="/elections/:id/result" element={<ElectionResultPage />} />
                        <Route path="/my/votes" element={<VoteHistoryPage />} />
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
        </AuthProvider>
    );
}
