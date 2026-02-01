import { useEffect, useRef, useState, useCallback } from "react";
import { WS_BACKEND_URL } from "../config";

export type ConnectionState =
    | "idle"
    | "connecting"
    | "connected"
    | "authenticated"
    | "disconnected"
    | "error";

export interface LogEntry {
    timestamp: number;
    direction: "IN" | "OUT";
    raw: string;
}

export interface WsMessage {
    type: string;
    payload: Record<string, unknown>;
}

const MAX_LOG = 200;

export function useWebSocket(token: string | null) {
    const wsRef = useRef<WebSocket | null>(null);
    const [connectionState, setConnectionState] = useState<ConnectionState>("idle");
    const [lastMessage, setLastMessage] = useState<WsMessage | null>(null);
    const [messageLog, setMessageLog] = useState<LogEntry[]>([]);
    const [authMessage, setAuthMessage] = useState<string | null>(null);

    const appendLog = useCallback((direction: "IN" | "OUT", raw: string) => {
        setMessageLog((prev) => {
            const next = [...prev, { timestamp: Date.now(), direction, raw }];
            if (next.length > MAX_LOG) return next.slice(next.length - MAX_LOG);
            return next;
        });
    }, []);

    const send = useCallback((msg: { type: string; payload: unknown }) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            const raw = JSON.stringify(msg);
            wsRef.current.send(raw);
            appendLog("OUT", raw);
        }
    }, [appendLog]);

    useEffect(() => {
        if (!token) {
            setConnectionState("idle");
            return;
        }

        setConnectionState("connecting");
        setAuthMessage(null);

        const ws = new WebSocket(`${WS_BACKEND_URL}/?token=${token}`);
        wsRef.current = ws;
        let isFirstMessage = true;

        ws.addEventListener("open", () => {
            setConnectionState("connected");
        });

        ws.addEventListener("message", (event) => {
            const raw = typeof event.data === "string" ? event.data : String(event.data);
            appendLog("IN", raw);

            // The first message from the server is plain text: "Authenticated as {handle}"
            if (isFirstMessage) {
                isFirstMessage = false;
                setAuthMessage(raw);
                setConnectionState("authenticated");
                return;
            }

            try {
                const parsed: WsMessage = JSON.parse(raw);
                setLastMessage(parsed);
            } catch {
                console.warn("WS: failed to parse message as JSON:", raw);
            }
        });

        ws.addEventListener("close", () => {
            setConnectionState("disconnected");
        });

        ws.addEventListener("error", () => {
            setConnectionState("error");
        });

        return () => {
            ws.close();
            wsRef.current = null;
        };
    }, [token, appendLog]);

    return { connectionState, send, lastMessage, messageLog, authMessage };
}
