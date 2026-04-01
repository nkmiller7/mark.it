import { Router, Response } from "express";

import { validationMethods, ValidationError } from "@/validation";
import { authMiddleware, AuthenticatedRequest } from "@/middleware/auth";
import { DataError } from "@/data/collections";
import { jobDataMethods, JobDocument } from "@/data/jobs";

const jobRoutes = Router();

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
