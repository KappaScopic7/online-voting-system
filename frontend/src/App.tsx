import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import ElectionsPage from './pages/ElectionsPage';
import CandidatesPage from './pages/CandidatesPage';
import ConfirmPage from './pages/ConfirmPage';
import DonePage from './pages/DonePage';
import VoteHistoryPage from './pages/VoteHistoryPage';

export default function App() {
    return (
        <AuthProvider>
            <Routes>
                <Route path="/login" element={<LoginPage />} />

                <Route element={<ProtectedRoute />}>
                    <Route path="/elections" element={<ElectionsPage />} />
                    <Route path="/elections/:electionId/candidates" element={<CandidatesPage />} />
                    <Route path="/elections/:electionId/confirm" element={<ConfirmPage />} />
                    <Route path="/done" element={<DonePage />} />
                    <Route path="/history" element={<VoteHistoryPage />} />
                </Route>

                <Route path="*" element={<Navigate to="/elections" replace />} />
            </Routes>
        </AuthProvider>
    );
}
