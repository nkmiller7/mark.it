import express from "express";
import validator from "validator";

import {
    LabelerUserDocument,
    OwnerUserDocument,
    ReviewerUserDocument,
    userDataMethods,
    UserDocument,
} from "@/data/users";

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

        type: (arg: unknown): string => {
            if (typeof arg !== "string")
                throw new ValidationError(400, "Type must be a string.");
            const trimmedArg = arg.trim().toLowerCase();
            switch (true) {
                case trimmedArg === "owner" ||
                    trimmedArg === "labeler" ||
                    trimmedArg === "reviewer": {
                    return trimmedArg;
                }
                case true: {
                    throw new ValidationError(400, "Unrecognized type.");
                }
            }
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
    },

    request: {
        auth: {
            register: (
                req: express.Request,
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

            login: (
                req: express.Request,
            ): { email: string; password: string } => {
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
    },
};

export { validationMethods, ValidationError };
