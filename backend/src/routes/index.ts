import { Express, Request, Response } from "express";

import { authRoutes } from "@/routes/auth";
import { userRoutes } from "@/routes/user";

const configRoutes = (app: Express): void => {
    app.use("/api/auth", authRoutes);
    app.use("/api/user", userRoutes);
    app.use("{*splat}", (req: Request, res: Response) => {
        res.status(404).json({ error: "Not found." });
    });
};

export { configRoutes };
