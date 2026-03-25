import express from "express";
import validator from "validator";

class ValidationError extends Error {
    code: number;

    constructor(code: number, message: string) {
        super(message);
        this.name = "ValidationError";
        this.code = code;
    }
}

const validate = {
    user: {
        email: (arg: unknown): string => {
            if (typeof arg !== "string")
                throw new ValidationError(400, "Email must be a string.");
            const trimmedArg = arg.trim();
            if (!validator.isEmail(trimmedArg))
                throw new ValidationError(400, "Email is not valid.");
            return trimmedArg;
        },

        password: (arg: unknown): string => {
            if (typeof arg !== "string")
                throw new ValidationError(400, "Password must be a string.");
            if (arg.length < 8)
                throw new ValidationError(
                    400,
                    "Password must be at least 8 characters long.",
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
                throw new ValidationError(400, "Password must not contain a space.");
            return arg;
        },
    },

    request: {
        auth: {
            register: (
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

                const email = validate.user.email(body.email);
                const password = validate.user.password(body.password);
                return {
                    email: email,
                    password: password,
                };
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

                const email = validate.user.email(body.email);
                const password = validate.user.password(body.password);
                return {
                    email: email,
                    password: password,
                };
            },
        },
    },
};

export { validate, ValidationError };
