import { useState, useEffect, type FormEvent } from "react";
import { Link } from "react-router-dom";
import api, { HttpStatusCode } from "../api/axios";

interface Space {
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
    map: {
        id: string;
        name: string;
        height: number;
        width: number;
        thumbnail_key: string | null;
        created_at: string;
        updated_at: string;
    };
}

export function Landing() {
    const [spaces, setSpaces] = useState<Space[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [newSpaceName, setNewSpaceName] = useState("");
    const [newSpaceMapId, setNewSpaceMapId] = useState("");
    const [createError, setCreateError] = useState<string | null>(null);

    async function fetchSpaces() {
        try {
            const response = await api.get("/api/v1/space");
            if (response.data && response.data.data && response.data.data.spaces) {
                setSpaces(response.data.data.spaces);
            }
        } catch (err: unknown) {
            const axiosErr = err as { response?: { status?: number } };
            if (axiosErr.response?.status === HttpStatusCode.BadRequest || axiosErr.response?.status === HttpStatusCode.Unauthorized) {
                setError("Please sign in to view spaces");
            } else {
                setError("Failed to fetch spaces");
            }
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchSpaces();
    }, []);

    async function handleCreateSpace(e: FormEvent) {
        e.preventDefault();
        setCreateError(null);
        if (!newSpaceName.trim() || !newSpaceMapId.trim()) {
            setCreateError("Name and Map ID are required");
            return;
        }
        try {
            const res = await api.post("/api/v1/space", {
                name: newSpaceName.trim(),
                map_id: newSpaceMapId.trim(),
            });
            if (res.status === HttpStatusCode.Created || res.status === HttpStatusCode.Ok) {
                setNewSpaceName("");
                setNewSpaceMapId("");
                await fetchSpaces();
            } else {
                setCreateError(res.data?.message || "Failed to create space");
            }
        } catch {
            setCreateError("Failed to create space");
        }
    }

    return (
        <div>
            <h1>BITS Pilani Space</h1>
            <p>Welcome to the virtual space platform</p>

            <hr />

            <h2>Available Spaces</h2>

            {isLoading && <p>Loading spaces...</p>}

            {error && <p>{error}</p>}

            {!isLoading && !error && spaces.length === 0 && (
                <p>No spaces available.</p>
            )}

            {!isLoading && !error && spaces.length > 0 && (
                <ul>
                    {spaces.map((space) => (
                        <li key={space.id}>
                            <strong>{space.name}</strong>
                            {" "}
                            <Link to={`/space/${space.id}`}>Join</Link>
                            <br />
                            Map: {space.map.name} ({space.map.width}x{space.map.height})
                            <br />
                            Created: {new Date(space.created_at).toLocaleDateString()}
                        </li>
                    ))}
                </ul>
            )}

            <hr />

            <h2>Create Space</h2>
            <form onSubmit={handleCreateSpace}>
                <div>
                    <label>
                        Name:{" "}
                        <input
                            type="text"
                            value={newSpaceName}
                            onChange={(e) => setNewSpaceName(e.target.value)}
                        />
                    </label>
                </div>
                <div>
                    <label>
                        Map ID:{" "}
                        <input
                            type="text"
                            value={newSpaceMapId}
                            onChange={(e) => setNewSpaceMapId(e.target.value)}
                        />
                    </label>
                </div>
                <button type="submit">Create</button>
                {createError && <p>{createError}</p>}
            </form>

            <hr />

            <nav>
                <Link to="/auth/signin">Sign In</Link> | <Link to="/auth/signup">Sign Up</Link>
            </nav>
        </div>
    );
}
