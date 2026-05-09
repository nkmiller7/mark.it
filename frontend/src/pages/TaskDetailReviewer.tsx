import { useEffect, useRef, useState } from "react";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface Task {
    _id: string;
    jobId: string;
    description: string;
    schema: string[];
    status: "unlabeled" | "labeled" | "reviewed";
    assignedReviewerIds: string[];
}

interface Asset {
    _id: string;
    status: "UNLABELED" | "LABELED" | "REVIEWED";
    label: string | null;
    reviews: { reviewerId: string; label: string }[];
}

interface Job {
    description: string;
}

export default function TaskDetailReviewer() {
    const { id } = useParams();
    const { currentUser, userData, userLoading } = useAuth();
    const navigate = useNavigate();
    const [task, setTask] = useState<Task | null>(null);
    const [job, setJob] = useState<Job | null>(null);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [rejectMode, setRejectMode] = useState(false);
    const [selected, setSelected] = useState<string | null>(null);
    const [confirmed, setConfirmed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [submitError, setSubmitError] = useState("");
    const hasInitializedIndexRef = useRef(false);

    const myId = userData?._id ?? "";

    useEffect(() => {
        hasInitializedIndexRef.current = false;
    }, [id]);

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
        if (hasInitializedIndexRef.current || assets.length === 0 || !myId) {
            return;
        }
        const firstUnreviewed = assets.findIndex(
            (a) => !a.reviews.some((r) => r.reviewerId === myId),
        );
        setCurrentIndex(firstUnreviewed === -1 ? 0 : firstUnreviewed);
        hasInitializedIndexRef.current = true;
    }, [assets, myId]);

    useEffect(() => {
        const fetchImageUrl = async () => {
            if (assets.length === 0) {
                return;
            }
            const token = await currentUser?.getIdToken();
            const res = await fetch(
                `/api/asset/${assets[currentIndex]._id}/url`,
                {
                    headers: { authorization: `Bearer ${token}` },
                },
            );
            if (!res.ok) {
                return;
            }
            const data = await res.json();
            setImageUrl(data.url);
        };
        fetchImageUrl();
    }, [currentIndex, assets, currentUser]);

    const submitReview = async (reviewLabel: string) => {
        setSubmitError("");
        const token = await currentUser?.getIdToken();
        const asset = assets[currentIndex];
        const res = await fetch(`/api/asset/${asset._id}/review`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ reviewLabel }),
        });
        if (!res.ok) {
            setSubmitError("Failed to submit review. Please try again.");
            return false;
        }
        setAssets((prev) =>
            prev.map((a, i) =>
                i === currentIndex
                    ? {
                          ...a,
                          reviews: [
                              ...a.reviews,
                              { reviewerId: myId, label: reviewLabel },
                          ],
                      }
                    : a,
            ),
        );
        setConfirmed(true);
        return true;
    };

    const handleApprove = async () => {
        const asset = assets[currentIndex];
        if (!asset.label) {
            return;
        }
        await submitReview(asset.label);
    };

    const handleRejectConfirm = async () => {
        if (!selected) {
            return;
        }
        const ok = await submitReview(selected);
        if (ok) {
            setRejectMode(false);
        }
    };

    const handleNext = async () => {
        const nextUnreviewed = assets.findIndex(
            (a, i) =>
                i > currentIndex &&
                !a.reviews.some((r) => r.reviewerId === myId),
        );
        if (nextUnreviewed !== -1) {
            setCurrentIndex(nextUnreviewed);
            setSelected(null);
            setConfirmed(false);
            setRejectMode(false);
        } else {
            const token = await currentUser?.getIdToken();
            await fetch(`/api/task/${id}/review`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    authorization: `Bearer ${token}`,
                },
            });
            navigate("/home");
        }
    };

    if (loading || userLoading) {
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
        userData?.type !== "reviewer" ||
        !task.assignedReviewerIds.includes(myId) ||
        task.status !== "labeled"
    ) {
        return <Navigate to="/home" />;
    }

    if (assets.length === 0) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4">
                <p className="text-gray-500">
                    This task has no assets to review.
                </p>
                <button
                    onClick={() => navigate("/home")}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    const reviewed = assets.filter((a) =>
        a.reviews.some((r) => r.reviewerId === myId),
    ).length;
    const hasMoreUnreviewed = assets.some(
        (a, i) =>
            i !== currentIndex && !a.reviews.some((r) => r.reviewerId === myId),
    );
    const isLastAsset = !hasMoreUnreviewed;
    const currentAsset = assets[currentIndex];
    const alreadyReviewedThis = currentAsset.reviews.some(
        (r) => r.reviewerId === myId,
    );

    return (
        <div className="mx-auto max-w-5xl px-6 py-12">
            <p className="mb-1 text-sm text-gray-500">{job.description}</p>
            <h1 className="mb-4 text-3xl font-bold text-gray-900">
                {task.description}
            </h1>

            <div className="flex items-center gap-3 mb-8">
                <div className="flex gap-1">
                    {assets.map((a, i) => (
                        <div
                            key={a._id}
                            className={`h-2 w-6 rounded-full transition-all ${
                                a.reviews.some((r) => r.reviewerId === myId)
                                    ? "bg-blue-500"
                                    : i === currentIndex
                                      ? "bg-blue-300"
                                      : "bg-gray-200"
                            }`}
                        />
                    ))}
                </div>
                <span className="text-sm text-gray-400">
                    {reviewed} / {assets.length} reviewed
                </span>
            </div>

            <div className="flex gap-8 items-start">
                <div className="flex-1 rounded-xl border border-gray-200 bg-gray-100 aspect-square flex items-center justify-center overflow-hidden">
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt="Asset"
                            className="w-full h-full object-contain"
                        />
                    ) : (
                        <p className="text-sm text-gray-400">
                            Loading image...
                        </p>
                    )}
                </div>
                <div className="w-64 shrink-0 rounded-xl border border-gray-200 bg-gray-50 p-6">
                    <p className="mb-1 text-xs text-gray-400">
                        Image {currentIndex + 1} of {assets.length}
                    </p>
                    <p className="mb-1 text-sm font-semibold text-gray-900">
                        {task.description}
                    </p>
                    <div className="mb-4 flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                            Labeler chose:
                        </span>
                        <span className="rounded-full bg-blue-100 border border-blue-300 px-2 py-0.5 text-xs font-medium text-blue-700">
                            {currentAsset.label ?? "—"}
                        </span>
                    </div>

                    {submitError && (
                        <p className="mb-3 text-xs text-red-600">
                            {submitError}
                        </p>
                    )}

                    {alreadyReviewedThis || confirmed ? (
                        <button
                            onClick={handleNext}
                            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
                        >
                            {isLastAsset ? "Finish Task" : "Next Image"}
                        </button>
                    ) : rejectMode ? (
                        <>
                            <p className="mb-2 text-xs text-gray-500">
                                Select the correct label:
                            </p>
                            <div className="space-y-2">
                                {task.schema.filter((option) => option !== currentAsset.label).map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => setSelected(option)}
                                        className={`w-full rounded-lg border px-4 py-2 text-left text-sm transition cursor-pointer ${selected === option ? "border-blue-400 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"}`}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                            <div className="mt-4 flex gap-2">
                                <button
                                    onClick={() => {
                                        setRejectMode(false);
                                        setSelected(null);
                                    }}
                                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRejectConfirm}
                                    disabled={!selected}
                                    className="flex-1 rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Confirm
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={handleApprove}
                                className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition"
                            >
                                Approve
                            </button>
                            <button
                                onClick={() => setRejectMode(true)}
                                className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition"
                            >
                                Reject
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
