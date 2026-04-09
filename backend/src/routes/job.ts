import { Router, Response } from "express";

import { ObjectId, WithId } from "mongodb";

import { validationMethods, ValidationError } from "@/validation";
import { authMiddleware, AuthenticatedRequest } from "@/middleware/auth";
import { DataError } from "@/data/collections";
import {
    userDataMethods,
    OwnerUserDocument,
    LabelerUserDocument,
    ReviewerUserDocument,
} from "@/data/users";
import { jobDataMethods, JobDocument } from "@/data/jobs";
import { taskDataMethods, TaskDocument } from "@/data/tasks";
import { ownerDataMethods } from '@/data/owner';
import mime from 'mime';
import path from 'path';

const jobRoutes = Router();

jobRoutes.get(
    "/",
    authMiddleware.authenticateRequest,
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            const user: WithId<
                OwnerUserDocument | LabelerUserDocument | ReviewerUserDocument
            > = await userDataMethods.getUserByEmail(req.user.token.email);
            if (userDataMethods.isLabelerUser(user)) {
                const jobs = await jobDataMethods.getJobsByLabelerRating(
                    user.rating,
                );
                return res.status(200).json(jobs);
            } else if (userDataMethods.isReviewerUser(user)) {
                const jobs = await jobDataMethods.getJobsByReviewerRating(
                    user.rating,
                );
                return res.status(200).json(jobs);
            } else {
                const jobs =
                    await jobDataMethods.getJobsWithTaskCountsByOwnerId(
                        user._id.toString(),
                    );
                return res.status(200).json(jobs);
            }
        } catch (e) {
            switch (true) {
                case e instanceof ValidationError: {
                    return res
                        .status((e as ValidationError).code)
                        .json({ error: (e as ValidationError).message });
                }
                case e instanceof DataError: {
                    return res
                        .status((e as DataError).code)
                        .json({ error: (e as DataError).message });
                }
                case true: {
                    return res.status(500).json({ error: e });
                }
            }
        }
    },
);

jobRoutes.get("/:id", async (req: AuthenticatedRequest, res: Response) => {
    try {
        const jobId: ObjectId = validationMethods.common.id(req.params.id);
        const job: JobDocument = await jobDataMethods.getJobById(
            jobId.toString(),
        );
        return res.status(200).json(job);
    } catch (e) {
        switch (true) {
            case e instanceof ValidationError: {
                return res
                    .status((e as ValidationError).code)
                    .json({ error: (e as ValidationError).message });
            }
            case e instanceof DataError: {
                return res
                    .status((e as DataError).code)
                    .json({ error: (e as DataError).message });
            }
            case true: {
                return res.status(500).json({ error: e });
            }
        }
    }
});

jobRoutes.get(
    "/:id/details",
    authMiddleware.authenticateOwnerRequest,
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            const jobId: ObjectId = validationMethods.common.id(req.params.id);

            const job: JobDocument = await jobDataMethods.getJobById(
                jobId.toString(),
            );
            const user = await userDataMethods.getUserByEmail(
                req.user.token.email,
            );
            if (job.ownerId.toString() !== user._id.toString())
                throw new ValidationError(403, "You do not own this job.");

            const details = await jobDataMethods.getJobWithDetails(
                jobId.toString(),
            );
            return res.status(200).json(details);
        } catch (e) {
            switch (true) {
                case e instanceof ValidationError: {
                    return res
                        .status((e as ValidationError).code)
                        .json({ error: (e as ValidationError).message });
                }
                case e instanceof DataError: {
                    return res
                        .status((e as DataError).code)
                        .json({ error: (e as DataError).message });
                }
                case true: {
                    return res.status(500).json({ error: e });
                }
            }
        }
    },
);

jobRoutes.get(
    "/:id/tasks",
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            const jobId: ObjectId = validationMethods.common.id(req.params.id);
            const tasks = await taskDataMethods.getTaskByJobId(
                jobId.toString(),
            );
            return res.status(200).json(tasks);
        } catch (e) {
            switch (true) {
                case e instanceof ValidationError: {
                    return res
                        .status((e as ValidationError).code)
                        .json({ error: (e as ValidationError).message });
                }
                case e instanceof DataError: {
                    return res
                        .status((e as DataError).code)
                        .json({ error: (e as DataError).message });
                }
                case true: {
                    return res.status(500).json({ error: e });
                }
            }
        }
    },
);

