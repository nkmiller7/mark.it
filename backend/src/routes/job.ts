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

const jobRoutes = Router();

jobRoutes.get(
    "/",
    authMiddleware.authenticateLabelerOrReviewerRequest,
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
                return res.status(403).json({ error: "Forbidden request." });
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

jobRoutes.post(
    "/",
    authMiddleware.authenticateOwnerRequest,
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            const job: JobDocument = validationMethods.request.job.create(req);
            await jobDataMethods.createJob(job);
            return res
                .status(201)
                .json({ message: "Job successfully created." });
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

export { jobRoutes };
