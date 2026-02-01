import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import Phaser from "phaser";
import { useAuth } from "../context/AuthContext";
import { useWebSocket, type ConnectionState, type LogEntry } from "../hooks/useWebSocket";
import { GameScene } from "../game/GameScene";
import api from "../api/axios";

interface SpaceMeta {
    id: string;
    name: string;
    map: {
        id: string;
        name: string;
        height: number;
        width: number;
    };
}

interface RoomUser {
    userId: string;
    x: number;
    y: number;
}

export function SpaceGame() {
    const { id: spaceId } = useParams<{ id: string }>();
    const { token } = useAuth();

    const [spaceMeta, setSpaceMeta] = useState<SpaceMeta | null>(null);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [myPos, setMyPos] = useState({ x: 0, y: 0 });
    const [roomUsers, setRoomUsers] = useState<RoomUser[]>([]);
    const [joined, setJoined] = useState(false);

    const gameContainerRef = useRef<HTMLDivElement>(null);
    const gameRef = useRef<Phaser.Game | null>(null);
    const sceneRef = useRef<GameScene | null>(null);

    const { connectionState, send, lastMessage, messageLog, authMessage } = useWebSocket(
        spaceMeta ? token : null
    );

    // Step 1: Fetch space metadata
    useEffect(() => {
        if (!spaceId || !token) return;

        async function fetchSpace() {
            try {
                const res = await api.get("/api/v1/space");
                const spaces = res.data?.data?.spaces;
                if (!Array.isArray(spaces)) {
                    setFetchError("Unexpected API response");
                    return;
                }
                const found = spaces.find((s: SpaceMeta) => s.id === spaceId);
                if (!found) {
                    setFetchError("Space not found");
                    return;
                }
                setSpaceMeta(found);
            } catch {
                setFetchError("Failed to fetch space data");
            }
        }
        fetchSpace();
    }, [spaceId, token]);

    // Move request callback (called by Phaser scene on keypress)
    const handleMoveRequest = useCallback(
        (x: number, y: number) => {
            send({ type: "MOVE", payload: { x, y } });
            setMyPos({ x, y });
        },
        [send]
    );

    // Step 2: Create Phaser game once we have space metadata
    useEffect(() => {
        if (!spaceMeta || !gameContainerRef.current) return;
        if (gameRef.current) return; // already created

        const scene = new GameScene();
        scene.configure({
            mapWidth: spaceMeta.map.width,
            mapHeight: spaceMeta.map.height,
            onMoveRequest: handleMoveRequest,
        });
        sceneRef.current = scene;

        const game = new Phaser.Game({
            type: Phaser.AUTO,
            width: 800,
            height: 600,
            parent: gameContainerRef.current,
            scene: scene,
            physics: { default: "arcade" },
            input: { keyboard: true },
        });
        gameRef.current = game;

        return () => {
            game.destroy(true);
            gameRef.current = null;
            sceneRef.current = null;
        };
    }, [spaceMeta, handleMoveRequest]);

    // Step 3: Send JOIN when WebSocket is authenticated
    useEffect(() => {
        if (connectionState === "authenticated" && spaceId && !joined) {
            send({ type: "JOIN", payload: { space_id: spaceId } });
        }
    }, [connectionState, spaceId, joined, send]);

    // Step 4: Dispatch incoming WS messages
    useEffect(() => {
        if (!lastMessage) return;
        const scene = sceneRef.current;

        switch (lastMessage.type) {
            case "JOINED": {
                const payload = lastMessage.payload as {
                    spawn: { x: number; y: number };
                    user_ids: string[];
                };
                setMyPos({ x: payload.spawn.x, y: payload.spawn.y });
                scene?.setMyPosition(payload.spawn.x, payload.spawn.y);

                // Other users already in the room (we don't know their positions)
                const others: RoomUser[] = (payload.user_ids || [])
                    .filter((uid) => uid !== getMyUserId())
                    .map((uid) => ({ userId: uid, x: 0, y: 0 }));
                setRoomUsers(others);
                others.forEach((u) => scene?.addUser(u.userId, u.x, u.y));
                setJoined(true);
                break;
            }
            case "USER-JOINED": {
                const payload = lastMessage.payload as {
                    user_id: string;
                    x: number;
                    y: number;
                };
                scene?.addUser(payload.user_id, payload.x, payload.y);
                setRoomUsers((prev) => {
                    if (prev.some((u) => u.userId === payload.user_id)) return prev;
                    return [...prev, { userId: payload.user_id, x: payload.x, y: payload.y }];
                });
                break;
            }
            case "MOVE": {
                const payload = lastMessage.payload as {
                    user_id: string;
                    x: number;
                    y: number;
                };
                scene?.moveUser(payload.user_id, payload.x, payload.y);
                setRoomUsers((prev) =>
                    prev.map((u) =>
                        u.userId === payload.user_id ? { ...u, x: payload.x, y: payload.y } : u
                    )
                );
                break;
            }
            case "MOVE-REJECTED": {
                const payload = lastMessage.payload as { x: number; y: number };
                scene?.setMyPosition(payload.x, payload.y);
                setMyPos({ x: payload.x, y: payload.y });
                break;
            }
            case "USER-LEAVE": {
                const payload = lastMessage.payload as { user_id: string };
                scene?.removeUser(payload.user_id);
                setRoomUsers((prev) => prev.filter((u) => u.userId !== payload.user_id));
                break;
            }
        }
    }, [lastMessage]);

    // Helper: extract user_id from token (JWT payload)
    function getMyUserId(): string | null {
        if (!token) return null;
        try {
            const parts = token.split(".");
            if (parts.length !== 3) return null;
            const payload = JSON.parse(atob(parts[1]!));
            return payload.user_id ?? null;
        } catch {
            return null;
        }
    }

    // --- Auth guard ---
    if (!token) {
        return (
            <div>
                <p>You must be signed in to enter a space.</p>
                <Link to="/auth/signin">Sign In</Link>
            </div>
        );
    }

    if (fetchError) {
        return (
            <div>
                <p>Error: {fetchError}</p>
                <Link to="/">Back to spaces</Link>
            </div>
        );
    }

    if (!spaceMeta) {
        return <p>Loading space...</p>;
    }

    return (
        <div>
            <div>
                <Link to="/">Back</Link>
                {" | "}
                <strong>{spaceMeta.name}</strong>
                {" | Map: "}
                {spaceMeta.map.name} ({spaceMeta.map.width}x{spaceMeta.map.height})
            </div>

            <div ref={gameContainerRef} />

            <DebugPanel
                connectionState={connectionState}
                authMessage={authMessage}
                myPos={myPos}
                roomUsers={roomUsers}
                messageLog={messageLog}
                myUserId={getMyUserId()}
            />
        </div>
    );
}

