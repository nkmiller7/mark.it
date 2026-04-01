import express from "express";
import cors from "cors";
import path from "path";

import { configRoutes } from "@/routes/index";

const expressApp: express.Express = express();

expressApp.use(cors());
expressApp.use(express.json());
expressApp.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === "production") {
    expressApp.use(express.static(path.join(__dirname, "../public")));
}

configRoutes(expressApp);

export { expressApp };
