import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
    const { currentUser, signOut } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
          <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                {/* Logo TBD or maybe keep it simple as is*/}
                <Link to="/" className="text-xl font-bold text-gray-900">
                    mark<span className="text-blue-600">.it</span>
                </Link>

                <div className="hidden items-center gap-8 md:flex">
                    {currentUser ? (
                        <>
                            <Link
                                to="/home"
                                className="text-sm text-gray-600 hover:text-gray-900 transition"
                            >
                                Dashboard
                            </Link>
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
                            <button
                                onClick={signOut}
                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                            >
                                Sign Out
                            </button>
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
