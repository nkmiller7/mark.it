import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface Task {
    _id: string;
    description: string;
    status: "unlabeled" | "labeled" | "reviewed";
    jobDescription: string;
    jobDeadline: string;
}

export default function LabelerHome() {
    const { currentUser } = useAuth();
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

    const incomplete = tasks.filter((t) => t.status === "unlabeled");
    const complete = tasks.filter(
        (t) => t.status === "labeled" || t.status === "reviewed",
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
                Labeler - Dashboard
            </h1>
            <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                    <h2 className="mb-4 text-sm font-semibold text-gray-900">
                        Claimed
                        <span className="ml-2 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
                            {incomplete.length}
                        </span>
                    </h2>
                    {incomplete.length === 0 ? (
                        <p className="text-sm text-gray-500">
                            No claimed tasks.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {incomplete.map((task) => (
                                <div
                                    key={task._id}
                                    className="rounded-lg border border-gray-200 bg-white overflow-hidden text-sm flex items-stretch"
                                >
                                    <div className="flex items-start justify-between gap-4 p-4 flex-1 min-w-0">
                                        <div className="space-y-1 min-w-0">
                                            <div className="font-semibold text-gray-900 truncate">{task.description}</div>
                                            <div className="text-xs text-gray-500">{task.jobDescription}</div>
                                            <div className="text-xs text-gray-400">Due {new Date(task.jobDeadline).toLocaleDateString()}</div>
                                        </div>
                                        <button onClick={() => navigate(`/tasks/label/${task._id}`)} className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition">
                                            Work on Task
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                    <h2 className="mb-4 text-sm font-semibold text-gray-900">
                        Completed
                        <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                            {complete.length}
                        </span>
                    </h2>
                    {complete.length === 0 ? (
                        <p className="text-sm text-gray-500">
                            No completed tasks yet.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {complete.map((task) => (
                                <div
                                    key={task._id}
                                    className="rounded-lg border border-gray-200 bg-white overflow-hidden text-sm flex items-stretch"
                                >
                                    <div className="flex items-start justify-between gap-4 p-4 flex-1 min-w-0">
                                        <div className="space-y-1 min-w-0">
                                            <div className="font-semibold text-gray-900 truncate">{task.description}</div>
                                            <div className="text-xs text-gray-500">{task.jobDescription}</div>
                                        </div>
                                        <button onClick={() => navigate(`/tasks/label/${task._id}`)} className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition">
                                            View
                                        </button>
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
