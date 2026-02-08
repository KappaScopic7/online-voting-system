// frontend/src/routes/userRoutes.tsx
import { Routes, Route } from "react-router-dom";

import { RequireAuth } from "../auth/routes/RequireAuth";
import { RequireVerifiedEmail } from "../auth/routes/RequireVerifiedEmail";
// import { RequireIdentityLinked } from "../auth/routes/RequireIdentityLinked";

import { MePage } from "../me/pages/MePage";
import { IdentityLinkPage } from "../identity/pages/IdentityLinkPage";
import { IdentityPendingPage } from "../identity/pages/IdentityPendingPage";

import { MyElectionsPage } from "../elections/pages/MyElectionsPage";

import { VoteHistoryPage } from "../voting/pages/VoteHistoryPage";
import { AllocVoteHistoryPage } from "../voting/pages/AllocVoteHistoryPage";

// import { VotingStartPage } from "../voting/pages/VotingStartPage";
// import { AllocVotingStartPage } from "../voting/pages/AllocVotingStartPage";

export function UserRoutes() {
    return (
        <Routes>
            {/* ログイン必須: /me, /me/identity, /me/identity/pending */}
            <Route element={<RequireAuth />}>
                <Route index element={<MePage />} />
                <Route path="identity" element={<IdentityLinkPage />} />
                <Route
                    path="identity/pending"
                    element={<IdentityPendingPage />}
                />
            </Route>

            {/* メール認証必須: /me/elections, /me/votes, /me/alloc-votes */}
            <Route element={<RequireVerifiedEmail />}>
                <Route path="elections" element={<MyElectionsPage />} />
                <Route path="votes" element={<VoteHistoryPage />} />
                <Route path="alloc-votes" element={<AllocVoteHistoryPage />} />
            </Route>

            {/* ここで /voting/start を守るのは非推奨（PublicRoutes側が先に当たりやすい） */}
        </Routes>
    );
}