function DebugPanel({
    connectionState,
    authMessage,
    myPos,
    roomUsers,
    messageLog,
    myUserId,
}: {
    connectionState: ConnectionState;
    authMessage: string | null;
    myPos: { x: number; y: number };
    roomUsers: RoomUser[];
    messageLog: LogEntry[];
    myUserId: string | null;
}) {
    return (
        <div>
            <h3>Debug</h3>

            <div>
                <strong>WS State:</strong> {connectionState}
                {authMessage && (
                    <>
                        {" | "}
                        {authMessage}
                    </>
                )}
            </div>

            <div>
                <strong>My ID:</strong> {myUserId ?? "unknown"}
                {" | "}
                <strong>Position:</strong> ({myPos.x}, {myPos.y})
            </div>

            <div>
                <strong>Users in room ({roomUsers.length}):</strong>
                <ul>
                    {roomUsers.map((u) => (
                        <li key={u.userId}>
                            {u.userId.slice(0, 8)}... ({u.x}, {u.y})
                        </li>
                    ))}
                </ul>
            </div>

            <div>
                <strong>Message Log ({messageLog.length}):</strong>
                <div
                    style={{
                        maxHeight: "200px",
                        overflow: "auto",
                        fontFamily: "monospace",
                        fontSize: "11px",
                        border: "1px solid #ccc",
                        padding: "4px",
                    }}
                >
                    {messageLog.map((entry, i) => (
                        <div key={i}>
                            [{new Date(entry.timestamp).toLocaleTimeString()}] [{entry.direction}]{" "}
                            {entry.raw}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
