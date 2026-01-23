import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./app/App";

import { AuthProvider } from "./auth/AuthContext";
import { StaffAuthProvider } from "./staff/StaffAuthContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <BrowserRouter>
            {/* 一般ユーザー */}
            <AuthProvider>
                {/* 管理者・委員会 */}
                <StaffAuthProvider>
                    <App />
                </StaffAuthProvider>
            </AuthProvider>
        </BrowserRouter>
    </React.StrictMode>,
);
