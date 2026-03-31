import { Router, Response } from "express";

import { validationMethods, ValidationError } from "@/validation";
import { authMiddleware, AuthenticatedRequest } from "@/middleware/auth";
import { DataError } from "@/data/collections";
import { userDataMethods, UserDocument } from "@/data/users";

const userRoutes = Router();

userRoutes.get(
    "/",
    authMiddleware.authenticateRequest,
    async (
        req: AuthenticatedRequest,
        res: Response,
    ): Promise<Response<any, Record<string, any>>> => {
        try {
            return res
                .status(200)
                .json(
                    await userDataMethods.getUserByEmail(req.user.token.email),
                );
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

export { userRoutes };
