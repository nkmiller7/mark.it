import { Express } from "express";

import { authRoutes } from "@/routes/auth";
import { userRoutes } from "@/routes/user";
import { jobRoutes } from "@/routes/job";

const configRoutes = (app: Express): void => {
    app.use("/api/auth", authRoutes);
    app.use("/api/user", userRoutes);
    app.use("/api/jobs", jobRoutes);
    app.use("{*splat}", (req, res) => {
        res.status(404).json({ error: "Endpoint not found." });
    });
};

export { configRoutes };
