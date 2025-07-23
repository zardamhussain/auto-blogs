import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useProjects } from "../context/ProjectContext";
import { useAuth } from "../context/AuthContext";
import { useTasks } from "../context/TaskContext";
import { API_BASE_URL } from "../config";
import BlogCard from "../components/BlogCard";
import BlogCardSkeleton from "../components/BlogCardSkeleton";
import NewBlogSidebar from "../components/NewBlogSidebar";
import BlogDetailsModal from "../components/BlogDetailsModal";
import Toast from "../components/Toast";
import "./BlogPage.css";

const BlogPage = () => {
  const { postId } = useParams();
  const {
    projects,
    selectedProject,
    loading: projectsLoading,
    apiClient,
  } = useProjects();
  const { appToken } = useAuth();
  const { tasks } = useTasks();
  const [blogPosts, setBlogPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isNewBlogSidebarOpen, setIsNewBlogSidebarOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [supportedLanguages, setSupportedLanguages] = useState([]);

  const addBlogPostToState = (newPost) => {
    if (newPost && newPost.id) {
      setBlogPosts((prevPosts) => [newPost, ...prevPosts]);
      showToast("Blog post created successfully!", "success");
    }
  };

  const showToast = (message, type) => {
    const id = Date.now();
    setToasts((prevToasts) => [...prevToasts, { id, message, type }]);
  };

  const dismissToast = (id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  const handleStatusChange = async (postId, newStatus) => {
    try {
      const response = await apiClient.put(`/blogs/posts/${postId}/status`, {
        status: newStatus,
      });
      if (response.status === 200) {
        setBlogPosts((prevPosts) =>
          prevPosts.map((p) =>
            p.id === postId ? { ...p, status: newStatus } : p
          )
        );
        showToast(`Post status updated to ${newStatus}`, "success");
      } else {
        showToast("Failed to update post status", "error");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      showToast("An error occurred while updating status", "error");
    }
  };

  const handleOpenDetailsModal = (post) => {
    setSelectedPost(post);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedPost(null);
  };

  const handleDeletePost = async (postId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this blog post? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await apiClient.delete(`/blogs/posts/${postId}`);
      fetchBlogPosts();
    } catch (error) {
      console.error("Delete error:", error);
      alert("An error occurred while deleting the post.");
    }
  };

  const fetchSupportedLanguages = async () => {
    if (!apiClient) return;
    try {
      const response = await apiClient.get("/languages/supported");
      setSupportedLanguages(response.data);
    } catch (error) {
      console.error("Error fetching supported languages:", error);
      setSupportedLanguages([]);
    }
  };

  const fetchBlogPosts = async () => {
    if (!selectedProject || !apiClient) return;
    setLoading(true);
    try {
      const response = await apiClient.get("/blogs/posts/" + selectedProject);
      // Sort blog posts by created_at in descending order (newest first)
      const sortedPosts = response.data.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setBlogPosts(sortedPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      setBlogPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogPosts();
  }, [selectedProject, apiClient]);

  useEffect(() => {
    fetchSupportedLanguages();
  }, [apiClient]);

  const currentProject = projects.find((p) => p.id === selectedProject);
  const generatingBlogs = tasks.filter(
    (task) => task.status === "pending" || task.status === "in_progress"
  );

  if (projectsLoading) {
    return <div>Loading projects...</div>;
  }

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-semibold text-text-primary">Blog Posts</h1>
        <div className="bg-white/10 backdrop-blur-[10px] rounded-[12px] border border-white/20 p-1">
          <button
            className="bg-black/10 text-white border-none py-3 px-6 rounded-lg text-sm font-bold cursor-pointer transition-colors duration-200 hover:bg-[var(--color-primary-dark)]"
            onClick={() => setIsNewBlogSidebarOpen(true)}
            disabled={generatingBlogs.length > 0}
          >
            {generatingBlogs.length > 0
              ? "Generation in progress..."
              : "+ New Blog"}
          </button>
        </div>
      </div>

      {showSuccessToast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-[#22c55e] text-white py-4 px-8 rounded-lg shadow-lg z-[2000] font-medium">
          Blog post created successfully!
        </div>
      )}

      <NewBlogSidebar
        isOpen={isNewBlogSidebarOpen}
        onClose={() => setIsNewBlogSidebarOpen(false)}
        onGenerationComplete={addBlogPostToState}
        supportedLanguages={supportedLanguages}
      />

      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
        {generatingBlogs.map((task) => (
          <BlogCardSkeleton key={task.run_id} />
        ))}
        {loading && generatingBlogs.length === 0
          ? Array.from({ length: 6 }).map((_, index) => (
              <BlogCardSkeleton key={index} />
            ))
          : blogPosts.map((post) => (
              <BlogCard
                key={post.id}
                title={post.title}
                status={post.status}
                createdAt={post.created_at}
                translations={post.translations || []}
                onClick={() => handleOpenDetailsModal(post)}
                onDelete={() => handleDeletePost(post.id)}
              />
            ))}
      </div>

      <BlogDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        post={selectedPost}
        onStatusChange={handleStatusChange}
        supportedLanguages={supportedLanguages}
      />

      <div className="fixed bottom-5 right-5 z-[2000] flex flex-col gap-4">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onDismiss={dismissToast} />
        ))}
      </div>
    </>
  );
};

export default BlogPage;