jobRoutes.post(
    "/",
    authMiddleware.authenticateOwnerRequest,
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            const owner = await userDataMethods.getUserByEmail(
                req.user.token.email,
            );
            req.body.ownerId = owner._id.toString();
            const job = validationMethods.request.job.create(req);

            const jobId: string = (
                await jobDataMethods.createJob(job)
            ).toString();

            return res.status(201).json({ jobId: jobId });
        } catch (e: unknown) {
            switch (true) {
                case e instanceof ValidationError: {
                    return res
                        .status((e as ValidationError).code)
                        .json({ error: (e as ValidationError).message });
                }
                case e instanceof DataError: {
                    return res
                        .status((e as DataError).code)
                        .json({ error: (e as DataError).message });
                }
                case true: {
                    return res.status(500).json({ error: e });
                }
            }
        }
    },
);

jobRoutes.post(
    "/:jobId/tasks",
    authMiddleware.authenticateOwnerRequest,
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            const jobId: ObjectId = validationMethods.common.id(
                req.params.jobId,
            );
            const job = await jobDataMethods.getJobById(jobId.toString());

            const user = await userDataMethods.getUserByEmail(
                req.user.token.email,
            );
            if (job.ownerId.toString() !== user._id.toString())
                throw new ValidationError(403, "You do not own this job.");

            const task: TaskDocument =
                validationMethods.request.task.create(req);
            task.jobId = jobId;
            const taskId = await taskDataMethods.createTask(task);

            return res.status(201).json({ taskId });
        } catch (e: unknown) {
            switch (true) {
                case e instanceof ValidationError: {
                    return res
                        .status((e as ValidationError).code)
                        .json({ error: (e as ValidationError).message });
                }
                case e instanceof DataError: {
                    return res
                        .status((e as DataError).code)
                        .json({ error: (e as DataError).message });
                }
                case true: {
                    return res.status(500).json({ error: e });
                }
            }
        }
    },
);

jobRoutes.post(
    "/:id/upload",
    authMiddleware.authenticateOwnerRequest,
    async(req: AuthenticatedRequest, res:Response) => {
        try {
            const filePaths = req.body.filePaths;
            let files = [];
            for(let file of filePaths){
                let mimetype = mime.lookup(file);
                if(mimetype !== "image/jpeg" && mimetype !== "image/png"){
                    throw new DataError(400, "Image must be of type jpeg or png");
                }
                files.push({
                    path: file,
                    mimetype: mimetype,
                    filename: path.parse(file)
                })
            }
            const result = await ownerDataMethods.uploadImages(files);
            return res.status(200).json(result);
        }catch (e: unknown) {
            switch (true) {
                case e instanceof ValidationError: {
                    return res
                        .status((e as ValidationError).code)
                        .json({ error: (e as ValidationError).message });
                }
                case e instanceof DataError: {
                    return res
                        .status((e as DataError).code)
                        .json({ error: (e as DataError).message });
                }
                case true: {
                    return res.status(500).json({ error: e });
                }
            }
        }
    }
);

jobRoutes.delete(
    "/:jobId",
    authMiddleware.authenticateOwnerRequest,
    async(req: AuthenticatedRequest, res:Response) => {
        try {
            const mongoId = validationMethods.common.id(req.params.jobId);
            await jobDataMethods.deleteJob(mongoId);
            return res.status(200).json("Successfully deleted job");
        }catch (e: unknown) {
            switch (true) {
                case e instanceof ValidationError: {
                    return res
                        .status((e as ValidationError).code)
                        .json({ error: (e as ValidationError).message });
                }
                case e instanceof DataError: {
                    return res
                        .status((e as DataError).code)
                        .json({ error: (e as DataError).message });
                }
                case true: {
                    return res.status(500).json({ error: e });
                }
            }
        }
    }
)

export { jobRoutes };
