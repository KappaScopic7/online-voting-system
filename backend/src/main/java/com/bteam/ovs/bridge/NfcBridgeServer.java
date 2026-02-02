package com.bteam.ovs.bridge;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import javax.smartcardio.*;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicReference;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class NfcBridgeServer {

    private static final AtomicReference<String> lastUuid = new AtomicReference<>(null);

    // RFC4122っぽいバリアント/バージョンも含めて厳格に（あなたの値 550e... は v4 なのでOK）
    private static final Pattern UUID_STRICT = Pattern.compile(
            "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$");

    // “UUIDっぽい形” を広く拾う（strictは後段でかける）
    private static final Pattern UUID_LOOSE = Pattern.compile(
            "(?i)\\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\b");

    public static void main(String[] args) throws Exception {
        int port = 39123;

        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", port), 0);

        server.createContext("/health", ex -> json(ex, 200, "{\"ok\":true}"));

        server.createContext("/last", ex -> {
            addCors(ex);
            if ("OPTIONS".equalsIgnoreCase(ex.getRequestMethod())) {
                ex.sendResponseHeaders(204, -1);
                ex.close();
                return;
            }

            String v = lastUuid.get();
            if (v == null || v.isBlank()) {
                ex.sendResponseHeaders(204, -1);
                ex.close();
                return;
            }
            json(ex, 200, "{\"uuid\":\"" + v + "\"}");
        });

        server.createContext("/clear", ex -> {
            addCors(ex);
            if ("OPTIONS".equalsIgnoreCase(ex.getRequestMethod())) {
                ex.sendResponseHeaders(204, -1);
                ex.close();
                return;
            }
            if (!"POST".equalsIgnoreCase(ex.getRequestMethod())) {
                ex.sendResponseHeaders(405, -1);
                ex.close();
                return;
            }
            lastUuid.set(null);
            json(ex, 200, "{\"cleared\":true}");
        });

        server.setExecutor(Executors.newFixedThreadPool(4));
        server.start();

        System.out.println("[bridge] listening on http://127.0.0.1:" + port);
        System.out.println("[bridge] endpoints: GET /health, GET /last, POST /clear");

        Thread nfcThread = new Thread(NfcBridgeServer::readLoop, "nfc-read-loop");
        nfcThread.setDaemon(true);
        nfcThread.start();
    }

    private static void readLoop() {
        while (true) {
            try {
                TerminalFactory factory = TerminalFactory.getDefault();
                List<CardTerminal> terminals = factory.terminals().list();
                if (terminals.isEmpty()) {
                    System.out.println("[nfc] no card terminals found");
                    sleep(1000);
                    continue;
                }

                CardTerminal terminal = terminals.get(0);
                System.out.println("[nfc] using terminal: " + terminal.getName());
                System.out.println("[nfc] waiting for card...");

                while (true) {
                    try {
                        terminal.waitForCardPresent(1000);
                    } catch (CardException ce) {
                        System.out.println("[nfc] waitForCardPresent failed: " + ce.getMessage());
                        break; // 端末取り直し
                    }

                    if (!terminal.isCardPresent())
                        continue;

                    Card card = null;
                    try {
                        card = terminal.connect("*");
                        CardChannel channel = card.getBasicChannel();

                        // ★PaSoRi環境では「連番ブロック＝連続メモリ」が怪しいので、多めに読んでノイズから復元する
                        byte[] raw = readManyBlocks(channel, 4, 40); // 4..39 (36ブロック=576B)

                        // 必要ならダンプ（重いならmax小さく）
                        System.out.println("[nfc] dump(hex) = " + toHex(raw, 128));
                        System.out.println("[nfc] dump(ascii)= " + toAscii(raw, 128));

                        String uuid = extractUuidFromRaw(raw);

                        if (uuid != null) {
                            // 最終チェック
                            UUID.fromString(uuid);
                            lastUuid.set(uuid);
                            System.out.println("[nfc] captured uuid: " + uuid);
                        } else {
                            System.out.println("[nfc] uuid not found (check card content)");
                        }

                    } catch (Exception e) {
                        System.out.println("[nfc] read error: " + e.getMessage());
                    } finally {
                        if (card != null) {
                            try {
                                card.disconnect(false);
                            } catch (Exception ignored) {
                            }
                        }

                        try {
                            terminal.waitForCardAbsent(1000);
                        } catch (CardException ce) {
                            System.out.println("[nfc] waitForCardAbsent failed: " + ce.getMessage());
                            break;
                        }
                        System.out.println("[nfc] waiting for next card...");
                    }
                }
            } catch (Exception e) {
                System.out.println("[nfc] fatal(loop): " + e.getMessage());
            }

            sleep(500);
        }
    }

    private static byte[] readManyBlocks(CardChannel channel, int startBlock, int endExclusive) throws CardException {
        byte[] buf = new byte[(endExclusive - startBlock) * 16];
        int idx = 0;

        for (int block = startBlock; block < endExclusive; block += 4) {
            byte[] d = readBlock16(channel, block);
            if (d == null)
                break; // 読めない領域に入った
            System.arraycopy(d, 0, buf, idx, 16);
            idx += 16;
        }

        byte[] out = new byte[idx];
        System.arraycopy(buf, 0, out, 0, idx);
        return out;
    }

    private static byte[] readBlock16(CardChannel channel, int block) throws CardException {
        byte[] cmd = new byte[] { (byte) 0xFF, (byte) 0xB0, (byte) 0x00, (byte) block, (byte) 0x10 };
        ResponseAPDU res = channel.transmit(new CommandAPDU(cmd));
        if (res.getSW() != 0x9000)
            return null;

        byte[] d = res.getData();
        if (d == null || d.length != 16)
            return null; // 0バイト等は失敗扱い
        return d;
    }

    /**
     * rawからUUIDを抽出する。
     * 1) NDEF Text Record を best-effort でパースして text を連結
     * 2) 連結文字列からUUIDを抽出（strict優先）
     * 3) だめなら raw を printable ASCII に落として拾う（最終保険）
     */
    private static String extractUuidFromRaw(byte[] raw) {
        if (raw == null || raw.length == 0)
            return null;

        String joined = joinNdefTextRecordsBestEffort(raw);
        if (joined != null && !joined.isBlank()) {
            // 1) そのまま探す
            String u1 = findUuidInside(joined);
            if (u1 != null)
                return u1;

            // 2) “hexとダッシュだけ” に正規化して探す（今回これが効く）
            String norm = keepHexAndDash(joined);
            String u2 = findUuidInside(norm);
            if (u2 != null)
                return u2;
        }

        // 最終保険：rawをprintable ASCIIにしてから同じこと
        String ascii = toPrintableAscii(raw);

        String u3 = findUuidInside(ascii);
        if (u3 != null)
            return u3;

        String u4 = findUuidInside(keepHexAndDash(ascii));
        if (u4 != null)
            return u4;

        return null;
    }

    private static String keepHexAndDash(String s) {
        if (s == null)
            return null;

        StringBuilder sb = new StringBuilder(s.length());
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == '-' || isHex(c))
                sb.append(c);
        }
        return sb.toString();
    }

    // 既に isHex が無い場合は追加（あなたの全体差し替え版には入ってないので要注意）
    private static boolean isHex(char c) {
        return (c >= '0' && c <= '9')
                || (c >= 'a' && c <= 'f')
                || (c >= 'A' && c <= 'F');
    }

    /**
     * rawのどこかに埋もれている NDEF Short Record (SR=1) の Text record(type='T') を拾って結合する。
     * - 先頭がTLVでも途中でも、とにかく "SR + TNF=WellKnown + type='T'" を探索する
     * - ID Length(IL) にも対応
     */
    private static String joinNdefTextRecordsBestEffort(byte[] raw) {
        StringBuilder out = new StringBuilder();

        for (int recStart = 0; recStart < raw.length - 4; recStart++) {
            int hdr = raw[recStart] & 0xFF;

            boolean sr = (hdr & 0x10) != 0; // Short Record
            int tnf = (hdr & 0x07);
            if (!sr || tnf != 0x01)
                continue; // SR + Well-known

            int typeLenPos = recStart + 1;
            int payloadLenPos = recStart + 2;
            if (payloadLenPos >= raw.length)
                continue;

            int typeLen = raw[typeLenPos] & 0xFF;
            int payloadLen = raw[payloadLenPos] & 0xFF;

            int pos = recStart + 3;

            boolean il = (hdr & 0x08) != 0; // ID Length present
            int idLen = 0;
            if (il) {
                if (pos >= raw.length)
                    continue;
                idLen = raw[pos] & 0xFF;
                pos++;
            }

            // type
            if (pos + typeLen > raw.length)
                continue;
            if (typeLen != 1 || raw[pos] != 0x54)
                continue; // 'T'
            pos += typeLen;

            // id
            if (pos + idLen > raw.length)
                continue;
            pos += idLen;

            // payload
            if (pos + payloadLen > raw.length)
                continue;

            // Text payload format: [status][lang...][text...]
            if (payloadLen >= 1) {
                int status = raw[pos] & 0xFF;
                int langLen = status & 0x3F;
                int textStart = pos + 1 + langLen;
                int textLen = (pos + payloadLen) - textStart;

                if (textLen >= 0 && textStart >= 0
                        && textStart + textLen <= raw.length) {
                    String text = new String(raw, textStart, textLen, StandardCharsets.UTF_8);
                    out.append(text);
                }
            }

            // レコード全長を計算して探索位置を飛ばす（高速化＆誤検出減）
            int recLen = 3 + (il ? 1 : 0) + typeLen + idLen + payloadLen;
            recStart += Math.max(0, recLen - 1);
        }

        String s = out.toString().trim();
        return s.isBlank() ? null : s;
    }

    private static String findUuidInside(String s) {
        if (s == null)
            return null;

        Matcher m = UUID_LOOSE.matcher(s);
        while (m.find()) {
            String uuid = m.group();

            // strict優先
            if (UUID_STRICT.matcher(uuid).matches())
                return uuid;

            // strictにしないならこれでもOK
            try {
                UUID.fromString(uuid);
                return uuid;
            } catch (Exception ignored) {
            }
        }
        return null;
    }

    private static String toPrintableAscii(byte[] raw) {
        StringBuilder sb = new StringBuilder(raw.length);
        for (byte b : raw) {
            int x = b & 0xFF;
            sb.append((x >= 0x20 && x <= 0x7E) ? (char) x : ' ');
        }
        return sb.toString();
    }

    private static void addCors(HttpExchange ex) {
        ex.getResponseHeaders().add("Access-Control-Allow-Origin", "http://localhost:5173");
        ex.getResponseHeaders().add("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
        ex.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");
    }

    private static void json(HttpExchange ex, int status, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        ex.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        ex.sendResponseHeaders(status, bytes.length);
        try (OutputStream os = ex.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static String toHex(byte[] data, int max) {
        StringBuilder sb = new StringBuilder();
        int n = Math.min(data.length, max);
        for (int i = 0; i < n; i++) {
            sb.append(String.format("%02X", data[i])).append(i % 16 == 15 ? "\n" : " ");
        }
        return sb.toString();
    }

    private static String toAscii(byte[] data, int max) {
        StringBuilder sb = new StringBuilder();
        int n = Math.min(data.length, max);
        for (int i = 0; i < n; i++) {
            int x = data[i] & 0xFF;
            sb.append((x >= 0x20 && x <= 0x7E) ? (char) x : '.');
        }
        return sb.toString();
    }

    private static void sleep(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException ignored) {
        }
    }
}
