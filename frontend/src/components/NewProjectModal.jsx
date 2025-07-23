import React, { useState } from "react";
import { useProjects } from "../context/ProjectContext";
import "./NewProjectModal.css";
import { Paperclip, Sun, PenTool, Type } from "react-feather";

const NewProjectModal = ({ isOpen, onClose, onProjectCreated }) => {
  const { apiClient, initiateBrandProcessing, activeBrandProcessingProjectId } =
    useProjects();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [newlyCreatedProject, setNewlyCreatedProject] = useState(null);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [activeGuideTab, setActiveGuideTab] = useState("knowledge");

  const isProcessing =
    activeBrandProcessingProjectId === newlyCreatedProject?.id;

  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Project name is required.");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      const response = await apiClient.post("/projects/", {
        name,
        description,
      });
      const newProject = response.data;
      setNewlyCreatedProject(newProject);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.detail || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBrandFetch = async () => {
    if (!websiteUrl.trim() || !newlyCreatedProject) return;
    setIsSubmitting(true);
    setError("");
    try {
      await initiateBrandProcessing(
        newlyCreatedProject.id,
        websiteUrl,
        (promptData) => {
          setGeneratedContent(promptData);
          setIsSubmitting(false);
        }
      );
    } catch (err) {
      setError("Failed to start brand processing.");
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset state before closing
    setName("");
    setDescription("");
    setError("");
    setStep(1);
    setWebsiteUrl("");
    setGeneratedContent(null);
    setIsSubmitting(false);

    // Call onProjectCreated only when closing if a project was created
    if (newlyCreatedProject) {
      onProjectCreated(newlyCreatedProject);
    }
    setNewlyCreatedProject(null); // Clear the created project
    onClose();
  };

  if (!isOpen) return null;

  const renderInitialPromptUI = () => (
    <div className="text-[#888] flex-1 flex flex-col justify-center items-center text-center">
      <div className="mb-[20px] text-[#666]">
        <Paperclip size={48} />
      </div>
      <h3 className="text-[20px] mb-[10px] text-[#ccc]">
        Your Style Guide Awaits
      </h3>
      <p>
        Enter your website URL and click "Generate Guide" to see the magic
        happen.
      </p>
    </div>
  );

  const renderProcessingUI = () => (
    <div className="text-[#888] flex-1 flex flex-col justify-center items-center text-center flex-col h-full relative overflow-hidden">
      <div className="flex flex-col justify-around items-center h-[60%] z-10">
        <div className="bg-[rgba(255,255,255,0.05)] rounded-full w-[60px] h-[60px] flex justify-center items-center text-[#a0a0a0] animate-pulse">
          <PenTool size={28} />
        </div>
        <div className="bg-[rgba(255,255,255,0.05)] rounded-full w-[60px] h-[60px] flex justify-center items-center text-[#a0a0a0] animate-[pulse_2s_infinite_ease-in-out_0.6s]">
          <Type size={28} />
        </div>
      </div>
      <div className="z-10 text-center">
        <h3 className="mt-[20px] text-[18px]">Analyzing Your Brand...</h3>
        <p className="text-[14px] text-[#888]">
          Crafting a style guide that feels just like you.
        </p>
      </div>
    </div>
  );

  const tabContent = {
    knowledge: generatedContent?.base_knowledge || "",
    style: generatedContent?.writing_style_guide || "",
    image: generatedContent?.image_style || "",
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex justify-center items-center z-[1000] backdrop-blur-sm p-4"
      onClick={handleClose}
    >
      <div
        className={`bg-[#2c2c2c] text-[#e0e0e0] p-[30px] rounded-[12px] w-full max-w-[600px] shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-[#444] transition-all duration-400 ease-in-out max-h-[90vh] overflow-hidden ${
          step === 2
            ? `max-w-[1000px] flex flex-col ${
                generatedContent ? "h-[85vh]" : "h-[59vh]"
              }`
            : ""
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {step === 1 && (
          <>
            <h2 className="mt-0 text-[24px] font-semibold text-white text-center mb-[10px]">
              Create New Project
            </h2>
            <form onSubmit={handleProjectSubmit}>
              <div className="mb-[20px]">
                <label
                  htmlFor="projectName"
                  className="block mb-[8px] text-[14px] font-medium text-[#b0b0b0]"
                >
                  Project Name
                </label>
                <input
                  id="projectName"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Awesome SEO Project"
                  autoFocus
                  className="w-full p-[12px] bg-[#383838] border border-[#555] rounded-[8px] text-[#e0e0e0] text-[16px] transition-all duration-300 ease-in-out focus:outline-none focus:border-[#e7e7e7] focus:ring-[3px] focus:ring-[rgba(181,181,185,0.3)]"
                />
              </div>
              <div className="form-group">
                <label
                  htmlFor="projectDescription"
                  className="block mb-[8px] text-[14px] font-medium text-[#b0b0b0]"
                >
                  Description (Optional)
                </label>
                <textarea
                  id="projectDescription"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="3"
                  placeholder="A brief description of the project's goals."
                  className="w-full p-[12px] bg-[#383838] border border-[#555] rounded-[8px] text-[#e0e0e0] text-[16px] transition-all duration-300 ease-in-out focus:outline-none focus:border-[#e7e7e7] focus:ring-[3px] focus:ring-[rgba(181,181,185,0.3)]"
                />
              </div>
              {error && <p className="error-message">{error}</p>}
              <div className="flex justify-end gap-[15px] mt-[30px]">
                <button
                  type="button"
                  onClick={handleClose}
                  className="p-[10px] px-[20px] border-none rounded-[8px] text-[16px] font-medium cursor-pointer transition-all duration-300 hover:-translate-y-0.5 disabled:bg-[#555] disabled:text-[#888] disabled:cursor-not-allowed disabled:transform-none bg-[#484848] text-[#e0e0e0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`p-[10px] px-[20px] border-none rounded-[8px] text-[16px] font-medium cursor-pointer transition-all duration-300 hover:-translate-y-0.5 disabled:bg-[#555] disabled:text-[#888] disabled:cursor-not-allowed disabled:transform-none bg-[#ffffff] text-[#000000] ${
                    isSubmitting ? "" : ""
                  }`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating..." : "Next"}
                </button>
              </div>
            </form>
          </>
        )}

        {step === 2 && (
          <div className="flex flex-1 gap-[30px] min-h-0 overflow-hidden">
            <div
              className={`${
                generatedContent ? "flex-[0.5]" : "flex-1"
              } flex flex-col min-w-0`}
            >
              <h2 className="text-left text-[20px] font-semibold mb-[10px] flex-shrink-0">
                Connect Your Website
              </h2>
              <p className="text-left text-[#a0a0a0] text-[16px] flex-shrink-0">
                Provide a URL to automatically generate a style guide that
                matches your brand. This step is optional.
              </p>

              <div className="mb-[20px] flex-shrink-0">
                <label
                  htmlFor="websiteUrl"
                  className="block mb-[8px] text-[14px] font-medium text-[#eeeeee] mt-[30px]"
                >
                  Website URL
                </label>
                <input
                  id="websiteUrl"
                  type="text"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://example.com"
                  disabled={isProcessing}
                  className="w-full p-[12px] bg-[#383838] border border-[#555] rounded-[8px] text-[#e0e0e0] text-[16px] transition-all duration-300 ease-in-out focus:outline-none focus:border-[#f4f2ff] focus:ring-[3px] focus:ring-[rgba(185,184,188,0.3)]"
                />
              </div>

              <div className="mt-auto flex justify-between flex-shrink-0">
                <button
                  type="button"
                  onClick={handleClose}
                  className="p-[10px] px-[20px] border-none rounded-[8px] text-[16px] font-medium cursor-pointer transition-all duration-300 hover:-translate-y-0.5 disabled:bg-[#555] disabled:text-[#888] disabled:cursor-not-allowed disabled:transform-none bg-[#ffffff] text-[#000000]"
                >
                  Finish
                </button>
                {!generatedContent && (
                  <button
                    type="button"
                    onClick={handleBrandFetch}
                    className="p-[10px] px-[20px] border-none rounded-[8px] text-[16px] font-medium cursor-pointer transition-all duration-300 hover:-translate-y-0.5 disabled:bg-[#555] disabled:text-[#888] disabled:cursor-not-allowed disabled:transform-none bg-[#ffffff] text-black"
                    disabled={isProcessing || !websiteUrl.trim()}
                  >
                    {isProcessing ? "Generating..." : "Generate Guide"}
                  </button>
                )}
              </div>
              {error && <p className="error-message">{error}</p>}
            </div>

            <div className="flex-1 bg-[#222] rounded-[10px] p-[30px] flex flex-col justify-start items-stretch text-left border border-dashed border-[#444] min-w-0 min-h-0">
              {isProcessing ? (
                renderProcessingUI()
              ) : generatedContent ? (
                <>
                  <h4 className="text-[18px] mb-[20px] text-white text-center flex-shrink-0">
                    Here's what we learned about your brand:
                  </h4>
                  <div className="flex justify-center gap-[10px] mb-[20px] flex-shrink-0 flex-wrap">
                    <button
                      className={`flex items-center gap-[8px] p-[10px] px-[20px] border border-[#444] bg-[#2e2e2e00] text-[#a0a0a0] rounded-[8px] cursor-pointer transition-all duration-300 text-[14px] hover:bg-[#414141] hover:text-white ${
                        activeGuideTab === "knowledge"
                          ? "bg-[#ffffff] text-black"
                          : ""
                      }`}
                      onClick={() => setActiveGuideTab("knowledge")}
                    >
                      <Sun size={18} />
                      <span>Brand & Product</span>
                    </button>
                    <button
                      className={`flex items-center gap-[8px] p-[10px] px-[20px] border border-[#444] bg-[#4a4a4a00] text-[#a0a0a0] rounded-[8px] cursor-pointer transition-all duration-300 text-[14px] hover:bg-[#414141] hover:text-white ${
                        activeGuideTab === "style"
                          ? "bg-[#ffffff] text-black"
                          : ""
                      }`}
                      onClick={() => setActiveGuideTab("style")}
                    >
                      <PenTool size={18} />
                      <span>Writing Style</span>
                    </button>
                    <button
                      className={`flex items-center gap-[8px] p-[10px] px-[20px] border border-[#444] bg-[#4a4a4a00] text-[#a0a0a0] rounded-[8px] cursor-pointer transition-all duration-300 text-[14px] hover:bg-[#414141] hover:text-white ${
                        activeGuideTab === "image"
                          ? "bg-[#ffffff] text-black"
                          : ""
                      }`}
                      onClick={() => setActiveGuideTab("image")}
                    >
                      <span>Image Style</span>
                    </button>
                  </div>
                  <div className="flex-grow bg-[#2c2c2c] p-[25px] rounded-[8px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#555] scrollbar-track-[#2c2c2c] min-h-0">
                    <p className="text-[15px] text-[#c0c0c0] m-0 leading-[1.7] whitespace-pre-wrap">
                      {tabContent[activeGuideTab]}
                    </p>
                  </div>
                </>
              ) : (
                renderInitialPromptUI()
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewProjectModal;
