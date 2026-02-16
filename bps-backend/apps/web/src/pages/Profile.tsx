import { useState, useEffect, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api, { HttpStatusCode } from "../api/axios";

interface UserProfile {
    id: string;
    name: string;
    handle: string;
    email: string;
    role: string;
    created_at: string;
    updated_at: string;
}

export function Profile() {
    const { token, logout } = useAuth();
    const navigate = useNavigate();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Update form
    const [newName, setNewName] = useState("");
    const [newHandle, setNewHandle] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [updatePassword, setUpdatePassword] = useState("");
    const [updateMsg, setUpdateMsg] = useState<string | null>(null);
    const [updateError, setUpdateError] = useState<string | null>(null);

    // Delete form
    const [deletePassword, setDeletePassword] = useState("");
    const [deleteError, setDeleteError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) {
            navigate("/auth/signin");
            return;
        }
        fetchProfile();
    }, [token]);

    async function fetchProfile() {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get("/api/v1/user/me");
            if (res.status === HttpStatusCode.Ok && res.data?.data?.user) {
                setProfile(res.data.data.user);
            } else {
                setError("Failed to load profile");
            }
        } catch {
            setError("Failed to load profile");
        } finally {
            setIsLoading(false);
        }
    }

    async function handleUpdate(e: FormEvent) {
        e.preventDefault();
        setUpdateMsg(null);
        setUpdateError(null);

        if (!updatePassword) {
            setUpdateError("Current password is required to make changes");
            return;
        }

        const userUpdates: Record<string, string> = {};
        if (newName.trim()) userUpdates.new_name = newName.trim();
        if (newHandle.trim()) userUpdates.new_handle = newHandle.trim();
        if (newEmail.trim()) userUpdates.new_email = newEmail.trim();
        if (newPassword) userUpdates.new_password = newPassword;

        if (Object.keys(userUpdates).length === 0) {
            setUpdateError("Fill in at least one field to update");
            return;
        }

        try {
            const res = await api.patch("/api/v1/user/me", {
                password: updatePassword,
                user: userUpdates,
            });

            if (res.status === HttpStatusCode.Ok) {
                setUpdateMsg("Profile updated successfully");
                setNewName("");
                setNewHandle("");
                setNewEmail("");
                setNewPassword("");
                setUpdatePassword("");
                await fetchProfile();
            } else if (res.status === HttpStatusCode.Forbidden) {
                setUpdateError("Incorrect password");
            } else if (res.status === HttpStatusCode.Conflict) {
                setUpdateError(res.data?.error || "Handle or email already taken");
            } else {
                setUpdateError(res.data?.error || "Update failed");
            }
        } catch {
            setUpdateError("Update failed");
        }
    }

    async function handleDelete(e: FormEvent) {
        e.preventDefault();
        setDeleteError(null);

        if (!deletePassword) {
            setDeleteError("Password is required to delete your account");
            return;
        }

        if (!confirm("Are you sure you want to delete your account? This cannot be undone.")) {
            return;
        }

        try {
            const res = await api.delete("/api/v1/user/me", {
                data: { password: deletePassword },
            });

            if (res.status === HttpStatusCode.Ok) {
                await logout();
                navigate("/auth/signin");
            } else if (res.status === HttpStatusCode.Forbidden) {
                setDeleteError("Incorrect password");
            } else {
                setDeleteError(res.data?.error || "Delete failed");
            }
        } catch {
            setDeleteError("Delete failed");
        }
    }

    if (!token) {
        return (
            <div>
                <p>Please <Link to="/auth/signin">sign in</Link> to view your profile.</p>
            </div>
        );
    }

    if (isLoading) return <p>Loading profile...</p>;
    if (error) return <p>{error}</p>;
    if (!profile) return <p>No profile data.</p>;

    return (
        <div>
            <h1>Profile</h1>
            <p><Link to="/">Back to Home</Link></p>

            <hr />

            <h2>Your Info</h2>
            <table>
                <tbody>
                    <tr><td><strong>Name</strong></td><td>{profile.name}</td></tr>
                    <tr><td><strong>Handle</strong></td><td>{profile.handle}</td></tr>
                    <tr><td><strong>Email</strong></td><td>{profile.email}</td></tr>
                    <tr><td><strong>Role</strong></td><td>{profile.role}</td></tr>
                    <tr><td><strong>Joined</strong></td><td>{new Date(profile.created_at).toLocaleDateString()}</td></tr>
                </tbody>
            </table>

            <hr />

            <h2>Update Profile</h2>
            <form onSubmit={handleUpdate}>
                <div>
                    <label>New Name: <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} /></label>
                </div>
                <div>
                    <label>New Handle: <input type="text" value={newHandle} onChange={(e) => setNewHandle(e.target.value)} /></label>
                </div>
                <div>
                    <label>New Email: <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} /></label>
                </div>
                <div>
                    <label>New Password: <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></label>
                </div>
                <div>
                    <label><strong>Current Password (required):</strong> <input type="password" value={updatePassword} onChange={(e) => setUpdatePassword(e.target.value)} /></label>
                </div>
                <button type="submit">Update</button>
                {updateMsg && <p style={{ color: "green" }}>{updateMsg}</p>}
                {updateError && <p style={{ color: "red" }}>{updateError}</p>}
            </form>

            <hr />

            <h2>Delete Account</h2>
            <form onSubmit={handleDelete}>
                <div>
                    <label>Password: <input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} /></label>
                </div>
                <button type="submit" style={{ color: "red" }}>Delete My Account</button>
                {deleteError && <p style={{ color: "red" }}>{deleteError}</p>}
            </form>
        </div>
    );
}
