import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useProjects } from "../context/ProjectContext";
import { ChevronDown, PlusCircle } from "lucide-react";
import "./PageHeader.css";
import { useNavigate } from "react-router-dom";
// import InvitationsBell from './InvitationsBell';

const PageHeader = ({ breadcrumb, hideBorder, hideProjectSelector }) => {
  const { projects, selectedProject, setSelectedProject, loading } =
    useProjects();
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const handleSelectProject = (projectId) => {
    setSelectedProject(projectId);
    setDropdownOpen(false);
  };

  const selectedProjectDetails = projects?.find(
    (p) => p.id === selectedProject
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className={`page-header ${hideBorder ? "no-border" : ""}`}>
      <div className="header-left">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <span className="breadcrumb-item">{breadcrumb[0]}</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-item active">{breadcrumb[1]}</span>
        </nav>
      </div>

      <div className="header-right">
        {/* <InvitationsBell /> */}
        {/* Project Selector */}
        {!hideProjectSelector && (
          <div className="project-selector" ref={dropdownRef}>
            <button
              className="project-selector-btn"
              onClick={() => setDropdownOpen(!isDropdownOpen)}
              disabled={loading}
            >
              <span>
                {loading
                  ? "Loading..."
                  : selectedProjectDetails?.name || "Select Project"}
              </span>
              <ChevronDown size={18} />
            </button>
            {isDropdownOpen && (
              <div className="project-dropdown">
                <div className="project-dropdown-list">
                  {projects.length > 0 ? (
                    projects.map((project) => (
                      <div
                        key={project.id}
                        className="project-option"
                        onClick={() => handleSelectProject(project.id)}
                      >
                        {project.name}
                      </div>
                    ))
                  ) : (
                    <div
                      className="project-option"
                      style={{ fontStyle: "italic", cursor: "default" }}
                    >
                      No projects found.
                    </div>
                  )}
                </div>
                <div className="project-option-divider" />
                <div
                  className="add-project-btn"
                  onClick={() => navigate("/projects")}
                >
                  <PlusCircle size={18} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default PageHeader;
