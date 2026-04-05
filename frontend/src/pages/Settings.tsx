import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface UserData {
    email: string;
    type: string;
    entityName?: string;
    firstName?: string;
    lastName?: string;
    rating?: number;
}

export default function Settings() {
    const { currentUser, signOut } = useAuth();
    const [userData, setUserData] = useState<UserData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [darkMode, setDarkMode] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            const token = await currentUser?.getIdToken();
            const res = await fetch("/api/user/", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    authorization: `Bearer ${token}`,
                },
            });
            if (!res.ok) {
                setError("Failed to load user data.");
                return;
            }
            const data: UserData = await res.json();
            setUserData(data);
        };
        if (currentUser) fetchUser();
    }, [currentUser]);

    if (error) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
                <p className="text-red-600">{error}</p>
                <button
                    onClick={signOut}
                    className="mt-6 rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                    Sign Out
                </button>
            </div>
        );
    }

    if (!userData) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-gray-500">Loading User Info...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center bg-white px-4 pt-12">
            <h1 className="text-3xl font-bold text-gray-900">
                Account Settings
            </h1>
            <div className="mt-6 w-full max-w-sm rounded-xl border border-gray-200 bg-gray-50 p-6 space-y-3">
                <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-500">
                        Account Type
                    </span>
                    <span className="font-medium text-gray-900 capitalize">
                        {userData.type}
                    </span>
                </div>
                {userData.type === "owner" && (
                    <div className="flex justify-between text-sm">
                        <span className="font-medium text-gray-500">
                            Entity Name
                        </span>
                        <span className="text-gray-900">
                            {userData.entityName}
                        </span>
                    </div>
                )}
                {(userData.type === "labeler" ||
                    userData.type === "reviewer") && (
                    <>
                        <div className="flex justify-between text-sm">
                            <span className="font-medium text-gray-500">
                                Name
                            </span>
                            <span className="text-gray-900">
                                {userData.firstName} {userData.lastName}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="font-medium text-gray-500">
                                User Rating
                            </span>
                            <span className="text-gray-900">
                                {userData.rating}
                            </span>
                        </div>
                    </>
                )}
                <div className="flex justify-between text-sm pb-3 border-b border-gray-200">
                    <span className="font-medium text-gray-500">Email</span>
                    <span className="text-gray-900">{userData.email}</span>
                </div>
                <Link
                    to="/settings/change-password"
                    className="block rounded-lg border border-blue-300 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 transition"
                >
                    Change Password
                </Link>
                <div className="flex items-center justify-between rounded-lg border border-gray-300 px-4 py-2">
                    <div className="text-sm font-medium text-gray-700">
                        Dark Mode (Not Yet Implemented)
                    </div>
                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${darkMode ? "bg-blue-600" : "bg-gray-300"}`}
                    >
                        <div
                            className={`h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${darkMode ? "translate-x-4" : "translate-x-1"}`}
                        />
                    </button>
                </div>
                {!confirmDelete ? (
                    <button
                        onClick={() => setConfirmDelete(true)}
                        className="block w-full rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition"
                    >
                        Delete Account (Not Yet Implemented)
                    </button>
                ) : (
                    <div className="rounded-lg border border-red-300 px-4 py-3 space-y-2">
                        <div className="text-sm font-medium text-gray-700 text-center">
                            Are you sure you want to delete your account?
                        </div>
                        <div className="flex gap-2">
                            <button className="flex-1 rounded-lg border border-red-400 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition">
                                Yes
                                {/*  will have to come back to this later, because we'd have to consider what happens to jobs, tasks, etc.*/}
                            </button>
                            <button
                                onClick={() => setConfirmDelete(false)}
                                className="flex-1 rounded-lg border border-blue-400 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 transition"
                            >
                                No
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
