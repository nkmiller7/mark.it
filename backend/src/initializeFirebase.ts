import { initializeApp, App } from "firebase-admin/app";
import admin from "firebase-admin";
import root from "app-root-path";

const firebaseApp: App = initializeApp({
    credential: admin.credential.cert(`${root.path}/firebase-adminsdk.json`),
});

export { firebaseApp };
