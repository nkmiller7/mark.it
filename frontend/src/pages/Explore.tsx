import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LabelerExplore from "./LabelerExplore";
import ReviewerExplore from "./ReviewerExplore";

export default function Explore() {
    const { userData, userLoading } = useAuth();

    if (userLoading || !userData) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-gray-500">Loading...</p>
            </div>
        );
    }

    if (userData?.type === "owner") {
        return <Navigate to="/home" />;
    }

    if (userData?.type === "labeler") {
        return <LabelerExplore />;
    }

    if (userData?.type === "reviewer") {
        return <ReviewerExplore />;
    }

    return <Navigate to="/home" />;
}
