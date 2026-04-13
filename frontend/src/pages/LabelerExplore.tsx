import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

interface Job {
    _id: string;
    description: string;
    deadlineDate: string;
    ratingRequired: {
        labeler: number;
        reviewer: number;
    };
}

interface Task {
    _id: string;
    description: string;
    status: "unlabeled" | "labeled" | "reviewed";
    assignedLabelerId: string | null;
}

export default function LabelerExplore() {
    const { currentUser, userData } = useAuth();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [expandedJob, setExpandedJob] = useState<string | null>(null);
    const [tasks, setTasks] = useState<Record<string, Task[]>>({});
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const token = await currentUser?.getIdToken();
                const res = await fetch("/api/job", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        authorization: `Bearer ${token}`,
                    },
                });
                if (!res.ok) {
                    setError("Failed to load jobs.");
                    return;
                }
                const data: Job[] = await res.json();
                setJobs(data);

                const taskMap: Record<string, Task[]> = {};
                for (const job of data) {
                    const taskRes = await fetch(`/api/job/${job._id}/tasks`, {
                        headers: { authorization: `Bearer ${token}` },
                    });
                    taskMap[job._id] = await taskRes.json();
                }
                setTasks(taskMap);
            } catch {
                setError("Failed to load jobs.");
            } finally {
                setLoading(false);
            }
        };
        if (currentUser) {
            fetchJobs();
        }
    }, [currentUser]);

    const getTaskButton = (task: Task, jobId: string) => {
        const isDone = task.status === "labeled" || task.status === "reviewed";
        const isMine = task.assignedLabelerId === userData?._id;
        const isClaimed = task.assignedLabelerId !== null;

        if (isDone) {
            return (
                <button disabled className="shrink-0 rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-400 cursor-not-allowed">
                    Labeled
                </button>
            );
        }
        if (isMine) {
            return (
                <button onClick={() => unclaimTask(jobId, task._id)} className="shrink-0 rounded-lg bg-red-500 px-3 py-1 text-xs font-medium text-white hover:bg-red-600 transition">
                    Unclaim
                </button>
            );
        }
        if (isClaimed) {
            return (
                <button disabled className="shrink-0 rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-400 cursor-not-allowed">
                    Claimed
                </button>
            );
        }
        return (
            <button onClick={() => claimTask(jobId, task._id)} className="shrink-0 rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 transition">
                Claim
            </button>
        );
    };

    const toggleJob = (jobId: string) => {
        if (expandedJob === jobId) {
            setExpandedJob(null);
        } else {
            setExpandedJob(jobId);
        }
    };

    const unclaimTask = async (jobId: string, taskId: string) => {
        const token = await currentUser?.getIdToken();
        const res = await fetch(`/api/task/${taskId}/unclaim`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                authorization: `Bearer ${token}`,
            },
        });
        if (!res.ok) {
            return;
        }
        setTasks((prev) => ({
            ...prev,
            [jobId]: prev[jobId].map((t) =>
                t._id === taskId ? { ...t, assignedLabelerId: null } : t,
            ),
        }));
    };

    const claimTask = async (jobId: string, taskId: string) => {
        const token = await currentUser?.getIdToken();
        const res = await fetch(`/api/task/${taskId}/claim`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                authorization: `Bearer ${token}`,
            },
        });
        if (!res.ok) {
            return;
        }
        setTasks((prev) => ({
            ...prev,
            [jobId]: prev[jobId].map((t) =>
                t._id === taskId
                    ? { ...t, assignedLabelerId: userData?._id ?? null }
                    : t,
            ),
        }));
    };

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
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-gray-900">
                    Labeler - Explore Jobs
                </h1>
                <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-sm text-gray-600">Show All Jobs</span>
                    <div
                        onClick={() => setShowAll((prev) => !prev)}
                        className={`relative w-10 h-6 rounded-full transition ${showAll ? "bg-blue-600" : "bg-gray-300"}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${showAll ? "left-5" : "left-1"}`} />
                    </div>
                </label>
            </div>
            {jobs.length === 0 ? (
                <p className="text-gray-500">No jobs available.</p>
            ) : (
                <div className="grid gap-4">
                    {jobs.filter((job) => showAll || (userData?.rating ?? 0) >= job.ratingRequired.labeler).map((job) => {
                        const meetsRating = (userData?.rating ?? 0) >= job.ratingRequired.labeler;
                        return (
                        <div
                            key={job._id}
                            className={`rounded-xl border overflow-hidden ${meetsRating ? "border-gray-200 bg-gray-50" : "border-gray-200 bg-gray-100 opacity-60"}`}
                        >
                            <button
                                onClick={() => meetsRating && toggleJob(job._id)}
                                className={`w-full p-6 text-left transition ${meetsRating ? "hover:bg-gray-100" : "cursor-not-allowed"}`}
                            >
                                <div className="flex items-start justify-between gap-4 mb-3">
                                    <span className={`font-semibold ${meetsRating ? "text-gray-900" : "text-gray-400"}`}>
                                        {job.description}
                                    </span>
                                    {meetsRating && (
                                        <span className={`text-gray-400 transition-transform shrink-0 mt-0.5 ${expandedJob === job._id ? "rotate-180" : ""}`}>
                                            ▼
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <span className="inline-flex items-center rounded-full bg-white border border-gray-200 px-3 py-1 text-xs text-gray-600">
                                        Due {new Date(job.deadlineDate).toLocaleDateString()}
                                    </span>
                                    <span className="inline-flex items-center rounded-full bg-white border border-gray-200 px-3 py-1 text-xs text-gray-600">
                                        Rating {job.ratingRequired.labeler}+
                                    </span>
                                    {meetsRating && tasks[job._id]?.length > 0 && (
                                        <>
                                            <span className="inline-flex items-center rounded-full bg-white border border-gray-200 px-3 py-1 text-xs text-gray-600">
                                                {tasks[job._id].filter((t) => t.status === "labeled" || t.status === "reviewed").length} / {tasks[job._id].length} completed
                                            </span>
                                            <span className="inline-flex items-center rounded-full bg-white border border-gray-200 px-3 py-1 text-xs text-gray-600">
                                                {tasks[job._id].filter((t) => t.status === "unlabeled").length} unlabeled
                                            </span>
                                        </>
                                    )}
                                    {!meetsRating && (
                                        <span className="inline-flex items-center rounded-full bg-white border border-gray-200 px-3 py-1 text-xs text-gray-400">
                                            Your rating does not meet the minimum required rating for this job
                                        </span>
                                    )}
                                </div>
                            </button>
                            {meetsRating && expandedJob === job._id && (
                                <div className="border-t border-gray-200 px-6 py-4 space-y-2">
                                    {tasks[job._id]?.length === 0 ? (
                                        <p className="text-sm text-gray-500">
                                            No tasks for this job.
                                        </p>
                                    ) : (
                                        tasks[job._id]?.map((task, index) => (
                                            <div
                                                key={task._id}
                                                className="rounded-lg border border-gray-200 bg-white overflow-hidden flex items-stretch"
                                            >
                                                <div className="w-1 shrink-0 bg-blue-400" />
                                                <div className="flex items-center justify-between gap-4 p-4 flex-1 min-w-0">
                                                    <div className="space-y-0.5 text-sm min-w-0">
                                                        <div className="font-semibold text-gray-700">
                                                            Task #{index + 1}
                                                        </div>
                                                        <div className="text-gray-600 truncate">
                                                            {task.description}
                                                        </div>
                                                        <div className="text-xs text-gray-400 capitalize">
                                                            {task.status}
                                                        </div>
                                                    </div>
                                                    {getTaskButton(task, job._id)}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
