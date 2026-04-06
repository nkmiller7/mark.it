import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Card from "../components/Card";

interface Contributor {
    _id: string;
    firstName: string;
    lastName: string;
}

interface TaskDetail {
    _id: string;
    description: string;
    schema: string[];
    status: "unlabeled" | "labeled" | "reviewed";
    labeler: { firstName: string; lastName: string } | null;
    reviewer: { firstName: string; lastName: string } | null;
}

interface JobDetailData {
    job: {
        _id: string;
        description: string;
        deadlineDate: string;
        ratingRequired: {
            reviewer: number;
            labeler: number;
        };
    };
    tasks: TaskDetail[];
    contributors: {
        labelers: Contributor[];
        reviewers: Contributor[];
    };
}

const STATUS_CONFIG: Record<
    string,
    { label: string; bg: string; text: string }
> = {
    unlabeled: {
        label: "Unlabeled",
        bg: "bg-gray-100",
        text: "text-gray-700",
    },
    labeled: {
        label: "Labeled",
        bg: "bg-yellow-100",
        text: "text-yellow-800",
    },
    reviewed: {
        label: "Reviewed",
        bg: "bg-green-100",
        text: "text-green-800",
    },
};

export default function JobDetail() {
    const { id } = useParams<{ id: string }>();
    const { currentUser } = useAuth();
    const [data, setData] = useState<JobDetailData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const token = await currentUser?.getIdToken();
                const res = await fetch(`/api/job/${id}/details`, {
                    headers: { authorization: `Bearer ${token}` },
                });
                if (!res.ok) {
                    const body = await res.json().catch(() => null);
                    setError(body?.error || "Failed to load job details.");
                    return;
                }
                setData(await res.json());
            } catch {
                setError("Failed to load job details.");
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [currentUser, id]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-gray-500">Loading job details...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
                <p className="text-red-600">{error}</p>
                <Link
                    to="/home"
                    className="text-sm font-medium text-blue-600 hover:underline"
                >
                    Back to Dashboard
                </Link>
            </div>
        );
    }

    const { job, tasks, contributors } = data;
    const deadline = new Date(job.deadlineDate);
    const isPast = deadline < new Date();
    const reviewedCount = tasks.filter((t) => t.status === "reviewed").length;
    const pct =
        tasks.length > 0 ? Math.round((reviewedCount / tasks.length) * 100) : 0;

    return (
        <div className="mx-auto max-w-5xl px-6 py-10">
            {/* Back link */}
            <Link
                to="/home"
                className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="size-4"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 19.5 8.25 12l7.5-7.5"
                    />
                </svg>
                Back to Dashboard
            </Link>

            {/* Job info */}
            <Card className="mt-6 p-6">
                <h1 className="text-xl font-bold text-gray-900">
                    {job.description}
                </h1>

                <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Deadline
                        </p>
                        <p
                            className={`mt-1 text-sm font-medium ${isPast ? "text-red-600" : "text-gray-900"}`}
                        >
                            {deadline.toLocaleDateString()}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Min. Labeler Rating
                        </p>
                        <p className="mt-1 text-sm font-medium text-gray-900">
                            {job.ratingRequired.labeler}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Min. Reviewer Rating
                        </p>
                        <p className="mt-1 text-sm font-medium text-gray-900">
                            {job.ratingRequired.reviewer}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Progress
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                            <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
                                <div
                                    className={`h-full rounded-full ${pct === 100 ? "bg-green-500" : "bg-blue-500"}`}
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                                {reviewedCount}/{tasks.length}
                            </span>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Contributors */}
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <Card className="p-5">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                        Labelers
                    </h2>
                    {contributors.labelers.length === 0 ? (
                        <p className="mt-3 text-sm text-gray-400">
                            No labelers assigned yet
                        </p>
                    ) : (
                        <ul className="mt-3 space-y-2">
                            {contributors.labelers.map((c) => (
                                <li
                                    key={c._id}
                                    className="flex items-center gap-2 text-sm text-gray-700"
                                >
                                    <span className="flex size-7 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700">
                                        {c.firstName[0]}
                                        {c.lastName[0]}
                                    </span>
                                    {c.firstName} {c.lastName}
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
                <Card className="p-5">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                        Reviewers
                    </h2>
                    {contributors.reviewers.length === 0 ? (
                        <p className="mt-3 text-sm text-gray-400">
                            No reviewers assigned yet
                        </p>
                    ) : (
                        <ul className="mt-3 space-y-2">
                            {contributors.reviewers.map((c) => (
                                <li
                                    key={c._id}
                                    className="flex items-center gap-2 text-sm text-gray-700"
                                >
                                    <span className="flex size-7 items-center justify-center rounded-full bg-purple-100 text-xs font-medium text-purple-700">
                                        {c.firstName[0]}
                                        {c.lastName[0]}
                                    </span>
                                    {c.firstName} {c.lastName}
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            </div>

            {/* Tasks */}
            <div className="mt-6">
                <h2 className="text-lg font-semibold text-gray-900">
                    Tasks ({tasks.length})
                </h2>

                <div className="mt-4 space-y-3">
                    {tasks.map((task, i) => {
                        const cfg =
                            STATUS_CONFIG[task.status] ??
                            STATUS_CONFIG.unlabeled;
                        return (
                            <Card key={task._id} className="p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-gray-900">
                                            Task {i + 1}
                                        </p>
                                        <p className="mt-1 text-sm text-gray-600">
                                            {task.description}
                                        </p>
                                    </div>
                                    <span
                                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.bg} ${cfg.text}`}
                                    >
                                        {cfg.label}
                                    </span>
                                </div>

                                {task.schema.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                        {task.schema.map((label, li) => (
                                            <span
                                                key={li}
                                                className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600"
                                            >
                                                {label}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {(task.labeler || task.reviewer) && (
                                    <div className="mt-3 flex gap-4 text-xs text-gray-500">
                                        {task.labeler && (
                                            <span>
                                                Labeler:{" "}
                                                {task.labeler.firstName}{" "}
                                                {task.labeler.lastName}
                                            </span>
                                        )}
                                        {task.reviewer && (
                                            <span>
                                                Reviewer:{" "}
                                                {task.reviewer.firstName}{" "}
                                                {task.reviewer.lastName}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
