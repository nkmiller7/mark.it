import { Express, Request, Response } from "express";
import path from "path";

import { authRoutes } from "@/routes/auth";
import { userRoutes } from "@/routes/user";
import { jobRoutes } from "@/routes/job";

const configRoutes = (app: Express): void => {
    app.get("/api/health", (_req: Request, res: Response) => {
        res.json({ status: "ok" });
    });

    app.use("/api/auth", authRoutes);
    app.use("/api/user", userRoutes);
    app.use("/api/jobs", jobRoutes);

    app.use("/api/{*splat}", (_req: Request, res: Response) => {
        res.status(404).json({ error: "Endpoint not found." });
    });

    if (process.env.NODE_ENV === "production") {
        app.use("{*splat}", (_req: Request, res: Response) => {
            res.sendFile(path.join(__dirname, "../../public/index.html"));
        });
    }
};

export { configRoutes };
