import { Router, Request, Response } from "express";

import { firebaseApp } from "@/initializeFirebase";
import { getAuth } from "firebase-admin/auth";
import { FirebaseAuthError } from "firebase-admin/auth";

import { validationMethods, ValidationError } from "@/validation";
import { authMiddleware, AuthenticatedRequest } from "@/middleware/auth";
import { DataError } from "@/data/collections";
import {
    OwnerUserDocument,
    ReviewerUserDocument,
    LabelerUserDocument,
    userDataMethods,
    UserDocument,
} from "@/data/users";

const authRoutes = Router();
const firebaseAuth = getAuth(firebaseApp);

authRoutes.post(
    "/register",
    async (
        req: Request,
        res: Response,
    ): Promise<Response<any, Record<string, any>>> => {
        try {
            const user:
                | OwnerUserDocument
                | LabelerUserDocument
                | ReviewerUserDocument =
                validationMethods.request.auth.register(req);
            //console.log("validated user:", JSON.stringify(user));
            await userDataMethods.createUser(user);
            //console.log("mongo user created");
            await firebaseAuth.createUser({
                email: user.email,
                password: validationMethods.user.password(req.body.password),
            });
            //console.log("firebase user created");
            return res
                .status(201)
                .json({ message: "Account successfully created." });
        } catch (e: unknown) {
            //console.error("[register] error:", e);
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
                case e instanceof FirebaseAuthError: {
                    return res
                        .status(500)
                        .json({ error: (e as FirebaseAuthError).message });
                }
                case true: {
                    return res.status(500).json({ error: e });
                }
            }
        }
    },
);

authRoutes.get(
    "/check",
    authMiddleware.authenticateRequest,
    async (
        req: AuthenticatedRequest,
        res: Response,
    ): Promise<Response<any, Record<string, any>>> => {
        return res.status(200).json({ message: "Authenticated." });
    },
);

export { authRoutes };
