import { validationMethods } from "@/validation";
import { assetsCollection, tasksCollection, usersCollection, DataError } from "@/data/collections";
import { ObjectId } from "mongodb";
import { TaskDocument } from "./tasks";
import { assetDataMethods } from "./assets";
import fs from 'fs';
import S3 from 'aws-sdk/clients/s3';
import * as dotenv from 'dotenv';
dotenv.config();
const mode = process.env.MODE;

const ownerDataMethods = {
    uploadImages: async (files: any[]): Promise<{ key: string; source: "s3" | "local"; }[]> => {
        let results= [];
        if(mode === "prod"){
            const s3 = new S3({
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                region: process.env.AWS_REGION,
            });
            for(let file of files){
                if(file.mimetype !== "image/jpeg" && file.mimetype !== "image/png"){
                    throw new DataError(400, "Image must be of type jpeg or png");
                }
                const fileStream = fs.createReadStream(file.path);
                const uploadParams = {
                    Bucket: process.env.S3_BUCKET_NAME,
                    Key: file.filename,
                    Body: fileStream,
                    ContentType: file.mimetype,
                    ACL: 'public-read',
                };
                await s3.upload(uploadParams).promise();
                results.push({key: uploadParams.Key, source: "s3"});
            }
            return results;
        }else{
            for(let file of files){
                if(file.mimetype !== "image/jpeg" && file.mimetype !== "image/png"){
                    throw new DataError(400, "Image must be of type jpeg or png");
                }
                results.push({key: file.path, source: "local"});
            }
        }
        return results;   
    },
    createAssetsForTask: async (taskId: ObjectId, assetList: { key: string; source: "s3" | "local"}[]) => {
        for(let asset of assetList){
            await assetDataMethods.createAsset(taskId, asset.key, asset.source);
        }
    }
};


export {ownerDataMethods};