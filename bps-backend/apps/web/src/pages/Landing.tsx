import { useState, useEffect } from "react";
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

    useEffect(() => {
        async function fetchSpaces() {
            try {
                const response = await api.get("/api/v1/space");
                if (response.data && response.data.data && response.data.data.spaces) {
                    setSpaces(response.data.data.spaces);
                }
            } catch (err: any) {
                if (err.response?.status === HttpStatusCode.BadRequest || err.response?.status === HttpStatusCode.Unauthorized) {
                    setError("Please sign in to view spaces");
                } else {
                    setError("Failed to fetch spaces");
                }
            } finally {
                setIsLoading(false);
            }
        }

        fetchSpaces();
    }, []);

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
                            <br />
                            Map: {space.map.name} ({space.map.width}x{space.map.height})
                            <br />
                            Created: {new Date(space.created_at).toLocaleDateString()}
                        </li>
                    ))}
                </ul>
            )}

            <hr />

            <nav>
                <a href="/auth/signin">Sign In</a> | <a href="/auth/signup">Sign Up</a>
            </nav>
        </div>
    );
}
