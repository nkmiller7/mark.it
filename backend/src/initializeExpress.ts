import express from "express";
import cors from "cors";

import { configRoutes } from "@/routes/index";

const expressApp: express.Express = express();

expressApp.use(cors());
expressApp.use(express.json());
expressApp.use(express.urlencoded({ extended: true }));

configRoutes(expressApp);

export { expressApp };
