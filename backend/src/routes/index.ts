import { Express } from "express";

import { authRoutes } from "@/routes/auth";
import { userRoutes } from "@/routes/user";

const configRoutes = (app: Express): void => {
    app.use("/api/auth", authRoutes);
    app.use("/api/user", userRoutes);
};

export { configRoutes };
