import { Router, Request, Response } from "express";

import { validationMethods, ValidationError } from "@/validation";
import { authMiddleware, AuthenticatedRequest } from "@/middleware/auth";
import { DataError } from "@/data/collections";
import { userDataMethods, UserDocument } from "@/data/users";

const userRoutes = Router();

userRoutes.get(
    "/",
    authMiddleware.authenticateRequest,
    async (req: Request, res: Response) => {
        try {
            const authReq = req as AuthenticatedRequest;
            return res
                .status(200)
                .json(
                    await userDataMethods.getUserByEmail(
                        authReq.user.token.email!,
                    ),
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
                default: {
                    return res.status(500).json({ error: e });
                }
            }
        }
    },
);

export { userRoutes };
