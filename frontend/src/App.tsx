import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import PrivateRoute from "./components/PrivateRoute";
import PublicRoute from "./components/PublicRoute";
import Landing from "./pages/Landing";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Home from "./pages/Home";
import CreateJob from "./pages/CreateJob";
import JobDetail from "./pages/JobDetail";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import ChangePassword from "./pages/ChangePassword";
import ForgotPassword from "./pages/ForgotPassword";
import Explore from "./pages/Explore";
import TaskDetailLabeler from "./pages/TaskDetailLabeler";

function ScrollToHash() {
    const { pathname, hash } = useLocation();
    useEffect(() => {
        if (hash) {
            const el = document.querySelector(hash);
            if (el) el.scrollIntoView({ behavior: "smooth" });
        } else {
            window.scrollTo(0, 0);
        }
    }, [pathname, hash]);
    return null;
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <ScrollToHash />
                <Navbar />
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route element={<PublicRoute />}>
                        <Route path="/signin" element={<SignIn />} />
                        <Route path="/signup" element={<SignUp />} />
                        <Route path="/signin/forgot-password" element={<ForgotPassword />} />
                    </Route>
                    <Route element={<PrivateRoute />}>
                        <Route path="/home" element={<Home />} />
                        <Route path="/jobs/create" element={<CreateJob />} />
                        <Route path="/jobs/:id" element={<JobDetail />} />
                        <Route path="/tasks/label/:id" element={<TaskDetailLabeler />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/settings/change-password" element={<ChangePassword />} />
                        <Route path="/explore" element = {<Explore />} />
                    </Route>
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
