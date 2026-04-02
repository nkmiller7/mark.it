import { ObjectId } from "mongodb";
import { DataError, jobsCollection } from "@/data/collections";

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
        const validatedRating = validationMethods.job.ratingRequired(rating);

        const jobsCol = await jobsCollection();
        const jobs: JobDocument[] = await jobsCol
            .find({
                "ratingRequired.labeler": { $lte: validatedRating },
            })
            .toArray();

        return jobs;
    },

    getJobsByReviewerRating: async (rating: number): Promise<JobDocument[]> => {
        const validatedRating = validationMethods.job.ratingRequired(rating);

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
};

export { JobDocument, jobDataMethods };
