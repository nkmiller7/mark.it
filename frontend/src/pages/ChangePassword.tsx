import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword,
} from "firebase/auth";
import { useAuth } from "../context/AuthContext";

function validatePassword(pw: string): string | null {
    if (pw.length < 8) return "Password must be at least 8 characters.";
    if (!/[A-Z]/.test(pw)) return "Password must contain an uppercase letter.";
    if (!/[a-z]/.test(pw)) return "Password must contain a lowercase letter.";
    if (!/[0-9]/.test(pw)) return "Password must contain a digit.";
    if (!/[^A-Za-z0-9]/.test(pw))
        return "Password must contain a special character.";
    if (/\s/.test(pw)) return "Password must not contain spaces.";
    return null;
}

export default function ChangePassword() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");
        if (
            currentPassword.trim() === "" ||
            newPassword.trim() === "" ||
            confirmPassword.trim() === ""
        ) {
            setError("All fields are required.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        const passwordError = validatePassword(newPassword);
        if (passwordError) {
            setError(passwordError);
            return;
        }
        try {
            setLoading(true);
            const credential = EmailAuthProvider.credential(
                currentUser!.email!,
                currentPassword,
            );
            await reauthenticateWithCredential(currentUser!, credential);
            await updatePassword(currentUser!, newPassword);
            setSuccess(true);
        } catch {
            setError("Failed to update password.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center bg-white px-4 pt-12">
            <h1 className="text-3xl font-bold text-gray-900">
                Change Password
            </h1>
            <div className="mt-6 w-full max-w-sm rounded-xl border border-gray-200 bg-gray-50 p-6 space-y-3">
                {success && (
                    <div className="space-y-3">
                        <p className="rounded-lg bg-green-50 p-3 text-sm text-green-600">
                            Your password has been updated successfully.
                        </p>
                        <button
                            onClick={() => navigate("/settings")}
                            className="block w-full rounded-lg border border-blue-300 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 transition"
                        >
                            Back to Settings
                        </button>
                    </div>
                )}
                {!success && error && (
                    <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                        {error}
                    </p>
                )}
                {!success && (
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <input
                            type="password"
                            placeholder="Current Password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="block w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 focus:outline-none"
                        />
                        <input
                            type="password"
                            placeholder="New Password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="block w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 focus:outline-none"
                        />
                        <input
                            type="password"
                            placeholder="Confirm New Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="block w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 focus:outline-none"
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="block w-full rounded-lg border border-blue-300 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50 transition"
                        >
                            {loading
                                ? "Updating Password..."
                                : "Update Password"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
