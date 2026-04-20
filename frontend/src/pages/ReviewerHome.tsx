import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface Task {
    _id: string;
    description: string;
    status: "unlabeled" | "labeled" | "reviewed";
    jobDescription: string;
    jobDeadline: string;
    assignedReviewerIds: string[];
    completedReviewerIds: string[];
}

export default function ReviewerHome() {
    const { currentUser, userData } = useAuth();
    const navigate = useNavigate();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const token = await currentUser?.getIdToken();
                const res = await fetch("/api/task/mine", {
                    headers: { authorization: `Bearer ${token}` },
                });
                if (!res.ok) {
                    setError("Failed to load tasks.");
                    return;
                }
                const data: Task[] = await res.json();
                setTasks(data);
            } catch {
                setError("Failed to load tasks.");
            } finally {
                setLoading(false);
            }
        };
        if (currentUser) fetchTasks();
    }, [currentUser]);

    const unclaimTask = async (taskId: string) => {
        const token = await currentUser?.getIdToken();
        const res = await fetch(`/api/task/${taskId}/unclaim`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                authorization: `Bearer ${token}`,
            },
        });
        if (!res.ok) return;
        setTasks((prev) => prev.filter((t) => t._id !== taskId));
    };

    const myId = userData?._id ?? "";
    const pending = tasks.filter(
        (t) =>
            (t.assignedReviewerIds ?? []).includes(myId) &&
            !(t.completedReviewerIds ?? []).includes(myId),
    );
    const reviewed = tasks.filter((t) =>
        (t.completedReviewerIds ?? []).includes(myId),
    );

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-gray-500">Loading...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-red-600">{error}</p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl px-6 py-12">
            <h1 className="mb-8 text-3xl font-bold text-gray-900">
                Reviewer - Dashboard
            </h1>
            <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                    <h2 className="mb-4 text-sm font-semibold text-gray-900">
                        Pending Review
                        <span className="ml-2 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
                            {pending.length}
                        </span>
                    </h2>
                    {pending.length === 0 ? (
                        <p className="text-sm text-gray-500">No tasks pending review.</p>
                    ) : (
                        <div className="space-y-2">
                            {pending.map((task) => (
                                <div
                                    key={task._id}
                                    className="rounded-lg border border-gray-200 bg-white overflow-hidden text-sm flex items-stretch"
                                >
                                    <div className="flex items-start justify-between gap-4 p-4 flex-1 min-w-0">
                                        <div className="space-y-1 min-w-0">
                                            <div className="font-semibold text-gray-900 truncate">{task.description}</div>
                                            <div className="text-xs text-gray-500">{task.jobDescription}</div>
                                            <div className="text-xs text-gray-400">Due {new Date(task.jobDeadline).toLocaleDateString()}</div>
                                            <div className="text-xs text-gray-400">{(task.assignedReviewerIds ?? []).length} / 3 reviewers claimed</div>
                                            <div className="text-xs text-gray-400">{(task.completedReviewerIds ?? []).length} / 3 reviewers submitted</div>
                                        </div>
                                        <div className="flex flex-col gap-2 shrink-0">
                                            <button
                                                onClick={() => navigate(`/tasks/review/${task._id}`)}
                                                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition"
                                            >
                                                Review Task
                                            </button>
                                            <button
                                                onClick={() => unclaimTask(task._id)}
                                                className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 transition"
                                            >
                                                Unclaim
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                    <h2 className="mb-4 text-sm font-semibold text-gray-900">
                        Reviewed
                        <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                            {reviewed.length}
                        </span>
                    </h2>
                    {reviewed.length === 0 ? (
                        <p className="text-sm text-gray-500">No completed reviews yet.</p>
                    ) : (
                        <div className="space-y-2">
                            {reviewed.map((task) => (
                                <div
                                    key={task._id}
                                    className="rounded-lg border border-gray-200 bg-white overflow-hidden text-sm flex items-stretch"
                                >
                                    <div className="p-4 space-y-1 min-w-0">
                                        <div className="font-semibold text-gray-900 truncate">{task.description}</div>
                                        <div className="text-xs text-gray-500">{task.jobDescription}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
