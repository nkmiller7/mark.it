import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Card from "../components/Card";

interface JobSummary {
    _id: string;
    description: string;
    deadlineDate: string;
    ratingRequired: {
        reviewer: number;
        labeler: number;
    };
    taskCount: number;
    reviewedCount: number;
}

interface OwnerHomeProps {
    entityName: string;
    email: string;
}

export default function OwnerHome({ entityName }: OwnerHomeProps) {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [jobs, setJobs] = useState<JobSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const token = await currentUser?.getIdToken();
                const res = await fetch("/api/job", {
                    headers: { authorization: `Bearer ${token}` },
                });
                if (!res.ok) {
                    setError("Failed to load jobs.");
                    return;
                }
                const data: JobSummary[] = await res.json();
                setJobs(data);
            } catch {
                setError("Failed to load jobs.");
            } finally {
                setLoading(false);
            }
        };
        fetchJobs();
    }, [currentUser]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-gray-500">Loading jobs...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center px-4">
                <p className="text-red-600">{error}</p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-5xl px-6 py-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Dashboard
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Welcome back, {entityName}
                    </p>
                </div>
                <Link
                    to="/jobs/create"
                    className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition"
                >
                    + Create Job
                </Link>
            </div>

            {jobs.length === 0 ? (
                <div className="mt-16 flex flex-col items-center text-center">
                    <div className="rounded-full bg-gray-100 p-4">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="size-8 text-gray-400"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0"
                            />
                        </svg>
                    </div>
                    <h2 className="mt-4 text-lg font-semibold text-gray-900">
                        No jobs yet
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Create your first labeling job to get started.
                    </p>
                    <Link
                        to="/jobs/create"
                        className="mt-6 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition"
                    >
                        Create your first job
                    </Link>
                </div>
            ) : (
                <Card className="mt-8 overflow-hidden">
                    {/* Table header */}
                    <div className="grid grid-cols-[1fr_120px_200px_40px] gap-4 border-b border-gray-200 bg-gray-50 px-6 py-3 text-xs font-medium uppercase tracking-wide text-gray-500">
                        <span>Description</span>
                        <span>Deadline</span>
                        <span>Progress</span>
                        <span />
                    </div>

                    {/* Job rows */}
                    {jobs.map((job) => {
                        const deadline = new Date(job.deadlineDate);
                        const isPast = deadline < new Date();
                        const pct =
                            job.taskCount > 0
                                ? Math.round(
                                      (job.reviewedCount / job.taskCount) * 100,
                                  )
                                : 0;

                        return (
                            <div
                                key={job._id}
                                onClick={() => navigate(`/jobs/${job._id}`)}
                                className="grid cursor-pointer grid-cols-[1fr_120px_200px_40px] items-center gap-4 border-b border-gray-100 px-6 py-4 hover:bg-gray-50 transition last:border-b-0"
                            >
                                <p className="truncate text-sm font-medium text-gray-900">
                                    {job.description}
                                </p>

                                <span
                                    className={`text-sm ${isPast ? "font-medium text-red-600" : "text-gray-600"}`}
                                >
                                    {deadline.toLocaleDateString()}
                                </span>

                                <div className="flex items-center gap-3">
                                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                                        <div
                                            className={`h-full rounded-full transition-all ${pct === 100 ? "bg-green-500" : "bg-blue-500"}`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <span className="w-12 text-right text-xs text-gray-500">
                                        {job.reviewedCount}/{job.taskCount}
                                    </span>
                                </div>

                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                    stroke="currentColor"
                                    className="size-4 text-gray-400"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="m8.25 4.5 7.5 7.5-7.5 7.5"
                                    />
                                </svg>
                            </div>
                        );
                    })}
                </Card>
            )}
        </div>
    );
}
