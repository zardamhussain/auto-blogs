// src/config.js

// This is the single source of truth for the backend API URL.
// All API calls in the frontend should use this constant.
// Load the backend API base URL from the Vite environment variables.
// 1. Create an `.env` (or `.env.local`) file in the `frontend` directory.
// 2. Add a line like: `VITE_API_BASE_URL=https://your-backend.example.com`
// 3. Restart the dev server so that Vite picks up the new env variables.
//
// Vite exposes env variables that start with the `VITE_` prefix at build time via
// `import.meta.env`. Here we fall back to a sensible default (localhost) when the
// variable is not provided so that the application keeps working out-of-the-box.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'; 