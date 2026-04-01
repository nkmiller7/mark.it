import { initializeApp, App } from "firebase-admin/app";
import admin from "firebase-admin";

const firebaseApp: App = initializeApp({
    credential: admin.credential.cert(String(process.env.FIREBASE_ADMIN_SDK)),
});

export { firebaseApp };
