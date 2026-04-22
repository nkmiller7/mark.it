import { ObjectId } from "mongodb";
import {
    DataError,
    jobsCollection,
    tasksCollection,
    usersCollection,
    assetsCollection,
} from "@/data/collections";
import { UserDocument } from "@/data/users";
import { taskDataMethods } from "@/data/tasks";
import { validationMethods } from "@/validation";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import JSZip from "jszip";

interface JobDocument {
    ownerId: ObjectId;
    description: string;
    deadlineDate: string;
    ratingRequired: {
        reviewer: number;
        labeler: number;
    };
}

const jobDataMethods = {
    getJobById: async (id: string): Promise<JobDocument> => {
        const mongoId = validationMethods.common.id(id);

        const jobsCol = await jobsCollection();
        const job: JobDocument | null = await jobsCol.findOne({
            _id: mongoId,
        });
        if (job === null) throw new DataError(404, "Job not found.");

        return job;
    },

    getJobsByOwnerId: async (ownerId: string): Promise<JobDocument[]> => {
        const mongoOwnerId = validationMethods.common.id(ownerId);

        const jobsCol = await jobsCollection();
        const jobs: JobDocument[] = await jobsCol
            .find({
                ownerId: mongoOwnerId,
            })
            .toArray();

        return jobs;
    },

    getAllJobs: async (): Promise<JobDocument[]> => {
        const jobsCol = await jobsCollection();
        return jobsCol.find({}).toArray();
    },

    getJobsByLabelerRating: async (rating: number): Promise<JobDocument[]> => {
        const validatedRating = validationMethods.user.rating(rating);

        const jobsCol = await jobsCollection();
        const jobs: JobDocument[] = await jobsCol
            .find({
                "ratingRequired.labeler": { $lte: validatedRating },
            })
            .toArray();

        return jobs;
    },

    getJobsByReviewerRating: async (rating: number): Promise<JobDocument[]> => {
        const validatedRating = validationMethods.user.rating(rating);

        const jobsCol = await jobsCollection();
        const jobs: JobDocument[] = await jobsCol
            .find({
                "ratingRequired.reviewer": { $lte: validatedRating },
            })
            .toArray();

        return jobs;
    },

    createJob: async (job: JobDocument): Promise<ObjectId> => {
        job.ownerId = validationMethods.common.id(job.ownerId);
        job.description = validationMethods.job.description(job.description);
        job.deadlineDate = validationMethods.common.date(job.deadlineDate);
        job.ratingRequired = validationMethods.job.ratingRequired(
            job.ratingRequired,
        );

        const jobsCol = await jobsCollection();
        const insertInfo = await jobsCol.insertOne(job);
        if (insertInfo.acknowledged !== true)
            throw new DataError(500, "Failed to create new job.");

        return insertInfo.insertedId;
    },

    getJobsWithTaskCountsByOwnerId: async (
        ownerId: string,
    ): Promise<
        (JobDocument & { taskCount: number; reviewedCount: number })[]
    > => {
        const mongoOwnerId = validationMethods.common.id(ownerId);

        const jobsCol = await jobsCollection();
        const jobs = await jobsCol
            .aggregate<
                JobDocument & { taskCount: number; reviewedCount: number }
            >([
                { $match: { ownerId: mongoOwnerId } },
                {
                    $lookup: {
                        from: "tasks",
                        localField: "_id",
                        foreignField: "jobId",
                        as: "_tasks",
                    },
                },
                {
                    $addFields: {
                        taskCount: { $size: "$_tasks" },
                        reviewedCount: {
                            $size: {
                                $filter: {
                                    input: "$_tasks",
                                    as: "t",
                                    cond: {
                                        $eq: ["$$t.status", "reviewed"],
                                    },
                                },
                            },
                        },
                    },
                },
                { $project: { _tasks: 0 } },
            ])
            .toArray();

        return jobs;
    },

    getJobWithDetails: async (
        jobId: string,
    ): Promise<{
        job: JobDocument & { _id: ObjectId };
        tasks: {
            _id: ObjectId;
            description: string;
            schema: string[];
            status: string;
            labeler: { firstName: string; lastName: string } | null;
            reviewers: { firstName: string; lastName: string }[];
        }[];
        contributors: {
            labelers: { _id: ObjectId; firstName: string; lastName: string }[];
            reviewers: { _id: ObjectId; firstName: string; lastName: string }[];
        };
    }> => {
        const mongoJobId = validationMethods.common.id(jobId);

        const jobsCol = await jobsCollection();
        const jobDoc = await jobsCol.findOne({ _id: mongoJobId });
        if (jobDoc === null) throw new DataError(404, "Job not found.");

        const job = jobDoc as JobDocument & { _id: ObjectId };

        const tasksCol = await tasksCollection();
        const rawTasks = await tasksCol.find({ jobId: mongoJobId }).toArray();

        const labelerIds = new Set<string>();
        const reviewerIds = new Set<string>();
        for (const t of rawTasks) {
            if (t.assignedLabelerId)
                labelerIds.add(t.assignedLabelerId.toString());
            for (const id of t.assignedReviewerIds ?? [])
                reviewerIds.add(id.toString());
        }

        const allUserIds = [...new Set([...labelerIds, ...reviewerIds])].map(
            (id) => new ObjectId(id),
        );
        const usersCol = await usersCollection<UserDocument>();
        const users =
            allUserIds.length > 0
                ? await usersCol.find({ _id: { $in: allUserIds } }).toArray()
                : [];
        const userMap = new Map(users.map((u) => [u._id.toString(), u]));

        const resolveUser = (
            id: ObjectId | null,
        ): { firstName: string; lastName: string } | null => {
            if (!id) return null;
            const u = userMap.get(id.toString()) as
                | { firstName?: string; lastName?: string }
                | undefined;
            if (!u || !u.firstName || !u.lastName) return null;
            return { firstName: u.firstName, lastName: u.lastName };
        };

        const tasks = rawTasks.map((t) => ({
            _id: t._id,
            description: t.description,
            schema: t.schema,
            status: t.status,
            labeler: resolveUser(t.assignedLabelerId),
            reviewers: (t.assignedReviewerIds ?? []).map(resolveUser).filter((r): r is { firstName: string; lastName: string } => r !== null),
        }));

        const labelers = [...labelerIds]
            .map((id) => {
                const u = userMap.get(id) as
                    | {
                          _id: ObjectId;
                          firstName?: string;
                          lastName?: string;
                      }
                    | undefined;
                if (!u || !u.firstName || !u.lastName) return null;
                return {
                    _id: u._id,
                    firstName: u.firstName,
                    lastName: u.lastName,
                };
            })
            .filter(
                (
                    u,
                ): u is {
                    _id: ObjectId;
                    firstName: string;
                    lastName: string;
                } => u !== null,
            );

        const reviewers = [...reviewerIds]
            .map((id) => {
                const u = userMap.get(id) as
                    | {
                          _id: ObjectId;
                          firstName?: string;
                          lastName?: string;
                      }
                    | undefined;
                if (!u || !u.firstName || !u.lastName) return null;
                return {
                    _id: u._id,
                    firstName: u.firstName,
                    lastName: u.lastName,
                };
            })
            .filter(
                (
                    u,
                ): u is {
                    _id: ObjectId;
                    firstName: string;
                    lastName: string;
                } => u !== null,
            );

        return {
            job,
            tasks,
            contributors: { labelers, reviewers },
        };
    },
    getLabeledJobAssets: async (jobId: string) => {
        const mongoJobId = validationMethods.common.id(jobId);

        const tasksCol = await tasksCollection();
        const tasks = await tasksCol
            .find({
                jobId: new ObjectId(mongoJobId),
            })
            .toArray();

        const assetsCol = await assetsCollection();
        const labeledAssets = [];
        for (let task of tasks) {
            const taskAssets = await assetsCol
                .find({
                    taskId: task._id,
                    status: { $in: ["LABELED"] },
                    //statues: { $in: ["LABELED", "REVIEWED"] },
                })
                .toArray();
            labeledAssets.push(...taskAssets);
        }

        if (process.env.MODE === "prod") {
            const s3 = new S3Client({
                credentials: {
                    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
                },
                region: process.env.AWS_REGION,
            });
            const zip = new JSZip();

            for (let asset of labeledAssets) {
                const assetS3Key = asset.key;
                const command = new GetObjectCommand({
                    Bucket: process.env.S3_BUCKET_NAME,
                    Key: assetS3Key,
                });

                let fileBytes: Uint8Array = new Uint8Array();
                try {
                    const response = await s3.send(command);
                    if (!response.Body)
                        throw new DataError(
                            500,
                            "Failed to retrieve asset from S3",
                        );
                    fileBytes = await response.Body.transformToByteArray();
                } catch (e) {
                    throw new DataError(
                        500,
                        "Failed to retrieve asset from S3",
                    );
                }
                zip.file(
                    `${asset.label}_${asset.taskId.toString()}_${asset._id.toString()}`,
                    fileBytes,
                );
            }
            const content = await zip.generateAsync({
                type: "nodebuffer",
                compression: "DEFLATE",
                compressionOptions: { level: 6 },
            });
            return content;
        }

        // TODO: Implement local file retrieval for non-prod environments.
        throw new DataError(500, "Failed to retrieve labeled assets.");
    },
    deleteJob: async (id: string) => {
        const mongoId = validationMethods.common.id(id);
        const jobsCol = await jobsCollection();
        const tasksCol = await tasksCollection();
        const job: JobDocument | null = await jobsCol.findOne({
            _id: mongoId,
        });
        if (job === null) throw new DataError(404, "Job not found.");
        const jobTasks = await tasksCol.find({ jobId: mongoId }).toArray();
        for (let task of jobTasks) {
            await taskDataMethods.deleteTask(String(task._id), true);
        }
        await jobsCol.deleteOne({ _id: mongoId });
    }
};

export { JobDocument, jobDataMethods };
