import React, { useState, useEffect, useCallback } from "react";
import { useProjects } from "../context/ProjectContext";
import { X as CloseIcon, RefreshCw as GenerateIcon } from "react-feather";
import "./UpdateGuideSidebar.css";
import Loader from "./ui/Loader";

const UpdateGuideSidebar = ({ guide, onClose, onSave }) => {
  const { apiClient } = useProjects();
  const [name, setName] = useState("");
  const [baseKnowledge, setBaseKnowledge] = useState("");
  const [writingStyle, setWritingStyle] = useState("");
  const [imageStyle, setImageStyle] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("base_knowledge");

  const [baseKnowledgeSuggestion, setBaseKnowledgeSuggestion] = useState("");
  const [writingStyleSuggestion, setWritingStyleSuggestion] = useState("");
  const [imageStyleSuggestion, setImageStyleSuggestion] = useState("");

  const [inspirationImages, setInspirationImages] = useState([]);
  const [negativeImages, setNegativeImages] = useState([]);
  const [generatingSection, setGeneratingSection] = useState(null);
  const [generationError, setGenerationError] = useState("");

  const resetImageStyleForm = useCallback(() => {
    setImageStyleSuggestion("");
    setInspirationImages([]);
    setNegativeImages([]);
    setGenerationError("");
  }, []);

  useEffect(() => {
    if (guide) {
      setName(guide.name || "");
      setBaseKnowledge(guide.base_knowledge || "");
      setWritingStyle(guide.writing_style_guide || "");
      setImageStyle(guide.image_style || "");
      setError("");
      resetImageStyleForm();
      setBaseKnowledgeSuggestion("");
      setWritingStyleSuggestion("");
    }
  }, [guide, resetImageStyleForm]);

  const handleStyleGeneration = async (section) => {
    setGeneratingSection(section);
    setGenerationError("");

    const formData = new FormData();
    let suggestion = "";

    if (section === "base_knowledge") {
      suggestion = baseKnowledgeSuggestion;
      formData.append("base_knowledge_prompt", suggestion);
      formData.append("existing_base_knowledge", baseKnowledge);
    } else if (section === "writing_style_guide") {
      suggestion = writingStyleSuggestion;
      formData.append("writing_style_prompt", suggestion);
      formData.append("existing_writing_style", writingStyle);
    } else if (section === "image_style") {
      if (imageStyleSuggestion) {
        formData.append("image_style_suggestion", imageStyleSuggestion);
      }
      inspirationImages.forEach((file) => {
        formData.append("inspiration_images", file);
      });
      negativeImages.forEach((file) => {
        formData.append("negative_images", file);
      });
      formData.append("existing_image_style", imageStyle);
    }

    formData.append("project_id", guide.project_id);

    try {
      const { data } = await apiClient.post(
        "/prompts/generate-style-guide",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (data.base_knowledge) {
        setBaseKnowledge(data.base_knowledge);
        setBaseKnowledgeSuggestion("");
      }
      if (data.writing_style_guide) {
        setWritingStyle(data.writing_style_guide);
        setWritingStyleSuggestion("");
      }
      if (data.image_style) {
        setImageStyle(data.image_style);
        resetImageStyleForm();
      }
    } catch (err) {
      setGenerationError(err.response?.data?.detail || err.message);
    } finally {
      setGeneratingSection(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!guide) return;

    setIsUpdating(true);
    setError("");

    try {
      const { data: updatedGuide } = await apiClient.patch(
        `/prompts/${guide.id}`,
        {
          name,
          base_knowledge: baseKnowledge,
          writing_style_guide: writingStyle,
          image_style: imageStyle,
        }
      );
      onSave(updatedGuide);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!guide) return null;

  const isRegenerateDisabled =
    !imageStyleSuggestion.trim() &&
    inspirationImages.length === 0 &&
    negativeImages.length === 0;

  const renderLeftColumn = () => {
    switch (activeSection) {
      case "base_knowledge":
        return (
          <textarea
            className="style-display-area"
            value={baseKnowledge}
            onChange={(e) => setBaseKnowledge(e.target.value)}
            placeholder="Current base knowledge..."
            disabled={isUpdating}
          />
        );
      case "writing_style_guide":
        return (
          <textarea
            className="style-display-area"
            value={writingStyle}
            onChange={(e) => setWritingStyle(e.target.value)}
            placeholder="Current writing style guide..."
            disabled={isUpdating}
          />
        );
      case "image_style":
        return (
          <textarea
            className="image-style-display-area"
            value={imageStyle}
            onChange={(e) => setImageStyle(e.target.value)}
            placeholder="Current image style..."
          />
        );
      default:
        return null;
    }
  };

  const renderRightColumn = () => {
    switch (activeSection) {
      case "base_knowledge": {
        const isSuggestionDisabled = !baseKnowledgeSuggestion.trim();
        return (
          <div className="style-generation-form">
            <h4>Regenerate Base Knowledge</h4>
            <div className="form-group">
              <label>Suggestion</label>
              <textarea
                value={baseKnowledgeSuggestion}
                className="image-style-display-area"
                onChange={(e) => setBaseKnowledgeSuggestion(e.target.value)}
                placeholder="e.g., 'Add more detail about our competitor analysis'"
                disabled={generatingSection}
              />
            </div>
            {generationError && activeSection === "base_knowledge" && (
              <p className="error-message">{generationError}</p>
            )}
            <button
              type="button"
              className="regenerate-btn"
              onClick={() => handleStyleGeneration("base_knowledge")}
              disabled={generatingSection || isSuggestionDisabled}
            >
              {generatingSection === "base_knowledge" ? (
                <>
                  <Loader size="small" /> Regenerating...
                </>
              ) : (
                <>
                  <GenerateIcon size={16} /> Regenerate
                </>
              )}
            </button>
          </div>
        );
      }
      case "writing_style_guide": {
        const isSuggestionDisabled = !writingStyleSuggestion.trim();
        return (
          <div className="style-generation-form">
            <h4>Regenerate Writing Style</h4>
            <div className="form-group">
              <label>Suggestion</label>
              <textarea
                value={writingStyleSuggestion}
                className="image-style-display-area"
                onChange={(e) => setWritingStyleSuggestion(e.target.value)}
                placeholder="e.g., 'Emphasize a conversational tone'"
                disabled={generatingSection}
              />
            </div>
            {generationError && activeSection === "writing_style_guide" && (
              <p className="error-message">{generationError}</p>
            )}
            <button
              type="button"
              className="regenerate-btn"
              onClick={() => handleStyleGeneration("writing_style_guide")}
              disabled={generatingSection || isSuggestionDisabled}
            >
              {generatingSection === "writing_style_guide" ? (
                <>
                  <Loader size="small" /> Regenerating...
                </>
              ) : (
                <>
                  <GenerateIcon size={16} /> Regenerate
                </>
              )}
            </button>
          </div>
        );
      }
      case "image_style":
        return (
          <div className="style-generation-form">
            <h4>Regenerate Image Style</h4>
            <p className="refine-description">
              Provide new suggestions or images. The AI will use the current
              guide as context.
            </p>
            <div className="form-group">
              <label>Suggestion</label>
              <textarea
                value={imageStyleSuggestion}
                className="image-style-display-area"
                onChange={(e) => setImageStyleSuggestion(e.target.value)}
                placeholder="e.g., 'Make it more cinematic'"
                disabled={generatingSection}
              />
            </div>
            <div className="image-inputs-row">
              <div className="form-group">
                <label>Inspiration Images</label>
                <input
                  type="file"
                  multiple
                  onChange={(e) =>
                    setInspirationImages(Array.from(e.target.files))
                  }
                  disabled={generatingSection}
                />
              </div>
              <div className="form-group">
                <label>Negative Example Images</label>
                <input
                  type="file"
                  multiple
                  onChange={(e) =>
                    setNegativeImages(Array.from(e.target.files))
                  }
                  disabled={generatingSection}
                />
              </div>
            </div>
            {generationError && (
              <p className="error-message">{generationError}</p>
            )}
            <button
              type="button"
              className="regenerate-btn"
              onClick={() => handleStyleGeneration("image_style")}
              disabled={generatingSection || isRegenerateDisabled}
            >
              {generatingSection === "image_style" ? (
                <>
                  <Loader size="small" /> Regenerating...
                </>
              ) : (
                <>
                  <GenerateIcon size={16} /> Regenerate Image Style
                </>
              )}
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="update-guide-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Update Style Guide</h2>
          <button className="close-btn" onClick={onClose}>
            <CloseIcon size={20} />
          </button>
        </div>

        <div className="guide-sections">
          <button
            type="button"
            className={`section-tab ${
              activeSection === "base_knowledge" ? "active" : ""
            }`}
            onClick={() => setActiveSection("base_knowledge")}
          >
            Base Knowledge
          </button>
          <button
            type="button"
            className={`section-tab ${
              activeSection === "writing_style_guide" ? "active" : ""
            }`}
            onClick={() => setActiveSection("writing_style_guide")}
          >
            Writing Style
          </button>
          <button
            type="button"
            className={`section-tab ${
              activeSection === "image_style" ? "active" : ""
            }`}
            onClick={() => setActiveSection("image_style")}
          >
            Image Style
          </button>
        </div>

        <form className="modal-form-content" onSubmit={handleSubmit}>
          <div className="columns-container">
            <div className="left-column">
              <div className="form-group stretch">{renderLeftColumn()}</div>
              <button
                type="submit"
                className="update-btn"
                disabled={isUpdating}
              >
                {isUpdating ? "Updating..." : "Update Style Guide"}
              </button>
            </div>
            <div className="right-column">{renderRightColumn()}</div>
          </div>
        </form>
        {error && <p className="error-message full-width-error">{error}</p>}
      </div>
    </div>
  );
};

export default UpdateGuideSidebar;
