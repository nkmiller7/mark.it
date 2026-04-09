import { useEffect, useState } from "react";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface Task {
    _id: string;
    jobId: string;
    description: string;
    schema: string[];
    status: "unlabeled" | "labeled" | "reviewed";
    assignedLabelerId: string | null;
}

interface Asset {
    _id: string;
    status: "UNLABELED" | "LABELED" | "REVIEWED";
    label: string | null;
}

interface Job {
    description: string;
}

export default function TaskDetailLabeler() {
    const { id } = useParams();
    const { currentUser, userData } = useAuth();
    const navigate = useNavigate();
    const [task, setTask] = useState<Task | null>(null);
    const [job, setJob] = useState<Job | null>(null);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [selected, setSelected] = useState<string | null>(null);
    const [confirmed, setConfirmed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [submitError, setSubmitError] = useState("");

    useEffect(() => {
        const fetchData = async () => {
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

                const assetRes = await fetch(`/api/task/${id}/assets`, {
                    headers: { authorization: `Bearer ${token}` },
                });
                if (assetRes.status === 404) {
                    setAssets([]);
                } else if (!assetRes.ok) {
                    setError("Failed to load assets.");
                    return;
                } else {
                    const assetData: Asset[] = await assetRes.json();
                    setAssets(assetData);
                    const firstUnlabeled = assetData.findIndex((a) => a.status === "UNLABELED");
                    setCurrentIndex(firstUnlabeled === -1 ? 0 : firstUnlabeled);
                }
            } catch {
                setError("Failed to load task.");
            } finally {
                setLoading(false);
            }
        };
        if (currentUser) {
            fetchData();
        }
    }, [currentUser, id]);

    useEffect(() => {
        const fetchImageUrl = async () => {
            if (assets.length === 0) return;
            const token = await currentUser?.getIdToken();
            const res = await fetch(`/api/asset/${assets[currentIndex]._id}/url`, {
                headers: { authorization: `Bearer ${token}` },
            });
            if (!res.ok) return;
            const data = await res.json();
            setImageUrl(data.url);
        };
        fetchImageUrl();
    }, [currentIndex, assets, currentUser]);

    const handleConfirm = async () => {
        if (!selected) {
            return;
        }
        setSubmitError("");
        const token = await currentUser?.getIdToken();
        const asset = assets[currentIndex];
        const res = await fetch(`/api/asset/${asset._id}/label`, {
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
        setAssets((prev) =>
            prev.map((a, i) =>
                i === currentIndex ? { ...a, status: "LABELED", label: selected } : a,
            ),
        );
        setConfirmed(true);
    };

    const handleNext = () => {
        const nextUnlabeled = assets.findIndex((a, i) => i > currentIndex && a.status === "UNLABELED");
        if (nextUnlabeled !== -1) {
            setCurrentIndex(nextUnlabeled);
            setSelected(null);
            setConfirmed(false);
        } else {
            navigate("/home");
        }
    };

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

    if (userData?.type !== "labeler" || task.assignedLabelerId !== userData?._id || task.status !== "unlabeled") {
        return <Navigate to="/home" />;
    }

    if (assets.length === 0) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4">
                <p className="text-gray-500">This task has no assets to label.</p>
                <button
                    onClick={() => navigate("/home")}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    const labeled = assets.filter((a) => a.status === "LABELED" || a.status === "REVIEWED").length;
    const hasMoreUnlabeled = assets.some((a, i) => i !== currentIndex && a.status === "UNLABELED");
    const isLastAsset = !hasMoreUnlabeled;

    return (
        <div className="mx-auto max-w-5xl px-6 py-12">
            <p className="mb-1 text-sm text-gray-500">{job.description}</p>
            <h1 className="mb-4 text-3xl font-bold text-gray-900">{task.description}</h1>

            <div className="flex items-center gap-3 mb-8">
                <div className="flex gap-1">
                    {assets.map((a, i) => (
                        <div
                            key={a._id}
                            className={`h-2 w-6 rounded-full transition-all ${
                                a.status === "LABELED" || a.status === "REVIEWED"
                                    ? "bg-blue-500"
                                    : i === currentIndex
                                    ? "bg-blue-300"
                                    : "bg-gray-200"
                            }`}
                        />
                    ))}
                </div>
                <span className="text-sm text-gray-400">{labeled} / {assets.length} labeled</span>
            </div>

            <div className="flex gap-8 items-start">
                <div className="flex-1 rounded-xl border border-gray-200 bg-gray-100 aspect-square flex items-center justify-center overflow-hidden">
                    {imageUrl ? (
                        <img src={imageUrl} alt="Asset" className="w-full h-full object-contain" />
                    ) : (
                        <p className="text-sm text-gray-400">Loading image...</p>
                    )}
                </div>
                <div className="w-64 shrink-0 rounded-xl border border-gray-200 bg-gray-50 p-6">
                    <p className="mb-1 text-xs text-gray-400">Image {currentIndex + 1} of {assets.length}</p>
                    <p className="mb-4 text-sm font-semibold text-gray-900">
                        {task.description}
                    </p>
                    <div className="space-y-2">
                        {task.schema.map((option) => (
                            <button
                                key={option}
                                onClick={() => !confirmed && setSelected(option)}
                                disabled={confirmed}
                                className={`w-full rounded-lg border px-4 py-2 text-left text-sm transition ${selected === option ? "border-blue-400 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-700"} ${!confirmed ? "hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 cursor-pointer" : "cursor-not-allowed text-gray-400"}`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                    {submitError && (
                        <p className="mt-3 text-xs text-red-600">{submitError}</p>
                    )}
                    {!confirmed && selected && (
                        <button
                            onClick={handleConfirm}
                            className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
                        >
                            Confirm
                        </button>
                    )}
                    {confirmed && (
                        <button
                            onClick={handleNext}
                            className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
                        >
                            {isLastAsset ? "Finish Task" : "Next Image"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
