import { Request, Response, NextFunction } from "express";

import { firebaseApp } from "@/initializeFirebase";
import { getAuth } from "firebase-admin/auth";

import { AuthenticatedRequest } from "@/routes/auth";

const firebaseAuth = getAuth(firebaseApp);

const authMiddleware = {
    authenticateRequest: async (
        req: Request,
        res: Response,
        next: NextFunction,
    ) => {
        try {
            const authHeader = req.headers.authorization;
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
};

export { authMiddleware };
