import { useAuth } from "../context/AuthContext";
import OwnerHome from "./OwnerHome";
import LabelerHome from "./LabelerHome";
import ReviewerHome from "./ReviewerHome";

export default function Home() {
    const { userData, userLoading, signOut } = useAuth();

    if (userLoading || !userData) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-gray-500">Loading...</p>
            </div>
        );
    }

    switch (userData.type) {
        case "owner":
            return (
                <OwnerHome
                    entityName={userData.entityName!}
                    email={userData.email}
                />
            );
        case "labeler":
            return (
                <LabelerHome
                    firstName={userData.firstName!}
                    lastName={userData.lastName!}
                    email={userData.email}
                    rating={userData.rating!}
                />
            );
        case "reviewer":
            return (
                <ReviewerHome
                    firstName={userData.firstName!}
                    lastName={userData.lastName!}
                    email={userData.email}
                    rating={userData.rating!}
                />
            );
        default:
            return (
                <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
                    <p className="text-red-600">Unknown account type.</p>
                    <button
                        onClick={signOut}
                        className="mt-6 rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                    >
                        Sign Out
                    </button>
                </div>
            );
    }
}
