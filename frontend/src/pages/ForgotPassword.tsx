import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

function validateEmail(email: string): string | null {
    if (email.trim() === "") {
        return "Email is required.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return "Please enter a valid email.";
    }
    return null;
}

export default function ForgotPassword() {
    const auth = getAuth();
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");
        const emailError = validateEmail(email);
        if (emailError) {
            setError(emailError);
            return;
        }
        try {
            setLoading(true);
            await sendPasswordResetEmail(auth, email);
            setSuccess(true);
        } catch {
            setError("Failed to send password reset email. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center bg-white px-4 pt-12">
            <h1 className="text-3xl font-bold text-gray-900">
                Forgot Password
            </h1>
            <div className="mt-6 w-full max-w-sm rounded-xl border border-gray-200 bg-gray-50 p-6 space-y-3">
                {success ? (
                    <div className="space-y-3">
                        <p className="rounded-lg bg-green-50 p-3 text-sm text-green-600">
                            Password reset email sent. Check your inbox.
                        </p>
                        <Link
                            to="/signin"
                            className="block w-full rounded-lg border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                        >
                            Back to Sign In
                        </Link>
                    </div>
                ) : (
                    <>
                        {error && (
                            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                                {error}
                            </p>
                        )}
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                required
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 focus:outline-none"
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="block w-full rounded-lg border border-blue-300 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50 transition"
                            >
                                {loading ? "Sending..." : "Send Reset Email"}
                            </button>
                            <Link
                                to="/signin"
                                className="block w-full rounded-lg border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                            >
                                Back to Sign In
                            </Link>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
