import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import PageHeader from "./PageHeader";
import ProjectOnboardingModal from "./ProjectOnboardingModal";
import { useProjects } from "../context/ProjectContext";
import "../App.css";
import React from "react";
import NewProjectModal from "./NewProjectModal";

const BREADCRUMB_MAP = {
  "/": ["Workspace", "Dashboard"],
  "/blogs": ["Workspace", "All Blogs"],
  "/schedule": ["Workspace", "Schedule"],
  "/prompts": ["Workspace", "Prompts"],
  "/analytics": ["Management", "Analytics"],
  "/settings": ["Management", "Settings"],
  "/projects": ["Management", "Projects"],
  "/workflows": ["Workspace", "Workflows"],
  "/templates": ["Management", "Workflow Templates"],
};

const Layout = ({ children }) => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const { showProjectOnboardingModal, setShowProjectOnboardingModal } =
    useProjects();

  console.log(
    "Layout: showProjectOnboardingModal state:",
    showProjectOnboardingModal
  );

  useEffect(() => {
    document.body.classList.add("no-scroll");
    // Clean up the class when the component unmounts
    return () => {
      document.body.classList.remove("no-scroll");
    };
  }, []); // Run only once when the layout mounts

  const getBreadcrumb = (pathname) => {
    if (pathname.startsWith("/blogs/")) return ["Workspace", "Blog Post"];
    if (pathname.startsWith("/workflows")) return ["Workspace", "Workflows"];
    if (pathname.startsWith("/schedule")) return ["Workspace", "Schedule"];
    return BREADCRUMB_MAP[pathname] || ["", ""];
  };

  const breadcrumb = getBreadcrumb(location.pathname);
  console.log("Layout: breadcrumb", breadcrumb);
  const hideHeaderBorder = location.pathname === "/settings";
  const hideGlobalPageHeader = location.pathname === "/cta-generator";

  return (
    <div className="app-shell">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)}
      />
      <main className="main-content">
        {!hideGlobalPageHeader && (
          <PageHeader breadcrumb={breadcrumb} hideBorder={hideHeaderBorder} />
        )}
        <div className="content-wrapper">{children}</div>
      </main>
      <NewProjectModal
        isOpen={showProjectOnboardingModal}
        onClose={() => {
          console.log("Layout: ProjectOnboardingModal onClose triggered.");
          setShowProjectOnboardingModal(false);
        }}
        isForcedCreation={true}
      />
    </div>
  );
};

export default Layout;
