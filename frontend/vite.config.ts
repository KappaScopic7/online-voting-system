import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        strictPort: true,
        proxy: {
            "/api": {
                target: "http://localhost:8080",
                changeOrigin: true,
            },

            // ✅ NFC Bridge（CORS回避）
            "/nfc-bridge": {
                target: "http://127.0.0.1:39123",
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/nfc-bridge/, ""),
            },
        },
    },

    build: {
        sourcemap: true,
    },
});
