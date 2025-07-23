import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
} from "react";
import { useAuth } from "./AuthContext";
import createApiClient from "../api/apiClient";

export const ProjectContext = createContext();

export const useProjects = () => {
  return useContext(ProjectContext);
};

export const ProjectProvider = ({ children }) => {
  const { appToken } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(
    localStorage.getItem("selectedProjectId") || null
  );
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProjectOnboardingModal, setShowProjectOnboardingModal] =
    useState(false);
  const [activeBrandProcessingProjectId, setActiveBrandProcessingProjectId] =
    useState(null);

  const apiClient = useMemo(() => {
    return createApiClient(appToken, selectedProject);
  }, [appToken, selectedProject]);

  const fetchProjects = async () => {
    console.log(
      "ProjectContext: fetchProjects called. Current appToken:",
      appToken
    );
    if (!appToken) {
      setLoading(false);
      setProjects([]);
      console.log("ProjectContext: No appToken, returning.");
      return;
    }
    setLoading(true);
    try {
      const client = createApiClient(appToken);
      const response = await client.get("/projects/");
      const data = response.data;
      setProjects(data);
      console.log("ProjectContext: Fetched projects. Count:", data.length);

      if (data.length > 0) {
        setShowProjectOnboardingModal(false); // Hide modal if projects exist
        const storedProjectId = localStorage.getItem("selectedProjectId");
        if (storedProjectId && data.some((p) => p.id === storedProjectId)) {
          setSelectedProject(storedProjectId);
        } else {
          const defaultProjectId = data[0].id;
          setSelectedProject(defaultProjectId);
          localStorage.setItem("selectedProjectId", defaultProjectId);
        }
      } else {
        setSelectedProject(null);
        localStorage.removeItem("selectedProjectId");
        setShowProjectOnboardingModal(true);
      }
    } catch (error) {
      console.error("ProjectContext: Failed to fetch projects:", error);
      setProjects([]);
      setSelectedProject(null);
      setShowProjectOnboardingModal(false); // Don't show on error
    } finally {
      setLoading(false);
    }
  };

  const initiateBrandProcessing = async (projectId, brandUrl, onSuccess) => {
    if (!apiClient) return;

    setActiveBrandProcessingProjectId(projectId);

    try {
      // Start the background job by hitting the new endpoint
      await apiClient.post(
        `/projects/${projectId}/brand-fetch-and-generate-guide`,
        { brand_url: brandUrl }
      );

      // Start polling
      const poll = setInterval(async () => {
        try {
          const { data: projectData } = await apiClient.get(
            `/projects/${projectId}`
          );
          if (projectData.brand_info_status === "completed") {
            clearInterval(poll);

            if (projectData.default_prompt_id) {
              try {
                const { data: promptData } = await apiClient.get(
                  `/prompts/${projectData.default_prompt_id}`
                );
                if (onSuccess) {
                  onSuccess(promptData);
                }
              } catch (promptError) {
                console.error("Failed to fetch generated prompt:", promptError);
              }
            }

            // Refresh all projects data to get the final state and stop processing indicator
            await fetchProjects();
            setActiveBrandProcessingProjectId(null);
          } else if (projectData.brand_info_status === "failed") {
            clearInterval(poll);
            await fetchProjects();
            // TODO: Show an error toast to the user
            console.error("Brand processing failed on the backend.");
            setActiveBrandProcessingProjectId(null);
          }
        } catch (pollError) {
          console.error("Polling failed:", pollError);
          clearInterval(poll);
          setActiveBrandProcessingProjectId(null);
        }
      }, 5000); // Poll every 5 seconds
    } catch (error) {
      console.error("Failed to initiate brand processing:", error);
      setActiveBrandProcessingProjectId(null);
      // Optionally: show an error toast to the user
    }
  };

  const fetchInvitations = async () => {
    if (!appToken) return;
    try {
      const response = await apiClient.get("/invitations/pending");
      setInvitations(response.data);
    } catch (error) {
      console.error("Failed to fetch invitations:", error);
      setInvitations([]);
    }
  };
  const createUntitledProject = async () => {
    console.log("ProjectContext: createUntitledProject called.");
    try {
      await apiClient.post("/projects/", {
        name: "Untitled Project",
        description: "Your first project.",
      });
      console.log("ProjectContext: Untitled project created in backend.");
      await fetchProjects();
      console.log(
        "ProjectContext: fetchProjects called after untitled project creation."
      );
    } catch (error) {
      console.error(
        "ProjectContext: Failed to create untitled project:",
        error
      );
    }
  };

  useEffect(() => {
    if (appToken) {
      fetchProjects();
      fetchInvitations();
    }
  }, [appToken]);

  useEffect(() => {
    if (selectedProject && projects.length > 0) {
      const project = projects.find((p) => p.id === selectedProject);
      if (project) {
        setCurrentUserRole(project.role);
      }
    } else {
      setCurrentUserRole(null);
    }
  }, [selectedProject, projects]);

  const handleSetSelectedProject = (projectId) => {
    setSelectedProject(projectId);
    if (projectId) {
      localStorage.setItem("selectedProjectId", projectId);
    } else {
      localStorage.removeItem("selectedProjectId");
    }
  };

  const removeProjectById = (projectId) => {
    const updatedProjects = projects.filter((p) => p.id !== projectId);
    setProjects(updatedProjects);

    if (selectedProject === projectId) {
      const newSelectedProject =
        updatedProjects.length > 0 ? updatedProjects[0].id : null;
      handleSetSelectedProject(newSelectedProject);
    }
  };

  const acceptInvitation = async (token) => {
    await apiClient.post(`/invitations/accept/${token}`);
    fetchProjects(); // Refresh projects to include the new one
    fetchInvitations(); // Refresh invitations
  };

  const declineInvitation = async (token) => {
    await apiClient.post(`/invitations/decline/${token}`);
    fetchInvitations(); // Refresh invitations
  };

  const value = {
    projects,
    selectedProject,
    setSelectedProject: handleSetSelectedProject,
    loading,
    apiClient,
    fetchProjects,
    currentUserRole,
    invitations,
    acceptInvitation,
    declineInvitation,
    removeProjectById,
    showProjectOnboardingModal,
    setShowProjectOnboardingModal,
    createUntitledProject,
    activeBrandProcessingProjectId,
    initiateBrandProcessing,
  };

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
};
