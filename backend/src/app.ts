import { expressApp } from "@/initializeExpress";
import { firebaseApp } from "@/initializeFirebase";
import dotenv from "dotenv";

dotenv.config();

expressApp.listen(3000, () => {
    console.log("Server is running on port 3000");
});
