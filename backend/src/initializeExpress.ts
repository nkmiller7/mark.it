import express from "express";
import cors from "cors";
import path from "path";

import { configRoutes } from "@/routes/index";

const expressApp: express.Express = express();

expressApp.use(cors());
expressApp.use(express.json());
expressApp.use(express.urlencoded({ extended: true }));

configRoutes(expressApp);

expressApp.use(express.static(path.join(__dirname, "../public")));

expressApp.get("{*splat}", (_req, res) => {
  res.sendFile(path.join(__dirname, "../public", "index.html"));
});

export { expressApp };
