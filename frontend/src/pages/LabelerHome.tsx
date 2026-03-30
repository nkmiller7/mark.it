import { useAuth } from "../context/AuthContext";

interface LabelerHomeProps {
    firstName: string;
    lastName: string;
    email: string;
    rating: number;
}

export default function LabelerHome({
    firstName,
    lastName,
    email,
    rating,
}: LabelerHomeProps) {
    const { signOut } = useAuth();

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
            <h1 className="text-3xl font-bold text-gray-900">
                Labeler Dashboard
            </h1>
            <div className="mt-6 w-full max-w-sm rounded-xl border border-gray-200 bg-gray-50 p-6 space-y-3">
                <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-500">
                        Account Type
                    </span>
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        Labeler
                    </span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-500">Name</span>
                    <span className="text-gray-900">
                        {firstName} {lastName}
                    </span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-500">Email</span>
                    <span className="text-gray-900">{email}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-500">Rating</span>
                    <span className="text-gray-900">{rating}</span>
                </div>
            </div>
            <button
                onClick={signOut}
                className="mt-6 rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
                Sign Out
            </button>
        </div>
    );
}
