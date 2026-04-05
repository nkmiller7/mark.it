import { Router, Response } from "express";

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

const assetRoutes = Router();

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
            return res.status(200).json({ message: "Asset successfully labeled." });;
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

