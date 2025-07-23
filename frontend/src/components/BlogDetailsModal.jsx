import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import ReactMarkdown from "react-markdown";
import { X, Clipboard, Zap, ArrowRight } from "lucide-react";
import remarkGfm from "remark-gfm";
import matter from "gray-matter";
import StatusDropdown from "./StatusDropdown";
import RunTraceModal from "./RunTraceModal"; // Import the new modal
import "./BlogDetailsModal.css";

const BlogDetailsModalInternal = ({
  isOpen,
  onClose,
  post,
  onStatusChange,
  supportedLanguages = [],
  currentUserRole,
}) => {
  const [viewMode, setViewMode] = useState("preview"); // 'preview' or 'raw'
  const [copied, setCopied] = useState(false);
  const [currentPost, setCurrentPost] = useState(post);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [currentContent, setCurrentContent] = useState(null);
  const [isTraceModalOpen, setIsTraceModalOpen] = useState(false); // State for the new modal

  // Track image count for custom sizing
  const imageCountRef = useRef(0);

  useEffect(() => {
    // When the post prop changes (e.g., when opening the modal for a different post),
    // update the internal state.
    setCurrentPost(post);
    // Reset image counter when post changes
    imageCountRef.current = 0;
    // Reset language selection when modal opens
    setSelectedLanguage("en");
    setCurrentContent(null);
  }, [post]);

  const handleLanguageChange = (langCode) => {
    setSelectedLanguage(langCode);
    if (langCode === "en") {
      setCurrentContent(null); // Use original post
    } else {
      const translation = currentPost.translations?.find(
        (t) => t.language_code === langCode
      );
      setCurrentContent(translation);
    }
  };

  // Helper function to get language name from supported languages
  const getLanguageName = (code) => {
    if (!supportedLanguages || supportedLanguages.length === 0) {
      // Fallback to static names if supportedLanguages not available
      const names = {
        es: "Spanish",
        fr: "French",
        de: "German",
        hi: "Hindi",
        pt: "Portuguese",
        ru: "Russian",
        ja: "Japanese",
        ko: "Korean",
        zh: "Chinese",
        ar: "Arabic",
      };
      return names[code] || code.toUpperCase();
    }

    const language = supportedLanguages.find(
      (lang) => lang.language_code === code
    );
    return language ? language.language_name : code.toUpperCase();
  };

  if (!isOpen || !currentPost) {
    return null;
  }

  // Determine what content to show
  const displayContent = currentContent
    ? {
        title: currentContent.title,
        content: currentContent.content,
      }
    : {
        title: currentPost.title,
        content: currentPost.content,
      };

  const hasTranslations = currentPost?.translations?.length > 0;

  let postTitle = displayContent.title || "Post Details";
  let postBody = displayContent.content || "";
  let frontmatter = {};
  try {
    // This will extract the main content, stripping YAML frontmatter if it exists.
    const parsed = matter(displayContent.content || "");
    postBody = parsed.content;
    frontmatter = parsed.data;
    postTitle = frontmatter.title || displayContent.title || "Untitled Post";
  } catch (e) {
    console.error("Error parsing blog post content:", e);
    postBody = `Could not display post due to a formatting error. ${e}`;
  }

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(postBody).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
      },
      (err) => {
        console.error("Could not copy text: ", err);
      }
    );
  };

  const handleLocalStatusChange = (newStatus) => {
    if (currentPost) {
      // Update the local state immediately for a responsive UI
      setCurrentPost((prevPost) => ({ ...prevPost, status: newStatus }));
      // Call the handler passed from the parent to trigger the API call
      onStatusChange(currentPost.id, newStatus);
    }
  };

  // Custom image component with size control
  const CustomImage = ({ src, alt, title }) => {
    // Increment image counter
    imageCountRef.current += 1;
    const imageIndex = imageCountRef.current;

    const imageStyle = {
      maxWidth: "100%",
      height: "auto",
      borderRadius: "8px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      display: "block",
    };

    // Apply custom dimensions based on URL parameters or default sizing
    imageStyle.width = imageIndex == 1 ? "80%" : "60%";

    return (
      <img
        src={src}
        alt={alt}
        title={title}
        style={imageStyle}
        loading="lazy"
      />
    );
  };

  const formattedDate = new Date(currentPost.created_at).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  const tags = frontmatter.tags || currentPost.tags || [];
  const categories = frontmatter.categories || currentPost.categories || [];
  const description = frontmatter.description || currentPost.description || "";

  return (
    <div className={`modal-overlay ${isOpen ? "show" : ""}`} onClick={onClose}>
      <div className="modal-container">
        <div
          className="bg-bg-panel border border-border-color text-text-primary w-[90%] max-w-[1100px] flex flex-col max-h-[88vh] m-auto rounded-lg relative p-8 shadow-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-start flex-shrink-0 pb-4 border-b border-border-color px-4 py-6 mb-6 relative">
            <h1 className="text-3xl font-bold mb-4 text-accent-text leading-none block text-center">
              {postTitle}
            </h1>
            {/* Engaging Arrow Button Container with static label */}
            {currentPost.project_id && currentPost.slug && (
              <div
                className="absolute top-[10px] right-[60px] flex flex-row items-center z-10 gap-2"
                style={{ minWidth: 120 }}
              >
                <span className="text-primary-purple font-semibold text-sm select-none">Live Preview:</span>
                <button
                  className="bg-[#23263a] border border-primary-purple shadow-lg rounded-lg flex items-center justify-center px-3 py-2 group cursor-pointer transition-all duration-200 hover:bg-[#2d3250] hover:shadow-xl"
                  onClick={() => {
                    const url = `https://${currentPost.project_id}.outblogai.com/${currentPost.slug}`;
                    window.open(url, "_blank", "noopener,noreferrer");
                  }}
                  aria-label="Open live blog page"
                  tabIndex={0}
                  title="Open live blog page"
                  onKeyPress={e => { if (e.key === 'Enter') {
                    const url = `https://${currentPost.project_id}.outblogai.com/${currentPost.slug}`;
                    window.open(url, "_blank", "noopener,noreferrer");
                  }}}
                >
                  <ArrowRight
                    size={24}
                    className="transition-transform duration-200 group-hover:translate-x-2 text-primary-purple"
                  />
                </button>
              </div>
            )}
            {/* Close button remains top right */}
            <button
              onClick={onClose}
              className="bg-none border-none text-text-secondary text-[1.75rem] leading-none cursor-pointer p-0 transition-colors duration-200 hover:text-accent-text font-bold mb-3 absolute top-[10px] right-[15px]"
              aria-label="Close modal"
            >
              <X size={24} />
            </button>
          </div>
          <div className="py-6 px-10 overflow-y-auto">
            <div className="mb-6 flex justify-between items-center">
              <div className="flex items-center justify-start gap-4 mt-0">
                <StatusDropdown
                  currentStatus={currentPost.status}
                  onStatusChange={handleLocalStatusChange}
                />
                {currentPost.workflow_run_id && (
                  <button
                    onClick={() => setIsTraceModalOpen(true)}
                    className="trace-button"
                    title="Trace Workflow Run"
                  >
                    <Zap size={16} />
                    <span>Trace</span>
                  </button>
                )}
                <span className="text-sm text-text-secondary">
                  {formattedDate}
                </span>
              </div>
              <div className="view-controls">
                <div className="view-mode-toggle">
                  <button
                    className={viewMode === "preview" ? "active" : ""}
                    onClick={() => setViewMode("preview")}
                  >
                    Preview
                  </button>
                  <button
                    className={viewMode === "raw" ? "active" : ""}
                    onClick={() => setViewMode("raw")}
                  >
                    Raw
                  </button>
                </div>
                {hasTranslations && (
                  <select
                    value={selectedLanguage}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="ml-4 px-3 py-2 bg-[#2a2a2a] border border-border-color text-text-secondary rounded-md focus:outline-none focus:ring-2 focus:ring-primary-purple focus:border-primary-purple transition-colors duration-200 text-sm"
                  >
                    <option
                      className="bg-[#2a2a2a] text-text-secondary px-[8px] py-[12px]"
                      value="en"
                    >
                      us English
                    </option>
                    {currentPost.translations.map((translation) => (
                      <option
                        className="bg-[#2a2a2a] text-text-secondary px-[8px] py-[12px]"
                        key={translation.language_code}
                        value={translation.language_code}
                      >
                        {translation.language_code}{" "}
                        {getLanguageName(translation.language_code)}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {description && (
              <p className="text-base text-text-secondary mb-10 border-l-4 border-border-color pl-6 italic text-center">
                {description}
              </p>
            )}

            <div className="article-body">
              {postBody && (
                <div className="text-base mb-10 leading-relaxed text-white text-left">
                  {viewMode === "preview" ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        img: CustomImage,
                        // Force white color on all text elements
                        p: ({ children, ...props }) => (
                          <p className="white text-base" {...props}>
                            {children}
                          </p>
                        ),
                        h1: ({ children, ...props }) => (
                          <h1 className="text-white text-2xl" {...props}>
                            {children}
                          </h1>
                        ),
                        h2: ({ children, ...props }) => (
                          <h2 className="white text-xl" {...props}>
                            {children}
                          </h2>
                        ),
                        h3: ({ children, ...props }) => (
                          <h3 className="white text-lg" {...props}>
                            {children}
                          </h3>
                        ),
                        h4: ({ children, ...props }) => (
                          <h4 className="white text-base" {...props}>
                            {children}
                          </h4>
                        ),
                        h5: ({ children, ...props }) => (
                          <h5 className="white text-base" {...props}>
                            {children}
                          </h5>
                        ),
                        h6: ({ children, ...props }) => (
                          <h6 className="white text-base" {...props}>
                            {children}
                          </h6>
                        ),
                        span: ({ children, ...props }) => (
                          <span className="white text-base" {...props}>
                            {children}
                          </span>
                        ),
                        div: ({ children, ...props }) => (
                          <div className="white text-base" {...props}>
                            {children}
                          </div>
                        ),
                        li: ({ children, ...props }) => (
                          <li className="white text-base" {...props}>
                            {children}
                          </li>
                        ),
                        strong: ({ children, ...props }) => (
                          <strong className="white text-base" {...props}>
                            {children}
                          </strong>
                        ),
                        em: ({ children, ...props }) => (
                          <em className="white text-base" {...props}>
                            {children}
                          </em>
                        ),
                        blockquote: ({ children, ...props }) => (
                          <blockquote
                            style={{
                              color: "white",
                              borderLeft: "4px solid #60a5fa",
                              paddingLeft: "16px",
                              fontStyle: "italic",
                            }}
                            {...props}
                          >
                            {children}
                          </blockquote>
                        ),
                        code: ({ children, inline, ...props }) =>
                          inline ? (
                            <code
                              style={{
                                color: "white",
                                backgroundColor: "rgba(0,0,0,0.2)",
                                padding: "2px 4px",
                                borderRadius: "3px",
                              }}
                              {...props}
                            >
                              {children}
                            </code>
                          ) : (
                            <code style={{ color: "white" }} {...props}>
                              {children}
                            </code>
                          ),
                        pre: ({ children, ...props }) => (
                          <pre
                            style={{
                              color: "white",
                              backgroundColor: "rgba(0,0,0,0.3)",
                              borderRadius: "6px",
                              padding: "12px",
                            }}
                            {...props}
                          >
                            {children}
                          </pre>
                        ),
                        a: ({ children, ...props }) => (
                          <a style={{ color: "#60a5fa" }} {...props}>
                            {children}
                          </a>
                        ),
                      }}
                    >
                      {postBody}
                    </ReactMarkdown>
                  ) : (
                    <div className="relative">
                      <pre className="bg-bg-primary border border-border-color p-6 rounded-[8px] overflow-x-auto whitespace-pre-wrap break-words">
                        <code className='bg-transparent p-0 text-base font-["Courier New", Courier, monospace]'>
                          {postBody}
                        </code>
                      </pre>
                      <button
                        onClick={handleCopyToClipboard}
                        className="absolute top-4 right-4 bg-[#2a2a2a] border border-border-color text-text-secondary cursor-pointer p-2 rounded-md flex items-center justify-center transition-all duration-200 hover:bg-[#3a3a3a] hover:text-accent-text"
                      >
                        {copied ? "Copied!" : <Clipboard size={16} />}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {tags && tags.length > 0 && (
              <div className="mt-10 border-t border-border-color pt-6">
                <h3 className="text-[1.1rem] font-medium mb-4 text-[#fefefe]">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-3">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-border-color text-text-primary px-4 py-2 rounded-full text-sm font-sans"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {categories && categories.length > 0 && (
              <div className="mt-10 border-t border-border-color pt-6">
                <h3 className="text-[1.1rem] font-medium mb-4 text-[#fefefe]">
                  Categories
                </h3>
                <div className="flex flex-wrap gap-3">
                  {categories.map((cat, index) => (
                    <span
                      key={index}
                      className="bg-border-color text-text-primary px-4 py-2 rounded-full text-sm font-sans"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {isTraceModalOpen && (
        <RunTraceModal
          runId={currentPost.workflow_run_id}
          blogTitle={postTitle}
          onClose={() => setIsTraceModalOpen(false)}
        />
      )}
    </div>
  );
};

const BlogDetailsModal = (props) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // We can't render the portal on the server, so we wait until the component is mounted on the client.
  if (!props.isOpen || !isMounted) {
    return null;
  }

  return ReactDOM.createPortal(
    <BlogDetailsModalInternal {...props} />,
    document.body
  );
};

export default BlogDetailsModal;
