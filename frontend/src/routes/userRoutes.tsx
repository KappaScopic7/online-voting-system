import { Routes, Route } from "react-router-dom";

import { RequireAuth } from "../auth/routes/RequireAuth";
import { RequireVerifiedEmail } from "../auth/routes/RequireVerifiedEmail";

import { MePage } from "../me/pages/MePage";
import { MeProfilePage } from "../me/pages/MeProfilePage";
import { FavoritesPage } from "../me/pages/FavoritesPage";
import { IdentityLinkPage } from "../identity/pages/IdentityLinkPage";
import { IdentityPendingPage } from "../identity/pages/IdentityPendingPage";

import { MyElectionsPage } from "../elections/pages/MyElectionsPage";

import { VoteHistoryPage } from "../voting/pages/VoteHistoryPage";
import { AllocVoteHistoryPage } from "../voting/pages/AllocVoteHistoryPage";

export function UserRoutes() {
    return (
        <Routes>
            <Route element={<RequireAuth />}>
                <Route index element={<MePage />} />
                <Route path="profile" element={<MeProfilePage />} />{" "}
                <Route path="favorites" element={<FavoritesPage />} />
                <Route path="identity" element={<IdentityLinkPage />} />
                <Route
                    path="identity/pending"
                    element={<IdentityPendingPage />}
                />
            </Route>

            <Route element={<RequireVerifiedEmail />}>
                <Route path="elections" element={<MyElectionsPage />} />
                <Route path="votes" element={<VoteHistoryPage />} />
                <Route path="alloc-votes" element={<AllocVoteHistoryPage />} />
            </Route>
        </Routes>
    );
}
