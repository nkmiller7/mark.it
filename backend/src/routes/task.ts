import { Router, Response } from "express";

import { ObjectId, WithId } from "mongodb";

import { validationMethods, ValidationError } from "@/validation";
import { authMiddleware, AuthenticatedRequest } from "@/middleware/auth";
import { DataError } from "@/data/collections";
import { taskDataMethods, TaskDocument } from "@/data/tasks";
import { assetDataMethods, AssetDocument } from "@/data/assets";
import {
    userDataMethods,
    OwnerUserDocument,
    ReviewerUserDocument,
    LabelerUserDocument,
} from "@/data/users";

const taskRoutes = Router();

taskRoutes.get(
    "/:id",
    authMiddleware.authenticateRequest,
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            const taskId: ObjectId = validationMethods.common.id(req.params.id);
            const task = await taskDataMethods.getTaskById(taskId.toString());
            return res.status(200).json(task);
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

taskRoutes.get(
    "/:id/assets",
    authMiddleware.authenticateRequest,
    async( req: AuthenticatedRequest, res: Response) => {
        try {
            const taskId: ObjectId = validationMethods.common.id(req.params.id);
            const assets = await assetDataMethods.getAssetsByTask(taskId.toString());
            return res.status(200).json(assets);
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

taskRoutes.post(
    "/",
    authMiddleware.authenticateOwnerRequest,
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            const task: TaskDocument =
                validationMethods.request.task.create(req);
            const taskId: string = (
                await taskDataMethods.createTask(task)
            ).toString();
            return res.status(201).json({ taskId: taskId });
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
taskRoutes.post(
    "/:id/assets",
    authMiddleware.authenticateOwnerRequest,
    async (req: AuthenticatedRequest, res: Response) => {
        try{
            const taskId = validationMethods.common.id(req.params.id);
            const source = validationMethods.asset.source(req.body.source);
            const key = validationMethods.asset.key(req.body.key);
            await assetDataMethods.createAsset(taskId, key, source);
            return res
                .status(201)
                .json({ message: "Asset successfully uploaded to task." });
        }catch(e: unknown){
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
taskRoutes.patch(
    "/:id/claim",
    authMiddleware.authenticateLabelerOrReviewerRequest,
    async (req: AuthenticatedRequest, res: Response) => { 
        try {
            const taskId: ObjectId = validationMethods.common.id(req.params.id);
            const user: WithId<
                OwnerUserDocument | LabelerUserDocument | ReviewerUserDocument
            > = await userDataMethods.getUserByEmail(req.user.token.email);
            if (user.type === "owner")
                throw new ValidationError(
                    403,
                    "Owners are not allowed to claim tasks.",
                );
            await taskDataMethods.claimTask(
                taskId.toString(),
                user._id.toString(),
                user.type,
            );
            return res
                .status(200)
                .json({ message: "Task successfully claimed." });
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

export { taskRoutes };
