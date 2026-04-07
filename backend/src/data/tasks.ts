import { validationMethods } from "@/validation";

import { tasksCollection, DataError } from "@/data/collections";
import { ObjectId } from "mongodb";

interface TaskDocument {
    jobId: ObjectId;
    description: string;
    schema: string[];
    label: string | null;
    assignedLabelerId: ObjectId | null;
    assignedReviewerId: ObjectId | null;
    status: "unlabeled" | "labeled" | "reviewed";
}

interface TaskWithJob extends TaskDocument {
    jobDescription: string;
    jobDeadline: string;
}

const taskDataMethods = {
    getTaskById: async (id: string): Promise<TaskDocument> => {
        const mongoId = validationMethods.common.id(id);

        const tasksCol = await tasksCollection();
        const task: TaskDocument = await tasksCol.findOne({
            _id: mongoId,
        });
        if (task === null) throw new DataError(404, "Task not found.");

        return task;
    },

    getTaskByJobId: async (jobId: string): Promise<TaskDocument[]> => {
        const mongoJobId = validationMethods.common.id(jobId);

        const tasksCol = await tasksCollection();
        const tasks: TaskDocument[] = await tasksCol
            .find({
                jobId: mongoJobId,
            })
            .toArray();

        return tasks;
    },

    createTask: async (task: TaskDocument): Promise<ObjectId> => {
        task.jobId = validationMethods.common.id(task.jobId);
        task.description = validationMethods.task.description(task.description);
        task.schema = validationMethods.task.schema(task.schema);
        task.assignedLabelerId = task.assignedLabelerId
            ? validationMethods.common.id(task.assignedLabelerId)
            : null;
        task.assignedReviewerId = task.assignedReviewerId
            ? validationMethods.common.id(task.assignedReviewerId)
            : null;
        task.status = validationMethods.task.status(task.status);
        task.label = null;

        const tasksCol = await tasksCollection();
        const insertInfo = await tasksCol.insertOne(task);
        if (insertInfo.acknowledged !== true)
            throw new DataError(500, "Failed to create new task.");

        return insertInfo.insertedId;
    },

    getTasksByUserId: async (userId: string): Promise<TaskWithJob[]> => {
        const mongoUserId = validationMethods.common.id(userId);

        const tasksCol = await tasksCollection();
        const tasks = await tasksCol.aggregate<TaskWithJob>([
                {
                    $match: {
                        $or: [
                            { assignedLabelerId: mongoUserId },
                            { assignedReviewerId: mongoUserId },
                        ],
                    },
                },
                {
                    $lookup: {
                        from: "jobs",
                        localField: "jobId",
                        foreignField: "_id",
                        as: "_job",
                    },
                },
                {
                    $addFields: {
                        jobDescription: { $arrayElemAt: ["$_job.description", 0] },
                        jobDeadline: { $arrayElemAt: ["$_job.deadlineDate", 0] },
                    },
                },
                { $project: { _job: 0 } },
            ])
            .toArray();

        return tasks;
    },

    submitTaskLabel: async (taskId: string, userId: string, label: string): Promise<void> => {
        const mongoTaskId = validationMethods.common.id(taskId);
        const mongoUserId = validationMethods.common.id(userId);

        const tasksCol = await tasksCollection();
        const task: TaskDocument = await tasksCol.findOne({ _id: mongoTaskId });
        if (task === null) {
            throw new DataError(404, "Task not found.");
        }
        if (task.assignedLabelerId?.toString() !== mongoUserId.toString()) {
            throw new DataError(403, "You are not assigned to this task.");
        }
        if (task.status !== "unlabeled") {
            throw new DataError(400, "Task is not unlabeled.");
        }

        label = validationMethods.asset.label(label, task.schema);

        await tasksCol.updateOne(
            { _id: mongoTaskId },
            { $set: { status: "labeled", label: label } },
        );
    },

    claimTask: async (
        taskId: string,
        userId: string,
        role: "labeler" | "reviewer",
    ): Promise<void> => {
        const mongoTaskId = validationMethods.common.id(taskId);
        const mongoUserId = validationMethods.common.id(userId);

        const tasksCol = await tasksCollection();

        if (role === "labeler") {
            const result = await tasksCol.findOneAndUpdate(
                { _id: mongoTaskId, assignedLabelerId: null },
                { $set: { assignedLabelerId: mongoUserId } },
            );
            if (result === null) {
                throw new DataError(400, "Task not found or already claimed.");
            }
        } else {
            const result = await tasksCol.findOneAndUpdate(
                { _id: mongoTaskId, assignedReviewerId: null },
                { $set: { assignedReviewerId: mongoUserId } },
            );
            if (result === null) {
                throw new DataError(400, "Task not found or already claimed.");
            }
        }
    },
};

export { TaskDocument, TaskWithJob, taskDataMethods };
