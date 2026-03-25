import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { currentUser, signOut } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      <h1 className="text-3xl font-bold text-gray-900">
        Welcome to mark<span className="text-blue-600">.it</span>
      </h1>
      <p className="mt-2 text-gray-600">
        Signed in as {currentUser?.email}
      </p>
      <button
        onClick={signOut}
        className="mt-6 rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
      >
        Sign Out
      </button>
    </div>
  );
}
