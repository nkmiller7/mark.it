import { validationMethods } from "@/validation";
import { assetsCollection, tasksCollection, usersCollection, DataError } from "@/data/collections";
import { ObjectId } from "mongodb";
import { TaskDocument } from "./tasks";

interface AssetDocument{
    taskId: ObjectId;
    key: string;
    source: "s3" | "local";
    label: string | null;
    reviewed_label: string | null;
    status: "UNLABELED" | "LABELED" | "REVIEWED";
    labeled_by: ObjectId | null;
    reviewed_by: ObjectId | null;
}

const assetDataMethods = {
    getAssetById: async (id: string): Promise<AssetDocument> => {
        const mongoId = validationMethods.common.id(id);
        const assetsCol = await assetsCollection();
        const asset: AssetDocument = await assetsCol.findOne({
            _id: mongoId,
        });
        if (asset === null) throw new DataError(404, "Asset not found.");
        return asset;
    },
    getAssetsByTask: async(taskID: string): Promise<AssetDocument[]> => {
        const mongoId = validationMethods.common.id(taskID);
        const assetsCol = await assetsCollection();
        const assets: AssetDocument[] = await assetsCol.find({taskId: mongoId}).toArray();
        if(assets.length === 0) throw new DataError(404, "No assets for this task");
        return assets;
    },
    createAsset: async (taskId: ObjectId, key: string, source: "s3"|"local"): Promise<ObjectId> => {
        taskId = validationMethods.common.id(taskId);
        source = validationMethods.asset.source(source);
        key = validationMethods.asset.key(key);
        const label = null;
        const reviewed_label= null;
        const status="UNLABELED";
        const labeled_by = null;
        const reviewed_by = null;
        const asset: AssetDocument ={
            taskId: taskId,
            key: key,
            source: source,
            label: label,
            reviewed_label: reviewed_label,
            status: status,
            labeled_by: labeled_by,
            reviewed_by: reviewed_by
        };
        const assetsCol = await assetsCollection();
        const insertInfo = await assetsCol.insertOne(asset);
        if (insertInfo.acknowledged !== true)
            throw new DataError(500, "Failed to create new asset.");

        return insertInfo.insertedId;
    },
    labelAsset: async (assetId: ObjectId, label: string, labelerId: ObjectId) => {
        assetId = validationMethods.common.id(assetId);
        labelerId = validationMethods.common.id(labelerId);
        const assetsCol = await assetsCollection();
        const taskCol = await tasksCollection();
        const userCol = await usersCollection();
        const asset: AssetDocument = await assetsCol.findOne({
            _id: assetId,
        });
        if (asset === null) throw new DataError(404, "Asset not found.");
        const task: TaskDocument = await taskCol.findOne({_id: asset.taskId});
        label = validationMethods.asset.label(label, task.schema);
        const user = await userCol.findOne({ _id: labelerId});
        if (user === null) throw new DataError(404, "Labeler not found.");
        if (user.type !== "labeler") throw new DataError(400, "User is not a labeler.");
        await assetsCol.updateOne(
            {_id: assetId},
            {
                $set:{
                    label: label,
                    status: "LABELED",
                    labeled_by: labelerId
                }
            }
        )
    },
    reviewAsset: async (assetId: ObjectId, reviewedLabel: string, reviewerId: ObjectId) => {
        assetId = validationMethods.common.id(assetId);
        reviewerId = validationMethods.common.id(reviewerId);
        const assetsCol = await assetsCollection();
        const taskCol = await tasksCollection();
        const userCol = await usersCollection();
        const asset: AssetDocument = await assetsCol.findOne({
            _id: assetId,
        });
        if (asset === null) throw new DataError(404, "Asset not found.");
        const task: TaskDocument = await taskCol.findOne({_id: asset.taskId});
        reviewedLabel = validationMethods.asset.label(reviewedLabel, task.schema);
        const user = await userCol.findOne({ _id: reviewerId});
        if (user === null) throw new DataError(404, "Reviewer not found.");
        if (user.type !== "reviewer") throw new DataError(400, "User is not a reviewer.");
        await assetsCol.updateOne(
            {_id: assetId},
            {
                $set:{
                    reviewed_label: reviewedLabel,
                    status: "REVIEWED",
                    labeled_by: reviewerId
                }
            }
        )
    }
};

export {AssetDocument, assetDataMethods};