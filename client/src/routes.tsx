import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./pages/landing";
import FaceVerify from "./pages/auth/face-verify";
import Login from "./pages/auth/login";
import { AuthProvider } from "./utils/contexts/AuthContext";
import ProtectedRoute from "./utils/components/ProtectedRoute";
import Dashboard from "./pages/dashboard";

export const AppRoutes = () => {

    return (
        <>
            <AuthProvider>
                <Router>
                    <Routes>
                        <Route path="/*" element={<Landing />} />
                        <Route path="/face-verify" element={<FaceVerify />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
                    </Routes>
                </Router>
            </AuthProvider>
        </>
    )
}
