import { Request, Response, NextFunction } from "express";

import { DecodedIdToken } from "firebase-admin/auth";

import { firebaseApp } from "@/initializeFirebase";
import { getAuth } from "firebase-admin/auth";

import {
    LabelerUserDocument,
    OwnerUserDocument,
    ReviewerUserDocument,
    userDataMethods,
} from "@/data/users";
import { WithId } from "mongodb";

interface AuthenticatedRequest extends Request {
    user: {
        token: DecodedIdToken;
    };
}

const firebaseAuth = getAuth(firebaseApp);

const authMiddleware = {
    authenticateRequest: async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const authHeader: string | undefined = req.headers.authorization;
            if (authHeader === undefined || authHeader.split(" ").length !== 2)
                return res.status(401).json({ error: "Unauthorized request." });
            const [bearerKeyword, idToken] = authHeader.split(" ");
            if (bearerKeyword !== "Bearer")
                return res.status(401).json({ error: "Unauthorized request." });
            (req as AuthenticatedRequest).user = {
                token: await firebaseAuth.verifyIdToken(idToken),
            };
            return next();
        } catch (e) {
            return res.status(401).json({ error: "Unauthorized request." });
        }
    },

    authenticateOwnerRequest: async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const authHeader: string | undefined = req.headers.authorization;
            if (authHeader === undefined || authHeader.split(" ").length !== 2)
                return res.status(401).json({ error: "Unauthorized request." });
            const [bearerKeyword, idToken] = authHeader.split(" ");
            if (bearerKeyword !== "Bearer")
                return res.status(401).json({ error: "Unauthorized request." });
            (req as AuthenticatedRequest).user = {
                token: await firebaseAuth.verifyIdToken(idToken),
            };
            if (
                !(await userDataMethods.isOwnerUser(
                    await userDataMethods.getUserByEmail(
                        (req as AuthenticatedRequest).user.token.email,
                    ),
                ))
            ) {
                return res.status(403).json({ error: "Forbidden request." });
            }
            return next();
        } catch (e) {
            return res.status(401).json({ error: "Unauthorized request." });
        }
    },

    authenticateLabelerOrReviewerRequest: async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const authHeader: string | undefined = req.headers.authorization;
            if (authHeader === undefined || authHeader.split(" ").length !== 2)
                return res.status(401).json({ error: "Unauthorized request." });
            const [bearerKeyword, idToken] = authHeader.split(" ");
            if (bearerKeyword !== "Bearer")
                return res.status(401).json({ error: "Unauthorized request." });
            (req as AuthenticatedRequest).user = {
                token: await firebaseAuth.verifyIdToken(idToken),
            };
            const user: WithId<
                OwnerUserDocument | LabelerUserDocument | ReviewerUserDocument
            > = await userDataMethods.getUserByEmail(
                (req as AuthenticatedRequest).user.token.email,
            );
            if (
                !(await userDataMethods.isLabelerUser(user)) &&
                !(await userDataMethods.isReviewerUser(user))
            ) {
                return res.status(403).json({ error: "Forbidden request." });
            }
            return next();
        } catch (e) {
            return res.status(401).json({ error: "Unauthorized request." });
        }
    },
};

export { authMiddleware, AuthenticatedRequest };
