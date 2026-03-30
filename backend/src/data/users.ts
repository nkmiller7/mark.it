import { ObjectId, Collection, WithId, Document } from "mongodb";
import { DataError, usersCollection } from "@/data/collections";

import { validationMethods } from "@/validation";

interface UserDocument {
    email: string;
    type: string;
}
interface OwnerUserDocument extends UserDocument {
    entityName: string;
}
interface LabelerUserDocument extends UserDocument {
    firstName: string;
    lastName: string;
    rating?: number;
}
interface ReviewerUserDocument extends UserDocument {
    firstName: string;
    lastName: string;
    rating?: number;
}

const userDataMethods = {
    doesEmailExist: async (arg: unknown): Promise<boolean> => {
        const email = validationMethods.user.email(arg);
        const usersCol = await usersCollection<UserDocument>();
        const user: WithId<UserDocument> = await usersCol.findOne({
            email: { $regex: email, $options: "i" },
        });
        return user !== null;
    },

    isOwnerUser: (user: UserDocument): user is OwnerUserDocument => {
        return user.type === "owner";
    },
    isLabelerUser: (user: UserDocument): user is LabelerUserDocument => {
        return user.type === "labeler";
    },
    isReviewerUser: (user: UserDocument): user is ReviewerUserDocument => {
        return user.type === "reviewer";
    },

    getUserByEmail: async (arg: unknown): Promise<WithId<UserDocument>> => {
        const email = validationMethods.user.email(arg);
        const usersCol = await usersCollection<UserDocument>();
        const user = await usersCol.findOne({
            email: {
                $regex: `^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
                $options: "i",
            },
        });
        if (user === null) throw new DataError(404, "User not found.");
        return user;
    },

    createUser: async <T extends UserDocument>(user: T): Promise<ObjectId> => {
        user.email = validationMethods.user.email(user.email);
        if (await userDataMethods.doesEmailExist(user.email))
            throw new DataError(400, "Email is already in use by a user.");
        switch (true) {
            case userDataMethods.isOwnerUser(user): {
                const ownerUser: OwnerUserDocument = user;
                const usersCol: Collection<OwnerUserDocument> =
                    await usersCollection<OwnerUserDocument>();
                ownerUser.entityName = validationMethods.user.entityName(
                    ownerUser.entityName,
                );
                const insertInfo = await usersCol.insertOne(ownerUser);
                if (insertInfo.acknowledged !== true)
                    throw new DataError(500, "Failed to create new user.");
                return insertInfo.insertedId;
            }

            case userDataMethods.isLabelerUser(user): {
                const labelerUser: LabelerUserDocument = user;
                const usersCol: Collection<LabelerUserDocument> =
                    await usersCollection<LabelerUserDocument>();
                labelerUser.firstName = validationMethods.user.firstName(
                    labelerUser.firstName,
                );
                labelerUser.lastName = validationMethods.user.lastName(
                    labelerUser.lastName,
                );
                labelerUser.rating = 0;
                const insertInfo = await usersCol.insertOne(labelerUser);
                if (insertInfo.acknowledged !== true)
                    throw new DataError(500, "Failed to create new user.");
                return insertInfo.insertedId;
            }

            case userDataMethods.isReviewerUser(user): {
                const reviewerUser: ReviewerUserDocument = user;
                const usersCol: Collection<ReviewerUserDocument> =
                    await usersCollection<ReviewerUserDocument>();
                reviewerUser.firstName = validationMethods.user.firstName(
                    reviewerUser.firstName,
                );
                reviewerUser.lastName = validationMethods.user.lastName(
                    reviewerUser.lastName,
                );
                reviewerUser.rating = 0;
                const insertInfo = await usersCol.insertOne(reviewerUser);
                if (insertInfo.acknowledged !== true)
                    throw new DataError(500, "Failed to create new user.");
                return insertInfo.insertedId;
            }
        }
    },
};

export {
    userDataMethods,
    UserDocument,
    OwnerUserDocument,
    LabelerUserDocument,
    ReviewerUserDocument,
};
