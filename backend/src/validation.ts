import { Request } from "express";
import validator from "validator";
import { ObjectId } from "mongodb";

import {
    LabelerUserDocument,
    OwnerUserDocument,
    ReviewerUserDocument,
    userDataMethods,
    UserDocument,
} from "@/data/users";
import { JobDocument } from "@/data/jobs";
import { TaskDocument } from "@/data/tasks";

class ValidationError extends Error {
    code: number;

    constructor(code: number, message: string) {
        super(message);
        this.name = "ValidationError";
        this.code = code;
    }
}

const validationMethods = {
    user: {
        email: (arg: unknown): string => {
            if (typeof arg !== "string")
                throw new ValidationError(400, "Email must be a string.");
            const trimmedArg = arg.trim();
            if (!validator.isEmail(trimmedArg))
                throw new ValidationError(400, "Email is not valid.");
            return trimmedArg;
        },

        type: (arg: unknown): "owner" | "labeler" | "reviewer" => {
            if (typeof arg !== "string")
                throw new ValidationError(400, "Type must be a string.");
            const trimmedArg = arg.trim().toLowerCase();
            if (
                trimmedArg === "owner" ||
                trimmedArg === "labeler" ||
                trimmedArg === "reviewer"
            ) {
                return trimmedArg;
            }
            throw new ValidationError(400, "Unrecognized type.");
        },

        password: (arg: unknown): string => {
            if (typeof arg !== "string")
                throw new ValidationError(400, "Password must be a string.");
            if (!(arg.length >= 8 && arg.length <= 30))
                throw new ValidationError(
                    400,
                    "Password must be between 8 and 30 characters long.",
                );
            if (!/[A-Z]/.test(arg))
                throw new ValidationError(
                    400,
                    "Password must contain at least one uppercase letter.",
                );
            if (!/[a-z]/.test(arg))
                throw new ValidationError(
                    400,
                    "Password must contain at least one lowercase letter.",
                );
            if (!/[0-9]/.test(arg))
                throw new ValidationError(
                    400,
                    "Password must contain at least one digit.",
                );
            if (!/[^A-Za-z0-9]/.test(arg))
                throw new ValidationError(
                    400,
                    "Password must contain at least one special character.",
                );
            if (/ /.test(arg))
                throw new ValidationError(
                    400,
                    "Password must not contain a space.",
                );
            return arg;
        },

        entityName: (arg: unknown): string => {
            if (typeof arg !== "string")
                throw new ValidationError(400, "Entity name must be a string.");
            const trimmedArg: string = arg.trim();
            if (!(trimmedArg.length >= 3 && trimmedArg.length <= 30))
                throw new ValidationError(
                    400,
                    "Entity name must be between 3 and 30 characters long.",
                );
            if (/[^A-Za-z0-9 ]/.test(arg))
                throw new ValidationError(
                    400,
                    "Entity name cannot contain special characters.",
                );
            return trimmedArg;
        },

        firstName: (arg: unknown): string => {
            if (typeof arg !== "string")
                throw new ValidationError(400, "First name must be a string.");
            const trimmedArg: string = arg.trim();
            if (!(trimmedArg.length >= 2 && trimmedArg.length <= 20))
                throw new ValidationError(
                    400,
                    "First name must be between 2 and 20 characters long.",
                );
            if (/[^A-Za-z ]/.test(arg))
                throw new ValidationError(
                    400,
                    "First name must only contain alphabetical characters and spaces.",
                );
            return trimmedArg;
        },

        lastName: (arg: unknown): string => {
            if (typeof arg !== "string")
                throw new ValidationError(400, "Last name must be a string.");
            const trimmedArg: string = arg.trim();
            if (!(trimmedArg.length >= 2 && trimmedArg.length <= 20))
                throw new ValidationError(
                    400,
                    "Last name must be between 2 and 20 characters long.",
                );
            if (/[^A-Za-z ]/.test(arg))
                throw new ValidationError(
                    400,
                    "Last name must only contain alphabetical characters and spaces.",
                );
            return trimmedArg;
        },

        rating: (arg: unknown): number => {
            if (typeof arg !== "number")
                throw new ValidationError(400, "Rating must be a number.");
            if (arg < 0 || arg > 5)
                throw new ValidationError(
                    400,
                    "Rating must be between 0 and 5.",
                );
            return arg;
        },
    },

    job: {
        description: (arg: unknown): string => {
            if (typeof arg !== "string")
                throw new ValidationError(400, "Description must be a string.");
            const trimmedArg: string = arg.trim();
            if (!(trimmedArg.length >= 10 && trimmedArg.length <= 200))
                throw new ValidationError(
                    400,
                    "Description must be between 10 and 200 characters long.",
                );
            return trimmedArg;
        },
        ratingRequired: (
            arg: unknown,
        ): { reviewer: number; labeler: number } => {
            if (typeof arg !== "object" || arg === null)
                throw new ValidationError(
                    400,
                    "Rating required must be an object.",
                );
            const argRecord = arg as Record<string, unknown>;
            if (
                argRecord.reviewer === undefined ||
                argRecord.labeler === undefined
            )
                throw new ValidationError(
                    400,
                    "Rating required must have reviewer and labeler properties.",
                );
            const reviewerRating = validationMethods.user.rating(
                argRecord.reviewer,
            );
            const labelerRating = validationMethods.user.rating(
                argRecord.labeler,
            );
            return {
                reviewer: reviewerRating,
                labeler: labelerRating,
            };
        },
    },

    task: {
        description: (arg: unknown): string => {
            if (typeof arg !== "string")
                throw new ValidationError(400, "Description must be a string.");
            const trimmedArg: string = arg.trim();
            if (!(trimmedArg.length >= 10 && trimmedArg.length <= 200))
                throw new ValidationError(
                    400,
                    "Description must be between 10 and 200 characters long.",
                );
            return trimmedArg;
        },
        schema: (arg: unknown): string[] => {
            if (!Array.isArray(arg))
                throw new ValidationError(400, "Schema must be an array.");
            if (arg.length === 0)
                throw new ValidationError(
                    400,
                    "Schema must have at least one field.",
                );
            const validatedSchema: string[] = [];
            for (const label of arg) {
                if (typeof label !== "string")
                    throw new ValidationError(400, "Labels must be strings.");
                const trimmedLabel = label.trim();
                if (trimmedLabel.length === 0)
                    throw new ValidationError(400, "Labels cannot be empty.");
                validatedSchema.push(trimmedLabel);
            }
            return validatedSchema;
        },
        status: (arg: unknown): "unlabeled" | "labeled" | "reviewed" => {
            if (typeof arg !== "string")
                throw new ValidationError(400, "Status must be a string.");
            const trimmedArg = arg.trim().toLowerCase();
            if (
                trimmedArg === "unlabeled" ||
                trimmedArg === "labeled" ||
                trimmedArg === "reviewed"
            ) {
                return trimmedArg;
            }
            throw new ValidationError(400, "Unrecognized status.");
        },
    },

    common: {
        id: (arg: unknown): ObjectId => {
            if (typeof arg !== "string")
                throw new ValidationError(400, "ID must be a string.");
            if (!ObjectId.isValid(arg))
                throw new ValidationError(400, "ID must be a valid ObjectId.");
            return new ObjectId(arg);
        },
        date: (arg: unknown): string => {
            if (typeof arg !== "string")
                throw new ValidationError(400, "Date must be a string.");
            if (!validator.isISO8601(arg))
                throw new ValidationError(
                    400,
                    "Date must be a valid ISO 8601 date string.",
                );
            return arg;
        },
    },

    request: {
        auth: {
            register: (
                req: Request,
            ):
                | OwnerUserDocument
                | LabelerUserDocument
                | ReviewerUserDocument => {
                const body = req.body;
                if (body === undefined || typeof body !== "object")
                    throw new ValidationError(400, "Invalid request body.");
                if (body.email === undefined || body.password === undefined)
                    throw new ValidationError(
                        400,
                        "Email and password are required.",
                    );

                validationMethods.user.password(body.password);

                const user: UserDocument = {
                    email: validationMethods.user.email(body.email),
                    type: validationMethods.user.type(body.type),
                };
                switch (true) {
                    case userDataMethods.isOwnerUser(user): {
                        const ownerUser: OwnerUserDocument = {
                            email: user.email,
                            type: user.type,
                            entityName: validationMethods.user.entityName(
                                body.entityName,
                            ),
                        };
                        return ownerUser;
                    }
                    case userDataMethods.isLabelerUser(user): {
                        const labelerUser: LabelerUserDocument = {
                            email: user.email,
                            type: user.type,
                            firstName: validationMethods.user.firstName(
                                body.firstName,
                            ),
                            lastName: validationMethods.user.lastName(
                                body.lastName,
                            ),
                            rating: 0,
                        };
                        return labelerUser;
                    }
                    case userDataMethods.isReviewerUser(user): {
                        const reviewerUser: ReviewerUserDocument = {
                            email: user.email,
                            type: user.type,
                            firstName: validationMethods.user.firstName(
                                body.firstName,
                            ),
                            lastName: validationMethods.user.lastName(
                                body.lastName,
                            ),
                            rating: 0,
                        };
                        return reviewerUser;
                    }
                    case true: {
                        throw new ValidationError(400, "Unrecognized type.");
                    }
                }
            },

            login: (req: Request): { email: string; password: string } => {
                const body = req.body;
                if (body === undefined || typeof body !== "object")
                    throw new ValidationError(400, "Invalid request body.");
                if (body.email === undefined || body.password === undefined)
                    throw new ValidationError(
                        400,
                        "Email and password are required.",
                    );

                const email = validationMethods.user.email(body.email);
                const password = validationMethods.user.password(body.password);
                return {
                    email: email,
                    password: password,
                };
            },
        },

        job: {
            create: (req: Request): JobDocument => {
                const body = req.body;
                if (body === undefined || typeof body !== "object")
                    throw new ValidationError(400, "Invalid request body.");
                if (
                    body.ownerId === undefined ||
                    body.description === undefined ||
                    body.deadlineDate === undefined ||
                    body.ratingRequired === undefined
                )
                    throw new ValidationError(
                        400,
                        "Owner ID, description, deadline date, and rating are required.",
                    );
                const job: JobDocument = {
                    ownerId: validationMethods.common.id(body.ownerId),
                    description: validationMethods.job.description(
                        body.description,
                    ),
                    deadlineDate: validationMethods.common.date(
                        body.deadlineDate,
                    ),
                    ratingRequired: validationMethods.job.ratingRequired(
                        body.ratingRequired,
                    ),
                };
                return job;
            },
        },

        task: {
            create: (req: Request): TaskDocument => {
                const body = req.body;
                if (body === undefined || typeof body !== "object")
                    throw new ValidationError(400, "Invalid request body.");
                if (
                    body.jobId === undefined ||
                    body.description === undefined ||
                    body.schema === undefined
                )
                    throw new ValidationError(
                        400,
                        "Job ID, description, and schema are required.",
                    );
                const task: TaskDocument = {
                    jobId: validationMethods.common.id(body.jobId),
                    description: validationMethods.task.description(
                        body.description,
                    ),
                    schema: validationMethods.task.schema(body.schema),
                    assignedLabelerId: null,
                    assignedReviewerId: null,
                    status: "unlabeled",
                };
                return task;
            },
        },
    },
};

export { validationMethods, ValidationError };
