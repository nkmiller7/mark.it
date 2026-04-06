import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface TaskForm {
    description: string;
    schema: string[];
    newLabel: string;
    files: File[];
    collapsed: boolean;
}

interface FormErrors {
    description?: string;
    deadlineDate?: string;
    labelerRating?: string;
    reviewerRating?: string;
    tasks?: Record<number, { description?: string; schema?: string }>;
    general?: string;
}

function emptyTask(): TaskForm {
    return {
        description: "",
        schema: [],
        newLabel: "",
        files: [],
        collapsed: false,
    };
}

export default function CreateJob() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [description, setDescription] = useState("");
    const [deadlineDate, setDeadlineDate] = useState("");
    const [labelerRating, setLabelerRating] = useState(0);
    const [reviewerRating, setReviewerRating] = useState(0);
    const [tasks, setTasks] = useState<TaskForm[]>([emptyTask()]);
    const [errors, setErrors] = useState<FormErrors>({});
    const [submitting, setSubmitting] = useState(false);
    const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

    function validate(): FormErrors {
        const e: FormErrors = {};
        const trimmedDesc = description.trim();
        if (trimmedDesc.length < 10 || trimmedDesc.length > 200)
            e.description =
                "Description must be between 10 and 200 characters.";

        if (!deadlineDate) {
            e.deadlineDate = "Deadline date is required.";
        } else if (new Date(deadlineDate) <= new Date()) {
            e.deadlineDate = "Deadline must be in the future.";
        }

        if (labelerRating < 0 || labelerRating > 5)
            e.labelerRating = "Rating must be between 0 and 5.";
        if (reviewerRating < 0 || reviewerRating > 5)
            e.reviewerRating = "Rating must be between 0 and 5.";

        const taskErrors: Record<
            number,
            { description?: string; schema?: string }
        > = {};
        tasks.forEach((t, i) => {
            const te: { description?: string; schema?: string } = {};
            const td = t.description.trim();
            if (td.length < 10 || td.length > 200)
                te.description =
                    "Description must be between 10 and 200 characters.";
            if (t.schema.length === 0)
                te.schema = "At least one label is required.";
            if (Object.keys(te).length > 0) taskErrors[i] = te;
        });
        if (Object.keys(taskErrors).length > 0) e.tasks = taskErrors;

        return e;
    }

    function updateTask(index: number, partial: Partial<TaskForm>) {
        setTasks((prev) =>
            prev.map((t, i) => (i === index ? { ...t, ...partial } : t)),
        );
    }

    function addTask() {
        setTasks((prev) => [...prev, emptyTask()]);
    }

    function removeTask(index: number) {
        if (tasks.length <= 1) return;
        setTasks((prev) => prev.filter((_, i) => i !== index));
    }

    function addLabel(index: number) {
        const task = tasks[index];
        const label = task.newLabel.trim();
        if (!label) return;
        if (task.schema.includes(label)) return;
        updateTask(index, {
            schema: [...task.schema, label],
            newLabel: "",
        });
    }

    function removeLabel(taskIndex: number, labelIndex: number) {
        const task = tasks[taskIndex];
        updateTask(taskIndex, {
            schema: task.schema.filter((_, i) => i !== labelIndex),
        });
    }

    function handleFiles(index: number, fileList: FileList | null) {
        if (!fileList) return;
        const imageFiles = Array.from(fileList).filter((f) =>
            f.type.startsWith("image/"),
        );
        updateTask(index, {
            files: [...tasks[index].files, ...imageFiles],
        });
    }

    function removeFile(taskIndex: number, fileIndex: number) {
        const task = tasks[taskIndex];
        updateTask(taskIndex, {
            files: task.files.filter((_, i) => i !== fileIndex),
        });
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const validationErrors = validate();
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length > 0) return;

        setSubmitting(true);
        try {
            const token = await currentUser?.getIdToken();
            
            let res = await fetch("/api/job", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    description: description.trim(),
                    deadlineDate: new Date(deadlineDate).toISOString(),
                    ratingRequired: {
                        labeler: labelerRating,
                        reviewer: reviewerRating,
                    },
                }),
            });
            if (!res.ok) {
                const data = await res.json();
                setErrors({ general: data.error || "Failed to create job." });
                return;
            }
            const responseBody = await res.json();
            if (!responseBody.jobId) {
                setErrors({ general: "Failed to create job. No job ID returned." });
                return;
            }


            for (const t of tasks) {
                res = await fetch(`/api/task`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        jobId: responseBody.jobId,
                        description: t.description.trim(),
                        schema: t.schema,
                    }),
                });
                if (!res.ok) {
                    const data = await res.json();
                    setErrors({ general: data.error || "Failed to create tasks." });
                    return;
                }
            }

            // TODO: Upload images per task using the returned taskIds
            // const { jobId, taskIds } = await res.json();
            // For each task with files, upload to asset endpoint

            navigate("/home");
        } catch {
            setErrors({ general: "Failed to create job. Please try again." });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="mx-auto max-w-3xl px-6 py-10">
            <h1 className="text-2xl font-bold text-gray-900">Create Job</h1>
            <p className="mt-1 text-sm text-gray-500">
                Define your labeling job and add one or more tasks.
            </p>

            {errors.general && (
                <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    {errors.general}
                </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-8">
                {/* Job Info */}
                <section className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-800">
                        Job Details
                    </h2>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            maxLength={200}
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                            placeholder="Describe the labeling job (10-200 characters)"
                        />
                        <div className="mt-1 flex justify-between text-xs">
                            <span className="text-red-600">
                                {errors.description ?? ""}
                            </span>
                            <span className="text-gray-400">
                                {description.trim().length}/200
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Deadline Date
                        </label>
                        <input
                            type="date"
                            value={deadlineDate}
                            min={new Date().toISOString().split("T")[0]}
                            onChange={(e) => setDeadlineDate(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                        {errors.deadlineDate && (
                            <p className="mt-1 text-xs text-red-600">
                                {errors.deadlineDate}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Min. Labeler Rating
                            </label>
                            <input
                                type="number"
                                min={0}
                                max={5}
                                step={1}
                                value={labelerRating}
                                onChange={(e) =>
                                    setLabelerRating(Number(e.target.value))
                                }
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                            {errors.labelerRating && (
                                <p className="mt-1 text-xs text-red-600">
                                    {errors.labelerRating}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Min. Reviewer Rating
                            </label>
                            <input
                                type="number"
                                min={0}
                                max={5}
                                step={1}
                                value={reviewerRating}
                                onChange={(e) =>
                                    setReviewerRating(Number(e.target.value))
                                }
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                            {errors.reviewerRating && (
                                <p className="mt-1 text-xs text-red-600">
                                    {errors.reviewerRating}
                                </p>
                            )}
                        </div>
                    </div>
                </section>

                {/* Tasks */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Tasks
                        </h2>
                        <button
                            type="button"
                            onClick={addTask}
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                        >
                            + Add Task
                        </button>
                    </div>

                    {tasks.map((task, ti) => (
                        <div
                            key={ti}
                            className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden"
                        >
                            {/* Task header */}
                            <div className="flex items-center justify-between bg-white px-4 py-3 border-b border-gray-200">
                                <button
                                    type="button"
                                    onClick={() =>
                                        updateTask(ti, {
                                            collapsed: !task.collapsed,
                                        })
                                    }
                                    className="flex items-center gap-2 text-sm font-medium text-gray-800"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={2}
                                        stroke="currentColor"
                                        className={`size-4 transition-transform ${task.collapsed ? "" : "rotate-90"}`}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="m8.25 4.5 7.5 7.5-7.5 7.5"
                                        />
                                    </svg>
                                    Task {ti + 1}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => removeTask(ti)}
                                    disabled={tasks.length <= 1}
                                    className="text-xs text-red-500 hover:text-red-700 disabled:text-gray-300 disabled:cursor-not-allowed transition"
                                >
                                    Remove
                                </button>
                            </div>

                            {/* Task body */}
                            {!task.collapsed && (
                                <div className="space-y-4 p-4">
                                    {/* Task description */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Description
                                        </label>
                                        <textarea
                                            value={task.description}
                                            onChange={(e) =>
                                                updateTask(ti, {
                                                    description: e.target.value,
                                                })
                                            }
                                            rows={2}
                                            maxLength={200}
                                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                            placeholder="Describe this task (10-200 characters)"
                                        />
                                        <div className="mt-1 flex justify-between text-xs">
                                            <span className="text-red-600">
                                                {errors.tasks?.[ti]
                                                    ?.description ?? ""}
                                            </span>
                                            <span className="text-gray-400">
                                                {task.description.trim().length}
                                                /200
                                            </span>
                                        </div>
                                    </div>

                                    {/* Label schema */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Label Schema
                                        </label>
                                        <div className="mt-1 flex gap-2">
                                            <input
                                                type="text"
                                                value={task.newLabel}
                                                onChange={(e) =>
                                                    updateTask(ti, {
                                                        newLabel:
                                                            e.target.value,
                                                    })
                                                }
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        e.preventDefault();
                                                        addLabel(ti);
                                                    }
                                                }}
                                                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                                placeholder="Type a label and press Enter"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => addLabel(ti)}
                                                className="rounded-lg bg-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 transition"
                                            >
                                                Add
                                            </button>
                                        </div>
                                        {task.schema.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {task.schema.map(
                                                    (label, li) => (
                                                        <span
                                                            key={li}
                                                            className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800"
                                                        >
                                                            {label}
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    removeLabel(
                                                                        ti,
                                                                        li,
                                                                    )
                                                                }
                                                                className="ml-0.5 text-blue-600 hover:text-blue-900"
                                                            >
                                                                &times;
                                                            </button>
                                                        </span>
                                                    ),
                                                )}
                                            </div>
                                        )}
                                        {errors.tasks?.[ti]?.schema && (
                                            <p className="mt-1 text-xs text-red-600">
                                                {errors.tasks[ti].schema}
                                            </p>
                                        )}
                                    </div>

                                    {/* Image upload */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Images
                                        </label>
                                        <div
                                            className="mt-1 flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 px-4 py-6 text-center hover:border-blue-400 transition"
                                            onClick={() =>
                                                fileInputRefs.current[
                                                    ti
                                                ]?.click()
                                            }
                                            onDragOver={(e) =>
                                                e.preventDefault()
                                            }
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                handleFiles(
                                                    ti,
                                                    e.dataTransfer.files,
                                                );
                                            }}
                                        >
                                            <div>
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    strokeWidth={1.5}
                                                    stroke="currentColor"
                                                    className="mx-auto size-8 text-gray-400"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"
                                                    />
                                                </svg>
                                                <p className="mt-1 text-sm text-gray-500">
                                                    Click or drag images here
                                                </p>
                                            </div>
                                        </div>
                                        <input
                                            ref={(el) => {
                                                fileInputRefs.current[ti] = el;
                                            }}
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="hidden"
                                            onChange={(e) =>
                                                handleFiles(ti, e.target.files)
                                            }
                                        />
                                        {task.files.length > 0 && (
                                            <div className="mt-3 grid grid-cols-4 gap-2">
                                                {task.files.map((file, fi) => (
                                                    <div
                                                        key={fi}
                                                        className="group relative"
                                                    >
                                                        <img
                                                            src={URL.createObjectURL(
                                                                file,
                                                            )}
                                                            alt={file.name}
                                                            className="h-20 w-full rounded-lg object-cover"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                removeFile(
                                                                    ti,
                                                                    fi,
                                                                )
                                                            }
                                                            className="absolute -right-1 -top-1 hidden rounded-full bg-red-500 p-0.5 text-white group-hover:block"
                                                        >
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                viewBox="0 0 20 20"
                                                                fill="currentColor"
                                                                className="size-3"
                                                            >
                                                                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </section>

                {/* Submit */}
                <div className="flex items-center justify-end gap-4 border-t border-gray-200 pt-6">
                    <button
                        type="button"
                        onClick={() => navigate("/home")}
                        className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        {submitting ? "Creating..." : "Create Job"}
                    </button>
                </div>
            </form>
        </div>
    );
}
