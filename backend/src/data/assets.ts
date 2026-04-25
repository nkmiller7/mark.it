import { validationMethods } from "@/validation";
import {
    assetsCollection,
    tasksCollection,
    usersCollection,
    DataError,
} from "@/data/collections";
import { TaskDocument } from "./tasks";
import { ObjectId } from "mongodb";
import { ownerDataMethods } from "./owner";
import { userDataMethods } from "./users";

interface AssetDocument {
    taskId: ObjectId;
    key: string;
    source: "s3" | "local";
    label: string | null;
    labeled_by: ObjectId | null;
    reviews: { reviewerId: ObjectId; label: string }[];
    status: "UNLABELED" | "LABELED" | "REVIEWED";
}

const assetDataMethods = {
    getAssetById: async (id: string): Promise<AssetDocument> => {
        const mongoId = validationMethods.common.id(id);
        const assetsCol = await assetsCollection();
        const asset = await assetsCol.findOne({
            _id: mongoId,
        });
        if (asset === null) throw new DataError(404, "Asset not found.");
        return asset;
    },
    getAssetsByTask: async (taskID: string): Promise<AssetDocument[]> => {
        const mongoId = validationMethods.common.id(taskID);
        const assetsCol = await assetsCollection();
        const assets: AssetDocument[] = await assetsCol
            .find({ taskId: mongoId })
            .toArray();
        if (assets.length === 0)
            throw new DataError(404, "No assets for this task");
        return assets;
    },
    createAsset: async (
        taskId: ObjectId,
        key: string,
        source: "s3" | "local",
    ): Promise<ObjectId> => {
        taskId = validationMethods.common.id(taskId);
        source = validationMethods.asset.source(source);
        key = validationMethods.asset.key(key);
        const asset: AssetDocument = {
            taskId: taskId,
            key: key,
            source: source,
            label: null,
            labeled_by: null,
            reviews: [],
            status: "UNLABELED",
        };
        const assetsCol = await assetsCollection();
        const insertInfo = await assetsCol.insertOne(asset);
        if (insertInfo.acknowledged !== true)
            throw new DataError(500, "Failed to create new asset.");

        return insertInfo.insertedId;
    },
    labelAsset: async (
        assetId: ObjectId,
        label: string,
        labelerId: ObjectId,
    ) => {
        assetId = validationMethods.common.id(assetId);
        labelerId = validationMethods.common.id(labelerId);
        const assetsCol = await assetsCollection();
        const taskCol = await tasksCollection();
        const userCol = await usersCollection();
        const asset = await assetsCol.findOne({
            _id: assetId,
        });
        if (asset === null) throw new DataError(404, "Asset not found.");
        if (asset.status !== "UNLABELED")
            throw new DataError(400, "Asset has already been labeled.");
        const task = await taskCol.findOne({ _id: asset.taskId });
        if (task === null) throw new DataError(404, "Task not found.");
        if (
            task.assignedLabelerId === null ||
            task.assignedLabelerId.toString() !== labelerId.toString()
        ) {
            throw new DataError(403, "You are not assigned to this task.");
        }
        label = validationMethods.asset.label(label, task.schema);
        const user = await userCol.findOne({ _id: labelerId });
        if (user === null) throw new DataError(404, "Labeler not found.");
        if (user.type !== "labeler")
            throw new DataError(400, "User is not a labeler.");
        await assetsCol.updateOne(
            { _id: assetId },
            {
                $set: {
                    label: label,
                    status: "LABELED",
                    labeled_by: labelerId,
                },
            },
        );
    },
    reviewAsset: async (
        assetId: ObjectId,
        label: string,
        reviewerId: ObjectId,
    ) => {
        assetId = validationMethods.common.id(assetId);
        reviewerId = validationMethods.common.id(reviewerId);

        const assetsCol = await assetsCollection();
        const taskCol = await tasksCollection();
        const userCol = await usersCollection();

        const asset = await assetsCol.findOne({ _id: assetId });
        if (asset === null) {
            throw new DataError(404, "Asset not found.");
        }
        if (asset.label === null) {
            throw new DataError(400, "Asset has not been labeled yet.");
        }

        const task = (await taskCol.findOne({
            _id: asset.taskId,
        })) as TaskDocument | null;
        if (task === null) {
            throw new DataError(404, "Task not found.");
        }

        const isAssigned = (task.assignedReviewerIds ?? []).some(
            (id) => id.toString() === reviewerId.toString(),
        );
        if (!isAssigned) {
            throw new DataError(403, "You are not assigned to this task.");
        }

        label = validationMethods.asset.label(label, task.schema);

        const result = await assetsCol.findOneAndUpdate(
            {
                _id: assetId,
                "reviews.reviewerId": { $ne: reviewerId },
                $expr: { $lt: [{ $size: { $ifNull: ["$reviews", []] } }, 3] },
            },
            { $push: { reviews: { reviewerId, label } } },
            { returnDocument: "after" },
        );
        if (result === null) {
            throw new DataError(
                400,
                "Already reviewed by you or review slots full.",
            );
        }

        if (result.reviews.length === 3) {
            await assetsCol.updateOne(
                { _id: assetId },
                { $set: { status: "REVIEWED" } },
            );

            const agreeingReviewers = result.reviews.filter(
                (r) => r.label === asset.label,
            );
            const disagreeingReviewers = result.reviews.filter(
                (r) => r.label !== asset.label,
            );

            const increaseRatings: ObjectId[] = [];
            const decreaseRatings: ObjectId[] = [];
            if (agreeingReviewers.length >= 2) {
                agreeingReviewers.forEach((r) =>
                    increaseRatings.push(r.reviewerId),
                );
                disagreeingReviewers.forEach((r) =>
                    decreaseRatings.push(r.reviewerId),
                );
            } else {
                agreeingReviewers.forEach((r) =>
                    decreaseRatings.push(r.reviewerId),
                );
                disagreeingReviewers.forEach((r) =>
                    increaseRatings.push(r.reviewerId),
                );
            }

            await Promise.all(
                increaseRatings.map(async (id) => {
                    try {
                        const user = await userCol.findOne({ _id: id });
                        if (user === null) {
                            throw new DataError(404, "User not found.");
                        }
                        if (!userDataMethods.isLabelerOrReviewerUser(user)) {
                            throw new DataError(400, "Invalid user type.");
                        }
                        const numAcceptedAssets = Math.floor(
                            (user.rating / 5) * user.numAssetsProcessed,
                        );
                        const newRating =
                            ((numAcceptedAssets + 1) /
                                (user.numAssetsProcessed + 1)) *
                            5;
                        await userCol.updateOne(
                            { _id: id },
                            {
                                $inc: { numAssetsProcessed: 1 },
                                $set: { rating: newRating },
                            },
                        );
                    } catch (e) {
                        throw new DataError(
                            500,
                            "Error updating increase ratings for user.",
                        );
                    }
                }),
            );
            await Promise.all(
                decreaseRatings.map(async (id) => {
                    try {
                        const user = await userCol.findOne({ _id: id });
                        if (user === null) {
                            throw new DataError(404, "User not found.");
                        }
                        if (!userDataMethods.isLabelerOrReviewerUser(user)) {
                            throw new DataError(400, "Invalid user type.");
                        }
                        const numAcceptedAssets = Math.ceil(
                            (user.rating / 5) * user.numAssetsProcessed,
                        );
                        const newRating =
                            (numAcceptedAssets /
                                (user.numAssetsProcessed + 1)) *
                            5;

                        await userCol.updateOne(
                            { _id: id },
                            {
                                $inc: { numAssetsProcessed: 1 },
                                $set: { rating: newRating },
                            },
                        );
                    } catch (e) {
                        throw new DataError(
                            500,
                            "Error updating decrease ratings for user.",
                        );
                    }
                }),
            );
        }
    },
    deleteAsset: async (assetId: ObjectId) => {
        const mongoId = validationMethods.common.id(assetId);
        const assetsCol = await assetsCollection();
        try {
            const asset = await assetsCol.findOne({
                _id: mongoId,
            });
            if (asset === null) {
                throw new DataError(404, "Asset not found.");
            }
            const key = asset.key;
            await ownerDataMethods.deleteImage(key);
        } catch (e) {
            throw new DataError(500, "Failed to delete asset from storage.");
        }
        await assetsCol.deleteOne({
            _id: mongoId,
        });
    },
};

export { AssetDocument, assetDataMethods };
