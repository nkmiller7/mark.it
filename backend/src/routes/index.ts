import express from "express";
import authRoutes from "./auth";

const configRoutes = (app: express.Express): void => {
    app.use("/api/auth", authRoutes);
    app.use("{*splat}", (req: express.Request, res: express.Response) => {
        res.status(404).json({ error: "Not found." });
    });
};

export default configRoutes;