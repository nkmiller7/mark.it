import dotenv from "dotenv";
dotenv.config();

import { expressApp } from "@/initializeExpress";
import { firebaseApp } from "@/initializeFirebase";

expressApp.listen(3001, () => {
    console.log("Server is running on port 3001");
});
