import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
    const { currentUser, userData, signOut, loading } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);

    const isOwner = userData?.type === "owner";

    return (
        <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                {/* Logo TBD or maybe keep it simple as is*/}
                <Link to="/" className="text-xl font-bold text-gray-900">
                    mark<span className="text-blue-600">.it</span>
                </Link>

                <div className="hidden items-center gap-8 md:flex">
                    {loading ? null : currentUser ? (
                        <>
                            <Link
                                to="/home"
                                className="text-sm text-gray-600 hover:text-gray-900 transition"
                            >
                                Dashboard
                            </Link>
                            {isOwner ? (
                                <Link
                                    to="/jobs/create"
                                    className="text-sm text-gray-600 hover:text-gray-900 transition"
                                >
                                    Create Job
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        to="/jobs"
                                        className="text-sm text-gray-600 hover:text-gray-900 transition"
                                    >
                                        Jobs
                                    </Link>
                                    <Link
                                        to="/tasks"
                                        className="text-sm text-gray-600 hover:text-gray-900 transition"
                                    >
                                        Tasks
                                    </Link>
                                </>
                            )}

                            <div className="relative">
                                <button
                                    onClick={() => setProfileOpen(!profileOpen)}
                                    className="rounded-full p-1 text-gray-600 hover:text-gray-900 transition"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.5}
                                        stroke="currentColor"
                                        className="size-6"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                                        />
                                    </svg>
                                </button>
                                {profileOpen && (
                                    <div className="absolute right-0 mt-2 w-40 rounded-xl border border-gray-200 bg-white shadow-lg">
                                        <Link
                                            to="/settings"
                                            onClick={() =>
                                                setProfileOpen(false)
                                            }
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-xl transition"
                                        >
                                            Settings
                                        </Link>
                                        <button
                                            onClick={() => {
                                                signOut();
                                                setProfileOpen(false);
                                            }}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-b-xl transition"
                                        >
                                            Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/#how-it-works"
                                className="text-sm text-gray-600 hover:text-gray-900 transition"
                            >
                                How It Works
                            </Link>
                            <Link
                                to="/#features"
                                className="text-sm text-gray-600 hover:text-gray-900 transition"
                            >
                                Features
                            </Link>
                            <Link
                                to="/signin"
                                className="text-sm text-gray-600 hover:text-gray-900 transition"
                            >
                                Sign In
                            </Link>
                            <Link
                                to="/signup"
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
                            >
                                Get Started
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile hamburger (if they shrink the page the nav bar was messing up*/}
                <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="flex flex-col gap-1.5 md:hidden"
                    aria-label="Toggle menu"
                >
                    <span
                        className={`block h-0.5 w-6 bg-gray-700 transition ${mobileOpen ? "translate-y-2 rotate-45" : ""}`}
                    />
                    <span
                        className={`block h-0.5 w-6 bg-gray-700 transition ${mobileOpen ? "opacity-0" : ""}`}
                    />
                    <span
                        className={`block h-0.5 w-6 bg-gray-700 transition ${mobileOpen ? "-translate-y-2 -rotate-45" : ""}`}
                    />
                </button>
            </div>

            {/* Mobile menu */}
            {mobileOpen && (
                <div className="border-t border-gray-100 bg-white px-6 py-4 md:hidden">
                    <div className="flex flex-col gap-4">
                        {currentUser ? (
                            <>
                                <Link
                                    to="/home"
                                    className="text-sm text-gray-600"
                                    onClick={() => setMobileOpen(false)}
                                >
                                    Dashboard
                                </Link>
                                {isOwner ? (
                                    <Link
                                        to="/jobs/create"
                                        className="text-sm text-gray-600"
                                        onClick={() => setMobileOpen(false)}
                                    >
                                        Create Job
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            to="/jobs"
                                            className="text-sm text-gray-600"
                                            onClick={() => setMobileOpen(false)}
                                        >
                                            Jobs
                                        </Link>
                                        <Link
                                            to="/tasks"
                                            className="text-sm text-gray-600"
                                            onClick={() => setMobileOpen(false)}
                                        >
                                            Tasks
                                        </Link>
                                    </>
                                )}
                                <Link
                                    to="/settings"
                                    className="text-sm text-gray-600"
                                    onClick={() => setMobileOpen(false)}
                                >
                                    Settings
                                </Link>
                                <button
                                    onClick={() => {
                                        signOut();
                                        setMobileOpen(false);
                                    }}
                                    className="text-left text-sm text-gray-600"
                                >
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/#features"
                                    className="text-sm text-gray-600"
                                    onClick={() => setMobileOpen(false)}
                                >
                                    Features
                                </Link>
                                <Link
                                    to="/#how-it-works"
                                    className="text-sm text-gray-600"
                                    onClick={() => setMobileOpen(false)}
                                >
                                    How It Works
                                </Link>
                                <Link
                                    to="/signin"
                                    className="text-sm text-gray-600"
                                    onClick={() => setMobileOpen(false)}
                                >
                                    Sign In
                                </Link>
                                <Link
                                    to="/signup"
                                    className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white"
                                    onClick={() => setMobileOpen(false)}
                                >
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
