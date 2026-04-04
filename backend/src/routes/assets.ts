import { Router, Response } from "express";

import { ObjectId, WithId } from "mongodb";

import { validationMethods, ValidationError } from "@/validation";
import { authMiddleware, AuthenticatedRequest } from "@/middleware/auth";
import { DataError } from "@/data/collections";
import { taskDataMethods, TaskDocument } from "@/data/tasks";
import {
    userDataMethods,
    OwnerUserDocument,
    ReviewerUserDocument,
    LabelerUserDocument,
} from "@/data/users";

const assetRoutes = Router();

