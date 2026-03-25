import { Router, Request, Response } from "express";

import { firebaseApp } from "@/initializeFirebase";
import { getAuth } from "firebase-admin/auth";
import { FirebaseAuthError, DecodedIdToken } from "firebase-admin/auth";

import { validate, ValidationError } from "@/validation";
import { authMiddleware } from "@/middleware/auth";

const authRoutes = Router();
const firebaseAuth = getAuth(firebaseApp);

interface AuthenticatedRequest extends Request {
    user: {
        token: DecodedIdToken;
    };
}

authRoutes.post("/register", async (req: Request, res: Response) => {
    try {
        const { email, password } = validate.request.auth.register(req);
        await firebaseAuth.createUser({
            email: email,
            password: password,
        });
        return res
            .status(201)
            .json({ message: "Account successfully created." });
    } catch (e: unknown) {
        switch (true) {
            case e instanceof ValidationError: {
                return res
                    .status((e as ValidationError).code)
                    .json({ error: (e as ValidationError).message });
            }
            case e instanceof FirebaseAuthError: {
                return res
                    .status(500)
                    .json({ error: (e as FirebaseAuthError).message });
            }
            case true: {
                return res
                    .status(500)
                    .json({ error: "An unexpected error occurred." });
            }
        }
    }
});

authRoutes.get(
    "/check",
    authMiddleware.authenticateRequest,
    async (req: AuthenticatedRequest, res: Response) => {
        return res.status(200).json({ message: "Authenticated." });
    },
);

export { authRoutes, AuthenticatedRequest };
