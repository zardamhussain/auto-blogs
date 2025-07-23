import React, { useState, useEffect, useCallback } from "react";
import GenerationPanel from "../components/GenerationPanel";
import GuideCard from "../components/GuideCard";
import GuideCardSkeleton from "../components/GuideCardSkeleton";
import UpdateGuideSidebar from "../components/UpdateGuideSidebar";
import ConnectWebsiteModal from "../components/ConnectWebsiteModal";
import { Info, AlertTriangle } from "react-feather";
import "./PromptsPage.css";
import { useProjects } from "../context/ProjectContext";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config";
import Pagination from "../components/Pagination";

const PromptsPage = () => {
  const [activeTab, setActiveTab] = useState("view");
  const [generatedContent, setGeneratedContent] = useState({
    base_knowledge: "",
    writing_style_guide: "",
    image_style: "",
  });
  const [styleGuideName, setStyleGuideName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [guides, setGuides] = useState([]);
  const [guidesLoading, setGuidesLoading] = useState(false);
  const [editingGuide, setEditingGuide] = useState(null);
  const [editingGuideId, setEditingGuideId] = useState(null);
  const [activeSection, setActiveSection] = useState("base_knowledge");
  const [isGenerated, setIsGenerated] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const promptsPerPage = 6;

  const {
    projects,
    selectedProject,
    apiClient,
    currentUserRole,
    activeBrandProcessingProjectId,
    initiateBrandProcessing,
  } = useProjects();
  const canCreate = currentUserRole === "admin" || currentUserRole === "owner";

  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [useBrandContext, setUseBrandContext] = useState(true);

  const currentProject = projects.find((p) => p.id === selectedProject);
  const isProcessing = activeBrandProcessingProjectId === selectedProject;

  const fetchGuides = useCallback(async () => {
    if (!selectedProject) return;
    setGuidesLoading(true);
    try {
      const { data } = await apiClient.get(
        `/prompts/project/${selectedProject}`
      );
      setGuides(data);
    } catch (error) {
      console.error(error);
    } finally {
      setGuidesLoading(false);
    }
  }, [selectedProject, apiClient]);

  useEffect(() => {
    if (!canCreate && activeTab === "create") {
      setActiveTab("view");
    }
    if (activeTab === "view") {
      fetchGuides();
    }
  }, [activeTab, fetchGuides, canCreate]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleDeleteGuide = (guideId) => {
    setGuides(guides.filter((g) => g.id !== guideId));
  };

  const handleUpdateGuideStatus = (updatedGuide) => {
    setGuides(guides.map((g) => (g.id === updatedGuide.id ? updatedGuide : g)));
  };

  const handleSaveUpdatedGuide = (updatedGuide) => {
    setGuides(guides.map((g) => (g.id === updatedGuide.id ? updatedGuide : g)));
    setEditingGuide(null);
  };

  const handleGenerationStart = () => {
    setIsLoading(true);
    setError("");
    setGeneratedContent({
      base_knowledge: "",
      writing_style_guide: "",
      image_style: "",
    });
    setSaveSuccess("");
    setSaveError("");
    setIsGenerated(false);
  };

  const handleGenerationSuccess = (content) => {
    setGeneratedContent((prev) => ({
      ...prev,
      ...content,
    }));
    setIsLoading(false);
    setIsGenerated(true);
  };

  const handleGenerationSuccessFromBrand = (promptData) => {
    if (promptData) {
      setGeneratedContent({
        base_knowledge: promptData.base_knowledge || "",
        writing_style_guide: promptData.writing_style_guide || "",
        image_style: promptData.image_style || "",
      });
      setStyleGuideName(promptData.name || "Generated Style Guide");
      setEditingGuideId(promptData.id);
      setIsGenerated(true);
      setActiveTab("create");
    }
    // The loading indicator is handled by activeBrandProcessingProjectId,
    // so no need to set isLoading here.
  };

  const handleGenerationError = (errorMessage) => {
    setError(errorMessage);
    setIsLoading(false);
  };

  const handleSaveStyleGuide = async () => {
    if (!selectedProject) {
      setSaveError("No project selected. Please select a project first.");
      return;
    }
    if (!styleGuideName) {
      setSaveError("Please enter a name for the style guide.");
      return;
    }
    if (
      !generatedContent.base_knowledge &&
      !generatedContent.writing_style_guide &&
      !generatedContent.image_style
    ) {
      setSaveError("There is no content to save.");
      return;
    }

    setIsSaving(true);
    setSaveSuccess("");
    setSaveError("");

    try {
      const payload = {
        project_id: selectedProject,
        name: styleGuideName,
        base_knowledge: generatedContent.base_knowledge,
        writing_style_guide: generatedContent.writing_style_guide,
        image_style: generatedContent.image_style,
      };

      if (editingGuideId) {
        // Update existing guide
        await apiClient.patch(`/prompts/${editingGuideId}`, {
          styleGuideName,
          base_knowledge: generatedContent.base_knowledge,
          writing_style_guide: generatedContent.writing_style_guide,
          image_style: generatedContent.image_style,
        });
      } else {
        // Create new guide
        await apiClient.post(`/prompts/`, payload);
      }

      setSaveSuccess("Style guide saved successfully!");
      setStyleGuideName("");
      setGeneratedContent({
        base_knowledge: "",
        writing_style_guide: "",
        image_style: "",
      });
      setEditingGuideId(null);
      setIsGenerated(false); // Go back to the generation panel
    } catch (err) {
      setSaveError(err.response?.data?.detail || err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateBrandContent = async (url) => {
    if (currentProject) {
      await initiateBrandProcessing(
        currentProject.id,
        url,
        handleGenerationSuccessFromBrand
      );
    }
    setIsConnectModalOpen(false);
  };

  const renderEditorContent = () => {
    if (isLoading) {
      return "Generating your style guide, please wait...";
    }
    if (error) {
      return `An error occurred: ${error}`;
    }
    return generatedContent[activeSection] || "";
  };

  const handleContentChange = (e) => {
    setGeneratedContent((prev) => ({
      ...prev,
      [activeSection]: e.target.value,
    }));
  };
  //pagination---
  const indexOfLastGuide = currentPage * promptsPerPage;
  const indexOfFirstGuide = indexOfLastGuide - promptsPerPage;
  const currentGuides = guides.slice(indexOfFirstGuide, indexOfLastGuide);
  const totalPages = Math.ceil(guides.length / promptsPerPage);
  //---

  const renderBrandContextUI = () => {
    if (isProcessing) {
      return (
        <div className="brand-context-bar processing">
          <div className="spinner"></div>
          <div>
            <p>
              <strong>We’re syncing content from your website...</strong>
            </p>
            <p>
              Your prompt will auto-enhance once it's ready (usually ~30 sec).
            </p>
          </div>
        </div>
      );
    }

    if (currentProject && currentProject.brand_content) {
      return (
        <div className="brand-context-bar completed">
          <input
            type="checkbox"
            id="use-brand-context"
            checked={useBrandContext}
            onChange={(e) => setUseBrandContext(e.target.checked)}
          />
          <label htmlFor="use-brand-context">Use Brand Context</label>
          <div className="tooltip-container">
            <Info size={16} />
            <span className="tooltip-text">
              When enabled, your brand's unique tone, voice, and product
              information will be used to generate more relevant and on-brand
              content.
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="brand-context-bar cta">
        <AlertTriangle size={20} className="cta-icon" />
        <div>
          <p>
            <strong>Want smarter prompts that reflect your brand?</strong>
          </p>
          <p>
            Connect your website to auto-fill prompts with real content about
            your products, messaging, and tone.
          </p>
        </div>
        <button
          className="cta-button"
          onClick={() => setIsConnectModalOpen(true)}
        >
          Add Website
        </button>
      </div>
    );
  };

  return (
    <div className="prompts-page">
      <div className="prompts-tabs">
        <button
          className={`tab-button ${activeTab === "view" ? "active" : ""}`}
          onClick={() => setActiveTab("view")}
        >
          View Guides
        </button>
        {canCreate && (
          <button
            className={`tab-button ${activeTab === "create" ? "active" : ""}`}
            onClick={() => setActiveTab("create")}
          >
            Create Guide
          </button>
        )}
      </div>

      <div className="prompts-content">
        {activeTab === "create" && (
          <div className="generation-page-container">
            <GenerationPanel
              onGenerationStart={handleGenerationStart}
              onGenerate={handleGenerationSuccess}
              onGenerationError={handleGenerationError}
              useBrandContext={useBrandContext}
              renderBrandContextUI={renderBrandContextUI}
            />
            {isGenerated && (
              <div className="editor-panel">
                <div className="editor-toolbar">
                  <h2 className="editor-title">Generated Writing Guide</h2>
                  <div className="editor-sections">
                    <button
                      className={`section-button ${
                        activeSection === "base_knowledge" ? "active" : ""
                      }`}
                      onClick={() => setActiveSection("base_knowledge")}
                    >
                      Base Knowledge
                    </button>
                    <button
                      className={`section-button ${
                        activeSection === "writing_style_guide" ? "active" : ""
                      }`}
                      onClick={() => setActiveSection("writing_style_guide")}
                    >
                      Writing Style
                    </button>
                    <button
                      className={`section-button ${
                        activeSection === "image_style" ? "active" : ""
                      }`}
                      onClick={() => setActiveSection("image_style")}
                    >
                      Image Style
                    </button>
                  </div>
                </div>
                <div className="style-guide-name-container">
                  <input
                    type="text"
                    className="style-guide-name-input"
                    placeholder="Enter a name for this style guide..."
                    value={styleGuideName}
                    onChange={(e) => {
                      setStyleGuideName(e.target.value);
                      setSaveError("");
                      setSaveSuccess("");
                    }}
                  />
                </div>
                <div className="editor-content">
                  <textarea
                    className="style-guide-content"
                    value={renderEditorContent()}
                    onChange={handleContentChange}
                    placeholder={`Enter your ${activeSection.replace(
                      "_",
                      " "
                    )} content...`}
                    disabled={isLoading}
                  />
                </div>
                {saveError && <p className="error-message">{saveError}</p>}
                {saveSuccess && (
                  <p className="success-message">{saveSuccess}</p>
                )}
                <div className="editor-actions">
                  <button
                    className="save-btn"
                    onClick={handleSaveStyleGuide}
                    disabled={
                      isSaving ||
                      (!generatedContent.base_knowledge &&
                        !generatedContent.writing_style_guide &&
                        !generatedContent.image_style)
                    }
                  >
                    {isSaving ? "Saving..." : "Save Style Guide"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        {activeTab === "view" && (
          <div className="view-guides-container">
            <h2>Your Style Guides</h2>
            {guidesLoading ? (
              <div className="guides-grid">
                {Array.from({ length: 6 }).map((_, index) => (
                  <GuideCardSkeleton key={index} />
                ))}
              </div>
            ) : guides.length === 0 ? (
              <p>No style guides found for this project.</p>
            ) : (
              <>
                <div className="guides-grid">
                  {currentGuides.map((guide) => (
                    <GuideCard
                      key={guide.id}
                      guide={guide}
                      onEdit={() => {
                        setEditingGuide(guide);
                        setEditingGuideId(guide.id);
                        setActiveSection("base_knowledge");
                      }}
                      onDelete={handleDeleteGuide}
                      onUpdateStatus={handleUpdateGuideStatus}
                      userRole={currentUserRole}
                    />
                  ))}
                </div>
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                )}
              </>
            )}
          </div>
        )}
      </div>
      <UpdateGuideSidebar
        guide={editingGuide}
        onClose={() => setEditingGuide(null)}
        onSave={handleSaveUpdatedGuide}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />
      <ConnectWebsiteModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onGenerate={handleGenerateBrandContent}
        isProcessing={isProcessing}
      />
    </div>
  );
};

export default PromptsPage;
