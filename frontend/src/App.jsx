import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProjectProvider } from "./context/ProjectContext";
import { ToastProvider } from "./context/ToastContext";
import { ThemeProvider } from "./context/ThemeContext";
import { TaskProvider } from "./context/TaskContext";
import ProtectedRoutes from "./components/ProtectedRoutes";
import AnalyticsTracker from "./components/AnalyticsTracker";
import AnalyticsInitializer from "./components/AnalyticsInitializer";
import PrivacyConsent from "./components/PrivacyConsent";
import BlogPage from "./pages/BlogPage";
import SettingsPage from "./pages/SettingsPage";
import ProjectPage from "./pages/ProjectPage";
import DashboardPage from "./pages/DashboardPage";
import WorkflowBuilderPage from "./pages/WorkflowBuilderPage";
import AcceptInvitationPage from "./pages/AcceptInvitationPage";
import CtaGeneratorPage from "./pages/CtaGeneratorPage";
import PromptsPage from "./pages/PromptsPage";
import WorkflowTemplatesPage from "./pages/WorkflowTemplatesPage";
import LandingPage from "./pages/LandingPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import SchedulePage from "./pages/SchedulePage";
import "./App.css";

const AnalyticsPage = () => <h1 style={{ padding: "2rem" }}>Analytics Page</h1>;

function App() {
  return (
    <Router>
      <AuthProvider>
        <ProjectProvider>
          <ToastProvider>
            <TaskProvider>
              <ThemeProvider>
                <AnalyticsInitializer />
                <AnalyticsTracker />
                <PrivacyConsent />
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<TermsOfService />} />
                  <Route element={<ProtectedRoutes />}>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/blogs" element={<BlogPage />} />
                    <Route path="/blogs/:blogId" element={<BlogPage />} />
                    <Route path="/prompts" element={<PromptsPage />} />
                    <Route path="/schedule" element={<SchedulePage />} />
                    <Route path="/analytics" element={<AnalyticsPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/projects" element={<ProjectPage />} />
                    <Route
                      path="/workflows"
                      element={<WorkflowBuilderPage />}
                    />
                    <Route
                      path="/templates"
                      element={<WorkflowTemplatesPage />}
                    />
                    <Route
                      path="/cta-generator"
                      element={<CtaGeneratorPage />}
                    />
                    <Route
                      path="/accept-invitation/:token"
                      element={<AcceptInvitationPage />}
                    />
                  </Route>
                </Routes>
              </ThemeProvider>
            </TaskProvider>
          </ToastProvider>
        </ProjectProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
