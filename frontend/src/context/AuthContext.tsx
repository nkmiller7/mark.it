import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    type User,
    type AuthError,
} from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";

interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    signUp: (
        email: string,
        password: string,
        fields: Record<string, string>,
    ) => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    async function signUp(
        email: string,
        password: string,
        fields: Record<string, string>,
    ) {
        const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, ...fields }),
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Registration failed.");
        }

        // Account created on backend now making client session
        await signInWithEmailAndPassword(auth, email, password);
        await firebaseSignOut(auth);
    }

    async function signIn(email: string, password: string) {
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (e) {
            const code = (e as AuthError).code;
            switch (code) {
                case "auth/invalid-credential":
                case "auth/wrong-password":
                case "auth/user-not-found":
                    throw new Error("Incorrect email or password.");
                case "auth/user-disabled":
                    throw new Error("This account has been disabled.");
                case "auth/too-many-requests":
                    throw new Error(
                        "Too many failed attempts. Please try again later.",
                    );
                default:
                    throw new Error("Failed to sign in. Please try again.");
            }
        }
    }

    async function signOut() {
        await firebaseSignOut(auth);
    }

    const value: AuthContextType = {
        currentUser,
        loading,
        signUp,
        signIn,
        signOut,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
