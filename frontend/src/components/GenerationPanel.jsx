import React, { useState } from "react";
import { useProjects } from "../context/ProjectContext";
import { useToast } from "../context/ToastContext";
import "./GenerationPanel.css";

const GenerationPanel = ({
  onGenerate,
  onGenerationStart,
  onGenerationError,
  useBrandContext,
  renderBrandContextUI,
}) => {
  const { apiClient, selectedProject } = useProjects();
  const { addToast } = useToast();
  const [prompts, setPrompts] = useState({
    base_knowledge:
      "A comprehensive guide about eco-friendly skincare products and ingredients.",
    writing_style_guide:
      "A witty, informal, and slightly sarcastic tone for a beauty blog.",
    image_style:
      "Clean, minimalist product photography with natural lighting and pastel backgrounds.",
  });
  const [inspirationImages, setInspirationImages] = useState([]);
  const [negativeImages, setNegativeImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activePrompt, setActivePrompt] = useState("base_knowledge");

  const handleFileChange = (event, setter) => {
    const files = Array.from(event.target.files);
    if (files.length > 5) {
      addToast("You can only upload a maximum of 5 images.", "error");
      event.target.value = null; // Clear the file input
      setter([]); // Clear the state
    } else {
      setter(files);
    }
  };

  const handleGenerateClick = async () => {
    setIsLoading(true);
    if (onGenerationStart) onGenerationStart();

    try {
      const formData = new FormData();
      let hasContent = false;

      formData.append("project_id", selectedProject);
      formData.append("use_brand_context", useBrandContext);

      if (prompts.base_knowledge.trim()) {
        formData.append("base_knowledge_prompt", prompts.base_knowledge.trim());
        hasContent = true;
      }
      if (prompts.writing_style_guide.trim()) {
        formData.append(
          "writing_style_prompt",
          prompts.writing_style_guide.trim()
        );
        hasContent = true;
      }
      if (prompts.image_style.trim()) {
        formData.append("image_style_suggestion", prompts.image_style.trim());
        hasContent = true;
      }

      inspirationImages.forEach((file) => {
        formData.append("inspiration_images", file);
        hasContent = true;
      });
      negativeImages.forEach((file) => {
        formData.append("negative_images", file);
        hasContent = true;
      });

      if (!hasContent) {
        throw new Error(
          "Please provide at least one prompt or an image to generate content."
        );
      }

      const { data } = await apiClient.post(
        `/prompts/generate-style-guide`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      onGenerate(data);
      addToast("Style guide generated successfully!", "success");
    } catch (err) {
      const message = err.response?.data?.detail || err.message;
      addToast(message, "error");
      if (onGenerationError) onGenerationError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromptChange = (e) => {
    setPrompts((prev) => ({
      ...prev,
      [activePrompt]: e.target.value,
    }));
  };

  return (
    <div className="generation-panel">
      <h2>Generate Style Guide</h2>
      <div className="prompt-sections">
        <button
          className={`prompt-section ${
            activePrompt === "base_knowledge" ? "active" : ""
          }`}
          onClick={() => setActivePrompt("base_knowledge")}
        >
          Base Knowledge
        </button>
        <button
          className={`prompt-section ${
            activePrompt === "writing_style_guide" ? "active" : ""
          }`}
          onClick={() => setActivePrompt("writing_style_guide")}
        >
          Writing Style
        </button>
        <button
          className={`prompt-section ${
            activePrompt === "image_style" ? "active" : ""
          }`}
          onClick={() => setActivePrompt("image_style")}
        >
          Image Style
        </button>
      </div>
      <div className="prompt-input">
        {renderBrandContextUI &&
          (activePrompt === "base_knowledge" ||
            activePrompt === "writing_style_guide") &&
          renderBrandContextUI()}
        <label>
          {activePrompt === "base_knowledge" &&
            "Describe your product/niche knowledge:"}
          {activePrompt === "writing_style_guide" &&
            "Describe your desired writing style:"}
          {activePrompt === "image_style" &&
            "Describe your desired image style:"}
        </label>
        <textarea
          value={prompts[activePrompt]}
          onChange={handlePromptChange}
          placeholder={`Enter your ${activePrompt.replace("_", " ")} prompt...`}
          disabled={isLoading}
        />
        {activePrompt === "image_style" && (
          <div className="image-upload-section">
            <div className="form-group">
              <label>Inspiration Images ({inspirationImages.length}/5)</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileChange(e, setInspirationImages)}
                disabled={isLoading}
              />
            </div>
            <div className="form-group">
              <label>
                Negative Example Images (what to avoid) ({negativeImages.length}
                /5)
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileChange(e, setNegativeImages)}
                disabled={isLoading}
              />
            </div>
          </div>
        )}
      </div>
      <button
        className="generate-btn"
        onClick={handleGenerateClick}
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="loader-in-button"></div>
        ) : (
          "Generate Style Guide"
        )}
      </button>
      <p className="helper-text">
        All non-empty prompts will be generated. You can leave prompts empty if
        you don't need that type of content.
      </p>
    </div>
  );
};

export default GenerationPanel;
