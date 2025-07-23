import axios from "axios";
import { API_BASE_URL } from "../config";

/**
 * Creates and configures an Axios API client.
 * @param {string | null} token - The authentication token.
 * @param {string | null} project_id - The currently selected project ID.
 * @returns {axios.AxiosInstance} An Axios instance with pre-configured interceptors.
 */
const createApiClient = (token = null, project_id = null) => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      "Content-Type": "application/json",
    },
  });

  instance.interceptors.request.use(
    (config) => {
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
      // Ensure project_id is included if it exists.
      if (project_id) {
        config.headers["X-Project-ID"] = project_id;
      } else {
        // If there's no project ID, we should not send an empty header.
        delete config.headers["X-Project-ID"];
      }
      console.log(`Making request to: ${config.baseURL}${config.url}`);
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor to catch 401
  instance.interceptors.response.use(
    (resp) => resp,
    (error) => {
      if (error.response && error.response.status === 401) {
        // clear token and reload to login
        localStorage.removeItem("appToken");
        window.location.href = "/";
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

export default createApiClient;
