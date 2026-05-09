import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type UserType = "owner" | "labeler" | "reviewer";

export default function SignUp() {
    const { signUp } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [userType, setUserType] = useState<UserType>("owner");
    const [entityName, setEntityName] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    function validatePassword(pw: string): string | null {
        if (pw.length < 8) return "Password must be at least 8 characters.";
        if (!/[A-Z]/.test(pw))
            return "Password must contain an uppercase letter.";
        if (!/[a-z]/.test(pw))
            return "Password must contain a lowercase letter.";
        if (!/[0-9]/.test(pw)) return "Password must contain a digit.";
        if (!/[^A-Za-z0-9]/.test(pw))
            return "Password must contain a special character.";
        if (/\s/.test(pw)) return "Password must not contain spaces.";
        return null;
    }

    function validateFields(): string | null {
        if (userType === "owner") {
            const trimmed = entityName.trim();
            if (trimmed.length < 3 || trimmed.length > 30)
                return "Entity name must be between 3 and 30 characters.";
            if (/[^A-Za-z0-9 ]/.test(trimmed))
                return "Entity name cannot contain special characters.";
        } else {
            const trimmedFirst = firstName.trim();
            const trimmedLast = lastName.trim();
            if (trimmedFirst.length < 2 || trimmedFirst.length > 20)
                return "First name must be between 2 and 20 characters.";
            if (/[^A-Za-z]/.test(trimmedFirst))
                return "First name must only contain letters.";
            if (trimmedLast.length < 2 || trimmedLast.length > 20)
                return "Last name must be between 2 and 20 characters.";
            if (/[^A-Za-z]/.test(trimmedLast))
                return "Last name must only contain letters.";
        }
        return null;
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        const pwError = validatePassword(password);
        if (pwError) {
            setError(pwError);
            return;
        }

        const fieldError = validateFields();
        if (fieldError) {
            setError(fieldError);
            return;
        }

        setLoading(true);

        try {
            const fields: Record<string, string> = { type: userType };
            if (userType === "owner") {
                fields.entityName = entityName;
            } else {
                fields.firstName = firstName;
                fields.lastName = lastName;
            }
            await signUp(email, password, fields);
            navigate("/home");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to create account.",
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm border border-gray-200">
                <h1 className="text-2xl font-bold text-gray-900">
                    Create your account
                </h1>

                {error && (
                    <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                        {error}
                    </p>
                )}

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    {/* Account Type Toggle */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Account Type
                        </label>
                        <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                            {(
                                ["owner", "labeler", "reviewer"] as UserType[]
                            ).map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setUserType(type)}
                                    className={`flex-1 px-3 py-2 text-sm font-medium transition ${
                                        userType === type
                                            ? "bg-blue-600 text-white"
                                            : "bg-white text-gray-700 hover:bg-gray-50"
                                    }`}
                                >
                                    {type.charAt(0).toUpperCase() +
                                        type.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    {/* Conditional fields based on user type */}
                    {userType === "owner" ? (
                        <div>
                            <label
                                htmlFor="entityName"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Entity Name
                            </label>
                            <input
                                id="entityName"
                                type="text"
                                required
                                value={entityName}
                                onChange={(e) => setEntityName(e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                    ) : (
                        <>
                            <div>
                                <label
                                    htmlFor="firstName"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    First Name
                                </label>
                                <input
                                    id="firstName"
                                    type="text"
                                    required
                                    value={firstName}
                                    onChange={(e) =>
                                        setFirstName(e.target.value)
                                    }
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="lastName"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Last Name
                                </label>
                                <input
                                    id="lastName"
                                    type="text"
                                    required
                                    value={lastName}
                                    onChange={(e) =>
                                        setLastName(e.target.value)
                                    }
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                        </>
                    )}

                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="confirmPassword"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Confirm Password
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition"
                    >
                        {loading ? "Creating account..." : "Sign Up"}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-500">
                    Already have an account?{" "}
                    <Link
                        to="/signin"
                        className="font-medium text-blue-600 hover:text-blue-500"
                    >
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
