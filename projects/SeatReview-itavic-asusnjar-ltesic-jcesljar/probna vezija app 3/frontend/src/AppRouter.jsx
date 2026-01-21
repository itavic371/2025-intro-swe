import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import { LanguageProvider } from "./LanguageContext";
import Login from "./Login";
import Register from "./Register";
import Verification from "./Verification";
import Profile from "./Profile";
import App from "./App";
import AdminPanel from "./AdminPanel";
import Navigation from "./Navigation";

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AuthFlow() {
  const [view, setView] = useState("login"); // login | register | verify
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleNeedVerification = (email, code) => {
    setVerificationEmail(email);
    setVerificationCode(code); // For testing without email
    setView("verify");
  };

  const handleVerified = () => {
    setView("login");
  };

  if (view === "verify") {
    return (
      <Verification
        email={verificationEmail}
        testCode={verificationCode}
        onVerified={handleVerified}
      />
    );
  }

  if (view === "register") {
    return (
      <Register
        onSwitchToLogin={() => setView("login")}
        onNeedVerification={handleNeedVerification}
      />
    );
  }

  return <Login onSwitchToRegister={() => setView("register")} />;
}

function AppRouter() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<AuthFlow />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <Navigation />
                  <div className="container">
                    <AdminPanel />
                  </div>
                </AdminRoute>
              }
            />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <App />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default AppRouter;
