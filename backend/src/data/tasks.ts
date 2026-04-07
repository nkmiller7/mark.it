import { validationMethods } from "@/validation";

import { tasksCollection, DataError } from "@/data/collections";
import { ObjectId } from "mongodb";

interface TaskDocument {
    jobId: ObjectId;
    description: string;
    schema: string[];
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

    claimTask: async (
        taskId: string,
        userId: string,
        role: "labeler" | "reviewer",
    ): Promise<void> => {
        const mongoTaskId = validationMethods.common.id(taskId);
        const mongoUserId = validationMethods.common.id(userId);

        const tasksCol = await tasksCollection();
        const task: TaskDocument = await tasksCol.findOne({
            _id: mongoTaskId,
        });
        if (task === null) throw new DataError(404, "Task not found.");

        if (role === "labeler") {
            if (task.assignedLabelerId !== null)
                throw new DataError(400, "Task already has a labeler.");
            await tasksCol.updateOne(
                { _id: mongoTaskId },
                { $set: { assignedLabelerId: mongoUserId } },
            );
        } else {
            if (task.assignedReviewerId !== null)
                throw new DataError(400, "Task already has a reviewer.");
            await tasksCol.updateOne(
                { _id: mongoTaskId },
                { $set: { assignedReviewerId: mongoUserId } },
            );
        }
    },
};

export { TaskDocument, TaskWithJob, taskDataMethods };
