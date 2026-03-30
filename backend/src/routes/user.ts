import { Router, Response } from "express";

import { authMiddleware } from "@/middleware/auth";
import { AuthenticatedRequest } from "@/routes/auth";

import { validationMethods, ValidationError } from "@/validation";

import { DataError } from "@/data/collections";
import { userDataMethods } from "@/data/users";

const userRoutes = Router();

userRoutes.get(
    "/:email",
    authMiddleware.authenticateRequest,
    async (
        req: AuthenticatedRequest,
        res: Response,
    ): Promise<Response<any, Record<string, any>>> => {
        try {
            const email = validationMethods.user.email(req.params.email);
            const user = await userDataMethods.getUserByEmail(email);
            const { _id, ...userData } = user;
            return res.status(200).json(userData);
        } catch (e: unknown) {
            if (e instanceof ValidationError) {
                return res.status(e.code).json({ error: e.message });
            }
            if (e instanceof DataError) {
                return res.status(e.code).json({ error: e.message });
            }
            return res.status(500).json({ error: "Internal server error." });
        }
    },
);

export { userRoutes };
