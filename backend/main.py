import os
from fastapi import FastAPI, Request, Response, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import logging
import json


from .routers import auth, users, blog, projects, prompts,blog_generation, image, cta,analytics, languages, workflow_templates,invitations, workflows, api_keys

from backend.services.supabase_service import SupabaseDataService
from .services.json_service import JsonDataService

# Configure logging for better visibility
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

load_dotenv(dotenv_path="backend\.env")

app = FastAPI(
    title="Outblogai API",
    description="API for Outblogai - a multi-tenant, multilingual, automated content generation platform.",
    version="0.1.0"
)
print("CORS_ALLOW_ORIGINS =", os.getenv("CORS_ALLOW_ORIGINS"))

# --- CORS Middleware ---
# Must be the first middleware to run to handle cross-origin requests.
allowed_origins = os.getenv("CORS_ALLOW_ORIGINS")
app.add_middleware(
    CORSMiddleware,
    # Allowable origins can be configured via the `CORS_ALLOW_ORIGINS` env var.
    # Provide a comma-separated list, e.g.:
    #   CORS_ALLOW_ORIGINS=https://docs.cosmi.skin,http://localhost:5173
    #
    # During local development we include common localhost ports by default so
    # you don't get blocked if you spin up the frontend on a different port.
    allow_origins=allowed_origins.split(",") if allowed_origins else [
            "https://docs.cosmi.skin",
            "https://www.outblogai.com",
            "http://www.outblogai.com.s3-website.us-east-2.amazonaws.com",
            "https://outblogai.com",
            "https://www.outblogai.com",
            "http://outblogai.com",
            "http://www.outblogai.com",
            "http://3.140.145.1:3100",  # example AWS IP
            "http://localhost:3000",   # Next.js dev server
            "http://localhost:3100",
            "http://localhost:8501",
            "http://localhost:5173",    # Vite default
  ],
    allow_credentials=True,
    allow_methods=["*"], # Allows all methods.
    allow_headers=["*"], # Allows all headers.
)

# --- Logging Middleware ---
# This middleware will log the details of every incoming request.
@app.middleware("http")
async def log_request_info(request: Request, call_next):
    logger.info(f"--- Incoming Request ---")
    logger.info(f"Method: {request.method}")
    logger.info(f"Path: {request.url.path}")
    
    # Pretty-print headers for readability
    headers = json.dumps(dict(request.headers), indent=2)
    # logger.info(f"Headers:\n{headers}")
    
    response = await call_next(request)
    
    # To log the response body, we need to read it and then rebuild the response
    response_body = b""
    async for chunk in response.body_iterator:
        response_body += chunk
    
 

    logger.info(f"Response Status Code: {response.status_code}")
    logger.info(f"--- End Request ---\n")
    
    # Re-create the response so it can be sent to the client
    return Response(content=response_body, status_code=response.status_code, headers=dict(response.headers))

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(blog.router)
app.include_router(projects.router)
app.include_router(analytics.router)
app.include_router(api_keys.router)
app.include_router(image.router)
app.include_router(blog_generation.router)
app.include_router(prompts.router)
app.include_router(workflows.router)
app.include_router(cta.router)
app.include_router(invitations.router)
app.include_router(languages.router)
app.include_router(workflow_templates.router)


@app.get("/")
def read_root():
    return {"message": "Welcome to the Cosmi API"}
