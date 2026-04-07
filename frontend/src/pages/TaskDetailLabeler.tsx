import { useEffect, useState } from "react";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface Task {
    _id: string;
    jobId: string;
    description: string;
    schema: string[];
    status: "unlabeled" | "labeled" | "reviewed";
    label: string | null;
    assignedLabelerId: string | null;
    assignedReviewerId: string | null;
}

interface Job {
    description: string;
}

export default function TaskDetailLabeler() {
    const { id } = useParams();
    const { currentUser, userData } = useAuth();
    const [task, setTask] = useState<Task | null>(null);
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selected, setSelected] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState("");

    const navigate = useNavigate();

    const handleSubmit = async () => {
        if (!selected) {
            return;
        }
        setSubmitError("");
        const token = await currentUser?.getIdToken();
        const res = await fetch(`/api/task/${id}/label`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ label: selected }),
        });
        if (!res.ok) {
            setSubmitError("Failed to submit label. Please try again.");
            return;
        }
        navigate("/home");
    };

    useEffect(() => {
        const fetchTask = async () => {
            try {
                const token = await currentUser?.getIdToken();
                const taskRes = await fetch(`/api/task/${id}`, {
                    headers: { authorization: `Bearer ${token}` },
                });
                if (!taskRes.ok) {
                    setError("Task not found.");
                    return;
                }
                const taskData: Task = await taskRes.json();
                setTask(taskData);

                const jobRes = await fetch(`/api/job/${taskData.jobId}`, {
                    headers: { authorization: `Bearer ${token}` },
                });
                if (!jobRes.ok) {
                    setError("Job not found.");
                    return;
                }
                const jobData: Job = await jobRes.json();
                setJob(jobData);
            } catch {
                setError("Failed to load task.");
            } finally {
                setLoading(false);
            }
        };
        if (currentUser) {
            fetchTask();
        }
    }, [currentUser, id]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-gray-500">Loading...</p>
            </div>
        );
    }

    if (error || !task || !job) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-red-600">{error || "Task not found."}</p>
            </div>
        );
    }

    if (
        userData?.type !== "labeler" ||
        task.assignedLabelerId !== userData?._id
    ) {
        return <Navigate to="/home" />;
    }

    const isReadOnly = task.status === "labeled" || task.status === "reviewed";

    return (
        <div className="mx-auto max-w-5xl px-6 py-12">
            <p className="mb-1 text-sm text-gray-500">{job.description}</p>
            <h1 className="mb-8 text-3xl font-bold text-gray-900">
                {task.description}
            </h1>
            <div className="flex gap-8 items-start">
                <div className="flex-1 rounded-xl border border-gray-200 bg-gray-100 aspect-square flex items-center justify-center">
                    <p className="text-sm text-gray-400">
                        PUT IMAGE HERE SOMEHOW FROM S3
                    </p>
                </div>
                <div className="w-64 shrink-0 rounded-xl border border-gray-200 bg-gray-50 p-6">
                    <p className="mb-4 text-sm font-semibold text-gray-900">
                        {task.description}
                    </p>
                    <div className="space-y-2">
                        {task.schema.map((option) => {
                            const isChosen = isReadOnly
                                ? option === task.label
                                : option === selected;
                            return (
                                <button
                                    key={option}
                                    onClick={() =>
                                        !isReadOnly && setSelected(option)
                                    }
                                    disabled={isReadOnly}
                                    className={`w-full rounded-lg border px-4 py-2 text-left text-sm transition ${isChosen ? "border-blue-400 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-400 cursor-not-allowed"} ${!isReadOnly && !isChosen ? "hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 text-gray-700 cursor-pointer" : ""}`}
                                >
                                    {option}
                                </button>
                            );
                        })}
                    </div>
                    {submitError && (
                        <p className="mt-3 text-xs text-red-600">{submitError}</p>
                    )}
                    {!isReadOnly && selected && (
                        <button
                            onClick={handleSubmit}
                            className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
                        >
                            Confirm
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
