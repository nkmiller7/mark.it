import { Router, Response } from "express";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { ObjectId, WithId } from "mongodb";

import { validationMethods, ValidationError } from "@/validation";
import { authMiddleware, AuthenticatedRequest } from "@/middleware/auth";
import { DataError } from "@/data/collections";
import { assetDataMethods, AssetDocument } from "@/data/assets";

import {
    userDataMethods,
    OwnerUserDocument,
    ReviewerUserDocument,
    LabelerUserDocument,
} from "@/data/users";

import {taskDataMethods} from "@/data/tasks";

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

const assetRoutes = Router();

assetRoutes.get("/:id/url",
    authMiddleware.authenticateLabelerOrReviewerRequest,
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            const assetId: ObjectId = validationMethods.common.id(req.params.id);
            const asset = await assetDataMethods.getAssetById(assetId.toString());
            const task = await taskDataMethods.getTaskById(String(asset.taskId));
            const user = await userDataMethods.getUserByEmail(req.user.token.email);
            const isAssigned =
                task.assignedLabelerId?.toString() === user._id.toString() ||
                task.assignedReviewerId?.toString() === user._id.toString();
            if (!isAssigned) {
                throw new ValidationError(403, "You are not assigned to this task.");
            }
            const command = new GetObjectCommand({
                Bucket: process.env.S3_BUCKET_NAME,
                Key: asset.key,
            });
            const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
            return res.status(200).json({ url });
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

assetRoutes.get("/:id",
    authMiddleware.authenticateRequest,
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            const assetId: ObjectId = validationMethods.common.id(req.params.id);
            const asset = await assetDataMethods.getAssetById(assetId.toString());
            return res.status(200).json(asset);
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

assetRoutes.patch("/:id/label",
    authMiddleware.authenticateLabelerRequest,
    async(req: AuthenticatedRequest, res: Response) => {
        try {
            const assetId: ObjectId = validationMethods.common.id(req.params.id);
            const asset = await assetDataMethods.getAssetById(String(assetId));
            const task = await taskDataMethods.getTaskById(String(asset.taskId));
            const user: WithId<
                OwnerUserDocument | LabelerUserDocument | ReviewerUserDocument
            > = await userDataMethods.getUserByEmail(req.user.token.email);
            if (user.type !== "labeler")
                throw new ValidationError(
                    403,
                    "Only labelers are allowed to label assets.",
                );
            let label = req.body.label;
            label = validationMethods.asset.label(label, task.schema);
            await assetDataMethods.labelAsset(assetId, label, user._id);

            const allAssets = await assetDataMethods.getAssetsByTask(String(asset.taskId));
            const allLabeled = allAssets.every((a) => a.status === "LABELED" || a.status === "REVIEWED");
            if (allLabeled) {
                await taskDataMethods.markTaskLabeled(String(asset.taskId));
            }

            return res.status(200).json({ message: "Asset successfully labeled." });
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
    }
);

assetRoutes.patch("/:id/review",
    authMiddleware.authenticateReviewerRequest,
    async(req: AuthenticatedRequest, res: Response) => {
        try {
            const assetId: ObjectId = validationMethods.common.id(req.params.id);
            const asset = await assetDataMethods.getAssetById(String(assetId));
            const task = await taskDataMethods.getTaskById(String(asset.taskId));
            const user: WithId<
                OwnerUserDocument | LabelerUserDocument | ReviewerUserDocument
            > = await userDataMethods.getUserByEmail(req.user.token.email);
            if (user.type !== "reviewer")
                throw new ValidationError(
                    403,
                    "Only reviewers are allowed to review assets.",
                );
            let reviewLabel = req.body.reviewLabel;
            reviewLabel = validationMethods.asset.label(reviewLabel, task.schema);
            await assetDataMethods.reviewAsset(assetId, reviewLabel, user._id);
            return res.status(200).json({ message: "Asset successfully reviewed." });;
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
    }
);

export { assetRoutes };
