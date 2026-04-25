import { Router, Request, Response } from "express";

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
import { ownerDataMethods } from "@/data/owner";
import mime from "mime";
import path from "path";

const jobRoutes = Router();

jobRoutes.get(
    "/",
    authMiddleware.authenticateRequest,
    async (req: Request, res: Response) => {
        try {
            const authReq = req as AuthenticatedRequest;
            const user: WithId<
                OwnerUserDocument | LabelerUserDocument | ReviewerUserDocument
            > = await userDataMethods.getUserByEmail(authReq.user.token.email!);
            if (
                userDataMethods.isLabelerUser(user) ||
                userDataMethods.isReviewerUser(user)
            ) {
                const jobs = await jobDataMethods.getAllJobs();
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
                default: {
                    return res.status(500).json({ error: e });
                }
            }
        }
    },
);

jobRoutes.get("/:id", async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthenticatedRequest;
        const jobId: ObjectId = validationMethods.common.id(authReq.params.id);
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
            default: {
                return res.status(500).json({ error: e });
            }
        }
    }
});

jobRoutes.get(
    "/:id/details",
    authMiddleware.authenticateOwnerRequest,
    async (req: Request, res: Response) => {
        try {
            const authReq = req as AuthenticatedRequest;

            const jobId: ObjectId = validationMethods.common.id(
                authReq.params.id,
            );

            const job: JobDocument = await jobDataMethods.getJobById(
                jobId.toString(),
            );
            const user = await userDataMethods.getUserByEmail(
                authReq.user.token.email!,
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
                default: {
                    return res.status(500).json({ error: e });
                }
            }
        }
    },
);

jobRoutes.get(
    "/:id/tasks",
    authMiddleware.authenticateRequest,
    async (req: Request, res: Response) => {
        try {
            const authReq = req as AuthenticatedRequest;

            const jobId: ObjectId = validationMethods.common.id(
                authReq.params.id,
            );
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
                default: {
                    return res.status(500).json({ error: e });
                }
            }
        }
    },
);

jobRoutes.get(
    "/:id/assets",
    authMiddleware.authenticateOwnerRequest,
    async (req: Request, res: Response) => {
        try {
            const authReq = req as AuthenticatedRequest;

            const jobId: ObjectId = validationMethods.common.id(
                authReq.params.id,
            );
            const job = await jobDataMethods.getJobById(jobId.toString());
            const user = await userDataMethods.getUserByEmail(
                authReq.user.token.email!,
            );
            if (job.ownerId.toString() !== user._id.toString())
                throw new ValidationError(403, "You do not own this job.");

            const labeledAssets = await jobDataMethods.getLabeledJobAssets(
                jobId.toString(),
            );
            res.set({
                "Content-Type": "application/zip",
                "Content-Disposition":
                    'attachment; filename="labeled_assets.zip"',
                "Content-Length": labeledAssets.length,
            });
            return res.send(labeledAssets);
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
                default: {
                    return res.status(500).json({ error: e });
                }
            }
        }
    },
);

jobRoutes.post(
    "/",
    authMiddleware.authenticateOwnerRequest,
    async (req: Request, res: Response) => {
        try {
            const authReq = req as AuthenticatedRequest;

            const owner = await userDataMethods.getUserByEmail(
                authReq.user.token.email!,
            );
            authReq.body.ownerId = owner._id.toString();
            const job = validationMethods.request.job.create(authReq);

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
                default: {
                    return res.status(500).json({ error: e });
                }
            }
        }
    },
);

jobRoutes.post(
    "/:jobId/tasks",
    authMiddleware.authenticateOwnerRequest,
    async (req: Request, res: Response) => {
        try {
            const authReq = req as AuthenticatedRequest;

            const jobId: ObjectId = validationMethods.common.id(
                authReq.params.jobId,
            );
            const job = await jobDataMethods.getJobById(jobId.toString());
            const user = await userDataMethods.getUserByEmail(
                authReq.user.token.email!,
            );
            if (job.ownerId.toString() !== user._id.toString())
                throw new ValidationError(403, "You do not own this job.");
            const task: TaskDocument =
                validationMethods.request.task.create(authReq);
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
                default: {
                    return res.status(500).json({ error: e });
                }
            }
        }
    },
);

jobRoutes.post(
    "/:id/upload",
    authMiddleware.authenticateOwnerRequest,
    async (req: Request, res: Response) => {
        try {
            const authReq = req as AuthenticatedRequest;

            const filePaths = authReq.body.filePaths;
            let files = [];
            for (let file of filePaths) {
                let mimetype = mime.lookup(file);
                if (mimetype !== "image/jpeg" && mimetype !== "image/png") {
                    throw new DataError(
                        400,
                        "Image must be of type jpeg or png",
                    );
                }
                files.push({
                    path: file,
                    mimetype: mimetype,
                    filename: path.parse(file),
                });
            }
            const result = await ownerDataMethods.uploadImages(files);
            return res.status(200).json(result);
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
                default: {
                    return res.status(500).json({ error: e });
                }
            }
        }
    },
);

jobRoutes.delete(
    "/:jobId",
    authMiddleware.authenticateOwnerRequest,
    async (req: Request, res: Response) => {
        try {
            const authReq = req as AuthenticatedRequest;
            const mongoId = validationMethods.common.id(authReq.params.jobId);
            await jobDataMethods.deleteJob(String(mongoId));
            return res.status(200).json("Successfully deleted job");
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
                default: {
                    return res.status(500).json({ error: e });
                }
            }
        }
    },
);

jobRoutes.delete(
    "/:jobId/:taskId",
    authMiddleware.authenticateOwnerRequest,
    async (req: Request, res: Response) => {
        try {
            const authReq = req as AuthenticatedRequest;
            const mongoId = validationMethods.common.id(authReq.params.taskId);
            await taskDataMethods.deleteTask(String(mongoId), false);
            return res.status(200).json("Successfully deleted task");
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
                default: {
                    return res.status(500).json({ error: e });
                }
            }
        }
    },
);

export { jobRoutes };
