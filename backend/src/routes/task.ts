import { Router, Response } from "express";
import multer from "multer";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import path from "path";

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

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
            cb(null, true);
        } else {
            cb(new Error("Only JPEG and PNG images are allowed."));
        }
    },
});

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

const taskRoutes = Router();

taskRoutes.get(
    "/mine",
    authMiddleware.authenticateLabelerOrReviewerRequest,
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            const user = await userDataMethods.getUserByEmail(
                req.user.token.email,
            );
            const tasks = await taskDataMethods.getTasksByUserId(
                user._id.toString(),
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
    authMiddleware.authenticateLabelerOrReviewerRequest,
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            const taskId: ObjectId = validationMethods.common.id(req.params.id);
            const task = await taskDataMethods.getTaskById(taskId.toString());
            const user = await userDataMethods.getUserByEmail(req.user.token.email);
            const isAssigned =
                task.assignedLabelerId?.toString() === user._id.toString() ||
                task.assignedReviewerId?.toString() === user._id.toString();
            if (!isAssigned) {
                throw new ValidationError(403, "You are not assigned to this task.");
            }
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
    upload.single("file"),
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            const taskId = validationMethods.common.id(req.params.id);

            if (!req.file) {
                return res
                    .status(400)
                    .json({ error: "No image file provided." });
            }

            const task = await taskDataMethods.getTaskById(taskId.toString());
            const ext = path.extname(req.file.originalname) || ".jpg";
            const s3Key = `${task.jobId.toString()}/${taskId.toString()}/${randomUUID()}${ext}`;

            await s3.send(
                new PutObjectCommand({
                    Bucket: process.env.S3_BUCKET_NAME,
                    Key: s3Key,
                    Body: req.file.buffer,
                    ContentType: req.file.mimetype,
                }),
            );

            await assetDataMethods.createAsset(taskId, s3Key, "s3");

            return res.status(201).json({
                message: "Asset successfully uploaded to task.",
                key: s3Key,
            });
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
                    return res
                        .status(500)
                        .json({ error: "Internal server error." });
                }
            }
        }
    },
);
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

taskRoutes.patch(
    "/:id/unclaim",
    authMiddleware.authenticateLabelerOrReviewerRequest,
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            const taskId: ObjectId = validationMethods.common.id(req.params.id);
            const user = await userDataMethods.getUserByEmail(req.user.token.email);
            if (user.type === "owner") {
                throw new ValidationError(403, "Owners cannot unclaim tasks.");
            }
            await taskDataMethods.unclaimTask(taskId.toString(), user._id.toString(), user.type);
            return res.status(200).json({ message: "Task successfully unclaimed." });
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

taskRoutes.delete(
    "/:taskId",
    authMiddleware.authenticateOwnerRequest,
    async(req: AuthenticatedRequest, res:Response) => {
        try {
            const mongoId = validationMethods.common.id(req.params.taskId);
            await taskDataMethods.deleteTask(String(mongoId));
            return res.status(200).json("Successfully deleted task");
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

export { taskRoutes };
