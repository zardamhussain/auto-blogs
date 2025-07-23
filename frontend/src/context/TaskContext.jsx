import React, { createContext, useState, useEffect, useContext } from 'react';
import { useProjects } from './ProjectContext';
import { useAuth } from './AuthContext';

const TaskContext = createContext();

export const useTasks = () => useContext(TaskContext);

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const { apiClient } = useProjects();
  const { user } = useAuth();

  useEffect(() => {
    const hasActiveTasks = tasks.some(task => task.status === 'in_progress' || task.status === 'pending');

    if (!hasActiveTasks) {
      return;
    }

    const interval = setInterval(() => {
      tasks.forEach(task => {
        if (task.status === 'in_progress' || task.status === 'pending') {
          apiClient.get(`/workflows/runs/${task.run_id}`)
            .then(response => {
              const run = response.data;
              if (run.status === 'success' || run.status === 'error') {
                // First, update the task status. This is critical to prevent reprocessing.
                updateTask(task.run_id, { status: run.status });
                // Only proceed with success actions if the task was not already successful.
                if (run.status === 'success' && task.status !== 'success' && task.onSuccess) {
                 
                  const finalNodeRun = run.node_runs.find(nr => nr.node_id.includes('SaveBlogPost'));
                  if (finalNodeRun && finalNodeRun.output && finalNodeRun.output.saved_blog_post) {
                    const savedPost = finalNodeRun.output.saved_blog_post;
                    apiClient.get(`/blogs/posts/post/${savedPost.id}`)
                      .then(response => {
                        const fullPost = response.data;
                        task.onSuccess(fullPost);
                      })
                      .catch(err => {
                        console.error(`Failed to fetch full blog post ${savedPost.id}`, err);
                        task.onSuccess(savedPost);
                      });
                  }
                }
              }
            })
            .catch(error => {
              console.error(`Error polling for task ${task.run_id}:`, error);
              updateTask(task.run_id, { status: 'error' });
            });
        }
      });
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [tasks, apiClient]);

  const addTask = (run_id, onSuccess) => {
    setTasks(prevTasks => [...prevTasks, { run_id, status: 'pending', onSuccess }]);
  };

  const updateTask = (run_id, updates) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.run_id === run_id ? { ...task, ...updates } : task
      )
    );
  };

  return (
    <TaskContext.Provider value={{ tasks, addTask }}>
      {children}
    </TaskContext.Provider>
  );
}; 