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

    private static final Pattern UUID_STRICT = Pattern.compile(
            "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$");

    private static final Pattern UUID_LOOSE = Pattern.compile(
            "(?i)\\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\b");

    // ★ wait時間（接続確認時間）を延ばすだけ
    private static final int WAIT_FOR_PRESENT_MS = 5000; // 1000 -> 5000
    private static final int WAIT_FOR_ABSENT_MS = 3000; // 1000 -> 3000

    public static void main(String[] args) throws Exception {
        String enable = System.getenv("OVS_NFC_BRIDGE");
        if (!"1".equals(enable)) {
            System.out.println("[bridge] disabled (set OVS_NFC_BRIDGE=1 to enable)");
            return;
        }

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
        try {
            TerminalFactory factory = TerminalFactory.getDefault();
            List<CardTerminal> terminals = factory.terminals().list();
            if (terminals.isEmpty()) {
                System.out.println("[nfc] no card terminals found -> stop");
                return; // ← ループしない
            }
        } catch (Exception e) {
            System.out.println("[nfc] init failed -> stop: " + e.getMessage());
            return;
        }

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
                        terminal.waitForCardPresent(WAIT_FOR_PRESENT_MS); // ★延長
                    } catch (CardException ce) {
                        System.out.println("[nfc] waitForCardPresent failed: " + ce.getMessage());
                        break;
                    }

                    if (!terminal.isCardPresent())
                        continue;

                    Card card = null;
                    try {
                        card = terminal.connect("*");
                        CardChannel channel = card.getBasicChannel();

                        byte[] raw = readManyBlocks(channel, 4, 40);

                        System.out.println("[nfc] dump(hex) = " + toHex(raw, 128));
                        System.out.println("[nfc] dump(ascii)= " + toAscii(raw, 128));

                        String uuid = extractUuidFromRaw(raw);

                        if (uuid != null) {
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
                            terminal.waitForCardAbsent(WAIT_FOR_ABSENT_MS); // ★延長
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
                break;
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
            return null;
        return d;
    }

    private static String extractUuidFromRaw(byte[] raw) {
        if (raw == null || raw.length == 0)
            return null;

        String joined = joinNdefTextRecordsBestEffort(raw);
        if (joined != null && !joined.isBlank()) {
            String u1 = findUuidInside(joined);
            if (u1 != null)
                return u1;

            String norm = keepHexAndDash(joined);
            String u2 = findUuidInside(norm);
            if (u2 != null)
                return u2;
        }

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

    private static boolean isHex(char c) {
        return (c >= '0' && c <= '9')
                || (c >= 'a' && c <= 'f')
                || (c >= 'A' && c <= 'F');
    }

    private static String joinNdefTextRecordsBestEffort(byte[] raw) {
        StringBuilder out = new StringBuilder();

        for (int recStart = 0; recStart < raw.length - 4; recStart++) {
            int hdr = raw[recStart] & 0xFF;

            boolean sr = (hdr & 0x10) != 0;
            int tnf = (hdr & 0x07);
            if (!sr || tnf != 0x01)
                continue;

            int typeLenPos = recStart + 1;
            int payloadLenPos = recStart + 2;
            if (payloadLenPos >= raw.length)
                continue;

            int typeLen = raw[typeLenPos] & 0xFF;
            int payloadLen = raw[payloadLenPos] & 0xFF;

            int pos = recStart + 3;

            boolean il = (hdr & 0x08) != 0;
            int idLen = 0;
            if (il) {
                if (pos >= raw.length)
                    continue;
                idLen = raw[pos] & 0xFF;
                pos++;
            }

            if (pos + typeLen > raw.length)
                continue;
            if (typeLen != 1 || raw[pos] != 0x54)
                continue;
            pos += typeLen;

            if (pos + idLen > raw.length)
                continue;
            pos += idLen;

            if (pos + payloadLen > raw.length)
                continue;

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

            if (UUID_STRICT.matcher(uuid).matches())
                return uuid;

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
