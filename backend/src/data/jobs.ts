import { ObjectId } from "mongodb";
import {
    DataError,
    jobsCollection,
    tasksCollection,
    usersCollection,
} from "@/data/collections";
import { UserDocument } from "@/data/users";

import { validationMethods } from "@/validation";

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
        const job: JobDocument = await jobsCol.findOne({
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
            reviewer: { firstName: string; lastName: string } | null;
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
            if (t.assignedReviewerId)
                reviewerIds.add(t.assignedReviewerId.toString());
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
            reviewer: resolveUser(t.assignedReviewerId),
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
};

export { JobDocument, jobDataMethods };
