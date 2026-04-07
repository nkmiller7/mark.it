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
                <button className="shrink-0 rounded-lg border border-red-300 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition">
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
            <button onClick={() => claimTask(jobId, task._id)} className="shrink-0 rounded-lg border border-blue-300 px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 transition">
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
            <h1 className="mb-8 text-3xl font-bold text-gray-900">
                Labeler - Explore Jobs
            </h1>
            {jobs.length === 0 ? (
                <p className="text-gray-500">
                    No jobs available for your rating.
                </p>
            ) : (
                <div className="grid gap-4">
                    {jobs.map((job) => (
                        <div
                            key={job._id}
                            className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden"
                        >
                            <button
                                onClick={() => toggleJob(job._id)}
                                className="w-full p-6 text-left hover:bg-gray-100 transition"
                            >
                                <div className="flex items-start justify-between gap-4 mb-3">
                                    <span className="font-semibold text-gray-900">
                                        {job.description}
                                    </span>
                                    <span
                                        className={`text-gray-400 transition-transform shrink-0 mt-0.5 ${expandedJob === job._id ? "rotate-180" : ""}`}
                                    >
                                        ▼
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <span className="inline-flex items-center rounded-full bg-white border border-gray-200 px-3 py-1 text-xs text-gray-600">
                                        Due{" "}
                                        {new Date(
                                            job.deadlineDate,
                                        ).toLocaleDateString()}
                                    </span>
                                    <span className="inline-flex items-center rounded-full bg-white border border-gray-200 px-3 py-1 text-xs text-gray-600">
                                        Rating {job.ratingRequired.labeler}+
                                    </span>
                                    {tasks[job._id]?.length > 0 && (
                                        <>
                                            <span className="inline-flex items-center rounded-full bg-white border border-gray-200 px-3 py-1 text-xs text-gray-600">
                                                {tasks[job._id].length} tasks
                                            </span>
                                            <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs text-blue-600">
                                                {
                                                    tasks[job._id].filter(
                                                        (t) =>
                                                            t.status ===
                                                            "unlabeled",
                                                    ).length
                                                }{" "}
                                                unlabeled
                                            </span>
                                        </>
                                    )}
                                </div>
                            </button>
                            {expandedJob === job._id && (
                                <div className="border-t border-gray-200 px-6 py-4 space-y-2">
                                    {tasks[job._id]?.length === 0 ? (
                                        <p className="text-sm text-gray-500">
                                            No tasks for this job.
                                        </p>
                                    ) : (
                                        tasks[job._id]?.map((task, index) => {
                                            return (
                                                <div
                                                    key={task._id}
                                                    className="rounded-lg border border-gray-200 bg-white overflow-hidden flex items-stretch"
                                                >
                                                    <div className="w-1 shrink-0 bg-blue-400" />
                                                    <div className="flex items-center justify-between gap-4 p-4 flex-1 min-w-0">
                                                        <div className="space-y-0.5 text-sm min-w-0">
                                                            <div className="font-semibold text-gray-700">
                                                                Task #
                                                                {index + 1}
                                                            </div>
                                                            <div className="text-gray-600 truncate">
                                                                {
                                                                    task.description
                                                                }
                                                            </div>
                                                            <div className="text-xs text-gray-400 capitalize">
                                                                {task.status}
                                                            </div>
                                                        </div>
                                                        {getTaskButton(task, job._id)}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
