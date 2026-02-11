import { Navigate, useLocation } from "react-router-dom";
import { staffToken } from "../shared/tokenStorage";

export function AdminGuard({ children }: { children: React.ReactNode }) {
    const loc = useLocation();
    const token = staffToken.get(); // 無いなら作る or 既存の staff token storage を使う

    if (!token) {
        // 既存の staff ログイン画面に合わせて変更
        return (
            <Navigate
                to="/admin/login"
                replace
                state={{ from: loc.pathname }}
            />
        );
    }
    return <>{children}</>;
}
