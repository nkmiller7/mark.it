import { Router, Request, Response } from "express";
import { FirebaseError } from "firebase/app";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
} from "firebase/auth";
import firebaseApp from "../initializeFirebase";
import { validate, ValidationError } from "../validation";

const auth = getAuth(firebaseApp);
const router = Router();

router.post("/register", async (req: Request, res: Response) => {
    try {
        const { email, password } = validate.request.auth.register(req);
        await createUserWithEmailAndPassword(auth, email, password);
        return res
            .status(201)
            .json({ message: "Account successfully created." });
    } catch (e: unknown) {
        if (e instanceof ValidationError) {
            return res.status(e.code).json({ error: e.message });
        } else if (e instanceof FirebaseError) {
            // Probably want to return correct status code based on error, but for now
            // just return 500.
            return res.status(500).json({ error: e.message });
        } else {
            return res
                .status(500)
                .json({ error: "An unexpected error occurred." });
        }
    }
});

router.post("/login", async (req: Request, res: Response) => {
    try {
        const { email, password } = validate.request.auth.login(req);
        const user = (await signInWithEmailAndPassword(auth, email, password))
            .user;
        return res.status(200).json({ token: await user.getIdToken() });
    } catch (e: unknown) {
        if (e instanceof ValidationError) {
            return res.status(e.code).json({ error: e.message });
        } else if (e instanceof FirebaseError) {
            // Probably want to return correct status code based on error, but for now
            // just return 500.
            return res.status(500).json({ error: e.message });
        } else {
            return res
                .status(500)
                .json({ error: "An unexpected error occurred." });
        }
    }
});

export default router;
